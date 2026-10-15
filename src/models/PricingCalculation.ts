import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";

const pricingCalculationSchema = baseSchema(
  {
    name: { type: String, required: true },
    ingredientCostCents: { type: Number, default: 0 },
    packagingCents: { type: Number, default: 0 },
    laborCents: { type: Number, default: 0 },
    otherCents: { type: Number, default: 0 },
    feePercent: { type: Number, default: 0 },
    marginPercent: { type: Number, default: 0 },
    batchQty: { type: Number, default: 1 },
    totalBatchCents: { type: Number, default: 0 },
    unitCostCents: { type: Number, default: 0 },
    suggestedUnitPriceCents: { type: Number, default: 0 },
    estimatedProfitPerUnitCents: { type: Number, default: 0 },
    linkedProductId: { type: String, default: null },
  },
  { timestamps: true, tenant: true },
);

pricingCalculationSchema.index({ storeId: 1, updatedAt: -1 });

export type PricingCalculationDoc = {
  _id: string;
  id: string;
  storeId: string;
  name: string;
  ingredientCostCents: number;
  packagingCents: number;
  laborCents: number;
  otherCents: number;
  feePercent: number;
  marginPercent: number;
  batchQty: number;
  totalBatchCents: number;
  unitCostCents: number;
  suggestedUnitPriceCents: number;
  estimatedProfitPerUnitCents: number;
  linkedProductId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const PricingCalculation: Model<PricingCalculationDoc> =
  (mongoose.models.PricingCalculation as Model<PricingCalculationDoc> | undefined) ??
  mongoose.model<PricingCalculationDoc>(
    "PricingCalculation",
    pricingCalculationSchema,
  );
