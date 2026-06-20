import type { Clip } from "@prisma/client";
import { isTemporaryMediaUnavailable } from "@/lib/media-retention";
import { toPublicClipUrl } from "@/lib/paths";
import { getStoredMediaDownloadUrl, getStoredMediaUrl } from "@/lib/storage";

export function toClipDTO(clip: Clip) {
  const fileName =
    clip.fileName ?? clip.objectKey?.split("/").pop() ?? "clip.mp4";
  const isUnavailable = isTemporaryMediaUnavailable(clip);
  const objectKey = isUnavailable ? null : clip.objectKey;

  return {
    ...clip,
    downloadUrl: getStoredMediaDownloadUrl(
      objectKey,
      toPublicClipUrl(fileName),
    ),
    url: getStoredMediaUrl(objectKey, toPublicClipUrl(fileName)),
  };
}
