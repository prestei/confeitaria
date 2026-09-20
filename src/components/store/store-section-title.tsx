"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

export function StoreSectionTitle({
  children,
  eyebrow,
  className,
}: {
  children: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;
    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const gsap = (await import("gsap")).default;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (cancelled || !ref.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => {
        gsap.from(ref.current!, {
          opacity: 0,
          y: 18,
          duration: 0.7,
          ease: "power2.out",
          immediateRender: false,
          scrollTrigger: { trigger: ref.current, start: "top 90%", once: true },
        });
      }, ref);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  return (
    <div ref={ref} className={cn("mb-6 md:mb-8", className)}>
      {eyebrow && (
        <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-rosewood">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-2xl text-cocoa md:text-3xl lg:text-[2.15rem]">
        {children}
      </h2>
      <div className="mt-3 h-px w-12 bg-rosewood/35" aria-hidden />
    </div>
  );
}
