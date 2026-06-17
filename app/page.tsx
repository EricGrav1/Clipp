import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  CloudUpload,
  Download,
  Play,
  Scissors,
  Share2,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { AuthNav } from "@/components/auth-nav";
import { CheckoutButton } from "@/components/billing-actions";
import { Button } from "@/components/ui/button";
import { BearFarmer } from "@/components/ui/mascot";
import { isClerkPublishableKey } from "@/lib/env";

const steps = [
  {
    icon: CloudUpload,
    title: "Upload",
    text: "Drop in a podcast, stream, coaching call, or webinar.",
  },
  {
    icon: Sprout,
    title: "Find the moment",
    text: "Mark the in-point and choose the clip length.",
  },
  {
    icon: Scissors,
    title: "Harvest",
    text: "Render clean MP4 clips from the exact timestamp.",
  },
  {
    icon: Share2,
    title: "Post",
    text: "Download the clip, copy your caption, and upload it anywhere.",
  },
];

const exampleClips = [
  ["Mindset is everything.", "00:34", "1.1M"],
  ["Habits beat motivation.", "00:28", "872K"],
  ["Protect your focus.", "00:36", "1.3M"],
  ["Build once. Earn forever.", "00:31", "965K"],
];

const benefits = [
  {
    icon: Clock3,
    title: "Save hours",
    text: "Pull short-form ideas out of long recordings without scrubbing forever.",
  },
  {
    icon: TrendingUp,
    title: "Grow faster",
    text: "Turn every episode, call, or stream into more chance to grow your audience!",
  },
  {
    icon: CalendarClock,
    title: "Stay consistent",
    text: "Keep a simple publishing rhythm with repeatable exports and captions.",
  },
];

const proof = [
  "Podcast hosts",
  "Coaches",
  "Course creators",
  "Streamers",
  "Solo founders",
];

