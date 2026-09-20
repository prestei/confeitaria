import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import {
  AnalyticsEventType,
  type AnalyticsEventType as AnalyticsEventTypeT,
} from "@/lib/enums";

const analyticsEventSchema = baseSchema(
  {
    type: {
      type: String,
      enum: Object.values(AnalyticsEventType),
      required: true,
    },
    productId: { type: String, default: null },
    source: { type: String, default: null },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, tenant: true },
);

analyticsEventSchema.index({ storeId: 1, createdAt: -1 });
analyticsEventSchema.index({ storeId: 1, type: 1 });

export type AnalyticsEventDoc = {
  _id: string;
  id: string;
  storeId: string;
  type: AnalyticsEventTypeT;
  productId: string | null;
  source: string | null;
  meta: unknown;
  createdAt: Date;
};

export const AnalyticsEvent: Model<AnalyticsEventDoc> =
  (mongoose.models.AnalyticsEvent as Model<AnalyticsEventDoc> | undefined) ??
  mongoose.model<AnalyticsEventDoc>("AnalyticsEvent", analyticsEventSchema);
