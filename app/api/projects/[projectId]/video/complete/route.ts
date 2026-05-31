import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { deleteStoredMedia } from "@/lib/storage";
import { assertVideoMetadata, ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

function assertUploadedObject(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("uploads/")) {
    throw new ValidationError("Uploaded video object is invalid.");
  }

  return value;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const account = await requireUserAccount();
    requireActiveSubscription(account);
    const body = await request.json().catch(() => ({}));
    const metadata = assertVideoMetadata({
      fileName: body.originalName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
    });
    const objectKey = assertUploadedObject(body.objectKey);
    const fileName = objectKey.split("/").at(-1);

    if (!fileName) {
      throw new ValidationError("Uploaded video object is invalid.");
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userAccountId: account.id },
      include: {
        video: true,
        clips: true,
      },
    });

    if (!project) {
      throw new ValidationError("Project not found.");
    }

    await Promise.all([
      deleteStoredMedia(project.video ?? {}),
      ...project.clips.map((clip) => deleteStoredMedia(clip)),
    ]);

    await prisma.clip.deleteMany({ where: { projectId } });
    const video = await prisma.video.upsert({
      where: { projectId },
      create: {
        projectId,
        originalName: metadata.fileName,
        mimeType: metadata.mimeType,
        fileName,
        url: typeof body.url === "string" ? body.url : `/api/media/${objectKey}`,
        path: null,
        objectKey,
        storageProvider: "r2",
        sizeBytes: metadata.sizeBytes,
      },
      update: {
        originalName: metadata.fileName,
        mimeType: metadata.mimeType,
        fileName,
        url: typeof body.url === "string" ? body.url : `/api/media/${objectKey}`,
        path: null,
        objectKey,
        storageProvider: "r2",
        sizeBytes: metadata.sizeBytes,
        durationSeconds: null,
      },
    });

    return NextResponse.json({ video, clips: [] }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