export default function LandingPage() {
  const isClerkEnabled = isClerkPublishableKey(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-border/80 bg-background/82 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <BearFarmer size={44} />
            <span className="font-display text-2xl font-extrabold tracking-tight">
              Clip Farmer
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-extrabold text-foreground/80 lg:flex">
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#posting">Posting</a>
            <a href="#pricing">Pricing</a>
            <a href="#examples">Examples</a>
          </nav>
          <div className="flex items-center gap-2">
            <AuthNav isClerkEnabled={isClerkEnabled} />
          </div>
        </div>
      </header>

      <section className="relative min-h-[640px] border-b border-border">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/images/clip-farmer-hero-tractor.png')] bg-cover bg-[60%_center] opacity-95" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.92)_22%,hsl(var(--background)/0.58)_48%,hsl(var(--background)/0.08)_76%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,hsl(var(--background))_82%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,hsl(var(--background)/0.58),transparent)]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-10 pt-10 sm:px-8 lg:min-h-[600px] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-14">
          <div className="max-w-3xl animate-fade-in-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-4 py-2 text-sm font-extrabold text-foreground shadow-soft">
              <Sprout className="h-4 w-4 text-primary" />
              The clip harvester for creators and podcasters
            </p>
            <h1 className="font-display text-6xl font-extrabold leading-[0.88] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              Harvest
              <span className="block text-accent">your best clips</span>
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-8 text-foreground/78">
              Find, cut, and export the most engaging moments from long-form
              recordings without dragging a timeline around all afternoon.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="primary">
                <Link href="/sign-up">Subscribe and start clipping</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/app">
                  Watch the workflow
                  <Play className="h-4 w-4 fill-current" />
                </Link>
              </Button>
            </div>
            <div className="mt-7 grid max-w-xl gap-3 text-sm font-bold text-muted-foreground sm:grid-cols-3">
              {[
                "No complex editor",
                "Post-ready exports",
                "Works in minutes",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        id="how"
        className="mx-auto grid max-w-7xl gap-8 border-b border-border px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div>
          <h2 className="mb-6 text-center font-display text-3xl font-extrabold text-foreground lg:text-left">
            Your clips, grown in 4 simple steps
          </h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.title}
                  className="rounded-2xl border border-border bg-card p-4 shadow-soft"
                >
                  <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-primary">
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className="mb-1 font-mono text-xs font-bold text-warning">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="font-display text-lg font-extrabold">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div id="examples">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-extrabold text-foreground">
              From long-form to scroll-stopping
            </h2>
            <Link
              className="hidden items-center gap-1 text-sm font-extrabold text-primary sm:flex"
              href="/app"
            >
              See workflow <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {exampleClips.map(([title, duration, views], index) => (
              <div
                key={title}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
              >
                <div className="relative grid aspect-[9/13] place-items-center bg-[linear-gradient(160deg,hsl(var(--foreground)/0.9),hsl(var(--primary)/0.54))] p-3 text-center">
                  <span className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 font-mono text-[10px] text-white">
                    {duration}
                  </span>
                  <span className="font-display text-xl font-extrabold leading-tight text-white drop-shadow">
                    {title}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 text-xs font-extrabold text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Play className="h-3 w-3 fill-current" />
                    {views}
                  </span>
                  <span>Clip {index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="posting"
        className="border-b border-border bg-[linear-gradient(180deg,hsl(var(--card)/0.42),transparent)]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <CalendarClock className="h-3.5 w-3.5" />
              Post-ready exports
            </p>
            <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Download once. Post anywhere.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Post scheduling is coming in a few harvests. Today, Clip Farmer
              gives you a ready clip, a caption workspace, and quick links so
              you can post manually without losing momentum.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["MP4 exports", "Copy-ready captions", "Platform links"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-border bg-card p-4 shadow-soft"
                  >
                    <Check className="mb-2 h-4 w-4 text-primary" />
                    <p className="text-sm font-extrabold text-foreground">
                      {item}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-border bg-card p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-primary">
                  Posting row
                </p>
                <h3 className="font-display text-2xl font-extrabold">
                  Clips ready to post
                </h3>
              </div>
              <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                3 ready
              </span>
            </div>

            <div className="space-y-3">
              {[
                ["Perfect Hook", "TikTok upload", "Copy caption"],
                ["Big Insight", "YouTube Shorts", "Download MP4"],
                ["Build once", "LinkedIn post", "Open platform"],
              ].map(([title, channels, time], index) => (
                <div
                  key={title}
                  className="grid gap-3 rounded-xl border border-border bg-card-2 p-3 sm:grid-cols-[72px_1fr_auto] sm:items-center"
                >
                  <div className="grid aspect-video place-items-center rounded-lg bg-[linear-gradient(140deg,hsl(var(--foreground)/0.92),hsl(var(--primary)/0.62))] text-white">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-extrabold">
                      {title}
                    </p>
                    <p className="text-sm text-muted-foreground">{channels}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground sm:justify-end">
                    <Download className="h-4 w-4 text-primary" />
                    {time}
                  </div>
                  {index === 0 ? (
                    <div className="sm:col-span-3 rounded-lg border border-border bg-card px-3 py-2 text-sm leading-6 text-muted-foreground">
                      “This one idea changed how I think about consistent
                      content.”
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                Built for solo creators who want the clip ready before they open
                the social app.
              </p>
              <Button asChild variant="primary">
                <Link href="/app">
                  Start clipping
                  <Download className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing"
        className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.95fr_1.05fr]"
      >
        <div className="rounded-[1.5rem] border border-border bg-card p-6 shadow-soft">
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-primary">
            Simple pricing
          </p>
          <h2 className="font-display text-3xl font-extrabold">
            Choose how you want to harvest.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card-2 p-5">
              <h3 className="font-display text-xl font-extrabold">Monthly</h3>
              <p className="mt-2 font-display text-4xl font-extrabold">
                $19
                <span className="text-base text-muted-foreground">/mo</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Full access with 120 render minutes, unlimited projects, and
                month-to-month flexibility.
              </p>
              <CheckoutButton className="mt-5">Start monthly</CheckoutButton>
            </div>
            <div className="relative rounded-2xl border-2 border-primary bg-card p-5 shadow-glow">
              <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-xs font-extrabold text-primary-foreground">
                Best value
              </span>
              <h3 className="font-display text-xl font-extrabold">Yearly</h3>
              <p className="mt-2 font-display text-4xl font-extrabold">
                $149
                <span className="text-base text-muted-foreground">/yr</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Same creator plan, paid yearly. Save $79 compared with monthly
                billing.
              </p>
              <CheckoutButton className="mt-5" interval="yearly">
                Start yearly
              </CheckoutButton>
            </div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            Have a promo code? Enter it during Stripe checkout before
            subscribing.
          </p>
        </div>

        <div
          id="features"
          className="rounded-[1.5rem] border border-border bg-card p-6 shadow-soft"
        >
          <h2 className="font-display text-3xl font-extrabold">
            Why creators love Clip Farmer
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div key={benefit.title}>
                  <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-warning/18 text-accent">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="font-display text-lg font-extrabold">
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {benefit.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-[linear-gradient(180deg,hsl(var(--primary)/0.92),hsl(var(--brand-to)))] text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8">
          <p className="text-center font-display text-xl font-extrabold">
            Built for long-form creators turning one recording into many posts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-extrabold opacity-85">
            {proof.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/support">Support</Link>
            <Link href="/app">Open app</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
