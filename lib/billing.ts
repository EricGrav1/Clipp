import type { UserAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ValidationError } from "@/lib/validation";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active"]);
const DEFAULT_FOUNDER_EMAIL = "EricGrav1@icloud.com";

function isLocalDevelopment() {
  return process.env.NODE_ENV !== "production";
}

export function isBillingConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      (process.env.STRIPE_MONTHLY_PRICE_ID || process.env.STRIPE_PRICE_ID),
  );
}

export function hasActiveSubscription(account: UserAccount) {
  if (isFounderAccount(account)) {
    return true;
  }

  if (!isBillingConfigured()) {
    return isLocalDevelopment();
  }

  return ACTIVE_SUBSCRIPTION_STATUSES.has(account.subscriptionStatus);
}

export function isFounderAccount(account: UserAccount) {
  const founderEmail = process.env.FOUNDER_EMAIL ?? DEFAULT_FOUNDER_EMAIL;

  return account.email?.toLowerCase() === founderEmail.toLowerCase();
}

export function requireActiveSubscription(
  account: UserAccount,
  message = "Subscribe to use Clip Farmer.",
) {
  if (!hasActiveSubscription(account)) {
    throw new ValidationError(message, 402);
  }
}

export function getRemainingRenderSeconds(account: UserAccount) {
  return Math.max(
    0,
    account.renderMinutesLimit * 60 - account.renderSecondsUsed,
  );
}

export function requireRenderEntitlement(account: UserAccount, durationSeconds: number) {
  if (!hasActiveSubscription(account)) {
    throw new ValidationError("Subscribe to render clips.", 402);
  }

  if (durationSeconds > getRemainingRenderSeconds(account)) {
    throw new ValidationError("Monthly render minutes exceeded.", 402);
  }
}

export async function recordRenderUsage(accountId: string, durationSeconds: number) {
  await prisma.userAccount.update({
    where: { id: accountId },
    data: {
      renderSecondsUsed: {
        increment: Math.ceil(durationSeconds),
      },
    },
  });
}
