import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { canTransitionStatus } from "@/lib/order-status";
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
  const body = z
    .object({
      status: z
        .enum([
          "NEW",
          "REVIEWING",
          "CONFIRMED",
          "IN_PRODUCTION",
          "READY",
          "DELIVERED",
          "CANCELLED",
        ])
        .optional(),
      amountPaidCents: z.number().int().nonnegative().optional(),
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

  const patch: { status?: string; amountPaidCents?: number } = {};
  if (body.status) patch.status = body.status;
  if (body.amountPaidCents != null) patch.amountPaidCents = body.amountPaidCents;
  if (!patch.status && patch.amountPaidCents == null) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  if (body.status && !canTransitionStatus(order.status, body.status)) {
    return NextResponse.json(
      { error: "Essa mudança de status não é permitida." },
      { status: 400 },
    );
  }

  const updated = await Order.findOneAndUpdate(
    { _id: id, storeId },
    { $set: patch },
    { returnDocument: "after" },
  ).lean();

  const status = body.status;
  if (status && shouldDeductStockOnStatus(order.status, status)) {
    try {
      const result = await maybeDeductStockForOrder({
        orderId: id,
        storeId,
        reason: "confirm",
      });
      if (result.shortage) {
        await Order.updateOne(
          { _id: id, storeId },
          { $set: { status: order.status } },
        );
        return NextResponse.json({ error: result.shortage }, { status: 400 });
      }
    } catch (err) {
      console.error("[stock:deduct]", err);
      await Order.updateOne(
        { _id: id, storeId },
        { $set: { status: order.status } },
      );
      return NextResponse.json(
        { error: "Não foi possível atualizar o estoque." },
        { status: 500 },
      );
    }
  } else if (status && shouldRestoreStockOnStatus(order.status, status)) {
    try {
      await maybeRestoreStockForOrder({
        orderId: id,
        storeId,
      });
    } catch (err) {
      console.error("[stock:restore]", err);
      await Order.updateOne(
        { _id: id, storeId },
        { $set: { status: order.status } },
      );
      return NextResponse.json(
        { error: "Não foi possível repor o estoque." },
        { status: 500 },
      );
    }
  }

  const fresh = await Order.findOne({ _id: id, storeId }).lean();
  return NextResponse.json(withIds(fresh ?? updated));
}
