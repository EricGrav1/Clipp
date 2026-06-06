import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription, requireRenderEntitlement } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { deleteStoredMedia, prepareClipOutput } from "@/lib/storage";
import {
  assertClipDuration,
  assertFiniteSeconds,
  ValidationError,
} from "@/lib/validation";
import { formatTime } from "@/lib/format";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    const clips = await prisma.clip.findMany({
      where: { projectId, project: { userAccountId: account.id } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ clips });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  let clipId: string | null = null;
  let outputPath: string | null = null;

  try {
    const body = await request.json();
    const account = await requireUserAccount();
    const requestedStart = assertFiniteSeconds(body.startTime, "Start time");
    const videoDuration = assertFiniteSeconds(body.videoDuration, "Video duration");
    const selectedDuration = assertClipDuration(body.duration, videoDuration);

    const project = await prisma.project.findFirst({
      where: { id: projectId, userAccountId: account.id },
      include: { video: true },
    });

    if (!project?.video) {
      throw new ValidationError("Upload a video before creating clips.");
    }

    if (videoDuration <= 0) {
      throw new ValidationError("Video duration is not available yet.");
    }

    const startTime = Math.min(Math.max(0, requestedStart), videoDuration);
    const endTime = Math.min(startTime + selectedDuration, videoDuration);
    const duration = endTime - startTime;

    if (duration <= 0.05) {
      throw new ValidationError("Move the playhead before the end of the video.");
    }

    requireRenderEntitlement(account, duration);

    const clipOutput = await prepareClipOutput();
    outputPath = clipOutput.outputPath;

    const clip = await prisma.clip.create({
      data: {
        projectId,
        videoId: project.video.id,
        title: `Clip ${formatTime(startTime)}`,
        startTime,
        endTime,
        duration,
        status: "QUEUED",
        fileName: clipOutput.fileName,
        url: clipOutput.url,
        path: outputPath,
        objectKey: clipOutput.objectKey,
        storageProvider: clipOutput.provider,
      },
    });
    clipId = clip.id;
    const renderJob = await prisma.renderJob.create({
      data: {
        clipId: clip.id,
        status: "QUEUED",
      },
    });

    await prisma.video.update({
      where: { id: project.video.id },
      data: { durationSeconds: videoDuration },
    });

    return NextResponse.json({ clip, renderJob }, { status: 201 });
  } catch (error) {
    if (clipId) {
      await prisma.clip
        .update({
          where: { id: clipId },
          data: {
            status: "FAILED",
            error:
              error instanceof Error ? error.message.slice(0, 1200) : "Render failed.",
          },
        })
        .catch(() => undefined);
    }
    await deleteStoredMedia({ path: outputPath }).catch(() => undefined);
    return jsonError(error);
  }
}
