import path from "node:path";

export const PUBLIC_DIR = path.join(process.cwd(), "public");
export const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
export const CLIPS_DIR = path.join(PUBLIC_DIR, "clips");

export function toPublicUploadUrl(fileName: string) {
  return `/uploads/${fileName}`;
}

export function toPublicClipUrl(fileName: string) {
  return `/clips/${fileName}`;
}
