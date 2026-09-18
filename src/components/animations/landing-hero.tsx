"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { LandingHeroVisual } from "@/components/animations/landing-hero-visual";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function LandingHero() {
  const badgeRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !badgeRef.current) return;
    let cancelled = false;

    (async () => {
      const { animate } = await import("animejs");
      if (cancelled || !badgeRef.current) return;
      animate(badgeRef.current, {
        scale: [1, 1.06, 1],
        duration: 2200,
        ease: "inOutSine",
        loop: true,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [reduced]);

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.7,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section className="shell relative grid min-h-[calc(100vh-5.5rem)] items-center gap-10 overflow-hidden pb-16 pt-4 lg:grid-cols-[1fr_1.05fr] lg:gap-12 xl:gap-16">
      <div
        className="blob animate-drift left-[-8%] top-[10%] h-64 w-64 bg-berry/35"
        aria-hidden
      />
      <div
        className="blob animate-float right-[5%] top-[20%] h-48 w-48 bg-caramel/40 lg:right-[48%]"
        aria-hidden
      />
      <div
        className="blob bottom-[5%] left-[30%] h-40 w-40 bg-rose/30"
        style={{ animation: "drift 11s ease-in-out infinite reverse" }}
        aria-hidden
      />

      <div className="relative z-10">
        <motion.p
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-berry/20 bg-white/70 px-3.5 py-1.5 text-sm font-semibold text-berry-deep shadow-sm backdrop-blur"
          {...fade(0)}
        >
          <Sparkles className="h-4 w-4 text-berry" />
          <span ref={badgeRef} className="inline-block origin-center">
            Plataforma para confeiteiras
          </span>
        </motion.p>

        <motion.h1
          className="font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl xl:text-8xl"
          {...fade(0.1)}
        >
          <span className="text-shimmer">DocePedido</span>
        </motion.h1>

        <motion.p
          className="mt-5 max-w-xl text-lg leading-relaxed text-cocoa-soft/90"
          {...fade(0.2)}
        >
          Transforme visitas em pedidos organizados. O cliente escolhe no
          cardápio, personaliza e envia tudo estruturado para o seu WhatsApp.
        </motion.p>

        <motion.div className="mt-8 flex flex-wrap gap-3" {...fade(0.32)}>
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link href="/cadastrar" className="btn-berry shadow-lg shadow-berry/25">
              Começar grátis
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link href="/doce-arte" className="btn-secondary">
              Ver demo ao vivo
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-10 flex flex-wrap gap-6 text-sm"
          {...fade(0.45)}
        >
          {[
            { n: "2", l: "modos de venda" },
            { n: "1", l: "link + QR Code" },
            { n: "∞", l: "pedidos no WhatsApp" },
          ].map((s) => (
            <div key={s.l} className="min-w-[6.5rem]">
              <p className="font-display text-3xl text-berry">{s.n}</p>
              <p className="text-cocoa-soft/70">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        className="relative z-10"
        initial={reduced ? false : { opacity: 0, scale: 0.94, x: 24 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.85, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        <LandingHeroVisual />
      </motion.div>
    </section>
  );
}
