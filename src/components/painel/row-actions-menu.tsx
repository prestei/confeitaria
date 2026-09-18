"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type RowActionItem = {
  label: string;
  icon?: LucideIcon;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "danger";
  separator?: boolean;
};

export function RowActionsMenu({
  items,
  align = "end",
  label = "Ações",
}: {
  items: RowActionItem[];
  align?: "start" | "end";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8C8682] transition",
          "hover:bg-[#F0F2F5] hover:text-[#2D2926]",
          open && "bg-[#F0F2F5] text-[#2D2926]",
        )}
      >
        <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            "absolute z-30 mt-1 min-w-[11.5rem] overflow-hidden rounded-md border border-[#E8E2DE] bg-white py-1 shadow-[0_8px_24px_rgba(45,41,38,0.12)]",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {items.map((item, i) => {
            const Icon = item.icon;
            const itemClass = cn(
              "flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] transition",
              item.tone === "danger"
                ? "text-[#C85A5A] hover:bg-[#FDECEC]"
                : "text-[#2D2926] hover:bg-[#F0F2F5]",
            );

            const content = (
              <>
                {Icon ? (
                  <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
                ) : null}
                {item.label}
              </>
            );

            return (
              <div key={`${item.label}-${i}`}>
                {item.separator ? (
                  <div className="my-1 border-t border-[#F0EBE7]" />
                ) : null}
                {item.href ? (
                  <Link
                    href={item.href}
                    role="menuitem"
                    className={itemClass}
                    onClick={() => setOpen(false)}
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    type="button"
                    role="menuitem"
                    className={itemClass}
                    onClick={() => {
                      setOpen(false);
                      item.onClick?.();
                    }}
                  >
                    {content}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
