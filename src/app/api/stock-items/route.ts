import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { StockItem } from "@/models/StockItem";

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const items = await StockItem.find({ storeId: session.user.storeId })
    .sort({ name: 1 })
    .lean();
  return NextResponse.json(withIds(items));
}

const createSchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(1).default("un"),
  unitCostCents: z.number().int().nonnegative().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const data = createSchema.parse(await req.json());
    await connectDB();
    const item = await StockItem.create({
      storeId: session.user.storeId,
      name: data.name.trim(),
      unit: data.unit.trim() || "un",
      quantity: 0,
      minQuantity: 0,
      unitCostCents: data.unitCostCents ?? null,
    });
    return NextResponse.json(withIds(item.toObject()), { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar item" }, { status: 500 });
  }
}
