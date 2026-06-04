import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { createDirectVideoUpload } from "@/lib/storage";
import { assertVideoMetadata, ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    const project = await prisma.project.findFirst({
      where: { id: projectId, userAccountId: account.id },
      select: { id: true },
    });

    if (!project) {
      throw new ValidationError("Project not found.");
    }

    const body = await request.json().catch(() => ({}));
    const metadata = assertVideoMetadata({
      fileName: body.fileName,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
    });
    const upload = await createDirectVideoUpload(
      metadata.extension,
      metadata.mimeType,
      metadata.sizeBytes,
    );

    if (!upload) {
      throw new ValidationError(
        "Production video uploads need Cloudflare R2 storage configured.",
        501,
      );
    }

    return NextResponse.json({ upload });
  } catch (error) {
    return jsonError(error);
  }
}
