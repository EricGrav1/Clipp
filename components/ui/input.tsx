import type { InputHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70",
        "focus:border-primary/60 focus:ring-2 focus:ring-ring/30",
        className,
      )}
      {...props}
    />
  );
}
