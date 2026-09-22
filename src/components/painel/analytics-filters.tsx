"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";

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
    <FilterChipGroup>
      {RANGES.map((r) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", r.id);
        return (
          <FilterChip
            key={r.id}
            label={r.label}
            active={current === r.id}
            href={`${pathname}?${params.toString()}`}
          />
        );
      })}
    </FilterChipGroup>
  );
}
