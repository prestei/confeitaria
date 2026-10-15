import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Product } from "@/models/Product";
import { StockItem } from "@/models/StockItem";

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  unit: z.string().min(1).optional(),
  unitCostCents: z.number().int().nonnegative().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const data = patchSchema.parse(await req.json());
  await connectDB();
  const storeId = session.user.storeId;
  const item = await StockItem.findOne({ _id: id, storeId }).lean();
  if (!item) {
    return NextResponse.json({ error: "Item não encontrado" }, { status: 404 });
  }

  const updated = await StockItem.findOneAndUpdate(
    { _id: id, storeId },
    {
      $set: {
        ...(data.name != null ? { name: data.name.trim() } : {}),
        ...(data.unit != null ? { unit: data.unit.trim() } : {}),
        ...(data.unitCostCents !== undefined
          ? { unitCostCents: data.unitCostCents }
          : {}),
      },
    },
    { new: true },
  ).lean();

  return NextResponse.json(withIds(updated));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const { id } = await params;
  await connectDB();
  const used = await Product.exists({
    storeId: session.user.storeId,
    "recipe.stockItemId": id,
  });
  if (used) {
    return NextResponse.json(
      { error: "Este insumo está na receita de um produto" },
      { status: 400 },
    );
  }
  await StockItem.deleteOne({ _id: id, storeId: session.user.storeId });
  return NextResponse.json({ ok: true });
}
