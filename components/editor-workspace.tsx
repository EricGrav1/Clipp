"use client";

import {
  ArrowLeft,
  Clock3,
  Download,
  Loader2,
  Scissors,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { ClipTimeline } from "@/components/clip-timeline";
import { ClipsPane, type ClipItem } from "@/components/clips-pane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { formatTime } from "@/lib/format";

type VideoItem = {
  id: string;
  originalName: string;
  url: string;
  durationSeconds: number | null;
};

type EditorProject = {
  id: string;
  name: string;
  video: VideoItem | null;
  clips: ClipItem[];
};

const DURATIONS = [30, 45, 60] as const;

export function EditorWorkspace({ project }: { project: EditorProject }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [video, setVideo] = useState(project.video);
  const [clips, setClips] = useState(project.clips);
  const [currentTime, setCurrentTime] = useState(0);
  const [clipStartTime, setClipStartTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(
    project.video?.durationSeconds ?? 0,
  );
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [customDuration, setCustomDuration] = useState("30");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const selectedEndTime = useMemo(() => {
    if (!videoDuration) {
      return clipStartTime + selectedDuration;
    }

    return Math.min(clipStartTime + selectedDuration, videoDuration);
  }, [clipStartTime, selectedDuration, videoDuration]);

  const maxCustomDuration = Math.max(1, Math.floor(videoDuration || 1));
  const actualClipDuration = Math.max(0, selectedEndTime - clipStartTime);

  function seekToStart(startTime: number) {
    const safeStart = Math.max(0, Math.min(startTime, Math.max(0, videoDuration - 0.05)));
    setClipStartTime(safeStart);
    setCurrentTime(safeStart);
    if (videoRef.current) {
      videoRef.current.currentTime = safeStart;
    }
  }

  function updateDuration(duration: number) {
    const safeDuration = Math.max(
      1,
      videoDuration ? Math.min(duration, videoDuration) : duration,
    );
    setSelectedDuration(safeDuration);
    setCustomDuration(String(Math.round(safeDuration)));
  }

  async function uploadVideo(file: File) {
    setError("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("video", file);

    try {
      const response = await fetch(`/api/projects/${project.id}/video`, {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setVideo(payload.video);
      setClips([]);
      setCurrentTime(0);
      setClipStartTime(0);
      setVideoDuration(0);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Upload failed.",
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function createClip() {
    if (!video) {
      setError("Upload a video before creating clips.");
      return;
    }

    setError("");
    setIsCreating(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/clips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: clipStartTime,
          duration: selectedDuration,
          videoDuration,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not create clip.");
      }

      setClips((existing) => [
        payload.clip,
        ...existing.filter((clip) => clip.id !== payload.clip.id),
      ]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Could not create clip.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen text-foreground">
      <div className="grid min-h-screen xl:grid-cols-[1fr_380px]">
        <section className="flex min-w-0 flex-col">
          <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <Button asChild size="icon" variant="ghost" title="Back">
                <Link href="/" aria-label="Back to projects">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-rec-pulse rounded-full bg-primary" />
                  Reel / Editing
                </p>
                <h1 className="truncate font-display text-lg font-bold uppercase tracking-tight">
                  {project.name}
                </h1>
              </div>
            </div>
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  uploadVideo(file);
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Button
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {video ? "Replace Video" : "Upload Video"}
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
            <section className="reg-frame relative grid flex-1 animate-fade-in-up place-items-center overflow-hidden rounded-lg border border-border bg-black shadow-panel">
              {/* Single scan sweep on load — monitor coming online. */}
              <span className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 animate-scan bg-gradient-to-b from-transparent via-primary/15 to-transparent" />
              {video ? (
                <video
                  key={video.id}
                  ref={videoRef}
                  className="max-h-[62vh] w-full"
                  controls
                  src={video.url}
                  onLoadedMetadata={(event) => {
                    const duration = event.currentTarget.duration;
                    if (Number.isFinite(duration)) {
                      setVideoDuration(duration);
                      if (selectedDuration > duration) {
                        setSelectedDuration(duration);
                        setCustomDuration(String(Math.max(1, Math.round(duration))));
                      }
                    }
                  }}
                  onTimeUpdate={(event) => {
                    const nextTime = event.currentTarget.currentTime;
                    setCurrentTime(nextTime);
                    setClipStartTime(nextTime);
                  }}
                />
              ) : (
                <div className="grid min-h-[52vh] place-items-center px-6 text-center">
                  <div className="animate-fade-in-up">
                    <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-lg border border-primary/30 bg-brand-soft shadow-lamp">
                      <Scissors className="h-9 w-9 text-primary" />
                    </div>
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-primary">
                      No signal
                    </p>
                    <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                      Load a source
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Drop an mp4, mov, or webm. The editor tracks the playhead
                      and renders clips from the exact timestamp.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="animate-fade-in-up rounded-lg border border-border bg-card p-4 [animation-delay:80ms]">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-accent" />
                  <span className="lcd lcd-green text-sm font-semibold">
                    {formatTime(currentTime)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground/50">/</span>
                  <span className="lcd lcd-dim text-sm">
                    {formatTime(videoDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  <span>In</span>
                  <span className="lcd lcd-cyan text-xs font-semibold">
                    {formatTime(clipStartTime)}
                  </span>
                  <span>Out</span>
                  <span className="lcd lcd-cyan text-xs font-semibold">
                    {formatTime(selectedEndTime)}
                  </span>
                </div>
              </div>

              <ClipTimeline
                clipStartTime={clipStartTime}
                currentTime={currentTime}
                disabled={!video || !videoDuration}
                selectedDuration={selectedDuration}
                videoDuration={videoDuration}
                onSelectStart={seekToStart}
              />

              <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="grid grid-cols-3 gap-2 sm:flex">
                    {DURATIONS.map((duration) => {
                      const safeDuration = videoDuration
                        ? Math.min(duration, videoDuration)
                        : duration;

                      return (
                        <Button
                          key={duration}
                          onClick={() => updateDuration(duration)}
                          variant={
                            selectedDuration === safeDuration
                              ? "primary"
                              : "secondary"
                          }
                        >
                          {duration}s
                        </Button>
                      );
                    })}
                  </div>
                  <label className="grid gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Custom · sec
                    <Input
                      className="h-10 w-32"
                      disabled={!video || !videoDuration}
                      inputMode="numeric"
                      min={1}
                      max={maxCustomDuration}
                      type="number"
                      value={customDuration}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setCustomDuration(nextValue);
                        const parsedDuration = Number(nextValue);
                        if (
                          Number.isFinite(parsedDuration) &&
                          parsedDuration >= 1
                        ) {
                          updateDuration(parsedDuration);
                        }
                      }}
                      onBlur={() => {
                        const parsedDuration = Number(customDuration);
                        if (!Number.isFinite(parsedDuration) || parsedDuration < 1) {
                          updateDuration(1);
                          return;
                        }
                        updateDuration(parsedDuration);
                      }}
                    />
                  </label>
                </div>
                <Button
                  disabled={
                    !video ||
                    isCreating ||
                    videoDuration <= 0 ||
                    actualClipDuration <= 0.05
                  }
                  onClick={createClip}
                  variant="primary"
                  className="lg:min-w-44"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isCreating ? "Rendering" : "Create Clip"}
                </Button>
              </div>
              {error ? (
                <p className="mt-3 animate-fade-in rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
                  {error}
                </p>
              ) : null}
            </section>
          </div>
        </section>

        <ClipsPane clips={clips} onClipsChange={setClips} />
      </div>
    </main>
  );
}
