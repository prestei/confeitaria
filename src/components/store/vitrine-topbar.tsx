"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";

export function VitrineTopbar({
  store,
}: {
  store: { slug: string; name: string };
}) {
  const { count } = useCart();
  return (
    <header className="sticky top-0 z-40 border-b border-cocoa/8 bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href={`/${store.slug}`} className="truncate text-sm font-semibold text-cocoa">
          {store.name}
        </Link>
        <Link
          href={`/${store.slug}/carrinho`}
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-cocoa/10 bg-white text-cocoa"
          aria-label="Carrinho"
        >
          <ShoppingBag className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rosewood px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
