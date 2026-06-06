import type { Video } from "@prisma/client";

export function toVideoDTO(video: Video | null) {
  if (!video) {
    return null;
  }

  return {
    durationSeconds: video.durationSeconds,
    id: video.id,
    originalName: video.originalName,
    url: video.url,
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
          originalName: project.video.originalName,
          url: project.video.url,
        }
      : null,
  };
}
