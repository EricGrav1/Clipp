import type { UserAccount } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getStripeSecretKey, STRIPE_API_VERSION } from "@/lib/stripe";
import { ValidationError } from "@/lib/validation";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active"]);
const DEFAULT_FOUNDER_EMAIL = "EricGrav1@icloud.com";

type StripeList<T> = {
  data?: T[];
};

type StripeCustomer = {
  id: string;
  email?: string | null;
};

type StripeSubscriptionItem = {
  current_period_start?: number | null;
  current_period_end?: number | null;
  price?: {
    id?: string | null;
  } | null;
};

type StripeSubscriptionResponse = {
  id: string;
  cancel_at_period_end?: boolean | null;
  customer?: string | StripeCustomer | null;
  status?: string | null;
  items?: {
    data?: StripeSubscriptionItem[];
  } | null;
};

type StripeCheckoutSessionResponse = {
  id: string;
  client_reference_id?: string | null;
  customer?: string | StripeCustomer | null;
  mode?: string | null;
  payment_status?: string | null;
  status?: string | null;
  subscription?: string | StripeSubscriptionResponse | null;
};

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

function getStripeObjectId(value: string | { id?: string | null } | null | undefined) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id ?? null;
}

function getSubscriptionSnapshot(subscription: StripeSubscriptionResponse) {
  const item = subscription.items?.data?.[0];
  const status = subscription.cancel_at_period_end
    ? "canceled"
    : subscription.status ?? "inactive";

  return {
    currentPeriodStart: item?.current_period_start
      ? new Date(item.current_period_start * 1000)
      : null,
    currentPeriodEnd: item?.current_period_end
      ? new Date(item.current_period_end * 1000)
      : null,
    priceId: item?.price?.id ?? null,
    status,
  };
}

async function stripeGet<T>(path: string, params?: URLSearchParams) {
  const query = params?.toString();
  const response = await fetch(
    `https://api.stripe.com${path}${query ? `?${query}` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${getStripeSecretKey()}`,
        "Stripe-Version": STRIPE_API_VERSION,
      },
    },
  );
  const payload = (await response.json().catch(() => ({}))) as T & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new ValidationError(
      payload.error?.message ?? "Could not refresh Stripe subscription status.",
      response.status || 500,
    );
  }

  return payload;
}

async function updateAccountFromStripeSubscription({
  accountId,
  customerId,
  subscription,
}: {
  accountId: string;
  customerId: string | null;
  subscription: StripeSubscriptionResponse;
}) {
  const snapshot = getSubscriptionSnapshot(subscription);

  return prisma.$transaction(async (tx) => {
    await tx.userAccount.updateMany({
      where: {
        id: { not: accountId },
        OR: [
          ...(customerId ? [{ stripeCustomerId: customerId }] : []),
          { stripeSubscriptionId: subscription.id },
        ],
      },
      data: {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: "inactive",
        stripePriceId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
      },
    });

    return tx.userAccount.update({
      where: { id: accountId },
      data: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: snapshot.status,
        stripePriceId: snapshot.priceId,
        currentPeriodStart: snapshot.currentPeriodStart,
        currentPeriodEnd: snapshot.currentPeriodEnd,
        renderSecondsUsed: 0,
      },
    });
  });
}

async function getNewestStripeSubscription(customerId: string) {
  const params = new URLSearchParams({
    customer: customerId,
    limit: "10",
    status: "all",
  });
  const subscriptions = await stripeGet<StripeList<StripeSubscriptionResponse>>(
    "/v1/subscriptions",
    params,
  );

  return (
    subscriptions.data?.find((subscription) =>
      ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status ?? ""),
    ) ??
    subscriptions.data?.[0] ??
    null
  );
}

export async function syncCheckoutSessionSubscription(
  account: UserAccount,
  checkoutSessionId: string,
) {
  const sessionId = checkoutSessionId.trim();

  if (!sessionId.startsWith("cs_")) {
    throw new ValidationError("Invalid Stripe checkout session.", 400);
  }

  const params = new URLSearchParams();
  params.append("expand[]", "customer");
  params.append("expand[]", "subscription");

  const session = await stripeGet<StripeCheckoutSessionResponse>(
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    params,
  );

  const customerEmail =
    session.customer && typeof session.customer === "object"
      ? session.customer.email?.toLowerCase()
      : null;
  const accountEmail = account.email?.toLowerCase() ?? null;
  const matchesAccount = session.client_reference_id === account.id;
  const matchesEmail = Boolean(accountEmail && customerEmail === accountEmail);

  if (!matchesAccount && !matchesEmail) {
    throw new ValidationError("Checkout session does not belong to this account.", 403);
  }

  if (session.mode !== "subscription" || session.status !== "complete") {
    throw new ValidationError("Checkout is not complete yet.", 400);
  }

  const customerId = getStripeObjectId(session.customer);
  let subscription =
    typeof session.subscription === "object" ? session.subscription : null;

  if (!subscription && typeof session.subscription === "string") {
    subscription = await stripeGet<StripeSubscriptionResponse>(
      `/v1/subscriptions/${encodeURIComponent(session.subscription)}`,
    );
  }

  if (!subscription) {
    throw new ValidationError("Stripe did not return a subscription.", 502);
  }

  return updateAccountFromStripeSubscription({
    accountId: account.id,
    customerId: customerId ?? getStripeObjectId(subscription.customer),
    subscription,
  });
}

export async function refreshSubscriptionFromStripe(account: UserAccount) {
  if (isFounderAccount(account) || !isBillingConfigured()) {
    return account;
  }

  try {
    let customerId = account.stripeCustomerId;

    if (!customerId && account.email) {
      const params = new URLSearchParams({
        email: account.email,
        limit: "10",
      });
      const customers = await stripeGet<StripeList<StripeCustomer>>(
        "/v1/customers",
        params,
      );
      customerId = customers.data?.find(
        (customer) =>
          customer.email?.toLowerCase() === account.email?.toLowerCase(),
      )?.id ?? null;
    }

    if (!customerId) {
      return account;
    }

    const subscription = await getNewestStripeSubscription(customerId);

    if (!subscription) {
      return account;
    }

    return updateAccountFromStripeSubscription({
      accountId: account.id,
      customerId,
      subscription,
    });
  } catch (error) {
    console.error("Stripe subscription refresh failed", {
      accountId: account.id,
      message: error instanceof Error ? error.message : "Unknown error",
    });

    return account;
  }
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
