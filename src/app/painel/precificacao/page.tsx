import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { PricingCalculation } from "@/models/PricingCalculation";
import { PageHeader } from "@/components/painel/page-header";
import {
  PricingCalculatorAdmin,
  type SavedCalculation,
} from "@/components/painel/pricing-calculator-admin";

export default async function PrecificacaoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const rows = leanList(
    await PricingCalculation.find({ storeId: session.storeId })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean(),
  );

  const initial: SavedCalculation[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    ingredientCostCents: row.ingredientCostCents,
    packagingCents: row.packagingCents,
    laborCents: row.laborCents,
    otherCents: row.otherCents,
    feePercent: row.feePercent,
    marginPercent: row.marginPercent,
    batchQty: row.batchQty,
    totalBatchCents: row.totalBatchCents,
    unitCostCents: row.unitCostCents,
    suggestedUnitPriceCents: row.suggestedUnitPriceCents,
    estimatedProfitPerUnitCents: row.estimatedProfitPerUnitCents,
    updatedAt: String(row.updatedAt),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Precificação"
        description="Estime custos e defina um preço de venda com margem e taxas. Salve os cálculos para consultar depois."
      />
      <PricingCalculatorAdmin initialCalculations={initial} />
    </div>
  );
}
