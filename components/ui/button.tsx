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
    "bg-brand text-white border-transparent shadow-[0_8px_24px_-10px_hsl(var(--brand-to)/0.7)] hover:shadow-glow hover:brightness-110",
  secondary:
    "bg-card text-foreground border-border hover:border-primary/40 hover:bg-card-2",
  ghost:
    "bg-transparent text-foreground/75 border-transparent hover:bg-card-2 hover:text-foreground",
  danger:
    "bg-destructive/12 text-destructive border-destructive/30 hover:bg-destructive/20",
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
    "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition duration-200",
    "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
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
