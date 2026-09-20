"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Star,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Cat = { slug: string; name: string; emoji: string | null };

export function StoreCategoryPills({
  categories,
  showFeatured = false,
}: {
  categories: Cat[];
  showFeatured?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const skipScrollRef = useRef(true);
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string>(
    showFeatured ? "destaques" : categories[0]?.slug ?? "",
  );

  const items = [
    ...(showFeatured
      ? [{ slug: "destaques", name: "Mais pedidos", emoji: null as string | null }]
      : []),
    ...categories,
  ];

  const itemKey = items.map((i) => i.slug).join("|");

  useEffect(() => {
    const sectionIds = items.map((i) =>
      i.slug === "destaques" ? "destaques" : `cat-${i.slug}`,
    );
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (!id) return;
        setActive(id === "destaques" ? "destaques" : id.replace(/^cat-/, ""));
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0, 0.2, 0.45] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemKey]);

  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    const container = scrollerRef.current;
    const el = container?.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (!container || !el) return;
    const left = el.offsetLeft - container.clientWidth / 2 + el.offsetWidth / 2;
    container.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (reduced || !scrollerRef.current) return;
    let cancelled = false;
    (async () => {
      const { animate, stagger } = await import("animejs");
      if (cancelled || !scrollerRef.current) return;
      const pills = scrollerRef.current.querySelectorAll("[data-cat]");
      animate(pills, {
        opacity: [0, 1],
        translateY: [10, 0],
        delay: stagger(40),
        duration: 480,
        ease: "outCubic",
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [reduced, itemKey]);

  function scrollBy(dir: -1 | 1) {
    scrollerRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  if (!items.length) return null;

  return (
    <nav
      className="sticky top-0 z-30 border-y border-rosewood/15 bg-[#2a1f1c]/95 shadow-[0_8px_28px_rgba(51,37,34,0.18)] backdrop-blur-md"
      aria-label="Categorias do cardápio"
    >
      <div className="mx-auto flex max-w-[1400px] items-center gap-1.5 px-2.5 py-2.5 sm:gap-2 sm:px-4 sm:py-3.5 md:px-6">
        <a
          href="#cardapio"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-terracotta transition hover:bg-white/14 hover:text-white sm:h-11 sm:w-11 sm:rounded-xl"
          aria-label="Início do cardápio"
          onClick={() =>
            setActive(showFeatured ? "destaques" : categories[0]?.slug ?? "")
          }
        >
          <LayoutGrid className="h-4 w-4" />
        </a>

        <div
          ref={scrollerRef}
          className="scrollbar-thin flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain py-0.5 sm:gap-2"
        >
          {items.map((c) => {
            const isActive = active === c.slug;
            const href = c.slug === "destaques" ? "#destaques" : `#cat-${c.slug}`;
            return (
              <motion.a
                key={c.slug}
                data-cat={c.slug}
                href={href}
                onClick={() => setActive(c.slug)}
                whileHover={reduced ? undefined : { y: -2, scale: 1.02 }}
                whileTap={reduced ? undefined : { scale: 0.97 }}
                className={cn(
                  "relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition sm:gap-2 sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-sm",
                  isActive
                    ? "bg-rosewood text-white shadow-[0_8px_24px_rgba(185,111,125,0.45)]"
                    : "bg-white/8 text-white/80 hover:bg-white/14 hover:text-white",
                )}
              >
                {c.slug === "destaques" ? (
                  <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                ) : (
                  <span className="text-sm leading-none sm:text-base" aria-hidden>
                    {c.emoji || "•"}
                  </span>
                )}
                {c.name}
                {isActive && (
                  <motion.span
                    layoutId="cat-pill-glow"
                    className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-terracotta/50 sm:rounded-xl"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
              </motion.a>
            );
          })}
        </div>

        <div className="hidden shrink-0 gap-1.5 sm:flex">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 text-white/70 transition hover:bg-white/14 hover:text-white"
            aria-label="Categorias anteriores"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/8 text-white/70 transition hover:bg-white/14 hover:text-white"
            aria-label="Próximas categorias"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );
}
