import { after, NextResponse } from "next/server";
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

    const isRecentlyRendering =
      renderJob.status === "RENDERING" &&
      renderJob.startedAt &&
      Date.now() - renderJob.startedAt.getTime() < 4 * 60 * 1000;

    if (renderJob.status === "COMPLETE" || isRecentlyRendering) {
      return NextResponse.json({ clip: renderJob.clip, job: renderJob });
    }

    const [clip, job] = await prisma.$transaction([
      prisma.clip.update({
        where: { id: clipId },
        data: { status: "QUEUED", error: null },
      }),
      prisma.renderJob.update({
        where: { id: renderJob.id },
        data: {
          error: null,
          finishedAt: null,
          status: "QUEUED",
        },
      }),
    ]);

    after(async () => {
      await processRenderJob(renderJob.id).catch((error) => {
        console.error("Background render retry failed", {
          clipId,
          error,
          renderJobId: renderJob.id,
        });
      });
    });

    return NextResponse.json({ clip, job });
  } catch (error) {
    return jsonError(error);
  }
}
