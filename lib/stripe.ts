import Stripe from "stripe";
import { trimmedEnvValue } from "@/lib/env";
import { ValidationError } from "@/lib/validation";

export const STRIPE_API_VERSION = "2026-04-22.dahlia";

function assertAsciiEnvironmentValue(name: string, value: string) {
  if (!/^[\x20-\x7E]+$/.test(value)) {
    throw new ValidationError(
      `${name} contains an invalid character. Delete it in Vercel and paste a fresh value from Stripe.`,
      500,
    );
  }
}

export function getStripeSecretKey() {
  const secretKey = trimmedEnvValue(process.env.STRIPE_SECRET_KEY);

  if (!secretKey) {
    throw new ValidationError("STRIPE_SECRET_KEY is not configured.", 500);
  }

  assertAsciiEnvironmentValue("STRIPE_SECRET_KEY", secretKey);

  if (!secretKey.startsWith("sk_")) {
    throw new ValidationError(
      "STRIPE_SECRET_KEY must be a Stripe secret key that starts with sk_.",
      500,
    );
  }

  if (secretKey === trimmedEnvValue(process.env.CLERK_SECRET_KEY)) {
    throw new ValidationError(
      "STRIPE_SECRET_KEY matches CLERK_SECRET_KEY. Paste the Stripe secret key into STRIPE_SECRET_KEY and the Clerk secret key into CLERK_SECRET_KEY.",
      500,
    );
  }

  return secretKey;
}

export function getStripePriceId(name: string) {
  const priceId = process.env[name]?.trim();

  if (!priceId) {
    throw new ValidationError(`${name} is not configured.`, 500);
  }

  assertAsciiEnvironmentValue(name, priceId);

  if (!priceId.startsWith("price_")) {
    throw new ValidationError(`${name} must be a Stripe price ID.`, 500);
  }

  return priceId;
}

export function getStripe() {
  const secretKey = getStripeSecretKey();

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });
}
