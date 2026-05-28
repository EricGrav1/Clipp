import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import {
  cancelWithProvider,
  retryScheduledPost,
  toScheduledPostDTO,
} from "@/lib/social";
import { ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action : "";
    const post = await prisma.scheduledPost.findFirst({
      where: { id: postId, userAccountId: account.id },
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

    if (!post) {
      throw new ValidationError("Scheduled post not found.", 404);
    }

    if (action === "cancel") {
      if (!["SCHEDULED", "SCHEDULING", "FAILED"].includes(post.status)) {
        throw new ValidationError("This post cannot be canceled.");
      }

      const connection = await prisma.socialConnection.findUnique({
        where: {
          userAccountId_provider: {
            userAccountId: account.id,
            provider: post.provider,
          },
        },
      });

      if (connection && post.providerPostId && post.status === "SCHEDULED") {
        await cancelWithProvider(connection, post.providerPostId);
      }

      const canceled = await prisma.scheduledPost.update({
        where: { id: post.id },
        data: {
          status: "CANCELED",
          failureReason: null,
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

      return NextResponse.json({ post: toScheduledPostDTO(canceled) });
    }

    if (action === "retry") {
      const retried = await retryScheduledPost(post);
      return NextResponse.json({ post: toScheduledPostDTO(retried) });
    }

    throw new ValidationError("Unsupported scheduled post action.");
  } catch (error) {
    return jsonError(error);
  }
}
