import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { appUrl } from "@/lib/url";
import { ValidationError } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST() {
  try {
    const account = await requireUserAccount();

    if (!account.stripeCustomerId) {
      throw new ValidationError("No billing account found.", 400);
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: account.stripeCustomerId,
      return_url: appUrl("/account"),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return jsonError(error);
  }
}
