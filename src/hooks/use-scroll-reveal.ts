"use client";

import { useEffect, useRef } from "react";
import { gsapDefaults } from "@/lib/animations/presets";
import { useReducedMotion } from "./use-reduced-motion";

type Options = {
  y?: number;
  duration?: number;
  stagger?: number;
  start?: string;
  once?: boolean;
};

/**
 * GSAP ScrollTrigger reveal for a container's children.
 * No-ops when prefers-reduced-motion is set.
 */
export function useScrollReveal<T extends HTMLElement>(options: Options = {}) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const children = el.children.length > 0 ? el.children : [el];
      ctx = gsap.context(() => {
        gsap.from(children, {
          opacity: 0,
          y: options.y ?? gsapDefaults.y,
          duration: options.duration ?? gsapDefaults.duration,
          stagger: options.stagger ?? gsapDefaults.stagger,
          ease: gsapDefaults.ease,
          scrollTrigger: {
            trigger: el,
            start: options.start ?? "top 88%",
            once: options.once ?? true,
          },
        });
      }, el);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced, options.y, options.duration, options.stagger, options.start, options.once]);

  return ref;
}
