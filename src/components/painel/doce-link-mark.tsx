import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";

export function DoceLinkMark({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "sidebar";
}) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-xl",
        variant === "sidebar"
          ? "bg-white/12 text-white"
          : "bg-[#E8F0EE] text-[var(--painel-brand,#0f352e)]",
        className,
      )}
      aria-hidden
    >
      <Heart className="h-[18px] w-[18px]" strokeWidth={2} fill="currentColor" />
    </span>
  );
}
