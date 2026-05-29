import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUserAccount } from "@/lib/auth";
import { getStripeSecretKey, STRIPE_API_VERSION } from "@/lib/stripe";
import { appUrl } from "@/lib/url";
import { ValidationError } from "@/lib/validation";

const PRICE_IDS = {
  monthly: "STRIPE_MONTHLY_PRICE_ID",
  yearly: "STRIPE_YEARLY_PRICE_ID",
} as const;

export const runtime = "nodejs";

async function createCheckoutSession({
  clerkUserId,
  customerEmail,
  customerId,
  interval,
  priceId,
  userAccountId,
}: {
  clerkUserId: string;
  customerEmail: string | null;
  customerId: string | null;
  interval: "monthly" | "yearly";
  priceId: string;
  userAccountId: string;
}) {
  const params = new URLSearchParams({
    "allow_promotion_codes": "true",
    "client_reference_id": userAccountId,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "mode": "subscription",
    "subscription_data[metadata][clerkUserId]": clerkUserId,
    "subscription_data[metadata][interval]": interval,
    "subscription_data[metadata][userAccountId]": userAccountId,
    "success_url": appUrl("/onboarding?session_id={CHECKOUT_SESSION_ID}"),
    "cancel_url": appUrl("/pricing"),
  });

  if (customerId) {
    params.set("customer", customerId);
  } else if (customerEmail) {
    params.set("customer_email", customerEmail);
  }

  let response: Response;

  try {
    response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getStripeSecretKey()}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Stripe-Version": STRIPE_API_VERSION,
      },
      body: params.toString(),
    });
  } catch (error) {
    console.error("Stripe checkout fetch failed", {
      message: error instanceof Error ? error.message : "Unknown fetch error",
    });

    throw new ValidationError(
      "Stripe could not be reached from the server. Try again in a minute.",
      502,
    );
  }

  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
    url?: string;
  };

  if (!response.ok || !payload.url) {
    throw new ValidationError(
      payload.error?.message ?? "Could not start Stripe Checkout.",
      response.status || 500,
    );
  }

  return payload.url;
}

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

    const url = await createCheckoutSession({
      clerkUserId: account.clerkUserId,
      customerEmail: account.email,
      customerId: account.stripeCustomerId,
      interval,
      priceId,
      userAccountId: account.id,
    });

    return NextResponse.json({ url });
  } catch (error) {
    return jsonError(error);
  }
}
