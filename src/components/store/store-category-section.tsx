"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

export function StoreCategorySection({
  id,
  index,
  name,
  emoji,
  children,
}: {
  id: string;
  index: number;
  name: string;
  emoji: string | null;
  coverUrl?: string | null;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const alt = index % 2 === 1;

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
        const header = ref.current!.querySelector("[data-cat-header]");
        if (!header) return;
        gsap.from(header, {
          opacity: 0,
          y: 22,
          duration: 0.75,
          ease: "power3.out",
          immediateRender: false,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            once: true,
          },
        });
      }, ref);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        "scroll-mt-28 border-b border-sky/15",
        alt ? "bg-sand/70" : "bg-ivory",
      )}
    >
      <div className="shell pb-6 pt-6 md:pb-14 md:pt-12">
        {/* Mobile */}
        <div className="mb-3 flex items-center gap-2.5 md:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-baby-mid/60 text-lg">
            {emoji || "•"}
          </span>
          <h2 className="text-[1.35rem] font-bold leading-none tracking-tight text-cocoa">
            {name}
          </h2>
        </div>

        {/* Desktop — cabeçalho de cardápio */}
        <header
          data-cat-header
          className="mb-8 hidden md:block"
        >
          <div className="flex items-end justify-between gap-6 border-b border-sky/25 pb-5">
            <div>
              {emoji && (
                <motion.span
                  className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-baby-soft text-xl ring-1 ring-sky/25"
                  whileHover={
                    reduced ? undefined : { scale: 1.08, rotate: 6 }
                  }
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  aria-hidden
                >
                  {emoji}
                </motion.span>
              )}
              <h2 className="font-display text-4xl leading-none text-cocoa lg:text-[2.85rem]">
                {name}
              </h2>
              <p className="mt-2 max-w-lg text-sm text-cocoa-soft">
                Sabores da casa — escolha o seu e finalize pelo WhatsApp.
              </p>
            </div>
            <div
              className="hidden h-1 w-24 rounded-full bg-gradient-to-r from-sky/80 to-baby-mid lg:block"
              aria-hidden
            />
          </div>
        </header>

        {children}
      </div>
    </section>
  );
}
