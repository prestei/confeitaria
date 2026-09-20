"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function LandingCta() {
  const reduced = useReducedMotion();

  return (
    <section className="section-pad">
      <div className="shell">
        <div
          data-reveal
          className="relative overflow-hidden rounded-xl bg-rosewood px-8 py-14 text-center text-ivory sm:px-12 sm:py-16"
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-terracotta/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-cocoa/20 blur-3xl"
            aria-hidden
          />

          <h2 className="relative font-display text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]">
            Pronto para apresentar sua confeitaria com mais cuidado?
          </h2>
          <p className="relative mx-auto mt-4 max-w-md text-base text-ivory/80">
            Crie sua vitrine, compartilhe o link e receba pedidos organizados —
            no ritmo da sua produção.
          </p>
          <motion.div
            className="relative mt-9"
            whileHover={reduced ? undefined : { y: -1 }}
            whileTap={reduced ? undefined : { scale: 0.985 }}
          >
            <Link
              href="/cadastrar"
              className="inline-flex items-center justify-center rounded-md bg-ivory px-6 py-3.5 text-sm font-semibold text-rosewood-deep transition hover:bg-white"
            >
              Começar gratuitamente
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
