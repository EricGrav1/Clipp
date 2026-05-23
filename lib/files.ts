import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { CLIPS_DIR, UPLOADS_DIR } from "@/lib/paths";

export async function ensureMediaDirectories() {
  await Promise.all([
    mkdir(UPLOADS_DIR, { recursive: true }),
    mkdir(CLIPS_DIR, { recursive: true }),
  ]);
}

export async function unlinkIfPresent(filePath: string | null | undefined) {
  if (!filePath) {
    return;
  }

  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export function safeJoin(basePath: string, fileName: string) {
  const resolvedPath = path.join(basePath, fileName);
  if (!resolvedPath.startsWith(basePath)) {
    throw new Error("Invalid file path.");
  }

  return resolvedPath;
}
