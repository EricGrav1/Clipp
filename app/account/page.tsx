import Link from "next/link";
import {
  BillingPortalButton,
  CheckoutButton,
} from "@/components/billing-actions";
import { SocialAccountsPanel } from "@/components/social/social-accounts-panel";
import { Button } from "@/components/ui/button";
import { requireUserAccount } from "@/lib/auth";
import {
  getRemainingRenderSeconds,
  hasActiveSubscription,
  refreshSubscriptionFromStripe,
} from "@/lib/billing";
import { formatDuration } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const account = await refreshSubscriptionFromStripe(
    await requireUserAccount(),
  );
  const hasSubscription = hasActiveSubscription(account);
  const remainingSeconds = getRemainingRenderSeconds(account);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link className="font-display text-xl font-extrabold" href="/">
            Clip Farmer
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/app">Dashboard</Link>
            </Button>
          </div>
        </div>

        <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-panel">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
            Account
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Billing and render usage
          </h1>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card-2 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Subscription
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {account.subscriptionStatus}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card-2 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Used
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {formatDuration(account.renderSecondsUsed)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card-2 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                Remaining
              </p>
              <p className="mt-2 font-display text-2xl font-extrabold">
                {formatDuration(remainingSeconds)}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {hasSubscription ? (
              <BillingPortalButton />
            ) : (
              <CheckoutButton>Subscribe</CheckoutButton>
            )}
          </div>
        </section>

        {hasSubscription ? <SocialAccountsPanel /> : null}
      </div>
    </main>
  );
}
