import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";
import { SOCIAL_PLATFORMS } from "@/lib/social";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    return NextResponse.json({
      connections: [],
      message: "Social publishing is coming in a few harvests.",
      platforms: SOCIAL_PLATFORMS,
    });
  } catch (error) {
    return jsonError(error);
  }
}
