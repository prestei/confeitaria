"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { formatBRL } from "@/lib/utils";

export function StoreCartBar({ storeSlug }: { storeSlug: string }) {
  const { count, subtotalCents, hasQuoteItems } = useCart();
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const onCartPage =
    pathname === `/${storeSlug}/carrinho` ||
    pathname?.startsWith(`/${storeSlug}/carrinho/`);

  if (onCartPage || count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:inset-x-auto md:bottom-8 md:right-8 md:px-0 md:pb-0">
      <AnimatePresence>
        <motion.div
          initial={reduced ? false : { y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="mx-auto max-w-lg md:mx-0 md:max-w-none"
        >
          <Link
            href={`/${storeSlug}/carrinho`}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-rosewood/30 bg-rosewood px-4 py-3.5 text-white shadow-[0_16px_40px_rgba(185,111,125,0.4)] transition hover:bg-rosewood-deep md:min-w-[17rem]"
            aria-label={`Sacola com ${count} itens`}
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold tabular-nums text-rosewood">
                {count}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-tight">
                Ver sacola
              </span>
              <span className="mt-0.5 block text-xs text-white/80">
                {hasQuoteItems
                  ? "Valor a confirmar"
                  : formatBRL(subtotalCents)}
              </span>
            </span>
            <span className="hidden text-xs font-semibold uppercase tracking-wide text-white/90 sm:inline">
              Continuar
            </span>
          </Link>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
