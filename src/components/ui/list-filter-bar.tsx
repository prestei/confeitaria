"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";

export type ListFilterOption<T extends string = string> = {
  value: T;
  label: string;
};

type ListFilterBarProps<T extends string> = {
  className?: string;
  search: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    "aria-label"?: string;
  };
  filters: {
    value: T;
    onChange: (value: T) => void;
    options: ReadonlyArray<ListFilterOption<T>>;
  };
};

/** Barra padrão: busca em linha própria no mobile; chips em linha com rolagem. */
export function ListFilterBar<T extends string>({
  className,
  search,
  filters,
}: ListFilterBarProps<T>) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3",
        className,
      )}
    >
      <label className="relative block w-full min-w-0 sm:max-w-[280px] sm:shrink-0">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--filter-search-icon,#9ca3af)]"
          strokeWidth={1.75}
          aria-hidden
        />
        <input
          type="search"
          value={search.value}
          onChange={(e) => search.onChange(e.target.value)}
          placeholder={search.placeholder ?? "Buscar…"}
          aria-label={search["aria-label"] ?? search.placeholder ?? "Buscar"}
          className={cn(
            "h-9 w-full rounded-full border border-[var(--filter-search-border,#e5e7eb)] bg-white",
            "py-0 pl-10 pr-4 text-sm text-[#111827] outline-none transition",
            "placeholder:text-[var(--filter-search-placeholder,#9ca3af)]",
            "focus:border-[var(--filter-chip-active-bg,#0f352e)]/25",
            "focus:ring-2 focus:ring-[var(--filter-chip-active-bg,#0f352e)]/10",
          )}
        />
      </label>

      <div
        className={cn(
          "max-sm:relative max-sm:left-1/2 max-sm:w-screen max-sm:max-w-[100vw] max-sm:-translate-x-1/2",
          "sm:min-w-0 sm:flex-1 sm:w-auto sm:max-w-none sm:left-auto sm:translate-x-0",
        )}
      >
        <FilterChipGroup
          className={cn(
            "w-full min-w-0 snap-x snap-mandatory scroll-px-4 pb-0.5",
            "max-sm:px-4",
            "sm:flex-1 sm:scroll-px-0 sm:px-0",
          )}
        >
          {filters.options.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={filters.value === opt.value}
              onClick={() => filters.onChange(opt.value)}
              className="snap-start"
            />
          ))}
          <span
            className="w-4 shrink-0 max-sm:w-4 sm:w-0"
            aria-hidden
          />
        </FilterChipGroup>
      </div>
    </div>
  );
}
