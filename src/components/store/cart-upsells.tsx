"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/utils";
import { UPSELL_SOURCE } from "@/lib/addons";

type UpsellAddon = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
};

type UpsellProduct = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  productType: string;
  priceMode: "FIXED" | "FROM" | "QUOTE";
  priceCents: number;
};

export function CartUpsells({ storeSlug }: { storeSlug: string }) {
  const { items, addItem } = useCart();
  const [addons, setAddons] = useState<UpsellAddon[]>([]);
  const [products, setProducts] = useState<UpsellProduct[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/upsells?slug=${encodeURIComponent(storeSlug)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setAddons(json.addons || []);
        setProducts(json.products || []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storeSlug]);

  const inCartNames = useMemo(
    () => new Set(items.map((i) => i.productName.trim().toLowerCase())),
    [items],
  );
  const inCartIds = useMemo(
    () => new Set(items.map((i) => i.productId).filter(Boolean)),
    [items],
  );
  const inCartAddons = useMemo(
    () => new Set(items.map((i) => i.addonId).filter(Boolean)),
    [items],
  );

  const addonOffers = addons.filter(
    (a) =>
      !inCartAddons.has(a.id) &&
      !inCartNames.has(a.name.trim().toLowerCase()),
  );
  const productOffers = products.filter(
    (p) => !inCartIds.has(p.id) && !inCartNames.has(p.name.trim().toLowerCase()),
  );

  if (!addonOffers.length && !productOffers.length) return null;

  function addAddon(addon: UpsellAddon) {
    addItem({
      productId: "",
      productName: addon.name,
      productType: "READY",
      quantity: 1,
      unitPriceCents: addon.priceCents,
      priceMode: "FIXED",
      imageUrl: addon.imageUrl,
      source: UPSELL_SOURCE,
      addonId: addon.id,
      customizations: {
        __source: UPSELL_SOURCE,
        __addonId: addon.id,
        Extra: addon.name,
      },
    });
  }

  function addProduct(product: UpsellProduct) {
    addItem({
      productId: product.id,
      productName: product.name,
      productType: product.productType,
      quantity: 1,
      unitPriceCents: product.priceCents,
      priceMode: product.priceMode,
      imageUrl: product.imageUrl,
      source: "UPSELL",
    });
  }

  return (
    <div className="mt-5 rounded-2xl border border-rosewood/20 bg-blush/30 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-cocoa">
        <Sparkles className="h-4 w-4 text-rosewood" />
        Que tal complementar o pedido?
      </p>
      <p className="mt-1 text-xs text-cocoa-soft">
        Que tal adicionar velas decorativas, topo de bolo impresso ou uma
        embalagem para presente por mais alguns reais?
      </p>
      <ul className="mt-4 space-y-2">
        {addonOffers.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-cocoa/8 bg-surface px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cocoa">
                {a.name}
              </p>
              <p className="text-xs text-cocoa-soft">
                por mais {formatBRL(a.priceCents)}
                {a.description ? ` · ${a.description}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg bg-rosewood px-3 py-1.5 text-xs font-bold text-white"
              onClick={() => addAddon(a)}
            >
              Adicionar
            </button>
          </li>
        ))}
        {productOffers.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-cocoa/8 bg-surface px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-cocoa">
                {p.name}
              </p>
              <p className="text-xs text-cocoa-soft">
                por mais {formatBRL(p.priceCents)}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg bg-rosewood px-3 py-1.5 text-xs font-bold text-white"
              onClick={() => addProduct(p)}
            >
              Adicionar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
