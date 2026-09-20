import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Product } from "@/models/Product";
import { StockMovement } from "@/models/StockMovement";
import { EstoqueAdmin } from "@/components/painel/estoque-admin";

export default async function EstoquePage() {
  const session = await requireStoreSession();
  const storeId = session.storeId;
  await connectDB();

  const [products, movementsRaw] = await Promise.all([
    leanList(
      await Product.find({ storeId, trackStock: true })
        .sort({ name: 1 })
        .lean(),
    ),
    leanList(
      await StockMovement.find({ storeId })
        .sort({ createdAt: -1 })
        .limit(40)
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

  return (
    <EstoqueAdmin
      initialProducts={JSON.parse(JSON.stringify(products))}
      initialMovements={JSON.parse(JSON.stringify(movements))}
    />
  );
}
