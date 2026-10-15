import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { StockItem } from "@/models/StockItem";
import { StockMovement } from "@/models/StockMovement";

const bodySchema = z.object({
  stockItemId: z.string(),
  type: z.enum(["IN", "OUT", "ADJUST"]),
  quantity: z.number().min(0),
  note: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = bodySchema.parse(await req.json());
  if (
    (data.type === "IN" || data.type === "OUT") &&
    data.quantity <= 0
  ) {
    return NextResponse.json(
      { error: "Informe uma quantidade maior que zero" },
      { status: 400 },
    );
  }
  await connectDB();
  const storeId = session.user.storeId;

  const item = await StockItem.findOne({
    _id: data.stockItemId,
    storeId,
  }).lean();
  if (!item) {
    return NextResponse.json({ error: "Insumo não encontrado" }, { status: 404 });
  }

  let nextQty = item.quantity;
  if (data.type === "IN") nextQty += data.quantity;
  else if (data.type === "OUT") nextQty = Math.max(0, nextQty - data.quantity);
  else nextQty = data.quantity;

  const [movement, updated] = await Promise.all([
    StockMovement.create({
      storeId,
      stockItemId: String(item._id),
      productId: null,
      type: data.type,
      quantity: data.quantity,
      note: data.note?.trim() || null,
    }),
    StockItem.findOneAndUpdate(
      { _id: item._id, storeId },
      { $set: { quantity: nextQty } },
      { new: true },
    ).lean(),
  ]);

  return NextResponse.json({
    movement: withIds(movement.toObject()),
    item: withIds(updated),
  });
}
