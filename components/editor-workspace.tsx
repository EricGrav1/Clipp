"use client";

import {
  ArrowLeft,
  Clock3,
  Loader2,
  Scissors,
  Sprout,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ClipTimeline } from "@/components/clip-timeline";
import { ClipsPane, type ClipItem } from "@/components/clips-pane";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BearFarmer } from "@/components/ui/mascot";
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
const MULTIPART_UPLOAD_CONCURRENCY = 3;
const MULTIPART_UPLOAD_RETRIES = 3;

type DirectUpload = {
  mode: "single";
  objectKey: string;
  uploadUrl: string;
  url: string;
};

type MultipartUpload = {
  mode: "multipart";
  objectKey: string;
  parts: Array<{ partNumber: number; uploadUrl: string }>;
  partSize: number;
  uploadId: string;
  url: string;
};

async function readJsonPayload<T extends { error?: string }>(
  response: Response,
  fallback: string,
) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  const text = await response.text().catch(() => "");
  const isHtml = text.trimStart().toLowerCase().startsWith("<!doctype html");

  return {
    error: isHtml
      ? `${fallback} The server returned an HTML error page instead of JSON. Check the Vercel function logs for the matching request.`
      : text
        ? `${fallback} ${text.slice(0, 500)}`
        : fallback,
  } as T;
}

function uploadBlobToSignedUrl({
  blob,
  contentType,
  onProgress,
  uploadUrl,
}: {
  blob: Blob;
  contentType?: string;
  onProgress: (progress: number) => void;
  uploadUrl: string;
}) {
  return new Promise<string | null>((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(request.getResponseHeader("ETag"));
        return;
      }

      reject(
        new Error(
          `Video storage rejected the upload (${request.status}). Check the R2 bucket CORS settings and try again.`,
        ),
      );
    };
    request.onerror = () => {
      reject(
        new Error(
          "R2 blocked the browser upload. In the bucket CORS policy, allow https://clippfarmer.com for PUT requests and expose the ETag header.",
        ),
      );
    };
    request.open("PUT", uploadUrl);
    if (contentType) {
      request.setRequestHeader("Content-Type", contentType);
    }
    request.send(blob);
  });
}

async function uploadMultipartFile({
  file,
  onProgress,
  upload,
}: {
  file: File;
  onProgress: (progress: number) => void;
  upload: MultipartUpload;
}) {
  const loadedByPart = new Map<number, number>();
  const completedParts: Array<{ etag: string; partNumber: number }> = [];
  let nextPartIndex = 0;

  function updateProgress(partNumber: number, loadedBytes: number) {
    loadedByPart.set(partNumber, loadedBytes);
    const totalLoaded = Array.from(loadedByPart.values()).reduce(
      (total, loaded) => total + loaded,
      0,
    );
    onProgress(Math.min(100, Math.round((totalLoaded / file.size) * 100)));
  }

  async function uploadPart(part: MultipartUpload["parts"][number]) {
    const start = (part.partNumber - 1) * upload.partSize;
    const end = Math.min(start + upload.partSize, file.size);
    const blob = file.slice(start, end);
    let lastError: unknown;

    for (let attempt = 1; attempt <= MULTIPART_UPLOAD_RETRIES; attempt += 1) {
      try {
        const etag = await uploadBlobToSignedUrl({
          blob,
          onProgress: (percent) => {
            updateProgress(part.partNumber, Math.round((percent / 100) * blob.size));
          },
          uploadUrl: part.uploadUrl,
        });

        if (!etag) {
          throw new Error(
            "R2 uploaded a video part but hid its ETag. Add ETag to the bucket CORS ExposeHeaders list.",
          );
        }

        updateProgress(part.partNumber, blob.size);
        completedParts.push({ etag, partNumber: part.partNumber });
        return;
      } catch (error) {
        lastError = error;
        loadedByPart.set(part.partNumber, 0);

        if (attempt < MULTIPART_UPLOAD_RETRIES) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
        }
      }
    }

    throw lastError;
  }

  async function worker() {
    while (nextPartIndex < upload.parts.length) {
      const part = upload.parts[nextPartIndex];
      nextPartIndex += 1;
      await uploadPart(part);
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(MULTIPART_UPLOAD_CONCURRENCY, upload.parts.length) },
      () => worker(),
    ),
  );
  onProgress(100);

  return completedParts.sort((a, b) => a.partNumber - b.partNumber);
}

