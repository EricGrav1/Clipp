import { writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { ensureMediaDirectories, safeJoin, unlinkIfPresent } from "@/lib/files";
import { UPLOADS_DIR, toPublicUploadUrl } from "@/lib/paths";
import { prisma } from "@/lib/prisma";
import { assertVideoFile, getVideoExtension, ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const formData = await request.formData();
    const file = assertVideoFile(formData.get("video") as File | null);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        video: true,
        clips: true,
      },
    });

    if (!project) {
      throw new ValidationError("Project not found.");
    }

    await ensureMediaDirectories();

    const extension = getVideoExtension(file.name);
    const fileName = `${randomUUID()}${extension}`;
    const filePath = safeJoin(UPLOADS_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);
    await Promise.all([
      unlinkIfPresent(project.video?.path),
      ...project.clips.map((clip) => unlinkIfPresent(clip.path)),
    ]);

    await prisma.clip.deleteMany({ where: { projectId } });
    const video = await prisma.video.upsert({
      where: { projectId },
      create: {
        projectId,
        originalName: file.name,
        mimeType: file.type,
        fileName,
        url: toPublicUploadUrl(fileName),
        path: filePath,
        sizeBytes: file.size,
      },
      update: {
        originalName: file.name,
        mimeType: file.type,
        fileName,
        url: toPublicUploadUrl(fileName),
        path: filePath,
        sizeBytes: file.size,
        durationSeconds: null,
      },
    });

    return NextResponse.json({ video, clips: [] }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
