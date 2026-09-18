"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function AgendaControls({
  label,
  prevHref,
  nextHref,
  view,
  monthParam,
  dayParam,
}: {
  label: string;
  prevHref: string;
  nextHref: string;
  view: "day" | "week" | "month";
  monthParam: string;
  dayParam: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-xl border border-cocoa/10 bg-white p-0.5">
        {(
          [
            ["day", "Dia"],
            ["week", "Semana"],
            ["month", "Mês"],
          ] as const
        ).map(([id, text]) => (
          <Link
            key={id}
            href={
              id === "month"
                ? `/painel/agenda?view=month&month=${monthParam}`
                : `/painel/agenda?view=${id}&day=${dayParam}`
            }
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              view === id ? "bg-cocoa text-white" : "text-cocoa-soft/70",
            )}
          >
            {text}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <Link
          href={prevHref}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cocoa/10 bg-white"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="min-w-[8rem] text-center text-xs font-semibold capitalize text-cocoa sm:min-w-[11rem] sm:text-sm">
          {label}
        </span>
        <Link
          href={nextHref}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cocoa/10 bg-white"
          aria-label="Próximo"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
