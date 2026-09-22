import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "berry"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-[#483129] text-white hover:bg-[#5E4335]",
  secondary:
    "border border-[#CED0D4] bg-white text-[#2D2926] hover:bg-[#F0F2F5]",
  accent: "bg-[#483129] text-white hover:bg-[#5E4335]",
  /** Alias de accent — mesma cor primária do menu lateral. */
  berry: "bg-[#483129] text-white hover:bg-[#5E4335]",
  ghost:
    "bg-transparent text-[#8C8682] hover:bg-[#F0F2F5] hover:text-[#2D2926]",
  danger: "bg-[#C85A5A] text-white hover:bg-[#B34A4A]",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs rounded",
  md: "h-9 gap-1.5 px-3.5 text-sm rounded",
  lg: "h-10 gap-2 px-4 text-sm rounded",
  icon: "h-9 w-9 rounded p-0",
};

/** Classes compartilhadas — use em `<button>` ou `<Link>` / `<a>` (server-safe). */
export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center font-semibold transition",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#483129]/25",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}
