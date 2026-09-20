"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowDown } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80";

export function LandingHero() {
  const reduced = useReducedMotion();

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.85,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <section className="shell relative grid items-center gap-12 pb-16 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14 lg:pb-24 lg:pt-8">
      <div className="relative z-10 max-w-xl">
        <motion.p className="eyebrow" {...fade(0)}>
          Para confeiteiras e docerias
        </motion.p>

        <motion.h1
          className="mt-5 font-display text-[2.65rem] leading-[1.08] text-cocoa sm:text-5xl lg:text-[3.35rem] xl:text-[3.75rem]"
          {...fade(0.08)}
        >
          Seu talento merece uma forma mais elegante de vender.
        </motion.h1>

        <motion.p className="lead mt-6 max-w-md" {...fade(0.16)}>
          O DocePedido ajuda você a apresentar produtos, organizar encomendas e
          receber pedidos estruturados pelo WhatsApp.
        </motion.p>

        <motion.div className="mt-9 flex flex-wrap items-center gap-3" {...fade(0.24)}>
          <motion.div
            whileHover={reduced ? undefined : { y: -1, scale: 1.01 }}
            whileTap={reduced ? undefined : { scale: 0.985 }}
          >
            <Link href="/cadastrar" className="btn-berry">
              Começar gratuitamente
            </Link>
          </motion.div>
          <a href="#como-funciona" className="btn-ghost">
            Ver como funciona
            <ArrowDown className="h-4 w-4 opacity-60" aria-hidden />
          </a>
        </motion.div>

        <motion.p
          className="mt-10 border-t border-cocoa/8 pt-6 text-sm text-ink-muted"
          {...fade(0.32)}
        >
          Cardápio online · Pedidos organizados · Link e QR Code
        </motion.p>
      </div>

      <motion.div
        className="relative"
        initial={reduced ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      >
        <div
          data-parallax
          className="relative aspect-[4/5] overflow-hidden rounded-xl sm:aspect-[5/6] lg:aspect-[4/5] xl:min-h-[560px]"
        >
          <Image
            src={HERO_IMAGE}
            alt="Bolo artesanal com cobertura de chocolate e frutas"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cocoa/45 via-transparent to-transparent"
            aria-hidden
          />
        </div>

        <aside className="absolute bottom-5 left-5 right-5 rounded-lg border border-white/20 bg-surface/95 p-4 shadow-[0_16px_40px_rgba(51,37,34,0.18)] backdrop-blur-sm sm:left-auto sm:right-6 sm:w-[16.5rem]">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-rosewood">
            Pedido estruturado
          </p>
          <p className="mt-2 font-display text-xl leading-tight text-cocoa">
            Bolo 2kg · Chocolate belga
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-cocoa-soft">
            Data, sabor e total claros — direto no WhatsApp.
          </p>
        </aside>
      </motion.div>
    </section>
  );
}
