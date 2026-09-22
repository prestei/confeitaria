"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Chip de filtro universal do painel. */
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
    "box-border inline-flex h-9 shrink-0 cursor-pointer items-center justify-center rounded px-4 text-sm font-semibold leading-none transition",
    active
      ? "bg-[#483129] text-white shadow-sm"
      : "bg-[#E4E6EB] text-[#65676B] hover:bg-[#D8DADF]",
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

/** Grupo horizontal padrão de FilterChips. */
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
