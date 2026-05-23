import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { ensureMediaDirectories, safeJoin, unlinkIfPresent } from "@/lib/files";
import { renderClip } from "@/lib/ffmpeg";
import { CLIPS_DIR, toPublicClipUrl } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import {
  assertClipDuration,
  assertFiniteSeconds,
  ValidationError,
} from "@/lib/validation";
import { formatTime } from "@/lib/format";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const clips = await prisma.clip.findMany({
      where: { projectId },
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
    const requestedStart = assertFiniteSeconds(body.startTime, "Start time");
    const videoDuration = assertFiniteSeconds(body.videoDuration, "Video duration");
    const selectedDuration = assertClipDuration(body.duration, videoDuration);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    await ensureMediaDirectories();
    const fileName = `${randomUUID()}.mp4`;
    outputPath = safeJoin(CLIPS_DIR, fileName);

    const clip = await prisma.clip.create({
      data: {
        projectId,
        videoId: project.video.id,
        title: `Clip ${formatTime(startTime)}`,
        startTime,
        endTime,
        duration,
        status: "RENDERING",
        fileName,
        url: toPublicClipUrl(fileName),
        path: outputPath,
      },
    });
    clipId = clip.id;

    await prisma.video.update({
      where: { id: project.video.id },
      data: { durationSeconds: videoDuration },
    });

    try {
      await renderClip({
        inputPath: project.video.path,
        outputPath,
        startTime,
        duration,
      });
    } catch (error) {
      await unlinkIfPresent(outputPath);
      const failedClip = await prisma.clip.update({
        where: { id: clip.id },
        data: {
          status: "FAILED",
          error:
            error instanceof Error
              ? error.message.slice(0, 1200)
              : "FFmpeg render failed.",
        },
      });
      return NextResponse.json({ clip: failedClip }, { status: 201 });
    }

    const readyClip = await prisma.clip.update({
      where: { id: clip.id },
      data: { status: "READY", error: null },
    });

    return NextResponse.json({ clip: readyClip }, { status: 201 });
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
    await unlinkIfPresent(outputPath).catch(() => undefined);
    return jsonError(error);
  }
}
