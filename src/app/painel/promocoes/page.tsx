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

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <PromocoesAdmin
      initialItems={JSON.parse(JSON.stringify(promotions))}
      storeSlug={session.storeSlug ?? undefined}
      origin={origin}
    />
  );
}
