"use client";

import { useEffect } from "react";
import { ProductConfigurator } from "@/components/store/product-configurator";
import { trackStoreEvent } from "@/lib/analytics";
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
  featured?: boolean;
  trackStock?: boolean;
  stockQty?: number;
  unit?: string;
  availability?: string;
  optionGroups: OptionGroup[];
  addons: Addon[];
};

export function ProductPageClient({
  storeSlug,
  product,
  minAdvanceDays,
  storeOpen = true,
}: {
  storeSlug: string;
  product: ProductDetail;
  minAdvanceDays: number;
  storeOpen?: boolean;
}) {
  useEffect(() => {
    trackStoreEvent({
      storeSlug,
      type: "PRODUCT_VIEW",
      productId: product.id,
      once: true,
      onceExtra: product.slug,
    });
  }, [storeSlug, product.id, product.slug]);

  return (
    <ProductConfigurator
      storeSlug={storeSlug}
      product={product}
      minAdvanceDays={minAdvanceDays}
      storeOpen={storeOpen}
    />
  );
}
