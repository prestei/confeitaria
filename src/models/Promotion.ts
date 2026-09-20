import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import {
  PromotionType,
  type PromotionType as PromotionTypeT,
} from "@/lib/enums";

const promotionSchema = baseSchema(
  {
    name: { type: String, required: true },
    code: { type: String, default: null },
    type: {
      type: String,
      enum: Object.values(PromotionType),
      default: PromotionType.PERCENT,
    },
    percentOff: { type: Number, default: null },
    amountOffCents: { type: Number, default: null },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    productIds: { type: [String], default: [] },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, tenant: true },
);

promotionSchema.index(
  { storeId: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: "string" } } },
);

export type PromotionDoc = {
  _id: string;
  id: string;
  storeId: string;
  name: string;
  code: string | null;
  type: PromotionTypeT;
  percentOff: number | null;
  amountOffCents: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  productIds: string[];
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const Promotion: Model<PromotionDoc> =
  (mongoose.models.Promotion as Model<PromotionDoc> | undefined) ??
  mongoose.model<PromotionDoc>("Promotion", promotionSchema);
