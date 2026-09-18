"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

const HeroScene = dynamic(
  () => import("@/components/animations/hero-scene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#ffc4d6,#fff6f1)]" />
    ),
  },
);

export function LandingHeroVisual() {
  return (
    <motion.div
      className="relative hidden min-h-[480px] overflow-hidden rounded-[2rem] border border-berry/15 shadow-[0_20px_60px_rgba(212,82,122,0.22)] lg:block xl:min-h-[560px] 2xl:min-h-[620px]"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
    >
      <HeroScene />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-cocoa/65 via-berry/10 to-transparent" />
      <div className="absolute bottom-6 left-6 right-6 text-white">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm text-butter backdrop-blur-sm">
          <Sparkles className="h-4 w-4" />
          Experiência visual viva
        </p>
        <p className="mt-3 font-display text-3xl leading-tight xl:text-4xl">
          Cardápio → Pedido → WhatsApp
        </p>
        <p className="mt-2 max-w-md text-sm text-white/85">
          Sem perguntas repetidas. Com opções, data e valor claros.
        </p>
      </div>
    </motion.div>
  );
}
