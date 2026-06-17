"use client";

import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Sprout,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ScheduledPostDTO } from "@/lib/social";

const STATUS_TONE: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  CANCELED: "neutral",
  FAILED: "danger",
  PUBLISHED: "success",
  SCHEDULED: "warning",
  SCHEDULING: "warning",
};

const STATUS_ICON: Record<string, typeof CalendarClock> = {
  CANCELED: XCircle,
  FAILED: XCircle,
  PUBLISHED: CheckCircle2,
  SCHEDULED: CalendarClock,
  SCHEDULING: Loader2,
};

function formatSchedule(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function platformLabel(platform: string) {
  return platform === "twitter"
    ? "X"
    : platform.charAt(0).toUpperCase() + platform.slice(1);
}

export function ScheduleBoard({
  initialPosts,
}: {
  initialPosts: ScheduledPostDTO[];
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const grouped = useMemo(() => {
    const upcoming = posts.filter((post) =>
      ["SCHEDULED", "SCHEDULING"].includes(post.status),
    );
    const attention = posts.filter((post) => post.status === "FAILED");
    const history = posts.filter((post) =>
      ["PUBLISHED", "CANCELED"].includes(post.status),
    );

    return { upcoming, attention, history };
  }, [posts]);

  async function refreshPosts() {
    setBusyId("refresh");
    setError("");

    try {
      const response = await fetch("/api/scheduled-posts");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not refresh schedule.");
      }

      setPosts(payload.posts ?? []);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not refresh schedule.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function updatePost(postId: string, action: "cancel" | "retry") {
    setBusyId(postId);
    setError("");

    try {
      const response = await fetch(`/api/scheduled-posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? `Could not ${action} post.`);
      }

      setPosts((existing) =>
        existing.map((post) => (post.id === postId ? payload.post : post)),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : `Could not ${action} post.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  function renderPost(post: ScheduledPostDTO) {
    const Icon = STATUS_ICON[post.status] ?? CalendarClock;
    const isBusy = busyId === post.id;

    return (
      <article
        key={post.id}
        className="animate-fade-in-up rounded-xl border border-border bg-card p-4 shadow-soft"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <Icon
                className={`h-4 w-4 text-primary ${post.status === "SCHEDULING" ? "animate-spin" : ""}`}
              />
              <Badge tone={STATUS_TONE[post.status] ?? "neutral"}>
                {post.status.toLowerCase()}
              </Badge>
            </div>
            <h3 className="truncate font-display text-lg font-bold tracking-tight">
              {post.clipTitle}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {post.projectName} · {formatSchedule(post.scheduledAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {post.status === "FAILED" ? (
              <Button
                disabled={isBusy}
                onClick={() => updatePost(post.id, "retry")}
                size="sm"
                variant="secondary"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Retry
              </Button>
            ) : null}
            {["SCHEDULED", "SCHEDULING", "FAILED"].includes(post.status) ? (
              <Button
                disabled={isBusy}
                onClick={() => updatePost(post.id, "cancel")}
                size="sm"
                variant="danger"
              >
                {isBusy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Cancel
              </Button>
            ) : null}
          </div>
        </div>

        <p className="mt-4 line-clamp-3 rounded-lg border border-border bg-card-2 p-3 text-sm leading-6">
          {post.sharedCaption}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {post.selectedPlatforms.map((platform) => (
            <span
              key={platform}
              className="rounded-full border border-border bg-card-2 px-2.5 py-1 text-xs font-bold text-muted-foreground"
            >
              {platformLabel(platform)}
            </span>
          ))}
        </div>

        {post.failureReason ? (
          <p className="mt-3 rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
            {post.failureReason}
          </p>
        ) : null}
      </article>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/12 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
            <Sprout className="h-3.5 w-3.5" />
            Posting calendar
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl">
            Schedule the harvest.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            The full posting row is still growing. Soon this field will hold
            your queued clips, platform timing, and publishing status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary">
            <Link href="/account">Social Accounts</Link>
          </Button>
          <Button
            disabled={busyId === "refresh"}
            onClick={refreshPosts}
            variant="primary"
          >
            {busyId === "refresh" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
          {error}
        </p>
      ) : null}

      {posts.length === 0 ? (
        <section className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-border bg-card/60 p-8 text-center">
          <div className="max-w-md">
            <CalendarClock className="mx-auto mb-4 h-10 w-10 text-primary/70" />
            <h2 className="font-display text-2xl font-bold tracking-tight">
              No clips planted in the calendar yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Post scheduling is coming in a few harvests. For now, harvest a
              ready clip, copy the caption, and post it manually.
            </p>
          </div>
        </section>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold tracking-tight">
              Upcoming
            </h2>
            {grouped.upcoming.length > 0 ? (
              grouped.upcoming.map(renderPost)
            ) : (
              <p className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground">
                No upcoming posts planted yet.
              </p>
            )}
          </section>
          <div className="space-y-5">
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold tracking-tight">
                Needs attention
              </h2>
              {grouped.attention.length > 0 ? (
                grouped.attention.map(renderPost)
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground">
                  No wilted posts.
                </p>
              )}
            </section>
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold tracking-tight">
                History
              </h2>
              {grouped.history.length > 0 ? (
                grouped.history.map(renderPost)
              ) : (
                <p className="rounded-xl border border-dashed border-border bg-card/50 p-4 text-sm text-muted-foreground">
                  Published and canceled posts will collect here.
                </p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
