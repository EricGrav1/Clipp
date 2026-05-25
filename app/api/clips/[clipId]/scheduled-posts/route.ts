import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import {
  assertConnectionCanPost,
  assertPlatformOverrides,
  assertScheduleCaption,
  assertScheduledAt,
  assertSelectedPlatforms,
  assertTimezone,
  scheduleWithProvider,
  toProviderMediaUrl,
  toScheduledPostDTO,
} from "@/lib/social";
import { ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clipId: string }> },
) {
  try {
    const { clipId } = await params;
    const account = await requireUserAccount();

    if (!hasActiveSubscription(account)) {
      throw new ValidationError("Subscribe before scheduling clips.", 402);
    }

    const body = await request.json();
    const selectedPlatforms = assertSelectedPlatforms(body.selectedPlatforms);
    const sharedCaption = assertScheduleCaption(body.sharedCaption);
    const platformOverrides = assertPlatformOverrides(body.platformOverrides);
    const scheduledAt = assertScheduledAt(body.scheduledAt);
    const timezone = assertTimezone(body.timezone);

    const clip = await prisma.clip.findFirst({
      where: {
        id: clipId,
        project: { userAccountId: account.id },
      },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    if (!clip) {
      throw new ValidationError("Clip not found.", 404);
    }

    if (clip.status !== "READY") {
      throw new ValidationError("Only ready clips can be scheduled.");
    }

    const connection = await prisma.socialConnection.findUnique({
      where: {
        userAccountId_provider: {
          userAccountId: account.id,
          provider: "ayrshare",
        },
      },
    });
    assertConnectionCanPost(connection, selectedPlatforms);

    const mediaUrl = toProviderMediaUrl(clip);
    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        userAccountId: account.id,
        clipId: clip.id,
        provider: "ayrshare",
        selectedPlatforms: JSON.stringify(selectedPlatforms),
        sharedCaption,
        platformOverrides: JSON.stringify(platformOverrides),
        scheduledAt,
        timezone,
        status: "SCHEDULING",
      },
    });

    try {
      const providerResult = await scheduleWithProvider({
        idempotencyKey: scheduledPost.id,
        mediaUrl,
        overrides: platformOverrides,
        platforms: selectedPlatforms,
        post: sharedCaption,
        scheduleDate: scheduledAt.toISOString(),
        connection: connection!,
      });

      const updatedPost = await prisma.scheduledPost.update({
        where: { id: scheduledPost.id },
        data: {
          providerPostId: providerResult.providerPostId,
          providerResponse: JSON.stringify(providerResult.response ?? {}),
          status: "SCHEDULED",
        },
        include: {
          clip: {
            include: {
              project: {
                select: { name: true },
              },
            },
          },
        },
      });

      return NextResponse.json({ post: toScheduledPostDTO(updatedPost) });
    } catch (error) {
      const failedPost = await prisma.scheduledPost.update({
        where: { id: scheduledPost.id },
        data: {
          failureReason:
            error instanceof Error ? error.message : "Social provider request failed.",
          providerResponse: JSON.stringify({
            error: error instanceof Error ? error.message : "Provider failure",
          }),
          status: "FAILED",
        },
        include: {
          clip: {
            include: {
              project: {
                select: { name: true },
              },
            },
          },
        },
      });

      return NextResponse.json(
        {
          error: failedPost.failureReason,
          post: toScheduledPostDTO(failedPost),
        },
        { status: error instanceof ValidationError ? error.status : 502 },
      );
    }
  } catch (error) {
    return jsonError(error);
  }
}
