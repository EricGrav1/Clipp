import type { UserAccount } from "@prisma/client";
import { isFounderAccount } from "@/lib/billing";

const STARTER_DIRECT_VIDEO_MAX_BYTES = 5 * 1024 * 1024 * 1024;
const DEFAULT_PRO_DIRECT_VIDEO_MAX_BYTES = 25 * 1024 * 1024 * 1024;

export type AccountTier = "starter" | "pro";

function configuredPriceIds(names: string[]) {
  return new Set(
    names
      .map((name) => process.env[name]?.trim())
      .filter((priceId): priceId is string => Boolean(priceId)),
  );
}

function readByteLimit(name: string, fallback: number) {
  const value = Number(process.env[name]);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return fallback;
}

export function getAccountTier(account: UserAccount | null | undefined): AccountTier {
  if (account && isFounderAccount(account)) {
    return "pro";
  }

  const proPriceIds = configuredPriceIds([
    "STRIPE_PRO_PRICE_ID",
    "STRIPE_PRO_MONTHLY_PRICE_ID",
    "STRIPE_PRO_YEARLY_PRICE_ID",
  ]);

  if (account?.stripePriceId && proPriceIds.has(account.stripePriceId)) {
    return "pro";
  }

  return "starter";
}

export function getAccountEntitlements(account: UserAccount | null | undefined) {
  const tier = getAccountTier(account);
  const isPro = tier === "pro";

  return {
    canRemoveWatermark: isPro,
    canUseAI: isPro,
    canUseDirectSocial: isPro,
    canUseScheduling: isPro,
    maxDirectVideoBytes: isPro
      ? readByteLimit(
          "PRO_DIRECT_VIDEO_MAX_BYTES",
          DEFAULT_PRO_DIRECT_VIDEO_MAX_BYTES,
        )
      : STARTER_DIRECT_VIDEO_MAX_BYTES,
    tier,
    watermarkText: process.env.WATERMARK_TEXT?.trim() || "Clip Farmer",
  };
}

export function shouldWatermarkClips(account: UserAccount | null | undefined) {
  return !getAccountEntitlements(account).canRemoveWatermark;
}
