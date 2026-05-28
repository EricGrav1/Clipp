import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutSuccessPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <section className="max-w-xl rounded-[1.5rem] border border-border bg-card p-8 text-center shadow-panel">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Billing active
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Your clip field is ready.
        </h1>
        <p className="mt-4 leading-7 text-muted-foreground">
          Stripe is confirming the subscription. Finish the quick setup so your
          workspace starts with the right defaults.
        </p>
        <Button asChild className="mt-6" variant="primary">
          <Link href="/onboarding">Continue setup</Link>
        </Button>
      </section>
    </main>
  );
}
