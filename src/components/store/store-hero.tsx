"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const StoreHeroAccents = dynamic(
  () =>
    import("@/components/store/store-hero-accents").then((m) => m.StoreHeroAccents),
  { ssr: false },
);

export function StoreHero({
  store,
}: {
  store: {
    slug: string;
    name: string;
    tagline: string | null;
    coverUrl: string | null;
    logoUrl?: string | null;
    accentColor: string;
  };
}) {
  const badgeRef = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const cover =
    store.coverUrl ||
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1800&q=80";

  useEffect(() => {
    if (reduced || !badgeRef.current) return;
    let cancelled = false;
    (async () => {
      const { animate } = await import("animejs");
      if (cancelled || !badgeRef.current) return;
      animate(badgeRef.current, {
        translateY: [0, -4, 0],
        duration: 2400,
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
          initial: { opacity: 0, y: 32 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.75,
            delay,
            ease: [0.22, 1, 0.36, 1] as const,
          },
        };

  return (
    <>
      {/* Mobile — capa + identidade estilo cardápio delivery */}
      <section className="md:hidden">
        <div
          className="relative h-48 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${cover})` }}
          role="img"
          aria-label={`Capa de ${store.name}`}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-[#0b0b0b]" />
          <Link
            href={`/${store.slug}/carrinho`}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            aria-label="Carrinho"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </Link>
        </div>
        <div className="relative -mt-10 px-4">
          <div className="flex items-end gap-3">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt=""
                className="h-[4.5rem] w-[4.5rem] shrink-0 rounded-2xl object-cover shadow-xl ring-2 ring-white/15"
              />
            ) : (
              <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-berry to-berry-deep text-3xl shadow-xl ring-2 ring-white/15">
                🍰
              </div>
            )}
            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate font-sans text-xl font-bold leading-tight text-white">
                {store.name}
              </h1>
              {store.tagline && (
                <p className="mt-0.5 line-clamp-2 text-sm text-white/55">
                  {store.tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Desktop — hero cinematico */}
      <section className="relative hidden min-h-[min(88vh,780px)] overflow-hidden md:block">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center"
          style={{ backgroundImage: `url(${cover})` }}
          role="img"
          aria-label={`Capa de ${store.name}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-cocoa/90 via-cocoa/55 to-berry/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-cocoa/80 via-transparent to-berry/20" />

        <StoreHeroAccents accent={store.accentColor || "#d4527a"} />

        <div className="shell relative flex min-h-[min(88vh,780px)] flex-col justify-end pb-16 pt-28 text-white">
          <motion.p
            ref={badgeRef}
            className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3.5 py-1.5 text-sm font-semibold text-butter backdrop-blur-md"
            {...fade(0)}
          >
            Doceria artesanal
          </motion.p>

          <motion.h1
            className="max-w-4xl font-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl xl:text-8xl"
            {...fade(0.12)}
          >
            {store.name}
          </motion.h1>

          {store.tagline && (
            <motion.p
              className="mt-5 max-w-2xl text-lg text-white/90 sm:text-xl"
              {...fade(0.22)}
            >
              {store.tagline}
            </motion.p>
          )}

          <motion.div className="mt-9 flex flex-wrap gap-3" {...fade(0.34)}>
            <motion.a
              href="#cardapio"
              className="btn-berry shadow-lg shadow-berry/40"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              Ver cardápio
            </motion.a>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={`/${store.slug}/encomenda`}
                className="btn-secondary !border-white/30 !bg-white/15 !text-white backdrop-blur"
              >
                Fazer encomenda
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
