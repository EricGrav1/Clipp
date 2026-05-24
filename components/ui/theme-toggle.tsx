"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/components/ui/theme-provider";
import { cn } from "@/components/ui/utils";

const ORDER: Theme[] = ["system", "light", "dark"];

const ICONS: Record<Theme, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<Theme, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const Icon = ICONS[theme];

  return (
    <button
      type="button"
      title={`${LABELS[theme]} (click to switch)`}
      aria-label={`Switch theme, currently ${LABELS[theme]}`}
      onClick={() => setTheme(ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length])}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground/80 shadow-soft transition",
        "hover:border-primary/40 hover:text-foreground hover:-translate-y-0.5 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <Icon key={theme} className="h-4 w-4 animate-scale-in" />
    </button>
  );
}
