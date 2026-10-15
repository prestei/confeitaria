import type { PromotionDoc } from "@/models/Promotion";

export type PromoCartItem = {
  productId?: string | null;
  unitPriceCents: number;
  quantity: number;
  priceMode?: string;
};

export type PromoValidation =
  | { ok: true; promotion: PromotionDoc; discountCents: number }
  | { ok: false; error: string };

function eligibleSubtotalCents(
  promo: PromotionDoc,
  items: PromoCartItem[],
): number {
  const scoped = promo.productIds?.length
    ? items.filter(
        (i) => i.productId && promo.productIds.includes(i.productId),
      )
    : items;

  return scoped
    .filter((i) => i.priceMode !== "QUOTE")
    .reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
}

export function computeDiscountCents(
  promo: PromotionDoc,
  items: PromoCartItem[],
): number {
  const base = eligibleSubtotalCents(promo, items);
  if (base <= 0) return 0;

  if (promo.type === "PERCENT") {
    const pct = Math.min(100, Math.max(0, promo.percentOff ?? 0));
    return Math.min(base, Math.round((base * pct) / 100));
  }

  if (promo.type === "FIXED" || promo.type === "PRODUCT") {
    const amount = Math.max(0, promo.amountOffCents ?? 0);
    return Math.min(base, amount);
  }

  return 0;
}

export function validatePromotion(
  promo: PromotionDoc | null | undefined,
  items: PromoCartItem[],
  now = new Date(),
): PromoValidation {
  if (!promo || !promo.active) {
    return { ok: false, error: "Cupom inválido ou inativo" };
  }
  if (!promo.code) {
    return { ok: false, error: "Cupom inválido" };
  }
  if (promo.startsAt && now < new Date(promo.startsAt)) {
    return { ok: false, error: "Este cupom ainda não está válido" };
  }
  if (promo.endsAt && now > new Date(promo.endsAt)) {
    return { ok: false, error: "Este cupom expirou" };
  }
  if (
    promo.usageLimit != null &&
    promo.usageLimit > 0 &&
    promo.usageCount >= promo.usageLimit
  ) {
    return { ok: false, error: "Este cupom atingiu o limite de usos" };
  }

  const discountCents = computeDiscountCents(promo, items);
  if (discountCents <= 0) {
    return {
      ok: false,
      error: promo.productIds?.length
        ? "Cupom não se aplica aos itens do carrinho"
        : "Cupom não gera desconto neste pedido",
    };
  }

  return { ok: true, promotion: promo, discountCents };
}
