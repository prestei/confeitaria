"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { AVAILABILITY_LABELS, formatBRL } from "@/lib/utils";
import { effectivePriceCents, hasPromoPrice } from "@/lib/pricing";
import type { Availability, PriceMode, ProductType } from "@/lib/enums";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { ProductAddModal } from "@/components/store/product-add-modal";
import { trackStoreEvent } from "@/lib/analytics";

export function priceLabel(
  mode: PriceMode,
  cents: number | null,
  listCents?: number | null,
) {
  if (mode === "QUOTE" || cents == null) return "Solicitar orçamento";
  if (mode === "FROM") return `A partir de ${formatBRL(cents)}`;
  if (listCents != null && listCents > cents) {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-1.5">
        <span className="text-[0.85em] font-medium text-cocoa-soft/55 line-through">
          {formatBRL(listCents)}
        </span>
        <span>{formatBRL(cents)}</span>
      </span>
    );
  }
  return formatBRL(cents);
}

function stockLabel(product: {
  trackStock?: boolean;
  stockQty?: number;
  unit?: string;
  availability: Availability;
}) {
  if (!product.trackStock) {
    return AVAILABILITY_LABELS[product.availability];
  }
  const qty = product.stockQty ?? 0;
  const unit = product.unit || "un";
  if (qty <= 0 || product.availability === "SOLD_OUT") {
    return "Esgotado";
  }
  if (qty === 1) return `1 ${unit} disponível`;
  return `${qty} ${unit} disponíveis`;
}

export function ProductCard({
  storeSlug,
  product,
  storeOpen = true,
}: {
  storeSlug: string;
  product: {
    id?: string;
    slug: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    productType: ProductType;
    priceMode: PriceMode;
    priceCents: number | null;
    promoPriceCents?: number | null;
    availability: Availability;
    featured: boolean;
    trackStock?: boolean;
    stockQty?: number;
    unit?: string;
  };
  /** When false, SCHEDULED_DAYS products become unavailable. */
  storeOpen?: boolean;
}) {
  const reduced = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);
  const [open, setOpen] = useState(false);

  const sellCents = effectivePriceCents(product);
  const listCents = hasPromoPrice(product) ? product.priceCents : null;
  const displayPrice = priceLabel(product.priceMode, sellCents, listCents);

  const addLabel =
    product.priceMode === "QUOTE"
      ? "Pedir orçamento"
      : "Adicionar";

  const scheduledClosed =
    product.availability === "SCHEDULED_DAYS" && !storeOpen;
  const availabilityText = scheduledClosed
    ? "Indisponível agora"
    : stockLabel(product);
  const soldOut =
    product.availability === "SOLD_OUT" ||
    scheduledClosed ||
    (product.trackStock && (product.stockQty ?? 0) <= 0);

  function openProduct() {
    setOpen(true);
    trackStoreEvent({
      storeSlug,
      type: "PRODUCT_CLICK",
      productId: product.id ?? null,
    });
    trackStoreEvent({
      storeSlug,
      type: "PRODUCT_VIEW",
      productId: product.id ?? null,
      once: true,
      onceExtra: product.slug,
    });
  }

  return (
    <>
      {/* Mobile */}
      <div className="flex items-start gap-3 border-b border-sky/15 py-3.5 last:border-b-0 md:hidden">
        <button
          type="button"
          onClick={openProduct}
          className="min-w-0 flex-1 pt-0.5 text-left active:opacity-80"
        >
          <h3 className="text-[15px] font-semibold leading-snug text-cocoa">
            {product.name}
          </h3>
          {product.description && (
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-cocoa-soft/65">
              {product.description}
            </p>
          )}
          <p className="mt-2 text-sm font-bold text-sky-deep">
            {displayPrice}
          </p>
          <p
            className={`mt-1 text-[11px] font-medium ${
              soldOut ? "text-rosewood" : "text-sky/80"
            }`}
          >
            {availabilityText}
          </p>
        </button>
        <div className="relative shrink-0">
          <button type="button" onClick={openProduct} className="block">
            <div className="h-[5.5rem] w-[5.5rem] overflow-hidden rounded-xl bg-baby-soft ring-1 ring-sky/20">
              {product.imageUrl && !imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-sky-deep/60">
                  Foto
                </div>
              )}
            </div>
          </button>
          {!soldOut && (
            <button
              type="button"
              onClick={openProduct}
              className="absolute -bottom-1.5 -right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-rosewood text-white shadow-md ring-2 ring-ivory transition hover:bg-rosewood-deep"
              aria-label={`Adicionar ${product.name}`}
            >
              <Plus className="h-4 w-4" strokeWidth={2.75} />
            </button>
          )}
        </div>
      </div>

      {/* Desktop */}
      <motion.article
        className="hidden overflow-hidden rounded-2xl border border-sky/20 bg-surface shadow-[0_8px_28px_rgba(106,155,184,0.08)] transition duration-300 hover:border-sky/40 hover:shadow-[0_16px_40px_rgba(106,155,184,0.16)] md:flex md:flex-col"
        whileHover={reduced ? undefined : { y: -4 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type="button"
          onClick={openProduct}
          className="group relative block w-full text-left"
        >
          <div className="relative aspect-[4/3] overflow-hidden bg-baby-soft">
            {product.imageUrl && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-sky-deep/50">
                Sem imagem
              </div>
            )}
            {product.featured && (
              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-deep shadow-sm">
                Destaque
              </span>
            )}
          </div>
          <div className="p-4 pb-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-[1.35rem] leading-tight text-cocoa">
                {product.name}
              </h3>
              <p className="shrink-0 rounded-full bg-baby px-2.5 py-1 text-sm font-bold text-sky-deep">
                {displayPrice}
              </p>
            </div>
            {product.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-cocoa-soft">
                {product.description}
              </p>
            )}
          </div>
        </button>

        <div className="mt-auto space-y-3 p-4 pt-3">
          {!soldOut ? (
            <motion.button
              type="button"
              onClick={openProduct}
              whileHover={reduced ? undefined : { y: -1 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rosewood px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(185,111,125,0.28)] transition hover:bg-rosewood-deep"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              {addLabel}
            </motion.button>
          ) : (
            <div className="inline-flex w-full items-center justify-center rounded-xl border border-cocoa/10 bg-sand/40 px-4 py-2.5 text-sm font-semibold text-cocoa-soft">
              Indisponível
            </div>
          )}
          <p
            className={`text-[11px] font-medium uppercase tracking-[0.12em] ${
              soldOut ? "text-rosewood" : "text-sky/80"
            }`}
          >
            {availabilityText}
          </p>
        </div>
      </motion.article>

      <ProductAddModal
        open={open}
        onOpenChange={setOpen}
        storeSlug={storeSlug}
        productSlug={open ? product.slug : null}
        storeOpen={storeOpen}
      />
    </>
  );
}
