import { prisma } from "@/lib/prisma";
import { recordRenderUsage } from "@/lib/billing";
import { renderClip } from "@/lib/ffmpeg";
import {
  deleteStoredMedia,
  ensureLocalReadableMedia,
  finalizeRenderedClip,
  getSignedMediaUrl,
} from "@/lib/storage";

async function getRenderSource(input: {
  objectKey?: string | null;
  path?: string | null;
  storageProvider?: string | null;
}) {
  if (input.storageProvider === "r2" && input.objectKey) {
    return {
      cleanupPath: null,
      source: await getSignedMediaUrl(input.objectKey),
    };
  }

  const sourcePath = await ensureLocalReadableMedia(input);

  return {
    cleanupPath: sourcePath !== input.path ? sourcePath : null,
    source: sourcePath,
  };
}

export async function processRenderJob(jobId: string) {
  const job = await prisma.renderJob.findUnique({
    where: { id: jobId },
    include: {
      clip: {
        include: {
          project: true,
          video: true,
        },
      },
    },
  });

  if (!job) {
    throw new Error("Render job not found.");
  }

  if (job.status === "COMPLETE") {
    return job;
  }

  if (
    job.status === "RENDERING" &&
    job.startedAt &&
    Date.now() - job.startedAt.getTime() < 4 * 60 * 1000
  ) {
    return job;
  }

  const renderSource = await getRenderSource(job.clip.video);
  const outputPath = job.clip.path;

  if (!renderSource.source || !outputPath) {
    throw new Error("Render job is missing media paths.");
  }

  await prisma.renderJob.update({
    where: { id: job.id },
    data: {
      attempts: { increment: 1 },
      error: null,
      startedAt: new Date(),
      status: "RENDERING",
    },
  });
  await prisma.clip.update({
    where: { id: job.clipId },
    data: { status: "RENDERING", error: null },
  });

  try {
    const renderResult = await renderClip({
      inputPath: renderSource.source,
      outputPath,
      startTime: job.clip.startTime,
      duration: job.clip.duration,
    });

    await finalizeRenderedClip(outputPath, job.clip.objectKey ?? "");
    if (renderSource.cleanupPath) {
      await deleteStoredMedia({ path: renderSource.cleanupPath });
    }

    const [, updatedJob] = await prisma.$transaction([
      prisma.clip.update({
        where: { id: job.clipId },
        data: { status: "READY", error: renderResult.warning },
      }),
      prisma.renderJob.update({
        where: { id: job.id },
        data: { status: "COMPLETE", error: null, finishedAt: new Date() },
      }),
    ]);

    if (job.clip.project.userAccountId) {
      await recordRenderUsage(job.clip.project.userAccountId, job.clip.duration);
    }

    return updatedJob;
  } catch (error) {
    const message =
      error instanceof Error ? error.message.slice(0, 1200) : "FFmpeg render failed.";
    if (renderSource.cleanupPath) {
      await deleteStoredMedia({ path: renderSource.cleanupPath }).catch(() => undefined);
    }
    await deleteStoredMedia({ path: outputPath }).catch(() => undefined);

    await prisma.$transaction([
      prisma.clip.update({
        where: { id: job.clipId },
        data: { status: "FAILED", error: message },
      }),
      prisma.renderJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: message, finishedAt: new Date() },
      }),
    ]);

    throw error;
  }
}
