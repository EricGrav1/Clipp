import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST() {
  try {
    const account = await requireUserAccount();
    requireActiveSubscription(account);

    return NextResponse.json(
      {
        error: "Social publishing is coming in a few harvests.",
      },
      { status: 501 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
