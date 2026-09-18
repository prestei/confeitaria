"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/cn";

const desktopTints = [
  "sm:bg-blush sm:border-berry/25 sm:text-berry-deep sm:hover:bg-berry sm:hover:text-white",
  "sm:bg-butter/80 sm:border-caramel/30 sm:text-cocoa sm:hover:bg-caramel sm:hover:text-white",
  "sm:bg-rose/40 sm:border-rose/40 sm:text-berry-deep sm:hover:bg-rose sm:hover:text-cocoa",
  "sm:bg-white sm:border-berry/15 sm:text-cocoa sm:hover:bg-cocoa sm:hover:text-white",
  "sm:bg-fog sm:border-cocoa/10 sm:text-cocoa-soft sm:hover:bg-berry-deep sm:hover:text-white",
];

type NavItem = { slug: string; name: string; emoji: string | null };

export function StoreCategoryNav({
  categories,
  sectionIdPrefix = "cat-",
  leadItems = [],
  variant = "delivery",
}: {
  categories: NavItem[];
  /** Prefixo dos ids das seções (ex.: cat-m-) */
  sectionIdPrefix?: string;
  /** Itens virtuais no início (ex.: Destaques) */
  leadItems?: NavItem[];
  /** delivery = abas texto + underline (Prefiro); chips = círculos com emoji */
  variant?: "delivery" | "chips";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const items = useMemo(
    () => [...leadItems, ...categories],
    [leadItems, categories],
  );
  const itemKey = items.map((i) => i.slug).join("|");
  const [active, setActive] = useState<string | null>(items[0]?.slug ?? null);

  useEffect(() => {
    if (reduced || !ref.current || !items.length || variant !== "chips") return;
    let cancelled = false;

    (async () => {
      const { animate, stagger } = await import("animejs");
      if (cancelled || !ref.current) return;
      const chips = ref.current.querySelectorAll("[data-cat]");
      animate(chips, {
        opacity: [0, 1],
        translateY: [12, 0],
        delay: stagger(45),
        duration: 450,
        ease: "outExpo",
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [reduced, itemKey, variant, items.length]);

  useEffect(() => {
    if (!items.length) return;

    const sections = items
      .map((c) => document.getElementById(`${sectionIdPrefix}${c.slug}`))
      .filter(Boolean) as HTMLElement[];

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const id = visible[0]?.target.id;
        if (id?.startsWith(sectionIdPrefix)) {
          setActive(id.slice(sectionIdPrefix.length));
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.15, 0.4] },
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [itemKey, sectionIdPrefix, items]);

  useEffect(() => {
    if (!active || !ref.current) return;
    const el = ref.current.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    el?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [active]);

  if (!items.length) return null;

  if (variant === "delivery") {
    return (
      <div
        ref={ref}
        className="scrollbar-thin flex gap-0 overflow-x-auto px-4"
        role="tablist"
        aria-label="Categorias do cardápio"
      >
        {items.map((c) => {
          const isActive = active === c.slug;
          return (
            <a
              key={c.slug}
              data-cat={c.slug}
              href={`#${sectionIdPrefix}${c.slug}`}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "relative shrink-0 px-3 py-3.5 text-[13px] font-semibold uppercase tracking-wide transition",
                isActive ? "text-white" : "text-white/45 hover:text-white/75",
              )}
            >
              {c.name}
              <span
                className={cn(
                  "absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-berry transition",
                  isActive ? "opacity-100" : "opacity-0",
                )}
                aria-hidden
              />
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="scrollbar-thin -mx-5 flex gap-1 overflow-x-auto px-5 pb-1 sm:mx-0 sm:gap-2.5 sm:px-0 sm:pb-2"
    >
      {items.map((c, i) => {
        const isActive = active === c.slug;
        return (
          <motion.a
            key={c.slug}
            data-cat={c.slug}
            href={`#${sectionIdPrefix}${c.slug}`}
            whileHover={reduced ? undefined : { scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "flex shrink-0 flex-col items-center gap-1.5 px-2.5 py-1.5 transition",
              "sm:flex-row sm:rounded-2xl sm:border sm:px-4 sm:py-2.5 sm:text-sm sm:font-semibold sm:shadow-sm",
              desktopTints[i % desktopTints.length],
              !reduced && "opacity-0",
              isActive ? "text-berry-deep" : "text-cocoa-soft/75",
            )}
          >
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full text-xl transition sm:hidden",
                isActive
                  ? "bg-berry text-white shadow-md shadow-berry/30 ring-2 ring-berry/25"
                  : "bg-white text-cocoa shadow-sm ring-1 ring-cocoa/8",
              )}
              aria-hidden
            >
              {c.emoji || "🍰"}
            </span>
            <span
              className={cn(
                "max-w-[4.75rem] truncate text-center text-[11px] font-semibold sm:max-w-none sm:text-sm",
                isActive && "max-sm:text-berry-deep",
              )}
            >
              <span className="hidden sm:inline">
                {c.emoji ? `${c.emoji} ` : ""}
              </span>
              {c.name}
            </span>
          </motion.a>
        );
      })}
    </div>
  );
}
