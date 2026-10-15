"use client";

import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex w-full max-w-full cursor-pointer items-start gap-3 sm:items-center",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--painel-brand,#0f352e)]/25",
          checked ? "bg-[var(--painel-brand,#0f352e)]" : "bg-[#CED0D4]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked && "translate-x-5",
          )}
        />
      </button>
      {label && (
        <span className="min-w-0 flex-1 pt-0.5 text-sm font-medium leading-snug text-pretty text-cocoa sm:pt-0">
          {label}
        </span>
      )}
    </label>
  );
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  id,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer items-start gap-2.5",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-cocoa/25 text-rosewood focus:ring-rosewood/30"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      {label && <span className="text-sm text-cocoa">{label}</span>}
    </label>
  );
}
