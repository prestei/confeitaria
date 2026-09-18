import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { OrdersAdmin } from "@/components/painel/orders-admin";

export default async function PedidosPage() {
  const session = await requireStoreSession();
  const orders = await prisma.order.findMany({
    where: { storeId: session.storeId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return <OrdersAdmin initialOrders={JSON.parse(JSON.stringify(orders))} />;
}
