"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

const RANGES = [
  { id: "today", label: "Hoje" },
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
  { id: "90", label: "90 dias" },
];

export function AnalyticsFilters({ current }: { current: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="inline-flex rounded-xl border border-cocoa/10 bg-white p-0.5">
      {RANGES.map((r) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", r.id);
        return (
          <Link
            key={r.id}
            href={`${pathname}?${params.toString()}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              current === r.id
                ? "bg-cocoa text-white"
                : "text-cocoa-soft/70 hover:text-cocoa",
            )}
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}
