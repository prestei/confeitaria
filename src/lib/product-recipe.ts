import { z } from "zod";
import { StockItem } from "@/models/StockItem";

export const recipeLineSchema = z.object({
  stockItemId: z.string().min(1),
  quantity: z.number().positive(),
});

export const productCostSchema = {
  packagingCents: z.number().int().nonnegative().optional(),
  laborCents: z.number().int().nonnegative().optional(),
  otherCostsCents: z.number().int().nonnegative().optional(),
  indirectCents: z.number().int().nonnegative().optional(),
  recipe: z.array(recipeLineSchema).optional(),
};

export async function resolveOwnedRecipe(
  storeId: string,
  recipe: { stockItemId: string; quantity: number }[],
) {
  if (recipe.length === 0) return recipe;
  const owned = await StockItem.find({
    storeId,
    _id: { $in: recipe.map((line) => line.stockItemId) },
  })
    .select({ _id: 1 })
    .lean();
  const allowed = new Set(owned.map((item) => String(item._id)));
  if (recipe.some((line) => !allowed.has(line.stockItemId))) return null;
  return recipe;
}
