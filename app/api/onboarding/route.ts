import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { syncCheckoutSessionSubscription } from "@/lib/billing";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

const REQUIRED_FIELDS = ["heardFrom", "creatorType", "contentSource", "primaryGoal"];

export async function POST(request: Request) {
  try {
    const account = await requireUserAccount();
    const body = await request.json().catch(() => ({}));
    const postingPlatforms = Array.isArray(body.postingPlatforms)
      ? body.postingPlatforms.filter(
          (platform: unknown): platform is string => typeof platform === "string",
        )
      : [];

    for (const field of REQUIRED_FIELDS) {
      if (typeof body[field] !== "string" || !body[field].trim()) {
        throw new ValidationError("Complete the required onboarding questions.", 400);
      }
    }

    if (typeof body.checkoutSessionId === "string" && body.checkoutSessionId.trim()) {
      await syncCheckoutSessionSubscription(account, body.checkoutSessionId);
    }

    await prisma.userAccount.update({
      where: { id: account.id },
      data: {
        onboardingCompletedAt: new Date(),
        onboardingAnswers: {
          heardFrom: body.heardFrom,
          creatorType: body.creatorType,
          contentSource: body.contentSource,
          primaryGoal: body.primaryGoal,
          postingPlatforms,
          teamSize: typeof body.teamSize === "string" ? body.teamSize : "",
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
