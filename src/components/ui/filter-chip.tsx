"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Chip de filtro — use dentro de `ListFilterBar` ou `FilterChipGroup`. */
export function FilterChip({
  label,
  active,
  onClick,
  href,
  className,
}: {
  label: string;
  active: boolean;
  onClick?: () => void;
  href?: string;
  className?: string;
}) {
  const styles = cn(
    "box-border inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded-full px-4 text-sm font-semibold leading-none transition",
    active
      ? "bg-[var(--filter-chip-active-bg,#0f352e)] text-white"
      : [
          "bg-[var(--filter-chip-inactive-bg,#eff3f6)] text-[var(--filter-chip-inactive-text,#4a6375)]",
          "hover:bg-[var(--filter-chip-inactive-hover,#e5ebef)]",
        ],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles} aria-current={active ? "page" : undefined}>
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={styles}
    >
      {label}
    </button>
  );
}

/** Grupo horizontal de chips (rolagem quando necessário). */
export function FilterChipGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-wrap items-center gap-2",
        className,
      )}
      role="group"
    >
      {children}
    </div>
  );
}
