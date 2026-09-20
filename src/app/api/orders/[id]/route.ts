import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import {
  maybeDeductStockForOrder,
  maybeRestoreStockForOrder,
  shouldDeductStockOnStatus,
  shouldRestoreStockOnStatus,
} from "@/lib/stock-order";
import { Order } from "@/models/Order";
import { z } from "zod";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = z
    .object({
      status: z.enum([
        "NEW",
        "REVIEWING",
        "CONFIRMED",
        "IN_PRODUCTION",
        "READY",
        "DELIVERED",
        "CANCELLED",
      ]),
    })
    .parse(await req.json());

  await connectDB();
  const storeId = session.user.storeId;
  const order = await Order.findOne({
    _id: id,
    storeId,
  }).lean();
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const updated = await Order.findOneAndUpdate(
    { _id: id, storeId },
    { $set: { status } },
    { new: true },
  ).lean();

  if (shouldDeductStockOnStatus(order.status, status)) {
    void maybeDeductStockForOrder({
      orderId: id,
      storeId,
      reason: "confirm",
    }).catch((err) => console.error("[stock:deduct]", err));
  } else if (shouldRestoreStockOnStatus(order.status, status)) {
    void maybeRestoreStockForOrder({
      orderId: id,
      storeId,
    }).catch((err) => console.error("[stock:restore]", err));
  }

  return NextResponse.json(withIds(updated));
}
