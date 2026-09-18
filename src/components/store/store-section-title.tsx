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
        gsap.from(ref.current!.children, {
          opacity: 0,
          x: -28,
          duration: 0.7,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 88%" },
        });
      }, ref);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  return (
    <div ref={ref} className={cn("mb-1 md:mb-6", className)}>
      {eyebrow && (
        <p className="mb-1 hidden text-sm font-bold uppercase tracking-[0.18em] text-berry md:block">
          {eyebrow}
        </p>
      )}
      <h2 className="font-sans text-base font-bold uppercase tracking-wide text-white md:font-display md:text-3xl md:normal-case md:tracking-normal md:font-normal md:text-cocoa lg:text-4xl">
        {children}
      </h2>
    </div>
  );
}
