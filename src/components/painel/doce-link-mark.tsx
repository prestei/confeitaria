import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";

export function DoceLinkMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center justify-center rounded-xl bg-[#F8D4DC] text-[#C45B7A]",
        className,
      )}
      aria-hidden
    >
      <Heart className="h-[18px] w-[18px]" strokeWidth={2} fill="currentColor" />
    </span>
  );
}
