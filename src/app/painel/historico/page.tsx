import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { OrdersHistory } from "@/components/painel/orders-history";

export default async function HistoricoPage() {
  const session = await requireStoreSession();
  const orders = await prisma.order.findMany({
    where: { storeId: session.storeId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return <OrdersHistory initialOrders={JSON.parse(JSON.stringify(orders))} />;
}
