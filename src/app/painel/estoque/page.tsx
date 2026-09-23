import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { StockMovement } from "@/models/StockMovement";
import { EstoqueAdmin } from "@/components/painel/estoque-admin";

export default async function EstoquePage() {
  const session = await requireStoreSession();
  const storeId = session.storeId;
  await connectDB();

  const [products, movementsRaw] = await Promise.all([
    leanList(
      await Product.find({ storeId })
        .select({
          name: 1,
          imageUrl: 1,
          stockQty: 1,
          stockMin: 1,
          unit: 1,
          trackStock: 1,
          availability: 1,
          active: 1,
          categoryId: 1,
          sortOrder: 1,
        })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ),
    leanList(
      await StockMovement.find({ storeId })
        .sort({ createdAt: -1 })
        .limit(80)
        .lean(),
    ),
  ]);

  const productIds = [...new Set(movementsRaw.map((m) => m.productId))];
  const named = productIds.length
    ? leanList(
        await Product.find({ _id: { $in: productIds } })
          .select({ name: 1 })
          .lean(),
      )
    : [];
  const nameMap = Object.fromEntries(named.map((p) => [p.id, p.name]));

  const movements = movementsRaw.map((m) => ({
    ...m,
    product: { name: nameMap[m.productId] || "Produto" },
  }));

  const categoryIds = [
    ...new Set(
      products
        .map((p) => p.categoryId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const categories = categoryIds.length
    ? leanList(
        await Category.find({ _id: { $in: categoryIds }, storeId })
          .select({ name: 1, sortOrder: 1 })
          .sort({ sortOrder: 1 })
          .lean(),
      )
    : [];
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const productsWithCategory = products.map((p) => ({
    ...p,
    category: p.categoryId ? (catMap[p.categoryId] ?? null) : null,
  }));

  return (
    <EstoqueAdmin
      initialProducts={JSON.parse(JSON.stringify(productsWithCategory))}
      initialMovements={JSON.parse(JSON.stringify(movements))}
    />
  );
}
