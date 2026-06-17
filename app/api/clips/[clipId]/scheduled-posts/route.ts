import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/billing";

export const runtime = "nodejs";

export async function POST() {
  try {
    requireActiveSubscription(await requireUserAccount());

    return NextResponse.json(
      {
        error:
          "Social scheduling is coming in a few harvests. Download the clip and post it manually for now.",
      },
      { status: 501 },
    );
  } catch (error) {
    return jsonError(error);
  }
}
