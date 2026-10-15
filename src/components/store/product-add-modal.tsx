"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ProductConfigurator } from "@/components/store/product-configurator";
import { useToast } from "@/components/ui/toast";
import type { PriceMode, ProductType } from "@/lib/enums";
import type { ResolvedAddon } from "@/lib/addons";

type ProductOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
  sortOrder: number;
};

type OptionGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: ProductOption[];
};

type Addon = ResolvedAddon;

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productType: ProductType;
  priceMode: PriceMode;
  priceCents: number | null;
  promoPriceCents?: number | null;
  kitContents: string | null;
  minAdvanceDays: number | null;
  trackStock?: boolean;
  stockQty?: number;
  unit?: string;
  availability?: string;
  optionGroups: OptionGroup[];
  addons: Addon[];
};

export function ProductAddModal({
  open,
  onOpenChange,
  storeSlug,
  productSlug,
  storeOpen = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeSlug: string;
  productSlug: string | null;
  storeOpen?: boolean;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [minAdvanceDays, setMinAdvanceDays] = useState(2);

  useEffect(() => {
    if (!open || !productSlug) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setProduct(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/store/product?storeSlug=${encodeURIComponent(storeSlug)}&productSlug=${encodeURIComponent(productSlug)}`,
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Falha ao carregar");
        if (cancelled) return;
        setProduct(data.product);
        setMinAdvanceDays(data.minAdvanceDays ?? 2);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Erro ao carregar produto");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, productSlug, storeSlug]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="lg"
        className="flex !max-h-[min(92vh,860px)] !max-w-[52rem] min-h-0 flex-col !overflow-hidden !rounded-2xl !bg-surface !p-0 shadow-[0_24px_80px_rgba(51,37,34,0.22)]"
        closeClassName="!right-3 !top-3 z-20 rounded-full bg-surface/90 text-cocoa shadow-sm ring-1 ring-cocoa/10 backdrop-blur-sm hover:!bg-sand hover:!text-rosewood-deep sm:!right-4 sm:!top-4"
      >
        {loading && (
          <div className="grid flex-1 md:grid-cols-2">
            <div className="aspect-[16/11] animate-pulse bg-sand md:aspect-auto md:min-h-[22rem]" />
            <div className="space-y-4 p-6">
              <div className="h-3 w-28 animate-pulse rounded bg-sand" />
              <div className="h-8 w-4/5 animate-pulse rounded bg-sand" />
              <div className="h-4 w-full animate-pulse rounded bg-sand" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-sand" />
              <div className="mt-6 h-24 animate-pulse rounded-xl bg-sand" />
              <div className="h-12 animate-pulse rounded-xl bg-sand" />
            </div>
          </div>
        )}
        {error && (
          <p className="px-6 py-16 text-center text-sm text-danger">{error}</p>
        )}
        {!loading && !error && product && (
          <ProductConfigurator
            key={product.id}
            storeSlug={storeSlug}
            product={product}
            minAdvanceDays={minAdvanceDays}
            storeOpen={storeOpen}
            compact
            onSuccess={() => {
              onOpenChange(false);
              toast({
                title: "Adicionado ao pedido",
                description: product.name,
                tone: "success",
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
