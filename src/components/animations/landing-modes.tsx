"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function LandingModes() {
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
        const panels = ref.current!.querySelectorAll("[data-mode]");
        gsap.from(panels, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: { trigger: ref.current, start: "top 80%" },
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
      className="shell py-10"
    >
      <div className="grid overflow-hidden rounded-[2rem] border border-berry/15 shadow-[0_20px_50px_rgba(212,82,122,0.12)] lg:grid-cols-2">
        <motion.div
          data-mode
          whileHover={reduced ? undefined : { backgroundColor: "rgba(255,224,234,0.55)" }}
          className="border-b border-berry/10 bg-white/90 p-8 sm:p-10 lg:border-b-0 lg:border-r"
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-berry">
            Modo 1
          </p>
          <h3 className="mt-3 font-display text-3xl text-cocoa sm:text-4xl">
            Loja rápida
          </h3>
          <p className="mt-4 text-cocoa-soft/85">
            Produto → Adicionais → Carrinho → Dados → Pedido. Ideal para pronta
            entrega e preços definidos.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Catálogo", "Carrinho", "WhatsApp"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-blush px-3 py-1 text-xs font-semibold text-berry-deep"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          data-mode
          whileHover={reduced ? undefined : { scale: 1.01 }}
          className="bg-gradient-to-br from-berry/90 via-berry-deep to-cocoa p-8 text-white sm:p-10"
        >
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-butter">
            Modo 2
          </p>
          <h3 className="mt-3 font-display text-3xl sm:text-4xl">
            Encomenda personalizada
          </h3>
          <p className="mt-4 text-white/85">
            Personalizar → Data → Referência → Orçamento. Ideal para bolos
            temáticos, festas e corporativo.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Wizard", "Orçamento", "Agenda"].map((t) => (
              <span
                key={t}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-butter backdrop-blur"
              >
                {t}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
