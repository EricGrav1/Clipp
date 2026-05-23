import type { InputHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-border bg-input px-3 text-sm text-foreground shadow-inset outline-none transition placeholder:text-muted-foreground/60",
        "focus:border-primary/60 focus:ring-2 focus:ring-ring/30",
        className,
      )}
      {...props}
    />
  );
}
