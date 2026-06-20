import type { Video } from "@prisma/client";
import { isTemporaryMediaUnavailable } from "@/lib/media-retention";

export function toVideoDTO(video: Video | null) {
  if (!video) {
    return null;
  }

  const isUnavailable = isTemporaryMediaUnavailable(video);

  return {
    durationSeconds: video.durationSeconds,
    id: video.id,
    mediaDeletedAt: video.mediaDeletedAt,
    mediaExpiresAt: video.mediaExpiresAt,
    originalName: video.originalName,
    url: isUnavailable ? null : video.url,
  };
}

export function toProjectCardDTO<T extends {
  _count: { clips: number };
  createdAt: Date;
  id: string;
  name: string;
  updatedAt: Date;
  video: Video | null;
}>(project: T) {
  return {
    _count: project._count,
    createdAt: project.createdAt,
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    video: project.video
      ? {
          mediaDeletedAt: project.video.mediaDeletedAt,
          mediaExpiresAt: project.video.mediaExpiresAt,
          originalName: project.video.originalName,
          url: isTemporaryMediaUnavailable(project.video)
            ? null
            : project.video.url,
        }
      : null,
  };
}
