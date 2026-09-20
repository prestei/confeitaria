import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { isAbandonedOnlineCheckout } from "@/lib/utils";
import { Order } from "@/models/Order";
import { OrdersAdmin } from "@/components/painel/orders-admin";

export default async function PedidosPage() {
  const session = await requireStoreSession();
  await connectDB();

  const orders = leanList(
    await Order.find({ storeId: session.storeId })
      .sort({ createdAt: -1 })
      .lean(),
  ).filter((o) => !isAbandonedOnlineCheckout(o));

  return <OrdersAdmin initialOrders={JSON.parse(JSON.stringify(orders))} />;
}
