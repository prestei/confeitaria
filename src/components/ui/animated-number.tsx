"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/** Anime.js number count-up for dashboard metrics */
export function AnimatedNumber({
  value,
  duration = 900,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.textContent = formatRef.current(value);
      return;
    }

    let cancelled = false;
    const state = { n: 0 };

    (async () => {
      const { animate } = await import("animejs");
      if (cancelled) return;
      animate(state, {
        n: value,
        duration,
        ease: "outExpo",
        onUpdate: () => {
          if (el) el.textContent = formatRef.current(state.n);
        },
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [value, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      {formatRef.current(reduced ? value : 0)}
    </span>
  );
}
