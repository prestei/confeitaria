import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import {
  StockMovementType,
  type StockMovementType as StockMovementTypeT,
} from "@/lib/enums";

const stockMovementSchema = baseSchema(
  {
    productId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: Object.values(StockMovementType),
      required: true,
    },
    quantity: { type: Number, required: true },
    note: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, tenant: true },
);

export type StockMovementDoc = {
  _id: string;
  id: string;
  storeId: string;
  productId: string;
  type: StockMovementTypeT;
  quantity: number;
  note: string | null;
  createdAt: Date;
};

export const StockMovement: Model<StockMovementDoc> =
  (mongoose.models.StockMovement as Model<StockMovementDoc> | undefined) ??
  mongoose.model<StockMovementDoc>("StockMovement", stockMovementSchema);
