import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";

const stockItemSchema = baseSchema(
  {
    name: { type: String, required: true },
    unit: { type: String, default: "un" },
    quantity: { type: Number, default: 0 },
    minQuantity: { type: Number, default: 0 },
    unitCostCents: { type: Number, default: null },
  },
  { timestamps: true, tenant: true },
);

stockItemSchema.index({ storeId: 1, name: 1 });

export type StockItemDoc = {
  _id: string;
  id: string;
  storeId: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitCostCents: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export const StockItem: Model<StockItemDoc> =
  (mongoose.models.StockItem as Model<StockItemDoc> | undefined) ??
  mongoose.model<StockItemDoc>("StockItem", stockItemSchema);
