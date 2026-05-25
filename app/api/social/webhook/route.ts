import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function mapProviderStatus(status: unknown) {
  if (typeof status !== "string") {
    return null;
  }

  const normalized = status.toLowerCase();
  if (["success", "published", "complete", "completed"].includes(normalized)) {
    return "PUBLISHED";
  }
  if (["pending", "scheduled", "awaiting approval"].includes(normalized)) {
    return "SCHEDULED";
  }
  if (["error", "failed", "failure"].includes(normalized)) {
    return "FAILED";
  }
  if (["deleted", "canceled", "cancelled"].includes(normalized)) {
    return "CANCELED";
  }

  return null;
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.length > 0);
}

export async function POST(request: Request) {
  try {
    const secret = process.env.SOCIAL_WEBHOOK_SECRET;
    if (secret && request.headers.get("x-social-webhook-secret") !== secret) {
      return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
    }

    const body = await request.json();
    const providerPostId = firstString(
      body.id,
      body.postId,
      body.ayrsharePostId,
      body.historyId,
      body.refId,
    );
    const status = mapProviderStatus(body.status ?? body.action ?? body.type);

    if (!providerPostId || !status) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    await prisma.scheduledPost.updateMany({
      where: { providerPostId },
      data: {
        status,
        providerResponse: JSON.stringify(body ?? {}),
        failureReason:
          status === "FAILED"
            ? firstString(body.message, body.error, body.details) ?? "Provider reported a failed post."
            : null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
