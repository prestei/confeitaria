"use client";

import { motion } from "motion/react";
import { Plus } from "lucide-react";
import {
  AVAILABILITY_LABELS,
  PRODUCT_TYPE_LABELS,
  formatBRL,
} from "@/lib/utils";
import type { Availability, PriceMode, ProductType } from "@prisma/client";
import Link from "next/link";

export function priceLabel(mode: PriceMode, cents: number | null) {
  if (mode === "QUOTE" || cents == null) return "Solicitar orçamento";
  if (mode === "FROM") return `A partir de ${formatBRL(cents)}`;
  return formatBRL(cents);
}

export function ProductCard({
  storeSlug,
  product,
}: {
  storeSlug: string;
  product: {
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    productType: ProductType;
    priceMode: PriceMode;
    priceCents: number | null;
    availability: Availability;
    featured: boolean;
  };
}) {
  const href = `/${storeSlug}/produto/${product.slug}`;

  return (
    <>
      {/* Mobile — lista estilo cardápio delivery */}
      <Link
        href={href}
        className="group flex items-start gap-3 border-b border-cocoa/8 py-4 last:border-b-0 active:bg-blush/30 md:hidden"
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-cocoa">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-cocoa-soft/70">
              {product.description}
            </p>
          )}
          <p className="mt-2 text-sm font-bold text-berry-deep">
            {priceLabel(product.priceMode, product.priceCents)}
          </p>
        </div>
        <div className="relative shrink-0">
          <div className="h-[5.75rem] w-[5.75rem] overflow-hidden rounded-xl bg-gradient-to-br from-blush to-butter/60">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl">
                🍰
              </div>
            )}
          </div>
          <span
            className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-berry text-white shadow-md shadow-berry/35 ring-2 ring-cream"
            aria-hidden
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </span>
        </div>
      </Link>

      {/* Desktop — card em grade */}
      <motion.div
        className="hidden md:block"
        whileHover={{ y: -6 }}
        transition={{ type: "spring", stiffness: 320, damping: 22 }}
      >
        <Link
          href={href}
          className="group block overflow-hidden rounded-3xl border border-berry/10 bg-white shadow-[0_8px_28px_rgba(212,82,122,0.1)] transition duration-300 hover:shadow-[0_16px_40px_rgba(212,82,122,0.18)]"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blush to-butter/60">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-5xl">
                🍰
              </div>
            )}
            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-cocoa shadow-sm">
                {PRODUCT_TYPE_LABELS[product.productType]}
              </span>
              {product.featured && (
                <span className="rounded-full bg-gradient-to-r from-berry to-berry-deep px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                  Destaque
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-display text-xl text-cocoa">{product.name}</h3>
            {product.description && (
              <p className="mt-1 line-clamp-2 text-sm text-cocoa-soft/75">
                {product.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="font-semibold text-berry-deep">
                {priceLabel(product.priceMode, product.priceCents)}
              </p>
              <p className="rounded-full bg-blush/80 px-2 py-0.5 text-xs text-berry-deep">
                {AVAILABILITY_LABELS[product.availability]}
              </p>
            </div>
          </div>
        </Link>
      </motion.div>
    </>
  );
}
