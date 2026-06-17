import Link from "next/link";
import { CalendarPlus, Download, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BearFarmer } from "@/components/ui/mascot";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { requireUserAccount } from "@/lib/auth";
import {
  hasActiveSubscription,
  refreshSubscriptionFromStripe,
} from "@/lib/billing";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  let account = await requireUserAccount();
  account = await refreshSubscriptionFromStripe(account);

  if (!hasActiveSubscription(account)) {
    redirect("/pricing?required=subscription");
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <div className="flex animate-fade-in items-center justify-between gap-3">
          <Link className="flex items-center gap-2.5" href="/">
            <BearFarmer size={40} className="animate-bob" />
            <div className="leading-none">
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Clip Farmer
              </span>
              <span className="block text-[11px] font-semibold text-muted-foreground">
                plant a video, harvest the clips
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/app">Dashboard</Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        <section className="grid min-h-[520px] animate-fade-in place-items-center rounded-[1.5rem] border border-border bg-card p-6 shadow-panel">
          <div className="max-w-2xl text-center">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
              <Sprout className="h-3.5 w-3.5" />
              Future crop
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
              Social publishing is coming in a few harvests.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              The connected channel row is still growing. Today Clip Farmer
              focuses on reliable harvesting, MP4 downloads, and a manual
              posting workflow for TikTok, Instagram, YouTube, and LinkedIn.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-card-2 p-4 text-left">
                <Download className="mb-3 h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold">
                  Use ready exports
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Download each ripe clip from the harvest basket and upload it
                  directly inside the social platform.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-card-2 p-4 text-left">
                <CalendarPlus className="mb-3 h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-bold">
                  Revisit later
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  When the crop is ready, this page can become the social
                  calendar and connected account manager.
                </p>
              </div>
            </div>

            <Button asChild className="mt-7" variant="primary">
              <Link href="/app">Back to workspace</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
