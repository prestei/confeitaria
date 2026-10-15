export type PricingInput = {
  ingredientCostCents: number;
  packagingCents: number;
  laborCents: number;
  otherCents: number;
  feePercent: number;
  marginPercent: number;
  batchQty: number;
};

export type PricingResult =
  | {
      ok: true;
      totalBatchCents: number;
      unitCostCents: number;
      suggestedUnitPriceCents: number;
      marginPercent: number;
      feePercent: number;
      estimatedProfitPerUnitCents: number;
    }
  | { ok: false; error: string };

/** Preço de venda = custo unitário ÷ (1 − margem − taxas), com margem e taxas em decimal. */
export function calculateSuggestedPrice(input: PricingInput): PricingResult {
  const batchQty = input.batchQty > 0 ? input.batchQty : 1;
  const costs = [
    input.ingredientCostCents,
    input.packagingCents,
    input.laborCents,
    input.otherCents,
  ];
  if (costs.some((c) => c < 0)) {
    return { ok: false, error: "Custos não podem ser negativos." };
  }

  const totalBatchCents = costs.reduce((sum, c) => sum + c, 0);
  const unitCostCents = Math.round(totalBatchCents / batchQty);

  const margin = input.marginPercent / 100;
  const fees = input.feePercent / 100;
  if (margin < 0 || fees < 0) {
    return { ok: false, error: "Margem e taxas devem ser zero ou positivas." };
  }
  if (margin + fees >= 1) {
    return {
      ok: false,
      error: "A soma da margem e das taxas deve ser menor que 100%.",
    };
  }

  const divisor = 1 - margin - fees;
  if (divisor <= 0) {
    return { ok: false, error: "Cálculo inválido: divisor zero ou negativo." };
  }

  const suggestedUnitPriceCents = Math.round(unitCostCents / divisor);
  const feeAmount = Math.round(suggestedUnitPriceCents * fees);
  const estimatedProfitPerUnitCents = Math.max(
    0,
    suggestedUnitPriceCents - unitCostCents - feeAmount,
  );

  return {
    ok: true,
    totalBatchCents,
    unitCostCents,
    suggestedUnitPriceCents,
    marginPercent: input.marginPercent,
    feePercent: input.feePercent,
    estimatedProfitPerUnitCents,
  };
}
