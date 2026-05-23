import { cloneElement, isValidElement } from "react";
import type { ButtonHTMLAttributes, ReactElement } from "react";
import { cn } from "@/components/ui/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-mint text-ink hover:bg-[#7be4ca] border-mint shadow-[0_0_0_1px_rgba(103,215,186,0.28)]",
  secondary:
    "bg-white/8 text-paper hover:bg-white/12 border-white/12",
  ghost: "bg-transparent text-paper/78 hover:bg-white/8 border-transparent",
  danger:
    "bg-signal/12 text-[#ffb1ad] hover:bg-signal/18 border-signal/25",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  icon: "h-9 w-9 p-0",
};

export function Button({
  asChild = false,
  className,
  children,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  const mergedClassName = cn(
    "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition disabled:cursor-not-allowed disabled:opacity-45",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint/80 focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
    variants[variant],
    sizes[size],
    className,
  );

  if (asChild && isValidElement(children)) {
    const child = children as ReactElement<{ className?: string }>;
    return cloneElement(child, {
      ...props,
      className: cn(mergedClassName, child.props.className),
    });
  }

  return (
    <button className={mergedClassName} {...props}>
      {children}
    </button>
  );
}
