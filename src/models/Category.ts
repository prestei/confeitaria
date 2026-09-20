import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";

const categorySchema = baseSchema(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: null },
    slug: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { tenant: true },
);

categorySchema.index({ storeId: 1, slug: 1 }, { unique: true });

export type CategoryDoc = {
  _id: string;
  id: string;
  storeId: string;
  name: string;
  emoji: string | null;
  slug: string;
  sortOrder: number;
  active: boolean;
};

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc> | undefined) ??
  mongoose.model<CategoryDoc>("Category", categorySchema);
