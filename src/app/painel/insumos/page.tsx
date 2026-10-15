import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { StockItem } from "@/models/StockItem";
import { InsumosCadastro } from "@/components/painel/insumos-cadastro";

export default async function InsumosPage() {
  const session = await requireStoreSession();
  await connectDB();
  const stockItems = leanList(
    await StockItem.find({ storeId: session.storeId }).sort({ name: 1 }).lean(),
  );

  return <InsumosCadastro initialItems={JSON.parse(JSON.stringify(stockItems))} />;
}
