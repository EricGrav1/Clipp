import type { Clip } from "@prisma/client";
import { toPublicClipUrl } from "@/lib/paths";
import { getStoredMediaUrl } from "@/lib/storage";

export function toClipDTO(clip: Clip) {
  const fileName = clip.fileName ?? clip.objectKey?.split("/").pop() ?? "clip.mp4";

  return {
    ...clip,
    url: getStoredMediaUrl(clip.objectKey, toPublicClipUrl(fileName)),
  };
}
