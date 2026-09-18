"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { MapPin, Clock3 } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function StoreInfoBar({
  address,
  city,
  productionNote,
  minAdvanceDays,
  description,
}: {
  address: string | null;
  city: string | null;
  productionNote: string | null;
  minAdvanceDays: number;
  description: string | null;
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
        gsap.from(ref.current!.querySelectorAll("[data-chip]"), {
          opacity: 0,
          y: 20,
          scale: 0.94,
          duration: 0.5,
          stagger: 0.08,
          ease: "back.out(1.4)",
          scrollTrigger: { trigger: ref.current, start: "top 90%" },
        });
      }, ref);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [reduced]);

  const location = [address, city].filter(Boolean).join(" · ");

  const chips = [
    location && {
      key: "loc",
      icon: MapPin,
      text: location,
      className: "border-berry/20 bg-white text-cocoa shadow-berry/10",
      iconClass: "text-berry",
    },
    productionNote && {
      key: "note",
      icon: Clock3,
      text: productionNote,
      className: "border-caramel/35 bg-butter/70 text-cocoa",
      iconClass: "text-caramel",
    },
    minAdvanceDays > 0 && {
      key: "days",
      icon: Clock3,
      text: `Prazo mínimo: ${minAdvanceDays} dia${minAdvanceDays > 1 ? "s" : ""}`,
      className: "border-berry/20 bg-blush text-berry-deep",
      iconClass: "text-berry-deep",
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof MapPin;
    text: string;
    className: string;
    iconClass: string;
  }>;

  return (
    <section ref={ref} className="px-4 py-3 md:shell md:py-10">
      {/* Mobile — faixa compacta tipo delivery (fundo escuro) */}
      <div className="space-y-2.5 md:hidden">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
            Aberto
          </span>
          {location && (
            <span className="inline-flex min-w-0 items-center gap-1 text-sm text-white/55">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-berry" aria-hidden />
              <span className="truncate">{location}</span>
            </span>
          )}
        </div>
        {(productionNote || minAdvanceDays > 0) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-300/80" aria-hidden />
              {productionNote ||
                `Prazo mín.: ${minAdvanceDays} dia${minAdvanceDays > 1 ? "s" : ""}`}
            </span>
          </div>
        )}
        {description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-white/50">
            {description}
          </p>
        )}
      </div>

      {/* Desktop — chips */}
      <div className="hidden md:block">
        <div className="flex flex-wrap gap-3">
          {chips.map((c) => (
            <motion.span
              key={c.key}
              data-chip
              whileHover={reduced ? undefined : { y: -3, scale: 1.03 }}
              className={`inline-flex items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-sm shadow-sm ${c.className}`}
            >
              <c.icon className={`h-4 w-4 ${c.iconClass}`} aria-hidden />
              {c.text}
            </motion.span>
          ))}
        </div>
        {description && (
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-cocoa-soft/90 sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
