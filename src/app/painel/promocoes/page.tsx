import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Promotion } from "@/models/Promotion";
import { PromocoesAdmin } from "@/components/painel/promocoes-admin";

export default async function PromocoesPage() {
  const session = await requireStoreSession();
  await connectDB();

  const promotions = leanList(
    await Promotion.find({ storeId: session.storeId })
      .sort({ createdAt: -1 })
      .lean(),
  );

  return (
    <PromocoesAdmin initialItems={JSON.parse(JSON.stringify(promotions))} />
  );
}
