import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
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
  const order = await Order.findOne({
    _id: id,
    storeId: session.user.storeId,
  }).lean();
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const updated = await Order.findOneAndUpdate(
    { _id: id, storeId: session.user.storeId },
    { $set: { status } },
    { new: true },
  ).lean();

  return NextResponse.json(withIds(updated));
}
