import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { processRenderJob } from "@/lib/render-jobs";
import { ValidationError } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    const renderJob = await prisma.renderJob.findFirst({
      where: {
        clipId,
        clip: {
          project: {
            userAccountId: account.id,
          },
        },
      },
      include: {
        clip: true,
      },
    });

    if (!renderJob) {
      throw new ValidationError("Render job not found.", 404);
    }

    if (renderJob.status === "COMPLETE") {
      return NextResponse.json({ clip: renderJob.clip, job: renderJob });
    }

    const job = await processRenderJob(renderJob.id);
    const clip = await prisma.clip.findUniqueOrThrow({
      where: { id: clipId },
    });

    return NextResponse.json({ clip, job });
  } catch (error) {
    return jsonError(error);
  }
}
