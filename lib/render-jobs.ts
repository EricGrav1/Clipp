import { prisma } from "@/lib/prisma";
import { recordRenderUsage } from "@/lib/billing";
import { renderClip } from "@/lib/ffmpeg";
import {
  deleteStoredMedia,
  ensureLocalReadableMedia,
  finalizeRenderedClip,
} from "@/lib/storage";

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

  const sourcePath = await ensureLocalReadableMedia(job.clip.video);
  const outputPath = job.clip.path;

  if (!sourcePath || !outputPath) {
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
    await renderClip({
      inputPath: sourcePath,
      outputPath,
      startTime: job.clip.startTime,
      duration: job.clip.duration,
    });

    await finalizeRenderedClip(outputPath, job.clip.objectKey ?? "");
    if (sourcePath !== job.clip.video.path) {
      await deleteStoredMedia({ path: sourcePath });
    }

    const [, updatedJob] = await prisma.$transaction([
      prisma.clip.update({
        where: { id: job.clipId },
        data: { status: "READY", error: null },
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
    if (sourcePath !== job.clip.video.path) {
      await deleteStoredMedia({ path: sourcePath }).catch(() => undefined);
    }

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
