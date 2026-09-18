"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CakeSlice } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function StoreCustomOrderBanner({ slug }: { slug: string }) {
  const reduced = useReducedMotion();

  return (
    <section className="pb-8 md:shell md:pb-14">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden rounded-2xl border border-white/10 md:rounded-[2rem] md:border-berry/20 md:shadow-[0_20px_60px_rgba(212,82,122,0.18)]"
      >
        <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative bg-gradient-to-br from-berry via-berry-deep to-cocoa p-8 text-white sm:p-12">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-butter/25 blur-2xl"
              aria-hidden
            />
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold text-butter backdrop-blur">
              <CakeSlice className="h-4 w-4" aria-hidden />
              Sob encomenda
            </div>
            <h2 className="mt-5 font-display text-3xl sm:text-4xl xl:text-5xl">
              Bolos, festas e kits personalizados
            </h2>
            <p className="mt-4 max-w-md text-white/85">
              Conte o tema, a data e o número de pessoas. Montamos um orçamento
              claro e enviamos tudo organizado no WhatsApp.
            </p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/${slug}/encomenda`}
                className="mt-8 inline-flex rounded-2xl bg-white px-6 py-3.5 font-semibold text-berry-deep shadow-lg"
              >
                Personalize sua encomenda
              </Link>
            </motion.div>
          </div>
          <div
            className="min-h-[240px] bg-cover bg-center lg:min-h-full"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1464349095439-e68e5c0e4b3d?auto=format&fit=crop&w=1200&q=80)",
            }}
            role="img"
            aria-label="Bolo decorado para festa"
          />
        </div>
      </motion.div>
    </section>
  );
}
