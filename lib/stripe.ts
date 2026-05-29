import Stripe from "stripe";
import { ValidationError } from "@/lib/validation";

export const STRIPE_API_VERSION = "2026-04-22.dahlia";

export function getStripeSecretKey() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new ValidationError("Stripe checkout is not configured yet.", 500);
  }

  return secretKey;
}

export function getStripe() {
  const secretKey = getStripeSecretKey();

  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });
}
