"use client";

import {
  CalendarPlus,
  Clipboard,
  Download,
  Eye,
  ExternalLink,
  Loader2,
  Pencil,
  Save,
  Share2,
  ShoppingBasket,
  Sprout,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDuration, formatTime } from "@/lib/format";

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

const MANUAL_SHARE_LINKS = [
  {
    label: "TikTok",
    href: "https://www.tiktok.com/upload",
    note: "Upload vertical clips",
  },
  {
    label: "YouTube Shorts",
    href: "https://studio.youtube.com",
    note: "Create a Short",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com",
    note: "Post a Reel",
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/feed/",
    note: "Share to your feed",
  },
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
  const [shareClip, setShareClip] = useState<ClipItem | null>(null);
  const [sharedCaption, setSharedCaption] = useState("");
  const [isCaptionCopied, setIsCaptionCopied] = useState(false);
  const [error, setError] = useState("");

  function openShareComposer(clip: ClipItem) {
    setError("");
    setShareClip(clip);
    setSharedCaption(clip.title);
    setIsCaptionCopied(false);
  }

  async function copyCaption() {
    if (!shareClip) {
      return;
    }

    setError("");

    try {
      await navigator.clipboard.writeText(
        sharedCaption.trim() || shareClip.title,
      );
      setIsCaptionCopied(true);
    } catch {
      setError(
        "Could not copy the caption automatically. Select the caption text and copy it manually.",
      );
      setIsCaptionCopied(false);
    }
  }

  function showDeferredScheduleMessage() {
    setError(
      "Post scheduling is coming in a few harvests. For now, download the clip and post it manually from the share panel.",
    );
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
                      onClick={showDeferredScheduleMessage}
                      size="icon"
                      title="Post scheduling is coming in a few harvests"
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

      {shareClip ? (
        <div
          className="fixed inset-0 z-50 grid animate-fade-in place-items-center bg-background/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Share clip"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setShareClip(null);
            }
          }}
        >
          <div className="relative grid max-h-[92vh] w-full max-w-4xl animate-scale-in overflow-y-auto rounded-xl border border-border bg-card shadow-panel lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-border bg-card-2 p-4 lg:border-b-0 lg:border-r">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                    <Share2 className="h-3.5 w-3.5" />
                    Share harvest
                  </p>
                  <h3 className="truncate font-display text-lg font-bold tracking-tight">
                    {shareClip.title}
                  </h3>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                    {formatTime(shareClip.startTime)} –{" "}
                    {formatTime(shareClip.endTime)}
                  </p>
                </div>
                <Button
                  onClick={() => setShareClip(null)}
                  size="icon"
                  title="Close sharing"
                  variant="ghost"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {shareClip.url ? (
                <video
                  className="aspect-video w-full rounded-md object-contain"
                  controls
                  src={shareClip.url}
                />
              ) : null}
            </div>

            <div className="space-y-4 p-4">
              <div className="rounded-lg border border-warning/25 bg-warning/10 p-3">
                <p className="text-sm font-bold text-foreground">
                  Posting is coming in a few harvests.
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  The full planting row for TikTok, Instagram, YouTube Shorts,
                  and LinkedIn is still growing. For now, download the clip,
                  copy the caption, and post it in the field you want to reach.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Caption
                </label>
                <textarea
                  className="min-h-28 w-full resize-y rounded-lg border border-border bg-input px-3 py-2 text-sm leading-6 outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  maxLength={2200}
                  value={sharedCaption}
                  onChange={(event) => setSharedCaption(event.target.value)}
                  placeholder="Write the caption you want to paste into the social platform."
                />
              </div>

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  Open a platform
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MANUAL_SHARE_LINKS.map((platform) => (
                    <a
                      key={platform.href}
                      href={platform.href}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-border bg-card-2 p-3 transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-soft"
                    >
                      <span className="flex items-center justify-between gap-3 font-display text-base font-bold text-foreground">
                        {platform.label}
                        <ExternalLink className="h-4 w-4 text-primary" />
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-muted-foreground">
                        {platform.note}
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              {error ? (
                <p className="rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <Button onClick={() => setShareClip(null)} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={copyCaption} variant="secondary">
                  <Clipboard className="h-4 w-4" />
                  {isCaptionCopied ? "Copied" : "Copy caption"}
                </Button>
                <Button
                  disabled={busyClipId === shareClip.id}
                  onClick={() => downloadClip(shareClip)}
                  variant="primary"
                >
                  {busyClipId === shareClip.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Download clip
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
