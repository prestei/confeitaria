import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { StockItem } from "@/models/StockItem";
import { StockMovement } from "@/models/StockMovement";
import { InsumosCadastro } from "@/components/painel/insumos-cadastro";

export default async function InsumosPage() {
  const session = await requireStoreSession();
  await connectDB();
  const storeId = session.storeId;

  const [stockItems, movementsRaw] = await Promise.all([
    leanList(
      await StockItem.find({ storeId }).sort({ name: 1 }).lean(),
    ),
    leanList(
      await StockMovement.find({ storeId, stockItemId: { $ne: null } })
        .sort({ createdAt: -1 })
        .limit(40)
        .lean(),
    ),
  ]);

  const itemIds = [
    ...new Set(movementsRaw.map((m) => m.stockItemId).filter(Boolean)),
  ] as string[];
  const named = itemIds.length
    ? leanList(
        await StockItem.find({ _id: { $in: itemIds } })
          .select({ name: 1 })
          .lean(),
      )
    : [];
  const nameMap = Object.fromEntries(named.map((item) => [item.id, item.name]));

  const movements = movementsRaw.map((m) => {
    const id = String(m.id ?? m._id);
    const stockItemId = m.stockItemId ? String(m.stockItemId) : null;
    return {
      id,
      type: m.type as "IN" | "OUT" | "ADJUST",
      quantity: m.quantity,
      note: m.note,
      createdAt: String(m.createdAt),
      stockItemId,
      stockItem: {
        name: (stockItemId && nameMap[stockItemId]) || "Insumo",
      },
    };
  });

  return (
    <InsumosCadastro
      initialItems={JSON.parse(JSON.stringify(stockItems))}
      initialMovements={JSON.parse(JSON.stringify(movements))}
    />
  );
}
