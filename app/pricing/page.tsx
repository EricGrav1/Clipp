import Link from "next/link";
import { Check } from "lucide-react";
import { CheckoutButton } from "@/components/billing-actions";
import { Button } from "@/components/ui/button";

const features = [
  "120 render minutes per month",
  "Unlimited projects while subscribed",
  "Source videos and clips kept while subscribed",
  "Download-ready MP4 exports",
  "Native share support where browsers allow it",
];

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ required?: string }>;
}) {
  const { required } = await searchParams;
  const isSubscriptionRequired = required === "subscription";

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex items-center justify-between">
          <Link className="font-display text-xl font-extrabold" href="/">
            Clip Farmer
          </Link>
          <Button asChild variant="secondary">
            <Link href="/app">Open app</Link>
          </Button>
        </div>

        {isSubscriptionRequired ? (
          <div className="mb-8 rounded-2xl border border-primary/45 bg-primary/12 px-5 py-4 text-sm font-semibold text-foreground">
            Choose a plan to unlock the Clip Farmer workspace.
          </div>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Pricing
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-none tracking-tight">
              Paid plans for serious clip harvesting.
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              No free tier. Choose monthly flexibility or yearly savings, then
              start turning long-form recordings into reusable clips.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-panel">
              <div className="flex items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h2 className="font-display text-3xl font-extrabold">
                    Monthly
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    For creators and podcasters who want flexible billing.
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-4xl font-extrabold">$19</p>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    per month
                  </p>
                </div>
              </div>
              <div className="my-6 grid gap-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              <CheckoutButton className="pt-1">Subscribe monthly</CheckoutButton>
            </div>

            <div className="relative rounded-[1.5rem] border-2 border-primary bg-card p-6 shadow-glow">
              <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground">
                Best value
              </span>
              <div className="flex items-end justify-between gap-4 border-b border-border pb-6">
                <div>
                  <h2 className="font-display text-3xl font-extrabold">Yearly</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Same creator plan with $79 saved each year.
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-4xl font-extrabold">$149</p>
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    per year
                  </p>
                </div>
              </div>
              <div className="my-6 grid gap-3">
                {features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              <CheckoutButton className="pt-1" interval="yearly">
                Subscribe yearly
              </CheckoutButton>
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">
              Cancel anytime through the billing portal. Promo codes can be
              entered at checkout. Render limits reset each monthly billing period.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
