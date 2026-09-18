"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/utils";

export function StoreCartBar({ storeSlug }: { storeSlug: string }) {
  const { count, subtotalCents, hasQuoteItems } = useCart();

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-50 md:hidden"
        >
          <Link
            href={`/${storeSlug}/carrinho`}
            className="pointer-events-auto flex items-center gap-3 bg-berry px-4 py-3.5 text-white shadow-[0_-8px_32px_rgba(0,0,0,0.45)]"
          >
            <span className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-md bg-black/25 px-2 text-sm font-bold tabular-nums">
              {count}
            </span>
            <span className="flex-1 text-center text-sm font-bold uppercase tracking-wider">
              Ver carrinho
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums">
              {hasQuoteItems ? "Orçamento" : formatBRL(subtotalCents)}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
