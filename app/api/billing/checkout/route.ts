import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { appUrl } from "@/lib/url";
import { ValidationError } from "@/lib/validation";

const PRICE_IDS = {
  monthly: "STRIPE_MONTHLY_PRICE_ID",
  yearly: "STRIPE_YEARLY_PRICE_ID",
} as const;

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const account = await requireUserAccount();
    const body = await request.json().catch(() => ({}));
    const interval = body.interval === "yearly" ? "yearly" : "monthly";
    const priceEnvName = PRICE_IDS[interval];
    const priceId = process.env[priceEnvName] ?? process.env.STRIPE_PRICE_ID;

    if (!priceId) {
      throw new ValidationError(`${priceEnvName} is not configured.`, 500);
    }

    const stripe = getStripe();
    const customerId = account.stripeCustomerId ?? (
      await stripe.customers.create({
        email: account.email ?? undefined,
        metadata: { userAccountId: account.id, clerkUserId: account.clerkUserId },
      })
    ).id;

    if (!account.stripeCustomerId) {
      await prisma.userAccount.update({
        where: { id: account.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      allow_promotion_codes: true,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: appUrl("/onboarding?session_id={CHECKOUT_SESSION_ID}"),
      cancel_url: appUrl("/pricing"),
      client_reference_id: account.id,
      subscription_data: {
        metadata: {
          interval,
          userAccountId: account.id,
          clerkUserId: account.clerkUserId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return jsonError(error);
  }
}
