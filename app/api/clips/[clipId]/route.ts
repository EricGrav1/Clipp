import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteStoredMedia } from "@/lib/storage";
import { assertClipTitle, ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;
    const account = await requireUserAccount();
    const body = await request.json();
    const title = assertClipTitle(body.title);
    const existingClip = await prisma.clip.findFirst({
      where: { id: clipId, project: { userAccountId: account.id } },
    });

    if (!existingClip) {
      throw new ValidationError("Clip not found.", 404);
    }

    const clip = await prisma.clip.update({
      where: { id: existingClip.id },
      data: { title },
    });

    return NextResponse.json({ clip });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;
    const account = await requireUserAccount();
    const clip = await prisma.clip.findFirst({
      where: { id: clipId, project: { userAccountId: account.id } },
    });

    if (!clip) {
      throw new ValidationError("Clip not found.", 404);
    }

    await prisma.clip.delete({ where: { id: clipId } });
    await deleteStoredMedia(clip);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
