import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { PromocoesAdmin } from "@/components/painel/promocoes-admin";

export default async function PromocoesPage() {
  const session = await requireStoreSession();
  const promotions = await prisma.promotion.findMany({
    where: { storeId: session.storeId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <PromocoesAdmin initialItems={JSON.parse(JSON.stringify(promotions))} />
  );
}
