"use client";

import Link from "next/link";
import type { PriceMode, ProductType } from "@/lib/enums";
import { priceLabel } from "@/components/store/product-card";
import { effectivePriceCents, hasPromoPrice } from "@/lib/pricing";
import { trackStoreEvent } from "@/lib/analytics";

type FeaturedProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  productType: ProductType;
  priceMode: PriceMode;
  priceCents: number | null;
  promoPriceCents?: number | null;
  featured: boolean;
};

export function StoreFeaturedBanners({
  storeSlug,
  products,
}: {
  storeSlug: string;
  products: FeaturedProduct[];
}) {
  if (!products.length) return null;

  const cards = products.slice(0, 3);

  return (
    <section id="destaques" className="scroll-mt-28">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 md:px-6">
        {/* Mobile — carrossel horizontal estilo Prefiro */}
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 scrollbar-thin md:hidden">
          {cards.map((p) => (
            <Link
              key={p.id}
              href={`/${storeSlug}/produto/${p.slug}`}
              onClick={() =>
                trackStoreEvent({
                  storeSlug,
                  type: "PRODUCT_CLICK",
                  productId: p.id,
                })
              }
              className="relative aspect-[16/10] w-[min(88vw,22rem)] shrink-0 snap-center overflow-hidden rounded-xl bg-cocoa shadow-[0_10px_28px_rgba(51,37,34,0.14)]"
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-cocoa to-cocoa-soft" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
              <span className="absolute left-3 top-3 rounded bg-rosewood px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Destaque
              </span>
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <h2 className="text-lg font-bold leading-tight text-white">
                  {p.name}
                </h2>
                {p.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-white/70">
                    {p.description}
                  </p>
                )}
                <p className="mt-2 text-sm font-bold text-terracotta">
                  {priceLabel(
                    p.priceMode,
                    effectivePriceCents(p),
                    hasPromoPrice(p) ? p.priceCents : null,
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Desktop — grade */}
        <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
          {cards.map((p) => (
            <Link
              key={p.id}
              href={`/${storeSlug}/produto/${p.slug}`}
              onClick={() =>
                trackStoreEvent({
                  storeSlug,
                  type: "PRODUCT_CLICK",
                  productId: p.id,
                })
              }
              className="group relative aspect-[16/11] overflow-hidden rounded-xl bg-cocoa shadow-[0_12px_36px_rgba(51,37,34,0.12)] ring-1 ring-cocoa/10 transition hover:ring-rosewood/40"
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-cocoa to-cocoa-soft" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              <span className="absolute left-4 top-4 rounded bg-rosewood px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                Destaque
              </span>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h2 className="font-display text-2xl leading-tight text-white">
                  {p.name}
                </h2>
                {p.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-white/70">
                    {p.description}
                  </p>
                )}
                <p className="mt-3 text-base font-bold text-terracotta">
                  {priceLabel(
                    p.priceMode,
                    effectivePriceCents(p),
                    hasPromoPrice(p) ? p.priceCents : null,
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
