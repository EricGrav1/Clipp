"use client";

import {
  Download,
  Eye,
  Loader2,
  Pencil,
  Save,
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
  const [error, setError] = useState("");

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
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Output
          </p>
          <h2 className="font-display text-base font-bold uppercase tracking-tight text-foreground">
            Render Bin
          </h2>
        </div>
        <Badge tone="neutral">{String(clips.length).padStart(2, "0")}</Badge>
      </header>

      <div className="flex-1 overflow-y-auto p-3">
        {error ? (
          <p className="mb-3 animate-fade-in rounded-md border border-destructive/35 bg-destructive/10 p-3 font-mono text-xs text-destructive">
            {error}
          </p>
        ) : null}

        {clips.length === 0 ? (
          <div className="reg-frame relative grid min-h-64 place-items-center rounded-lg border border-dashed border-border p-6 text-center">
            <p className="max-w-56 text-sm leading-6 text-muted-foreground">
              Rendered clips land here — preview, rename, download, or delete each
              one.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {clips.map((clip) => {
              const isEditing = editingId === clip.id;
              const isBusy = busyClipId === clip.id;
              const isReady = clip.status === "READY" && clip.url;
              const isProcessing =
                clip.status !== "READY" && clip.status !== "FAILED";

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
                          onChange={(event) => setDraftTitle(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              renameClip(clip.id);
                            }
                          }}
                        />
                      ) : (
                        <h3 className="truncate font-display text-sm font-bold uppercase tracking-tight text-foreground">
                          {clip.title}
                        </h3>
                      )}
                      <p className="mt-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
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
                      className={isProcessing ? "animate-glow-pulse" : undefined}
                    >
                      {clip.status.toLowerCase()}
                    </Badge>
                  </div>

                  {clip.error ? (
                    <p className="mb-3 line-clamp-3 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
                      {clip.error}
                    </p>
                  ) : null}

                  <div className="grid grid-cols-4 gap-2">
                    <Button
                      disabled={!isReady}
                      onClick={() => setPreviewClip(clip)}
                      size="icon"
                      title="Preview clip"
                      variant="secondary"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {isReady ? (
                      <Button asChild size="icon" title="Download clip" variant="secondary">
                        <a href={clip.url ?? ""} download aria-label="Download clip">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : (
                      <Button disabled size="icon" title="Download clip" variant="secondary">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
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
          <div className="reg-frame relative w-full max-w-3xl animate-scale-in rounded-lg border border-border bg-card p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-primary">
                  <span className="h-1.5 w-1.5 animate-rec-pulse rounded-full bg-primary" />
                  Preview
                </p>
                <h3 className="truncate font-display text-lg font-bold uppercase tracking-tight">
                  {previewClip.title}
                </h3>
                <p className="mt-0.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatTime(previewClip.startTime)} – {formatTime(previewClip.endTime)}
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
              <video className="w-full rounded-md" controls src={previewClip.url} />
            ) : null}
          </div>
        </div>
      ) : null}
    </aside>
  );
}
