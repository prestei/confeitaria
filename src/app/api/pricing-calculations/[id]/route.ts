import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { calculateSuggestedPrice } from "@/lib/pricing";
import { withIds } from "@/lib/serialize";
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
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
    const doc = await PricingCalculation.findOneAndUpdate(
      { _id: id, storeId: session.user.storeId },
      {
        $set: {
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
        },
      },
      { new: true },
    ).lean();

    if (!doc) {
      return NextResponse.json({ error: "Cálculo não encontrado" }, { status: 404 });
    }
    return NextResponse.json(withIds(doc));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
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
  const result = await PricingCalculation.deleteOne({
    _id: id,
    storeId: session.user.storeId,
  });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: "Cálculo não encontrado" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
