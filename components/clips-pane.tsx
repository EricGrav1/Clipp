"use client";

import {
  CalendarPlus,
  Download,
  Eye,
  Loader2,
  Pencil,
  Save,
  Share2,
  ShoppingBasket,
  Sprout,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDuration, formatTime } from "@/lib/format";
import type { SocialConnectionDTO, SocialPlatform } from "@/lib/social";

export type ClipItem = {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: string;
  url: string | null;
  error: string | null;
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  bluesky: "Bluesky",
  facebook: "Facebook",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  reddit: "Reddit",
  threads: "Threads",
  tiktok: "TikTok",
  twitter: "X",
  youtube: "YouTube",
};

const PLATFORM_ORDER: SocialPlatform[] = [
  "tiktok",
  "instagram",
  "youtube",
  "linkedin",
  "facebook",
  "twitter",
  "threads",
  "bluesky",
  "pinterest",
  "reddit",
];

export function ClipsPane({
  clips,
  onClipsChange,
}: {
  clips: ClipItem[];
  onClipsChange: (clips: ClipItem[]) => void;
}) {
  const [previewClip, setPreviewClip] = useState<ClipItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [busyClipId, setBusyClipId] = useState<string | null>(null);
  const [scheduleClip, setScheduleClip] = useState<ClipItem | null>(null);
  const [composerMode, setComposerMode] = useState<"share" | "schedule">(
    "schedule",
  );
  const [socialConnections, setSocialConnections] = useState<
    SocialConnectionDTO[]
  >([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(
    [],
  );
  const [sharedCaption, setSharedCaption] = useState("");
  const [platformOverrides, setPlatformOverrides] = useState<
    Record<string, string>
  >({});
  const [scheduledAt, setScheduledAt] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [isLoadingSocials, setIsLoadingSocials] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  function defaultScheduleTime() {
    const nextDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    nextDate.setMinutes(0, 0, 0);
    const offsetMs = nextDate.getTimezoneOffset() * 60 * 1000;
    return new Date(nextDate.getTime() - offsetMs).toISOString().slice(0, 16);
  }

  function sortPlatforms(platforms: SocialPlatform[]) {
    return [...platforms].sort(
      (first, second) =>
        PLATFORM_ORDER.indexOf(first) - PLATFORM_ORDER.indexOf(second),
    );
  }

  function platformLabel(platform: SocialPlatform) {
    return PLATFORM_LABELS[platform] ?? platform;
  }

  async function loadSocialAccounts() {
    setIsLoadingSocials(true);

    try {
      const response = await fetch("/api/social/accounts");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load connected channels.");
      }

      const connections = (payload.connections ?? []) as SocialConnectionDTO[];
      setSocialConnections(connections);
      const platforms = sortPlatforms(connections[0]?.connectedPlatforms ?? []);
      setSelectedPlatforms(platforms.slice(0, Math.min(platforms.length, 4)));
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not load connected channels.",
      );
    } finally {
      setIsLoadingSocials(false);
    }
  }

  function openComposer(clip: ClipItem, mode: "share" | "schedule") {
    setError("");
    setComposerMode(mode);
    setScheduleClip(clip);
    setSharedCaption(clip.title);
    setPlatformOverrides({});
    setScheduledAt(defaultScheduleTime());
    loadSocialAccounts();
  }

  function openScheduleComposer(clip: ClipItem) {
    openComposer(clip, "schedule");
  }

  function openShareComposer(clip: ClipItem) {
    openComposer(clip, "share");
  }

  function togglePlatform(platform: SocialPlatform) {
    setSelectedPlatforms((existing) =>
      existing.includes(platform)
        ? existing.filter((item) => item !== platform)
        : [...existing, platform],
    );
  }

  async function schedulePost() {
    if (!scheduleClip) {
      return;
    }

    setError("");
    setIsScheduling(true);

    try {
      const response = await fetch(
        `/api/clips/${scheduleClip.id}/scheduled-posts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selectedPlatforms,
            sharedCaption,
            platformOverrides,
            scheduledAt: new Date(scheduledAt).toISOString(),
            timezone,
          }),
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not schedule clip.");
      }

      setScheduleClip(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not schedule clip.",
      );
    } finally {
      setIsScheduling(false);
    }
  }

  async function downloadClip(clip: ClipItem) {
    setError("");

    if (!clip.url) {
      setError("This clip is not ready to download yet.");
      return;
    }

    setBusyClipId(clip.id);

    try {
      const downloadUrl = clip.url.startsWith("/api/media/")
        ? `${clip.url}?download=1`
        : clip.url;
      const response = await fetch(downloadUrl);

      if (!response.ok) {
        throw new Error("Could not download the clip.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `${clip.title.replace(/[^\w.-]+/g, "-") || "clip"}.mp4`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not download clip.",
      );
    } finally {
      setBusyClipId(null);
    }
  }

  async function renameClip(clipId: string) {
    setError("");
    setBusyClipId(clipId);

    try {
      const response = await fetch(`/api/clips/${clipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: draftTitle }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not rename clip.");
      }

      onClipsChange(
        clips.map((clip) => (clip.id === clipId ? payload.clip : clip)),
      );
      setEditingId(null);
      setDraftTitle("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not rename clip.",
      );
    } finally {
      setBusyClipId(null);
    }
  }

  async function deleteClip(clipId: string) {
    setError("");
    setBusyClipId(clipId);

    try {
      const response = await fetch(`/api/clips/${clipId}`, {
        method: "DELETE",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not delete clip.");
      }

      onClipsChange(clips.filter((clip) => clip.id !== clipId));
      if (previewClip?.id === clipId) {
        setPreviewClip(null);
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not delete clip.",
      );
    } finally {
      setBusyClipId(null);
    }
  }

  return (
    <aside className="flex min-h-[40vh] flex-col border-l border-border bg-card/60 backdrop-blur xl:min-h-screen">
      <header className="flex min-h-16 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2.5">
          <ShoppingBasket className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              The harvest
            </p>
            <h2 className="font-display text-base font-bold tracking-tight text-foreground">
              Harvest Basket
            </h2>
          </div>
        </div>
        <Badge tone="neutral">{clips.length}</Badge>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {error ? (
          <p className="mb-3 animate-fade-in rounded-lg border border-destructive/35 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            {error}
          </p>
        ) : null}

        {clips.length === 0 ? (
          <div className="grid min-h-64 place-items-center rounded-xl border border-dashed border-border p-6 text-center">
            <div>
              <Sprout className="mx-auto mb-3 h-8 w-8 animate-sway text-primary/70" />
              <p className="mx-auto max-w-56 text-sm leading-6 text-muted-foreground">
                Your harvested clips land here — preview, rename, download,
                share, or compost each one.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {clips.map((clip) => {
              const isEditing = editingId === clip.id;
              const isBusy = busyClipId === clip.id;
              const isReady = clip.status === "READY" && Boolean(clip.url);
              const isPreviewUnavailable =
                isReady &&
                Boolean(clip.error?.startsWith("Preview unavailable"));
              const isProcessing =
                clip.status !== "READY" && clip.status !== "FAILED";
              const statusLabel =
                clip.status === "READY"
                  ? "ripe"
                  : clip.status === "FAILED"
                    ? "wilted"
                    : "growing";

              return (
                <article
                  key={clip.id}
                  className="group relative animate-fade-in-up overflow-hidden rounded-lg border border-border bg-card-2 p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow"
                >
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-primary/0 transition group-hover:bg-primary/70" />
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <Input
                          value={draftTitle}
                          onChange={(event) =>
                            setDraftTitle(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              renameClip(clip.id);
                            }
                          }}
                        />
                      ) : (
                        <h3 className="truncate font-display text-base font-bold tracking-tight text-foreground">
                          {clip.title}
                        </h3>
                      )}
                      <p className="mt-1 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {formatTime(clip.startTime)}–{formatTime(clip.endTime)}
                        {"  ·  "}
                        {formatDuration(clip.duration)}
                      </p>
                    </div>
                    <Badge
                      tone={
                        clip.status === "READY"
                          ? "success"
                          : clip.status === "FAILED"
                            ? "danger"
                            : "warning"
                      }
                      className={
                        isProcessing ? "animate-glow-pulse" : undefined
                      }
                    >
                      {statusLabel}
                    </Badge>
                  </div>

                  {clip.error ? (
                    <p
                      className={`mb-3 line-clamp-3 rounded-md p-2 text-xs ${
                        clip.status === "READY"
                          ? "bg-warning/10 text-warning"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {clip.error}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-6 gap-2">
                    <Button
                      disabled={!isReady || isPreviewUnavailable}
                      onClick={() => setPreviewClip(clip)}
                      size="icon"
                      title={
                        isPreviewUnavailable
                          ? "Preview unavailable; download clip instead"
                          : "Preview clip"
                      }
                      variant="secondary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      disabled={!isReady || isBusy}
                      onClick={() => downloadClip(clip)}
                      size="icon"
                      title="Download clip"
                      variant="secondary"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      disabled={!isReady}
                      onClick={() => openShareComposer(clip)}
                      size="icon"
                      title="Share clip"
                      variant="secondary"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      disabled={!isReady}
                      onClick={() => openScheduleComposer(clip)}
                      size="icon"
                      title="Schedule clip"
                      variant="secondary"
                    >
                      <CalendarPlus className="h-4 w-4" />
                    </Button>
                    {isEditing ? (
                      <Button
                        disabled={isBusy}
                        onClick={() => renameClip(clip.id)}
                        size="icon"
                        title="Save clip name"
                        variant="secondary"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => {
                          setEditingId(clip.id);
                          setDraftTitle(clip.title);
                        }}
                        size="icon"
                        title="Rename clip"
                        variant="secondary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      disabled={isBusy}
                      onClick={() => deleteClip(clip.id)}
                      size="icon"
                      title="Delete clip"
                      variant="danger"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {previewClip ? (
        <div
          className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-background/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Preview clip"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setPreviewClip(null);
            }
          }}
        >
          <div className="relative w-full max-w-3xl animate-scale-in rounded-xl border border-border bg-card p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                  <Sprout className="h-3.5 w-3.5" />
                  Fresh harvest
                </p>
                <h3 className="truncate font-display text-lg font-bold tracking-tight">
                  {previewClip.title}
                </h3>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatTime(previewClip.startTime)} –{" "}
                  {formatTime(previewClip.endTime)}
                </p>
              </div>
              <Button
                onClick={() => setPreviewClip(null)}
                size="icon"
                title="Close preview"
                variant="ghost"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {previewClip.url ? (
              <video
                className="w-full rounded-md"
                controls
                src={previewClip.url}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      {scheduleClip ? (
        <div
          className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-background/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={composerMode === "share" ? "Share clip" : "Schedule clip"}
          onClick={(event) => {
            if (event.target === event.currentTarget && !isScheduling) {
              setScheduleClip(null);
            }
          }}
        >
          <div className="relative grid max-h-[92vh] w-full max-w-4xl animate-scale-in overflow-y-auto rounded-xl border border-border bg-card shadow-panel lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-border bg-card-2 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                    {composerMode === "share" ? (
                      <Share2 className="h-3.5 w-3.5" />
                    ) : (
                      <CalendarPlus className="h-3.5 w-3.5" />
                    )}
                    {composerMode === "share"
                      ? "Share harvest"
                      : "Schedule harvest"}
                  </p>
                  <h3 className="truncate font-display text-lg font-bold tracking-tight">
                    {scheduleClip.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatTime(scheduleClip.startTime)} –{" "}
                    {formatTime(scheduleClip.endTime)}
                  </p>
                </div>
                <Button
                  disabled={isScheduling}
                  onClick={() => setScheduleClip(null)}
                  size="icon"
                  title={
                    composerMode === "share"
                      ? "Close sharing"
                      : "Close scheduler"
                  }
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {scheduleClip.url ? (
                <video
                  className="aspect-video w-full rounded-md object-contain"
                  controls
                  src={scheduleClip.url}
                />
              ) : null}
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Caption
                </label>
                <textarea
                  className="min-h-28 w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm leading-6 outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  maxLength={2200}
                  value={sharedCaption}
                  onChange={(event) => setSharedCaption(event.target.value)}
                  placeholder="Write the post copy for every selected channel."
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Publish time
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                  />
                </label>
                <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Timezone
                  <Input
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                  />
                </label>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Platforms
                  </p>
                  {isLoadingSocials ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : null}
                </div>
                {(socialConnections[0]?.connectedPlatforms ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {sortPlatforms(
                      socialConnections[0]?.connectedPlatforms ?? [],
                    ).map((platform) => {
                      const isSelected = selectedPlatforms.includes(platform);
                      return (
                        <button
                          key={platform}
                          type="button"
                          onClick={() => togglePlatform(platform)}
                          className={`h-9 rounded-full border px-3 text-xs font-bold transition ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-soft"
                              : "border-border bg-card-2 text-muted-foreground hover:border-primary/50"
                          }`}
                        >
                          {platformLabel(platform)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border bg-card-2 p-4">
                    <p className="text-sm font-semibold text-foreground">
                      No connected channels yet.
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Connect TikTok, Instagram, YouTube, LinkedIn, or other
                      accounts before sharing clips.
                    </p>
                    <Button
                      asChild
                      className="mt-3"
                      size="sm"
                      variant="secondary"
                    >
                      <Link href="/account">Open Account</Link>
                    </Button>
                  </div>
                )}
              </div>

              {selectedPlatforms.length > 0 ? (
                <details className="rounded-lg border border-border bg-card-2 p-3">
                  <summary className="cursor-pointer text-sm font-bold text-foreground">
                    Per-channel overrides
                  </summary>
                  <div className="mt-3 space-y-3">
                    {selectedPlatforms.map((platform) => (
                      <label
                        key={platform}
                        className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground"
                      >
                        {platformLabel(platform)}
                        <textarea
                          className="min-h-20 w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm normal-case leading-6 tracking-normal text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                          maxLength={2200}
                          value={platformOverrides[platform] ?? ""}
                          onChange={(event) =>
                            setPlatformOverrides((existing) => ({
                              ...existing,
                              [platform]: event.target.value,
                            }))
                          }
                          placeholder="Leave blank to use the shared caption."
                        />
                      </label>
                    ))}
                  </div>
                </details>
              ) : null}

              {error ? (
                <p className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button
                  disabled={isScheduling}
                  onClick={() => setScheduleClip(null)}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    isScheduling ||
                    selectedPlatforms.length === 0 ||
                    !sharedCaption.trim() ||
                    !scheduledAt
                  }
                  onClick={schedulePost}
                  variant="primary"
                >
                  {isScheduling ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarPlus className="h-4 w-4" />
                  )}
                  {isScheduling
                    ? "Scheduling"
                    : composerMode === "share"
                      ? "Schedule Share"
                      : "Schedule Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
