import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  neutral: "border-white/12 bg-white/[0.06] text-paper/70",
  success: "border-mint/25 bg-mint/12 text-mint",
  warning: "border-brass/30 bg-brass/12 text-[#f1c66d]",
  danger: "border-signal/25 bg-signal/12 text-[#ffaaa6]",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-[11px] font-semibold uppercase tracking-[0.08em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
