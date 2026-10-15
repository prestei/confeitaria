import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { applyCategoryPriceAdjust } from "@/lib/category";
import { Category } from "@/models/Category";
import { Product, type ProductDoc } from "@/models/Product";

export class CheckoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckoutError";
  }
}

type IncomingItem = {
  productId?: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  priceMode: "FIXED" | "FROM" | "QUOTE";
  customizations?: Record<string, string | number | string[]>;
};

export type ResolvedLine = {
  productId: string | null;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  priceMode: "FIXED" | "FROM" | "QUOTE";
  customizations: Record<string, string | number | string[]> | null;
};

function addonQty(label: string, addonName: string) {
  const match = label.match(/^(\d+)x\s+(.+)$/);
  if (!match || match[2] !== addonName) return 0;
  const qty = Number(match[1]);
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
}

function catalogUnitCents(
  product: ProductDoc,
  customizations: IncomingItem["customizations"],
  category: { discountPercent?: number; surchargePercent?: number } | null,
) {
  if (product.priceMode === "QUOTE") return 0;
  let base = product.priceCents ?? 0;
  if (category && (category.discountPercent || category.surchargePercent)) {
    base =
      applyCategoryPriceAdjust(base, {
        discountPercent: category.discountPercent ?? 0,
        surchargePercent: category.surchargePercent ?? 0,
      }) ?? base;
  }

  let extra = 0;
  const custom = customizations ?? {};
  for (const group of product.optionGroups ?? []) {
    const chosen = custom[group.name];
    if (typeof chosen !== "string") continue;
    const option = group.options?.find((opt) => opt.name === chosen);
    if (option) extra += option.priceDeltaCents || 0;
  }
  const addons = custom["Adicionais"];
  if (Array.isArray(addons)) {
    for (const addon of product.addons ?? []) {
      for (const label of addons) {
        if (typeof label !== "string") continue;
        extra += (addon.priceCents || 0) * addonQty(label, addon.name);
      }
    }
  }
  return Math.max(0, base + extra);
}

/** Prices and names come from the store catalog, never from the client payload. */
export async function resolveCheckoutLines(
  storeId: string,
  items: IncomingItem[],
): Promise<ResolvedLine[]> {
  const ids = [
    ...new Set(items.map((item) => item.productId).filter((id): id is string => !!id)),
  ];
  const products = ids.length
    ? await Product.find({ _id: { $in: ids }, storeId }).lean()
    : [];
  const byId = new Map(products.map((product) => [String(product._id), product]));

  const categoryIds = [
    ...new Set(
      products
        .map((product) => product.categoryId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds }, storeId })
        .select({ discountPercent: 1, surchargePercent: 1 })
        .lean()
    : [];
  const catMap = new Map(categories.map((cat) => [String(cat._id), cat]));

  const lines: ResolvedLine[] = [];
  for (const item of items) {
    if (!item.productId) {
      if (item.priceMode !== "QUOTE") {
        throw new CheckoutError(
          "Não foi possível identificar um dos produtos do pedido.",
        );
      }
      lines.push({
        productId: null,
        productName: item.productName.trim().slice(0, 120) || "Encomenda",
        quantity: item.quantity,
        unitPriceCents: 0,
        lineTotalCents: 0,
        priceMode: "QUOTE",
        customizations: item.customizations ?? null,
      });
      continue;
    }

    const product = byId.get(item.productId);
    if (!product || product.active === false || product.showOnStorefront === false) {
      throw new CheckoutError(
        `"${item.productName}" não está disponível nesta loja.`,
      );
    }
    if (
      product.availability === "SOLD_OUT" ||
      (product.trackStock && product.stockQty <= 0)
    ) {
      throw new CheckoutError(`"${product.name}" está esgotado.`);
    }

    const unitPriceCents = catalogUnitCents(
      product,
      item.customizations,
      product.categoryId ? (catMap.get(product.categoryId) ?? null) : null,
    );
    lines.push({
      productId: String(product._id),
      productName: product.name,
      quantity: item.quantity,
      unitPriceCents,
      lineTotalCents: unitPriceCents * item.quantity,
      priceMode: product.priceMode,
      customizations: item.customizations ?? null,
    });
  }
  return lines;
}

/** Same cart + phone inside a short window collapses a double submit. */
export function checkoutFingerprint(
  phone: string,
  lines: ResolvedLine[],
  eventDate?: string,
  eventTime?: string,
) {
  const bucket = Math.floor(Date.now() / 20_000);
  const signature = lines
    .map(
      (line) =>
        `${line.productId ?? line.productName}:${line.quantity}:${line.unitPriceCents}`,
    )
    .sort()
    .join("|");
  const hash = createHash("sha256")
    .update(`${phone}|${eventDate ?? ""}|${eventTime ?? ""}|${signature}`)
    .digest("hex")
    .slice(0, 24);
  return `${bucket}:${hash}`;
}

function isDuplicateKey(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

/** Insert-only lock so two identical checkouts cannot both create an order. */
export async function claimCheckoutSlot(storeId: string, checkoutKey: string) {
  try {
    await mongoose.connection.collection("checkout_locks").insertOne({
      _id: `${storeId}:${checkoutKey}` as unknown as import("mongodb").ObjectId,
      storeId,
      createdAt: new Date(),
    });
    return true;
  } catch (error) {
    if (isDuplicateKey(error)) return false;
    throw error;
  }
}

export async function releaseCheckoutSlot(storeId: string, checkoutKey: string) {
  await mongoose.connection
    .collection("checkout_locks")
    .deleteOne({
      _id: `${storeId}:${checkoutKey}` as unknown as import("mongodb").ObjectId,
    });
}
