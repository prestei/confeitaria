import type { PriceMode } from "@/lib/enums";
import { addonsTotalCents } from "@/lib/addons";

type Priceable = {
  priceCents?: number | null;
  promoPriceCents?: number | null;
  priceMode?: PriceMode | string | null;
};

/** List price for display (strikethrough when promo is active). */
export function listPriceCents(product: Priceable): number | null {
  if (product.priceMode === "QUOTE") return null;
  return product.priceCents ?? null;
}

/**
 * Effective sell price: promo when set and strictly below list; otherwise list.
 * QUOTE products return null.
 */
export function effectivePriceCents(product: Priceable): number | null {
  if (product.priceMode === "QUOTE") return null;
  const list = product.priceCents ?? null;
  const promo = product.promoPriceCents ?? null;
  if (promo != null && promo >= 0 && (list == null || promo < list)) {
    return promo;
  }
  return list;
}

export function hasPromoPrice(product: Priceable): boolean {
  const list = product.priceCents ?? null;
  const promo = product.promoPriceCents ?? null;
  return promo != null && promo >= 0 && list != null && promo < list;
}

type OptionLike = { name: string; priceDeltaCents: number };
type GroupLike = { name: string; options: OptionLike[] };
type AddonLike = { name: string; priceCents: number; maxQty?: number };

type ProductForLine = Priceable & {
  optionGroups?: GroupLike[];
  addons?: AddonLike[];
};

/**
 * Recomputes a line unit price from the product + customization names
 * (as stored by the storefront configurator).
 */
export function computeUnitPriceCents(
  product: ProductForLine,
  customizations: Record<string, string | number | string[]> | null | undefined,
  priceMode: string,
): number {
  if (priceMode === "QUOTE") return 0;

  let unit = effectivePriceCents(product) ?? 0;
  const custom = customizations ?? {};

  for (const g of product.optionGroups ?? []) {
    const selectedName = custom[g.name];
    if (typeof selectedName !== "string") continue;
    const opt = g.options.find((o) => o.name === selectedName);
    if (opt) unit += opt.priceDeltaCents;
  }

  unit += addonsTotalCents(product.addons ?? [], custom);

  return Math.max(0, unit);
}
