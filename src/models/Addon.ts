import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import {
  AddonSelectionType,
  type AddonSelectionType as AddonSelectionTypeT,
} from "@/lib/enums";

const addonSchema = baseSchema(
  {
    name: { type: String, required: true },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    priceCents: { type: Number, required: true },
    selectionType: {
      type: String,
      enum: Object.values(AddonSelectionType),
      default: AddonSelectionType.QTY,
    },
    maxQty: { type: Number, default: 10 },
    noteLabel: { type: String, default: null },
    noteRequired: { type: Boolean, default: false },
    categoryIds: { type: [String], default: [] },
    suggestInCart: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, tenant: true },
);

addonSchema.index({ storeId: 1, sortOrder: 1, name: 1 });

export type CatalogAddonDoc = {
  _id: string;
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  selectionType: AddonSelectionTypeT;
  maxQty: number;
  noteLabel: string | null;
  noteRequired: boolean;
  categoryIds: string[];
  suggestInCart: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export const CatalogAddon: Model<CatalogAddonDoc> =
  (mongoose.models.Addon as Model<CatalogAddonDoc> | undefined) ??
  mongoose.model<CatalogAddonDoc>("Addon", addonSchema);
