import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { OrderStatus } from "@/lib/enums";
import { SALE_STATUSES } from "@/lib/order-status";
import { CustomersAdmin } from "@/components/painel/customers-admin";
import type { CustomerRow } from "@/components/painel/customers-table";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ novo?: string }>;
}) {
  const session = await requireStoreSession();
  const { novo } = await searchParams;
  const storeId = session.storeId;
  await connectDB();

  const customers = leanList(
    await Customer.find({ storeId }).sort({ updatedAt: -1 }).lean(),
  );

  const customerIds = customers.map((c) => c.id);
  const customerOrders = customerIds.length
    ? leanList(
        await Order.find({
          storeId,
          customerId: { $in: customerIds },
          status: { $ne: OrderStatus.CANCELLED },
        })
          .sort({ createdAt: -1 })
          .lean(),
      )
    : [];

  const ordersByCustomer = new Map<string, typeof customerOrders>();
  for (const o of customerOrders) {
    if (!o.customerId) continue;
    const list = ordersByCustomer.get(o.customerId) || [];
    list.push(o);
    ordersByCustomer.set(o.customerId, list);
  }

  let rows: CustomerRow[] = customers.map((c) => {
    const orders = ordersByCustomer.get(c.id) || [];
    const spent = orders
      .filter((o) => SALE_STATUSES.has(String(o.status)) && o.priceLabel !== "TO_CONFIRM")
      .reduce((s, o) => s + o.totalCents, 0);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      orders: orders.length,
      spent,
      lastOrder: (orders[0]?.createdAt || c.createdAt).toISOString(),
      href: `/painel/clientes/${c.id}`,
      instagram: c.instagram,
      notes: c.notes,
      editable: true,
    };
  });

  if (rows.length === 0) {
    const orders = leanList(
      await Order.find({ storeId }).sort({ createdAt: -1 }).lean(),
    );
    const map = new Map<string, CustomerRow>();
    for (const o of orders) {
      const existing = map.get(o.customerPhone);
      const add =
        SALE_STATUSES.has(o.status) && o.priceLabel !== "TO_CONFIRM"
          ? o.totalCents
          : 0;
      if (!existing) {
        map.set(o.customerPhone, {
          id: o.customerPhone,
          name: o.customerName,
          phone: o.customerPhone,
          email: o.customerEmail,
          orders: 1,
          spent: add,
          lastOrder: o.createdAt.toISOString(),
          href: `/painel/clientes/phone/${encodeURIComponent(o.customerPhone)}`,
        });
      } else {
        existing.orders += 1;
        existing.spent += add;
        if (o.createdAt.toISOString() > existing.lastOrder) {
          existing.lastOrder = o.createdAt.toISOString();
          existing.name = o.customerName;
          existing.email = o.customerEmail || existing.email;
        }
      }
    }
    rows = [...map.values()];
  }

  return <CustomersAdmin rows={rows} startOpen={novo === "1"} />;
}
