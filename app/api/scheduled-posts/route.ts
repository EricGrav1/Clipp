import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { toScheduledPostDTO } from "@/lib/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    const posts = await prisma.scheduledPost.findMany({
      where: { userAccountId: account.id },
      orderBy: { scheduledAt: "asc" },
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

    return NextResponse.json({ posts: posts.map(toScheduledPostDTO) });
  } catch (error) {
    return jsonError(error);
  }
}
