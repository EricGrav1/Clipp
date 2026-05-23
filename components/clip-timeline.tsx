"use client";

import { Scissors } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/components/ui/utils";
import { formatTime } from "@/lib/format";

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getTimelineSeconds(
  clientX: number,
  track: HTMLDivElement,
  videoDuration: number,
) {
  const rect = track.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
  return ratio * videoDuration;
}

type ClipTimelineProps = {
  clipStartTime: number;
  currentTime: number;
  disabled: boolean;
  selectedDuration: number;
  videoDuration: number;
  onSelectStart: (startTime: number) => void;
};

export function ClipTimeline({
  clipStartTime,
  currentTime,
  disabled,
  selectedDuration,
  videoDuration,
  onSelectStart,
}: ClipTimelineProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const safeDuration = Math.max(0, videoDuration);
  const safeClipDuration = Math.max(0, selectedDuration);
  const maxStart = Math.max(0, safeDuration - 0.05);
  const clampedStart = clamp(clipStartTime, 0, maxStart);
  const visibleClipDuration = safeDuration
    ? Math.min(safeClipDuration, Math.max(0, safeDuration - clampedStart))
    : 0;
  const clipWidth = safeDuration ? (visibleClipDuration / safeDuration) * 100 : 0;
  const clipLeft = safeDuration ? (clampedStart / safeDuration) * 100 : 0;
  const playheadLeft = safeDuration
    ? (clamp(currentTime, 0, safeDuration) / safeDuration) * 100
    : 0;

  function moveSelection(clientX: number) {
    if (disabled || !trackRef.current || !safeDuration) {
      return;
    }

    const rawStart = getTimelineSeconds(clientX, trackRef.current, safeDuration);
    onSelectStart(clamp(rawStart, 0, maxStart));
  }

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className={cn(
          "relative h-16 overflow-hidden rounded-md border border-white/12 bg-black/35",
          disabled ? "cursor-not-allowed opacity-45" : "cursor-pointer",
        )}
        onPointerDown={(event) => {
          if (disabled) {
            return;
          }

          event.currentTarget.setPointerCapture(event.pointerId);
          setIsDragging(true);
          moveSelection(event.clientX);
        }}
        onPointerMove={(event) => {
          if (isDragging) {
            moveSelection(event.clientX);
          }
        }}
        onPointerUp={(event) => {
          event.currentTarget.releasePointerCapture(event.pointerId);
          setIsDragging(false);
        }}
        onPointerCancel={() => setIsDragging(false)}
        role="slider"
        aria-label="Clip selection timeline"
        aria-valuemin={0}
        aria-valuemax={Math.round(maxStart)}
        aria-valuenow={Math.round(clampedStart)}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(event) => {
          if (disabled) {
            return;
          }

          const step = event.shiftKey ? 5 : 1;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            onSelectStart(clamp(clampedStart - step, 0, maxStart));
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            onSelectStart(clamp(clampedStart + step, 0, maxStart));
          }
          if (event.key === "Home") {
            event.preventDefault();
            onSelectStart(0);
          }
          if (event.key === "End") {
            event.preventDefault();
            onSelectStart(maxStart);
          }
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/14" />
        <div
          className="absolute bottom-0 top-0 w-px bg-paper/60"
          style={{ left: `${playheadLeft}%` }}
        />
        <div
          className="absolute bottom-2 top-2 flex min-w-12 items-center justify-center rounded-md border border-mint/60 bg-mint/22 text-ink shadow-[0_0_28px_rgba(103,215,186,0.2)]"
          style={{
            left: `${clipLeft}%`,
            width: `${clipWidth}%`,
          }}
        >
          <div className="flex h-9 min-w-9 items-center justify-center rounded-md bg-mint text-ink shadow-sm">
            <Scissors className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-paper/42">
        <span>{formatTime(0)}</span>
        <span>
          Selected start {formatTime(clampedStart)}
          {isDragging ? " dragging" : ""}
        </span>
        <span>{formatTime(safeDuration)}</span>
      </div>
    </div>
  );
}
