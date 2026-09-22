"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";

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
      <FilterChipGroup>
        {(
          [
            ["day", "Dia"],
            ["week", "Semana"],
            ["month", "Mês"],
          ] as const
        ).map(([id, text]) => (
          <FilterChip
            key={id}
            label={text}
            active={view === id}
            href={
              id === "month"
                ? `/painel/agenda?view=month&month=${monthParam}`
                : `/painel/agenda?view=${id}&day=${dayParam}`
            }
          />
        ))}
      </FilterChipGroup>
      <div className="flex items-center gap-1">
        <Link
          href={prevHref}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#CED0D4] bg-white text-[#2D2926] transition hover:bg-[#F0F2F5]"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <span className="min-w-[8rem] text-center text-xs font-semibold capitalize text-[#2D2926] sm:min-w-[11rem] sm:text-sm">
          {label}
        </span>
        <Link
          href={nextHref}
          className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[#CED0D4] bg-white text-[#2D2926] transition hover:bg-[#F0F2F5]"
          aria-label="Próximo"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
