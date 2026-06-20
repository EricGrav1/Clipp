import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { getAccountEntitlements } from "@/lib/entitlements";
import { sourceMediaExpiresAt } from "@/lib/media-retention";
import { prisma } from "@/lib/prisma";
import { completeMultipartVideoUpload, deleteStoredMedia } from "@/lib/storage";
import { assertVideoMetadata, ValidationError } from "@/lib/validation";
import { toVideoDTO } from "@/lib/video-dto";

export const runtime = "nodejs";

function assertUploadedObject(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("uploads/")) {
    throw new ValidationError("Uploaded video object is invalid.");
  }

  return value;
}

function assertMultipartUpload(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const upload = value as {
    parts?: Array<{ etag?: unknown; partNumber?: unknown }>;
    uploadId?: unknown;
  };
  if (
    typeof upload.uploadId !== "string" ||
    !upload.uploadId ||
    !Array.isArray(upload.parts) ||
    upload.parts.length === 0
  ) {
    throw new ValidationError("Multipart upload details are invalid.");
  }

  return {
    uploadId: upload.uploadId,
    parts: upload.parts.map((part) => {
      if (
        typeof part.etag !== "string" ||
        !part.etag ||
        !Number.isInteger(part.partNumber) ||
        Number(part.partNumber) < 1
      ) {
        throw new ValidationError("Multipart upload part is invalid.");
      }

      return {
        etag: part.etag,
        partNumber: Number(part.partNumber),
      };
    }),
  };
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
    const entitlements = getAccountEntitlements(account);
    const metadata = assertVideoMetadata({
      fileName: body.originalName,
      maxSizeBytes: entitlements.maxDirectVideoBytes,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
    });
    const objectKey = assertUploadedObject(body.objectKey);
    const multipartUpload = assertMultipartUpload(body.multipartUpload);
    const fileName = objectKey.split("/").at(-1);
    const mediaExpiresAt = sourceMediaExpiresAt();

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

    if (multipartUpload) {
      await completeMultipartVideoUpload({
        objectKey,
        parts: multipartUpload.parts,
        uploadId: multipartUpload.uploadId,
      });
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
        sizeBytes: BigInt(metadata.sizeBytes),
        mediaDeletedAt: null,
        mediaExpiresAt,
      },
      update: {
        originalName: metadata.fileName,
        mimeType: metadata.mimeType,
        fileName,
        url: typeof body.url === "string" ? body.url : `/api/media/${objectKey}`,
        path: null,
        objectKey,
        storageProvider: "r2",
        sizeBytes: BigInt(metadata.sizeBytes),
        durationSeconds: null,
        mediaDeletedAt: null,
        mediaExpiresAt,
      },
    });

    return NextResponse.json({ video: toVideoDTO(video), clips: [] }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
