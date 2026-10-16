import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { StockItem } from "@/models/StockItem";
import { StockMovement } from "@/models/StockMovement";
import { EstoqueAdmin } from "@/components/painel/estoque-admin";

export default async function EstoquePage() {
  const session = await requireStoreSession();
  const storeId = session.storeId;
  await connectDB();

  const [stockItems, products, categories, movementsRaw] = await Promise.all([
    leanList(await StockItem.find({ storeId }).sort({ name: 1 }).lean()),
    leanList(
      await Product.find({ storeId, trackStock: true })
        .sort({ name: 1 })
        .lean(),
    ),
    leanList(
      await Category.find({ storeId }).sort({ sortOrder: 1 }).lean(),
    ),
    leanList(
      await StockMovement.find({ storeId })
        .sort({ createdAt: -1 })
        .limit(80)
        .lean(),
    ),
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const productsWithCategory = products.map((p) => ({
    ...p,
    category: p.categoryId ? catMap[p.categoryId] ?? null : null,
  }));

  const productIds = [
    ...new Set(movementsRaw.map((m) => m.productId).filter(Boolean)),
  ] as string[];
  const stockItemIds = [
    ...new Set(movementsRaw.map((m) => m.stockItemId).filter(Boolean)),
  ] as string[];

  const [namedProducts, namedItems] = await Promise.all([
    productIds.length
      ? leanList(
          await Product.find({ _id: { $in: productIds } })
            .select({ name: 1 })
            .lean(),
        )
      : [],
    stockItemIds.length
      ? leanList(
          await StockItem.find({ _id: { $in: stockItemIds } })
            .select({ name: 1 })
            .lean(),
        )
      : [],
  ]);

  const productNameMap = Object.fromEntries(
    namedProducts.map((p) => [p.id, p.name]),
  );
  const itemNameMap = Object.fromEntries(
    namedItems.map((item) => [item.id, item.name]),
  );

  const movements = movementsRaw.map((m) => ({
    ...m,
    product: m.productId
      ? {
          name:
            productNameMap[m.productId as string] || "Produto",
        }
      : null,
    stockItem: m.stockItemId
      ? {
          name:
            itemNameMap[m.stockItemId as string] || "Insumo",
        }
      : null,
  }));

  return (
    <EstoqueAdmin
      initialStockItems={JSON.parse(JSON.stringify(stockItems))}
      initialProducts={JSON.parse(JSON.stringify(productsWithCategory))}
      initialMovements={JSON.parse(JSON.stringify(movements))}
    />
  );
}
