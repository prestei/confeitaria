import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import {
  IntegrationProvider,
  IntegrationStatus,
  type IntegrationProvider as IntegrationProviderT,
  type IntegrationStatus as IntegrationStatusT,
} from "@/lib/enums";

const integrationSchema = baseSchema(
  {
    provider: {
      type: String,
      enum: Object.values(IntegrationProvider),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(IntegrationStatus),
      default: IntegrationStatus.DISCONNECTED,
    },
    config: { type: mongoose.Schema.Types.Mixed, default: null },
    connectedAt: { type: Date, default: null },
  },
  { timestamps: true, tenant: true },
);

integrationSchema.index({ storeId: 1, provider: 1 }, { unique: true });

export type IntegrationDoc = {
  _id: string;
  id: string;
  storeId: string;
  provider: IntegrationProviderT;
  status: IntegrationStatusT;
  config: Record<string, unknown> | null;
  connectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const Integration: Model<IntegrationDoc> =
  (mongoose.models.Integration as Model<IntegrationDoc> | undefined) ??
  mongoose.model<IntegrationDoc>("Integration", integrationSchema);
