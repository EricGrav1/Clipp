import type { Clip } from "@prisma/client";
import { toPublicClipUrl } from "@/lib/paths";
import { getStoredMediaDownloadUrl, getStoredMediaUrl } from "@/lib/storage";

export function toClipDTO(clip: Clip) {
  const fileName =
    clip.fileName ?? clip.objectKey?.split("/").pop() ?? "clip.mp4";

  return {
    ...clip,
    downloadUrl: getStoredMediaDownloadUrl(
      clip.objectKey,
      toPublicClipUrl(fileName),
    ),
    url: getStoredMediaUrl(clip.objectKey, toPublicClipUrl(fileName)),
  };
}
