import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-cocoa/8",
        className,
      )}
      aria-hidden
    />
  );
}
