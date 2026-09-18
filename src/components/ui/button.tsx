"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "berry" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-cocoa text-white hover:bg-cocoa-soft shadow-sm hover:shadow-md hover:shadow-cocoa/15",
  secondary:
    "border border-cocoa/15 bg-white/80 text-cocoa hover:border-berry/50 hover:text-berry-deep",
  berry:
    "bg-berry text-white hover:bg-berry-deep shadow-sm hover:shadow-md hover:shadow-berry/25",
  ghost: "bg-transparent text-cocoa-soft hover:bg-cocoa/5 hover:text-cocoa",
  danger: "bg-red-700/90 text-white hover:bg-red-800",
};

const sizes: Record<ButtonSize, string> = {
  sm: "gap-1.5 px-3.5 py-2 text-sm rounded-xl",
  md: "gap-2 px-5 py-2.5 text-sm rounded-2xl",
  lg: "gap-2 px-6 py-3.5 text-base rounded-2xl",
  icon: "h-10 w-10 rounded-xl p-0",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-berry/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = "Button";
