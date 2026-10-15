"use client";

import { useEffect, useRef, useState } from "react";
import type { PriceMode, ProductType } from "@/lib/enums";
import { priceLabel } from "@/components/store/product-card";
import { ProductAddModal } from "@/components/store/product-add-modal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type FeaturedProduct = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  productType: ProductType;
  priceMode: PriceMode;
  priceCents: number | null;
};

const INTERVAL_MS = 4000;

export function StoreFeaturedBanners({
  storeSlug,
  products,
}: {
  storeSlug: string;
  products: FeaturedProduct[];
}) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const startX = useRef(0);
  const dragged = useRef(false);
  const count = products.length;

  useEffect(() => {
    if (count < 2 || paused || reduced || openSlug) return;
    const id = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count);
    }, INTERVAL_MS);
    return () => window.clearTimeout(id);
  }, [count, index, openSlug, paused, reduced]);

  if (!count) return null;

  const current = products[index] ?? products[0];

  function go(next: number) {
    setIndex((next + count) % count);
  }

  return (
    <section aria-roledescription="carrossel" aria-label="Destaques" className="mt-8">
      <div
        className="overflow-hidden rounded-2xl"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={() => setPaused(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
          onPointerDown={(event) => {
            if (event.pointerType === "mouse" && event.button !== 0) return;
            startX.current = event.clientX;
            dragged.current = false;
            setPaused(true);
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
            if (Math.abs(event.clientX - startX.current) > 8) dragged.current = true;
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            const delta = event.clientX - startX.current;
            if (delta > 48) go(index - 1);
            else if (delta < -48) go(index + 1);
            if (event.pointerType !== "mouse") setPaused(false);
            window.setTimeout(() => {
              dragged.current = false;
            }, 0);
          }}
          onPointerCancel={() => setPaused(false)}
        >
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-cocoa text-left"
              onClick={() => {
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                setOpenSlug(product.slug);
              }}
              aria-label={`${product.name}. ${priceLabel(product.priceMode, product.priceCents)}`}
            >
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-cocoa to-cocoa-soft" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rosewood">
                Destaque
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4">
                <h2 className="text-lg font-semibold leading-tight text-white">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-white/75">
                    {product.description}
                  </p>
                )}
                <p className="mt-2 text-sm font-bold text-white">
                  {priceLabel(product.priceMode, product.priceCents)}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" role="tablist" aria-label="Slides em destaque">
          {products.map((product, slide) => (
            <button
              key={product.id}
              type="button"
              role="tab"
              aria-selected={slide === index}
              aria-label={`Mostrar ${product.name}`}
              className={`h-1.5 rounded-full transition-all ${
                slide === index ? "w-5 bg-rosewood" : "w-1.5 bg-cocoa/20"
              }`}
              onClick={() => go(slide)}
            />
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {current.name}
      </p>

      <ProductAddModal
        open={openSlug != null}
        onOpenChange={(open) => {
          if (!open) setOpenSlug(null);
        }}
        storeSlug={storeSlug}
        productSlug={openSlug}
      />
    </section>
  );
}
