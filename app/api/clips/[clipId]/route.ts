import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { unlinkIfPresent } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { assertClipTitle, ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;
    const body = await request.json();
    const title = assertClipTitle(body.title);
    const clip = await prisma.clip.update({
      where: { id: clipId },
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
    const clip = await prisma.clip.findUnique({ where: { id: clipId } });

    if (!clip) {
      throw new ValidationError("Clip not found.");
    }

    await prisma.clip.delete({ where: { id: clipId } });
    await unlinkIfPresent(clip.path);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
