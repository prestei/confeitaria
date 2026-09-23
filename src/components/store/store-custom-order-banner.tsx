"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function StoreCustomOrderBanner({ slug }: { slug: string }) {
  const reduced = useReducedMotion();
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !lineRef.current) return;
    let cancelled = false;
    (async () => {
      const { animate } = await import("animejs");
      if (cancelled || !lineRef.current) return;
      animate(lineRef.current, {
        scaleX: [0, 1],
        duration: 1100,
        ease: "outCubic",
        delay: 120,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  return (
    <section className="shell pb-16 pt-4">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        className="grid overflow-hidden rounded-xl border border-cocoa/10 bg-surface lg:grid-cols-2"
      >
        <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-rosewood">
            Sob encomenda
          </p>
          <div
            ref={lineRef}
            className="mt-4 h-px w-16 origin-left bg-rosewood/40"
            aria-hidden
          />
          <h2 className="mt-5 font-display text-3xl leading-tight text-cocoa sm:text-4xl">
            Bolos, festas e kits feitos sob medida
          </h2>
          <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-cocoa-soft">
            Informe tema, data e quantidade de pessoas. Você recebe um pedido
            estruturado no WhatsApp — sem idas e vindas desnecessárias.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <motion.div
              whileHover={reduced ? undefined : { y: -1 }}
              whileTap={reduced ? undefined : { scale: 0.985 }}
            >
              <Link
                href={`/${slug}/encomenda`}
                className="btn-berry inline-flex"
              >
                Personalizar encomenda
              </Link>
            </motion.div>
          </div>
        </div>
        <div
          className="min-h-[240px] bg-cover bg-center lg:min-h-[22rem]"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?auto=format&fit=crop&w=1200&q=80)",
          }}
          role="img"
          aria-label="Bolo decorado para festa"
        />
      </motion.div>
    </section>
  );
}
