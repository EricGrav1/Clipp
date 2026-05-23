import type { InputHTMLAttributes } from "react";
import { cn } from "@/components/ui/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-white/12 bg-white/[0.06] px-3 text-sm text-paper outline-none transition placeholder:text-paper/35",
        "focus:border-mint/70 focus:ring-2 focus:ring-mint/25",
        className,
      )}
      {...props}
    />
  );
}
