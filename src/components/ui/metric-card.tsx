import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./card";

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-cocoa-soft/70">{label}</p>
          <p className="mt-2 font-display text-3xl tracking-tight text-cocoa">{value}</p>
          {hint && <p className="mt-1.5 text-xs text-cocoa-soft/60">{hint}</p>}
        </div>
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blush text-berry">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        )}
      </div>
    </Card>
  );
}
