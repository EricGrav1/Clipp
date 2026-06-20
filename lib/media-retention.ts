import type { Clip, Video } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deleteStoredMedia } from "@/lib/storage";

const DEFAULT_SOURCE_RETENTION_HOURS = 2;
const DEFAULT_CLIP_RETENTION_HOURS = 24;
const ACTIVE_RENDER_STATUSES = new Set(["QUEUED", "RENDERING"]);
const RUNNING_RENDER_STATUSES = new Set(["RENDERING"]);

type TemporaryMedia = {
  mediaDeletedAt?: Date | null;
  mediaExpiresAt?: Date | null;
};

function readRetentionHours(name: string, fallback: number) {
  const value = Number(process.env[name]);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return fallback;
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function sharedRetentionHours(fallback: number) {
  return readRetentionHours("TEMP_MEDIA_RETENTION_HOURS", fallback);
}

export function sourceMediaExpiresAt(now = new Date()) {
  return addHours(
    now,
    readRetentionHours(
      "SOURCE_MEDIA_RETENTION_HOURS",
      sharedRetentionHours(DEFAULT_SOURCE_RETENTION_HOURS),
    ),
  );
}

export function clipMediaExpiresAt(now = new Date()) {
  return addHours(
    now,
    readRetentionHours(
      "CLIP_MEDIA_RETENTION_HOURS",
      sharedRetentionHours(DEFAULT_CLIP_RETENTION_HOURS),
    ),
  );
}

export function isTemporaryMediaUnavailable(
  media: TemporaryMedia,
  now = new Date(),
) {
  return Boolean(
    media.mediaDeletedAt ||
      (media.mediaExpiresAt && media.mediaExpiresAt.getTime() <= now.getTime()),
  );
}

export async function mediaObjectIsAvailable(objectKey: string, now = new Date()) {
  const [clip, video] = await Promise.all([
    prisma.clip.findFirst({
      where: { objectKey },
      select: { mediaDeletedAt: true, mediaExpiresAt: true },
    }),
    prisma.video.findFirst({
      where: { objectKey },
      select: { mediaDeletedAt: true, mediaExpiresAt: true },
    }),
  ]);
  const media = clip ?? video;

  return !media || !isTemporaryMediaUnavailable(media, now);
}

export async function cleanupExpiredMedia({
  limit = 50,
  now = new Date(),
}: {
  limit?: number;
  now?: Date;
} = {}) {
  const expiredClips = await prisma.clip.findMany({
    where: {
      mediaDeletedAt: null,
      mediaExpiresAt: { lte: now },
      status: { notIn: Array.from(ACTIVE_RENDER_STATUSES) },
      OR: [{ objectKey: { not: null } }, { path: { not: null } }],
    },
    take: limit,
  });

  let deletedClips = 0;
  for (const clip of expiredClips) {
    await deleteStoredMedia(clip);
    await prisma.clip.update({
      where: { id: clip.id },
      data: {
        error: "Temporary clip file expired.",
        mediaDeletedAt: now,
        objectKey: null,
        path: null,
        status: "EXPIRED",
        url: null,
      },
    });
    deletedClips += 1;
  }

  const expiredVideos = await prisma.video.findMany({
    where: {
      mediaDeletedAt: null,
      mediaExpiresAt: { lte: now },
      OR: [{ objectKey: { not: null } }, { path: { not: null } }],
    },
    include: {
      clips: {
        select: {
          id: true,
          renderJob: {
            select: { id: true, status: true },
          },
        },
      },
    },
    take: limit,
  });

  let deletedVideos = 0;
  let skippedVideos = 0;
  for (const video of expiredVideos) {
    const hasActiveRender = video.clips.some((clip) =>
      clip.renderJob ? RUNNING_RENDER_STATUSES.has(clip.renderJob.status) : false,
    );

    if (hasActiveRender) {
      skippedVideos += 1;
      continue;
    }

    const queuedClipIds = video.clips
      .filter((clip) =>
        clip.renderJob ? ACTIVE_RENDER_STATUSES.has(clip.renderJob.status) : false,
      )
      .map((clip) => clip.id);
    const queuedRenderJobIds = video.clips
      .map((clip) => clip.renderJob)
      .filter(
        (renderJob): renderJob is { id: string; status: string } =>
          renderJob !== null && ACTIVE_RENDER_STATUSES.has(renderJob.status),
      )
      .map((renderJob) => renderJob.id);

    await deleteStoredMedia(video);
    await prisma.$transaction([
      ...(queuedClipIds.length > 0
        ? [
            prisma.clip.updateMany({
              where: { id: { in: queuedClipIds } },
              data: {
                error: "The temporary source video expired before rendering.",
                status: "FAILED",
              },
            }),
          ]
        : []),
      ...(queuedRenderJobIds.length > 0
        ? [
            prisma.renderJob.updateMany({
              where: { id: { in: queuedRenderJobIds } },
              data: {
                error: "The temporary source video expired before rendering.",
                finishedAt: now,
                status: "FAILED",
              },
            }),
          ]
        : []),
      prisma.video.update({
        where: { id: video.id },
        data: {
          mediaDeletedAt: now,
          objectKey: null,
          path: null,
          url: "",
        },
      }),
    ]);
    deletedVideos += 1;
  }

  return {
    deletedClips,
    deletedVideos,
    skippedVideos,
  };
}

export type TemporaryClip = Clip & TemporaryMedia;
export type TemporaryVideo = Video & TemporaryMedia;
