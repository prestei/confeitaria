"use client";

import Link from "next/link";
import {
  Children,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const AUTO_PLAY_MS = 4500;
const MOBILE_MQ = "(max-width: 639px)";

function slideNodes(root: HTMLElement) {
  return [...root.querySelectorAll<HTMLElement>("[data-metric-slide]")];
}

function nearestSlideIndex(root: HTMLElement) {
  const slides = slideNodes(root);
  if (slides.length === 0) return 0;
  let index = 0;
  let best = Infinity;
  for (let i = 0; i < slides.length; i++) {
    const dist = Math.abs(slides[i].offsetLeft - root.scrollLeft);
    if (dist < best) {
      best = dist;
      index = i;
    }
  }
  return index;
}

/** Linha de métricas: carrossel automático no mobile, grade no desktop. */
export function PainelMetricRow({
  children,
  className,
  autoPlayMs = AUTO_PLAY_MS,
}: {
  children: ReactNode;
  className?: string;
  autoPlayMs?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const slideCount = Children.count(children);

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const root = scrollerRef.current;
      if (!root) return;
      const slides = slideNodes(root);
      const slide = slides[index];
      if (!slide) return;
      root.scrollTo({
        left: slide.offsetLeft,
        behavior: reducedMotion ? "auto" : behavior,
      });
    },
    [reducedMotion],
  );

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || slideCount < 2) return;

    const mq = window.matchMedia(MOBILE_MQ);

    const tick = () => {
      if (paused || reducedMotion || !mq.matches) return;
      if (root.scrollWidth <= root.clientWidth + 2) return;

      const current = nearestSlideIndex(root);
      const next = (current + 1) % slideCount;
      scrollToIndex(next);
    };

    const id = window.setInterval(tick, autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, paused, reducedMotion, scrollToIndex, slideCount]);

  const pauseBriefly = useCallback(() => {
    setPaused(true);
    const id = window.setTimeout(() => setPaused(false), autoPlayMs * 2);
    return () => window.clearTimeout(id);
  }, [autoPlayMs]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    let resumeTimer: number | undefined;
    const onInteract = () => {
      setPaused(true);
      if (resumeTimer) window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => setPaused(false), autoPlayMs * 2);
    };

    root.addEventListener("touchstart", onInteract, { passive: true });
    root.addEventListener("pointerdown", onInteract);
    root.addEventListener("wheel", onInteract, { passive: true });

    return () => {
      root.removeEventListener("touchstart", onInteract);
      root.removeEventListener("pointerdown", onInteract);
      root.removeEventListener("wheel", onInteract);
      if (resumeTimer) window.clearTimeout(resumeTimer);
    };
  }, [autoPlayMs]);

  return (
    <div
      ref={scrollerRef}
      role="region"
      aria-roledescription="carrossel"
      aria-label="Métricas"
      aria-live="polite"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className={cn(
        "-mx-4 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 pt-0.5",
        "snap-x snap-mandatory scroll-pl-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "max-sm:touch-pan-x",
        "sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 sm:snap-none",
        "md:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Envolve cada card no carrossel mobile. */
export function PainelMetricSlide({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      data-metric-slide=""
      className={cn(
        "h-full w-[calc(50%-0.25rem)] max-w-[10.75rem] shrink-0 snap-start",
        "sm:w-auto sm:max-w-none sm:min-w-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

const defaultIconTone =
  "bg-[#E8F0EE] text-[var(--painel-brand,#0f352e)]";

/** Card de métrica do painel — ícone à esquerda, borda suave, tipografia neutra. */
export function PainelMetricCard({
  label,
  value,
  hint,
  icon: Icon,
  iconClassName,
  href,
  className,
  children,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  iconClassName?: string;
  href?: string;
  className?: string;
  children?: ReactNode;
}) {
  const valueText = String(value);

  const body = (
    <>
      {Icon ? (
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11",
            iconClassName ?? defaultIconTone,
          )}
        >
          <Icon
            className="h-3.5 w-3.5 sm:h-5 sm:w-5"
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p
          className="line-clamp-2 text-[10px] leading-tight text-[var(--painel-muted,#6b7280)] sm:text-[13px] sm:leading-snug"
          title={label}
        >
          {label}
        </p>
        <p
          className="mt-0.5 min-w-0 truncate text-base font-bold tabular-nums leading-tight text-[#111827] sm:mt-0 sm:text-2xl"
          title={valueText}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 text-xs text-[var(--painel-muted,#6b7280)]">
            {hint}
          </p>
        ) : null}
        {children ? (
          <div className="mt-1 min-w-0 leading-tight">{children}</div>
        ) : null}
      </div>
    </>
  );

  const styles = cn(
    "flex h-full min-h-[4.5rem] items-center gap-2 rounded-xl border border-[var(--painel-border)] bg-white px-2.5 py-2.5 sm:min-h-0 sm:gap-3 sm:px-4 sm:py-4",
    href &&
      "transition hover:border-[rgb(15_23_42/0.1)] hover:bg-[var(--painel-subtle,#eff3f6)]",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={styles}>
        {body}
      </Link>
    );
  }

  return <div className={styles}>{body}</div>;
}
