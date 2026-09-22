import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import {
  ALL_CATEGORY_DAYS,
  CATEGORY_DAY_KEYS,
  type CategoryDayKey,
} from "@/lib/category-days";

export { ALL_CATEGORY_DAYS, CATEGORY_DAY_KEYS, type CategoryDayKey };

const categorySchema = baseSchema(
  {
    name: { type: String, required: true },
    emoji: { type: String, default: null },
    slug: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    /** Desconto percentual aplicado aos produtos da categoria (0–100). */
    discountPercent: { type: Number, default: 0 },
    /** Acréscimo percentual aplicado aos produtos da categoria (≥ 0). */
    surchargePercent: { type: Number, default: 0 },
    /** Dias em que a categoria é exibida. Vazio = todos os dias. */
    displayDays: {
      type: [String],
      default: () => [...ALL_CATEGORY_DAYS],
    },
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
  discountPercent: number;
  surchargePercent: number;
  displayDays: CategoryDayKey[];
};

export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc> | undefined) ??
  mongoose.model<CategoryDoc>("Category", categorySchema);
