import { Order, type OrderDoc, type OrderItemDoc } from "@/models/Order";
import { Product } from "@/models/Product";
import { StockMovement } from "@/models/StockMovement";
import { Store } from "@/models/Store";
import { maybeNotifyLowStockTransition } from "@/lib/notify";

const ACCEPTED_STATUSES = new Set([
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
  "DELIVERED",
]);

function qtyByProduct(items: OrderItemDoc[]) {
  const map = new Map<string, { name: string; quantity: number }>();
  for (const item of items) {
    if (!item.productId) continue;
    const prev = map.get(item.productId);
    if (prev) {
      prev.quantity += item.quantity;
    } else {
      map.set(item.productId, {
        name: item.productName,
        quantity: item.quantity,
      });
    }
  }
  return map;
}

async function applyAvailability(productId: string, nextQty: number, trackStock: boolean) {
  if (!trackStock) return;
  if (nextQty <= 0) {
    await Product.updateOne(
      { _id: productId },
      { $set: { availability: "SOLD_OUT" } },
    );
    return;
  }
  await Product.updateOne(
    { _id: productId, availability: "SOLD_OUT" },
    { $set: { availability: "AVAILABLE" } },
  );
}

export type StockDeductResult = {
  deducted: boolean;
  shortage?: string;
};

/** Deducts stock once per order when auto-deduct is enabled. */
export async function maybeDeductStockForOrder(input: {
  orderId: string;
  storeId: string;
  reason: "confirm" | "pay";
}): Promise<StockDeductResult> {
  const store = await Store.findOne({ _id: input.storeId })
    .select({ autoDeductStock: 1 })
    .lean();
  // Default ON when field is missing (legacy stores).
  if (store?.autoDeductStock === false) return { deducted: false };

  const current = await Order.findOne({
    _id: input.orderId,
    storeId: input.storeId,
  })
    .select({ status: 1 })
    .lean();
  if (!current) return { deducted: false };
  if (input.reason === "confirm" && !ACCEPTED_STATUSES.has(current.status)) {
    return { deducted: false };
  }

  const claimed = await Order.findOneAndUpdate(
    {
      _id: input.orderId,
      storeId: input.storeId,
      stockDeducted: { $ne: true },
    },
    { $set: { stockDeducted: true } },
    { returnDocument: "before" },
  ).lean();

  if (!claimed) return { deducted: false };

  const items = qtyByProduct(claimed.items ?? []);
  if (items.size === 0) return { deducted: true };

  const products = await Product.find({
    _id: { $in: [...items.keys()] },
    storeId: input.storeId,
    trackStock: true,
  }).lean();

  const note =
    input.reason === "pay"
      ? `Baixa automática — pagamento do pedido ${input.orderId.slice(0, 8)}`
      : `Baixa automática — confirmação do pedido ${input.orderId.slice(0, 8)}`;

  const applied: { id: string; quantity: number }[] = [];

  for (const product of products) {
    const line = items.get(String(product._id));
    if (!line || line.quantity <= 0) continue;

    const updated = await Product.findOneAndUpdate(
      {
        _id: product._id,
        storeId: input.storeId,
        stockQty: { $gte: line.quantity },
      },
      { $inc: { stockQty: -line.quantity } },
      { returnDocument: "after" },
    ).lean();

    if (!updated) {
      for (const row of applied) {
        await Product.updateOne(
          { _id: row.id, storeId: input.storeId },
          { $inc: { stockQty: row.quantity } },
        );
      }
      await Order.updateOne(
        { _id: input.orderId, storeId: input.storeId },
        { $set: { stockDeducted: false } },
      );
      return {
        deducted: false,
        shortage: `Estoque insuficiente para "${product.name}".`,
      };
    }

    applied.push({ id: String(product._id), quantity: line.quantity });
    const nextQty = updated.stockQty;
    await Promise.all([
      StockMovement.create({
        storeId: input.storeId,
        productId: String(product._id),
        type: "OUT",
        quantity: line.quantity,
        note,
      }),
      applyAvailability(String(product._id), nextQty, true),
    ]);

    void maybeNotifyLowStockTransition({
      storeId: input.storeId,
      productName: product.name,
      previousQty: product.stockQty,
      nextQty,
      stockMin: product.stockMin,
      trackStock: true,
    }).catch((err) => console.error("[notify:stock]", err));
  }

  return { deducted: true };
}

/** Restores stock previously deducted when an order is cancelled. */
export async function maybeRestoreStockForOrder(input: {
  orderId: string;
  storeId: string;
}): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    {
      _id: input.orderId,
      storeId: input.storeId,
      stockDeducted: true,
    },
    { $set: { stockDeducted: false } },
    { returnDocument: "before" },
  ).lean();

  if (!claimed) return false;

  const items = qtyByProduct(claimed.items ?? []);
  if (items.size === 0) return true;

  const products = await Product.find({
    _id: { $in: [...items.keys()] },
    storeId: input.storeId,
    trackStock: true,
  }).lean();

  const note = `Estorno de estoque — cancelamento do pedido ${input.orderId.slice(0, 8)}`;

  for (const product of products) {
    const line = items.get(String(product._id));
    if (!line || line.quantity <= 0) continue;

    const updated = await Product.findOneAndUpdate(
      { _id: product._id, storeId: input.storeId },
      { $inc: { stockQty: line.quantity } },
      { returnDocument: "after" },
    ).lean();
    const nextQty = updated?.stockQty ?? product.stockQty + line.quantity;

    await Promise.all([
      StockMovement.create({
        storeId: input.storeId,
        productId: String(product._id),
        type: "IN",
        quantity: line.quantity,
        note,
      }),
      applyAvailability(String(product._id), nextQty, true),
    ]);
  }

  await Order.updateOne(
    { _id: input.orderId, storeId: input.storeId },
    { $set: { recipeDeductions: [] } },
  );

  return true;
}

export function shouldDeductStockOnStatus(
  previous: OrderDoc["status"] | string,
  next: OrderDoc["status"] | string,
) {
  return !ACCEPTED_STATUSES.has(previous) && ACCEPTED_STATUSES.has(next);
}

export function shouldRestoreStockOnStatus(
  previous: OrderDoc["status"] | string,
  next: OrderDoc["status"] | string,
) {
  return previous !== "CANCELLED" && next === "CANCELLED";
}
