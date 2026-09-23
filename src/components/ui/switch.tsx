"use client";

import { cn } from "@/lib/cn";

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  id,
  size = "md",
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  size?: "sm" | "md";
}) {
  const sm = size === "sm";
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative shrink-0 rounded-full transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#483129]/25",
          sm ? "h-5 w-9" : "h-6 w-11",
          checked ? "bg-[#483129]" : "bg-[#CED0D4]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition",
            sm ? "h-4 w-4" : "h-5 w-5",
            checked && (sm ? "translate-x-4" : "translate-x-5"),
          )}
        />
      </button>
      {label && (
        <span className="text-sm font-medium text-[#2D2926]">{label}</span>
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
