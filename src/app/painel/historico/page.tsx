import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Order } from "@/models/Order";
import { OrdersHistory } from "@/components/painel/orders-history";

export default async function HistoricoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const orders = leanList(
    await Order.find({ storeId: session.storeId })
      .sort({ createdAt: -1 })
      .lean(),
  );

  return <OrdersHistory initialOrders={JSON.parse(JSON.stringify(orders))} />;
}
