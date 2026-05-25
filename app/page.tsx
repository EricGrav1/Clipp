import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  CloudUpload,
  Play,
  Scissors,
  Send,
  Share2,
  Sprout,
  TrendingUp,
} from "lucide-react";
import { CheckoutButton } from "@/components/billing-actions";
import { Button } from "@/components/ui/button";
import { BearFarmer } from "@/components/ui/mascot";

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
    title: "Schedule",
    text: "Download, share, or queue clips for connected social channels.",
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
    text: "Schedule harvested clips into a simple publishing queue for your platforms and automate your growth!",
  },
];

const proof = ["Podcast hosts", "Coaches", "Course creators", "Streamers", "Solo founders"];

export default function LandingPage() {
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
            <a href="#scheduler">Scheduler</a>
            <a href="#pricing">Pricing</a>
            <a href="#examples">Examples</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href="/sign-in">Log in</Link>
            </Button>
            <div className="hidden sm:block">
              <Button asChild variant="primary">
                <Link href="/sign-up">Start harvesting</Link>
              </Button>
            </div>
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
              Find, cut, and schedule the most engaging moments from long-form
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
              {["No complex editor", "Social scheduler", "Works in minutes"].map(
                (item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="pointer-events-none relative hidden min-h-[440px] animate-fade-in opacity-0 lg:block">
            <div className="absolute bottom-0 right-0 hidden h-80 w-[38%] rounded-t-[34px] border border-[hsl(20_48%_33%)] bg-[linear-gradient(90deg,hsl(9_72%_49%),hsl(12_74%_42%))] shadow-panel lg:block">
              <div className="mx-auto mt-8 h-14 w-16 rounded-t-full border-4 border-[hsl(38_62%_86%)] bg-[hsl(38_36%_25%)]" />
              <div className="absolute bottom-10 left-1/2 h-24 w-32 -translate-x-1/2 rounded-lg border-4 border-[hsl(38_62%_86%)] bg-[hsl(12_62%_38%)]" />
            </div>
            <div className="absolute right-2 top-10 hidden h-72 w-24 rounded-full border border-border bg-card/70 lg:block" />

            <div className="absolute bottom-1 left-0 right-[18%] rounded-[2rem] border border-border bg-card/86 p-5 shadow-panel backdrop-blur">
              <div className="grid min-h-56 place-items-center rounded-[1.5rem] border border-border bg-[radial-gradient(circle_at_50%_0%,hsl(var(--warning)/0.34),transparent_46%),linear-gradient(180deg,hsl(var(--primary)/0.16),hsl(var(--card-2)))] p-5">
                <div className="relative h-52 w-full max-w-lg">
                  <div className="absolute bottom-6 left-12 h-20 w-[72%] rounded-[1.5rem] bg-[hsl(25_68%_42%)] shadow-soft" />
                  <div className="absolute bottom-2 left-20 h-16 w-16 rounded-full border-[10px] border-[hsl(25_34%_18%)] bg-[hsl(33_60%_54%)]" />
                  <div className="absolute bottom-10 left-20 right-20 grid grid-cols-7 items-end gap-2">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <span
                        key={index}
                        className="h-28 origin-bottom animate-sway rounded-full bg-[linear-gradient(180deg,hsl(var(--primary)),hsl(84_54%_37%))]"
                        style={{ animationDelay: `${index * 160}ms` }}
                      />
                    ))}
                  </div>
                  {[
                    ["Perfect Hook", "00:29", "850K", "left-2 top-2 -rotate-6"],
                    ["Viral Moment", "00:45", "1.2M", "left-[34%] -top-4 rotate-3"],
                    ["Big Insight", "00:52", "right-0 top-5 rotate-6"],
                  ].map(([label, time, views, position]) => (
                    <div
                      key={label}
                      className={`absolute ${position} w-36 rounded-2xl border border-border bg-card p-2 shadow-panel`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-extrabold text-accent-foreground">
                          {label}
                        </span>
                        <span className="rounded-full bg-foreground px-1.5 py-0.5 font-mono text-[10px] text-background">
                          {time}
                        </span>
                      </div>
                      <div className="grid aspect-[4/3] place-items-center rounded-xl bg-[linear-gradient(135deg,hsl(var(--sky)/0.75),hsl(var(--primary)/0.45))]">
                        <Play className="h-7 w-7 fill-white text-white" />
                      </div>
                      <p className="mt-1 text-[11px] font-extrabold text-muted-foreground">
                        {views} views
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-0 max-w-56 rotate-1 rounded-xl border border-[hsl(33_38%_32%)] bg-[hsl(31_34%_18%)] p-5 text-center text-warning shadow-panel">
              <p className="font-display text-xl font-bold leading-tight">
                Turn long content into short gold.
              </p>
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
                <div key={step.title} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
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
        id="scheduler"
        className="border-b border-border bg-[linear-gradient(180deg,hsl(var(--card)/0.42),transparent)]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
              <CalendarClock className="h-3.5 w-3.5" />
              Social scheduling
            </p>
            <h2 className="font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl">
              Turn the harvest into a posting calendar.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Clip Farmer is moving beyond exports. Connect your social accounts,
              choose a ready clip, write one caption with channel-specific tweaks,
              and queue it for the best time to post.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {["Connected channels", "Caption overrides", "Upcoming queue"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-border bg-card p-4 shadow-soft"
                  >
                    <Check className="mb-2 h-4 w-4 text-primary" />
                    <p className="text-sm font-extrabold text-foreground">{item}</p>
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
                  Next clips to publish
                </h3>
              </div>
              <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-extrabold text-primary">
                3 queued
              </span>
            </div>

            <div className="space-y-3">
              {[
                ["Perfect Hook", "TikTok, Instagram", "Today · 6:30 PM"],
                ["Big Insight", "YouTube Shorts", "Tomorrow · 9:00 AM"],
                ["Build once", "LinkedIn, X", "Friday · 12:15 PM"],
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
                    <CalendarClock className="h-4 w-4 text-primary" />
                    {time}
                  </div>
                  {index === 0 ? (
                    <div className="sm:col-span-3 rounded-lg border border-border bg-card px-3 py-2 text-sm leading-6 text-muted-foreground">
                      “This one idea changed how I think about consistent content.”
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                Built for solo creators and small teams managing every post themselves.
              </p>
              <Button asChild variant="primary">
                <Link href="/app">
                  Start scheduling
                  <Send className="h-4 w-4" />
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
            Have a promo code? Enter it during Stripe checkout before subscribing.
          </p>
        </div>

        <div id="features" className="rounded-[1.5rem] border border-border bg-card p-6 shadow-soft">
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