export function EditorWorkspace({ project }: { project: EditorProject }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const startedRenderClipIdsRef = useRef(new Set<string>());
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
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

  const refreshClips = useCallback(async () => {
    const response = await fetch(`/api/projects/${project.id}/clips`);
    const payload = await readJsonPayload<{
      clips?: ClipItem[];
      error?: string;
    }>(response, "Could not refresh clips.");

    if (!response.ok || !payload.clips) {
      throw new Error(payload.error ?? "Could not refresh clips.");
    }

    setClips(payload.clips);
  }, [project.id]);

  const startClipRender = useCallback(async (clipId: string) => {
    if (startedRenderClipIdsRef.current.has(clipId)) {
      return;
    }

    startedRenderClipIdsRef.current.add(clipId);

    try {
      const response = await fetch(`/api/clips/${clipId}/render`, {
        method: "POST",
      });
      const payload = await readJsonPayload<{
        clip?: ClipItem;
        error?: string;
      }>(response, "Could not render clip.");

      if (!response.ok || !payload.clip) {
        throw new Error(payload.error ?? "Could not render clip.");
      }

      setClips((existing) =>
        existing.map((clip) => (clip.id === clipId ? payload.clip! : clip)),
      );
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Could not render clip.";
      setClips((existing) =>
        existing.map((clip) =>
          clip.id === clipId
            ? { ...clip, error: message, status: "FAILED" }
          : clip,
        ),
      );
    }
  }, []);

  useEffect(() => {
    for (const clip of clips) {
      if (clip.status === "QUEUED" || clip.status === "RENDERING") {
        void startClipRender(clip.id);
      }
    }
  }, [clips, startClipRender]);

  useEffect(() => {
    const hasProcessingClip = clips.some(
      (clip) => clip.status === "QUEUED" || clip.status === "RENDERING",
    );

    if (!hasProcessingClip) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshClips().catch(() => undefined);
    }, 3_000);

    return () => window.clearInterval(intervalId);
  }, [clips, refreshClips]);

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

    try {
      const uploadUrlResponse = await fetch(
        `/api/projects/${project.id}/video/upload-url`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        },
      );
      const uploadUrlPayload = await readJsonPayload<{
        error?: string;
        upload?: DirectUpload | MultipartUpload;
      }>(uploadUrlResponse, "Could not prepare video upload.");

      if (uploadUrlResponse.ok && uploadUrlPayload.upload) {
        setUploadProgress(0);
        const multipartParts =
          uploadUrlPayload.upload.mode === "multipart"
            ? await uploadMultipartFile({
                file,
                onProgress: setUploadProgress,
                upload: uploadUrlPayload.upload,
              })
            : null;

        if (uploadUrlPayload.upload.mode === "single") {
          await uploadBlobToSignedUrl({
            blob: file,
            contentType: file.type || "application/octet-stream",
            onProgress: setUploadProgress,
            uploadUrl: uploadUrlPayload.upload.uploadUrl,
          });
        }

        const completeResponse = await fetch(
          `/api/projects/${project.id}/video/complete`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              objectKey: uploadUrlPayload.upload.objectKey,
              originalName: file.name,
              mimeType: file.type,
              sizeBytes: file.size,
              url: uploadUrlPayload.upload.url,
              multipartUpload:
                uploadUrlPayload.upload.mode === "multipart"
                  ? {
                      parts: multipartParts,
                      uploadId: uploadUrlPayload.upload.uploadId,
                    }
                  : null,
            }),
          },
        );
        const completePayload = await readJsonPayload<{
          error?: string;
          clips?: ClipItem[];
          video?: VideoItem;
        }>(completeResponse, "Could not finish video upload.");

        if (!completeResponse.ok || !completePayload.video) {
          throw new Error(completePayload.error ?? "Could not finish video upload.");
        }

        setVideo(completePayload.video);
        setClips(completePayload.clips ?? []);
        setCurrentTime(0);
        setClipStartTime(0);
        setVideoDuration(0);
        return;
      }

      if (
        uploadUrlResponse.status !== 501 ||
        window.location.hostname !== "localhost"
      ) {
        throw new Error(uploadUrlPayload.error ?? "Could not prepare video upload.");
      }

      const formData = new FormData();
      formData.append("video", file);
      const response = await fetch(`/api/projects/${project.id}/video`, {
        method: "POST",
        body: formData,
      });
      const payload = await readJsonPayload<{
        error?: string;
        clips?: ClipItem[];
        video?: VideoItem;
      }>(response, "Upload failed.");

      if (!response.ok || !payload.video) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setVideo(payload.video);
      setClips(payload.clips ?? []);
      setCurrentTime(0);
      setClipStartTime(0);
      setVideoDuration(0);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Upload failed.",
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
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
      const payload = await readJsonPayload<{
        clip?: ClipItem;
        error?: string;
        renderJob?: { id: string };
      }>(response, "Could not create clip.");

      if (!response.ok || !payload.clip) {
        throw new Error(payload.error ?? "Could not create clip.");
      }

      const nextClip = payload.clip;
      setClips((existing) => [
        nextClip,
        ...existing.filter((clip) => clip.id !== nextClip.id),
      ]);
      void startClipRender(nextClip.id);
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
                <Link href="/app" aria-label="Back to projects">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <BearFarmer size={36} className="hidden shrink-0 sm:block" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-primary">
                  <Sprout className="h-3.5 w-3.5" />
                  Field / Harvesting
                </p>
                <h1 className="truncate font-display text-lg font-bold tracking-tight">
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
                {isUploading && uploadProgress !== null
                  ? `${uploadProgress}%`
                  : video
                    ? "Replant Video"
                    : "Plant Video"}
              </Button>
              <ThemeToggle />
            </div>
          </header>

          <div className="flex flex-1 flex-col gap-4 p-4 sm:p-6">
            <section className="relative grid flex-1 animate-fade-in-up place-items-center overflow-hidden rounded-xl border border-border bg-black shadow-panel">
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
                <div className="grid min-h-[52vh] place-items-center bg-card px-6 text-center">
                  <div className="animate-fade-in-up">
                    <BearFarmer size={104} className="mx-auto mb-5 animate-bob" />
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
                      Empty field
                    </p>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
                      Plant a video to begin
                    </h2>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                      Drop in an mp4, mov, or webm. Barnaby tracks the playhead and
                      harvests clips from the exact timestamp.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="animate-fade-in-up rounded-xl border border-border bg-card p-4 shadow-soft [animation-delay:80ms]">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <span className="sign sign-fresh text-sm font-semibold">
                    {formatTime(currentTime)}
                  </span>
                  <span className="text-xs text-muted-foreground/50">/</span>
                  <span className="sign sign-dim text-sm">
                    {formatTime(videoDuration)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <span>In</span>
                  <span className="sign sign-ripe text-xs font-semibold">
                    {formatTime(clipStartTime)}
                  </span>
                  <span>Out</span>
                  <span className="sign sign-ripe text-xs font-semibold">
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
                  <label className="grid gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    Custom seconds
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
                    <Scissors className="h-4 w-4" />
                  )}
                  {isCreating ? "Harvesting" : "Harvest Clip"}
                </Button>
              </div>
              {error ? (
                <p className="mt-3 animate-fade-in rounded-lg border border-destructive/35 bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive">
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
