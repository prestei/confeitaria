import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-cocoa/12 bg-white/60 px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blush text-berry">
          <Icon className="h-6 w-6" aria-hidden />
        </div>
      )}
      <h3 className="font-display text-xl text-cocoa">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-cocoa-soft/75">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <a href={action.href} className="btn-primary !py-2.5 text-sm">
              {action.label}
            </a>
          ) : (
            <Button type="button" onClick={action.onClick} size="sm">
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
