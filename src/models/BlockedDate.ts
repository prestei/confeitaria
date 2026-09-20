import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";

const blockedDateSchema = baseSchema(
  {
    date: { type: Date, required: true },
    reason: { type: String, default: null },
  },
  { tenant: true },
);

blockedDateSchema.index({ storeId: 1, date: 1 }, { unique: true });

export type BlockedDateDoc = {
  _id: string;
  id: string;
  storeId: string;
  date: Date;
  reason: string | null;
};

export const BlockedDate: Model<BlockedDateDoc> =
  (mongoose.models.BlockedDate as Model<BlockedDateDoc> | undefined) ??
  mongoose.model<BlockedDateDoc>("BlockedDate", blockedDateSchema);
