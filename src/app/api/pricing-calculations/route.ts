import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { calculateSuggestedPrice } from "@/lib/pricing";
import { leanList, withIds } from "@/lib/serialize";
import { PricingCalculation } from "@/models/PricingCalculation";

const bodySchema = z.object({
  name: z.string().min(1).max(120),
  ingredientCostCents: z.number().int().nonnegative(),
  packagingCents: z.number().int().nonnegative(),
  laborCents: z.number().int().nonnegative(),
  otherCents: z.number().int().nonnegative(),
  feePercent: z.number().min(0).max(99.99),
  marginPercent: z.number().min(0).max(99.99),
  batchQty: z.number().int().positive().max(100_000),
  linkedProductId: z.string().optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  await connectDB();
  const rows = leanList(
    await PricingCalculation.find({ storeId: session.user.storeId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),
  );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const data = bodySchema.parse(await req.json());
    const computed = calculateSuggestedPrice({
      ingredientCostCents: data.ingredientCostCents,
      packagingCents: data.packagingCents,
      laborCents: data.laborCents,
      otherCents: data.otherCents,
      feePercent: data.feePercent,
      marginPercent: data.marginPercent,
      batchQty: data.batchQty,
    });
    if (!computed.ok) {
      return NextResponse.json({ error: computed.error }, { status: 400 });
    }

    await connectDB();
    const doc = await PricingCalculation.create({
      storeId: session.user.storeId,
      name: data.name.trim(),
      ingredientCostCents: data.ingredientCostCents,
      packagingCents: data.packagingCents,
      laborCents: data.laborCents,
      otherCents: data.otherCents,
      feePercent: data.feePercent,
      marginPercent: data.marginPercent,
      batchQty: data.batchQty,
      totalBatchCents: computed.totalBatchCents,
      unitCostCents: computed.unitCostCents,
      suggestedUnitPriceCents: computed.suggestedUnitPriceCents,
      estimatedProfitPerUnitCents: computed.estimatedProfitPerUnitCents,
      linkedProductId: data.linkedProductId ?? null,
    });

    return NextResponse.json(withIds(doc.toObject()));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar cálculo" }, { status: 500 });
  }
}
