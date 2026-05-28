import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { deleteStoredMedia, storeUploadedVideo } from "@/lib/storage";
import { assertVideoFile, getVideoExtension, ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    const formData = await request.formData();
    const file = assertVideoFile(formData.get("video") as File | null);
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

    const extension = getVideoExtension(file.name);
    const storedVideo = await storeUploadedVideo(file, extension);

    await Promise.all([
      deleteStoredMedia(project.video ?? {}),
      ...project.clips.map((clip) => deleteStoredMedia(clip)),
    ]);

    await prisma.clip.deleteMany({ where: { projectId } });
    const video = await prisma.video.upsert({
      where: { projectId },
      create: {
        projectId,
        originalName: file.name,
        mimeType: file.type,
        fileName: storedVideo.fileName,
        url: storedVideo.url,
        path: storedVideo.path,
        objectKey: storedVideo.objectKey,
        storageProvider: storedVideo.provider,
        sizeBytes: file.size,
      },
      update: {
        originalName: file.name,
        mimeType: file.type,
        fileName: storedVideo.fileName,
        url: storedVideo.url,
        path: storedVideo.path,
        objectKey: storedVideo.objectKey,
        storageProvider: storedVideo.provider,
        sizeBytes: file.size,
        durationSeconds: null,
      },
    });

    return NextResponse.json({ video, clips: [] }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
