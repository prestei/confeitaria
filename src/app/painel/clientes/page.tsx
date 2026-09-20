import { Plus, Users } from "lucide-react";
import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { OrderStatus } from "@/lib/enums";
import { PageAction, PageHeader } from "@/components/painel/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CustomersTable,
  type CustomerRow,
} from "@/components/painel/customers-table";

export default async function ClientesPage() {
  const session = await requireStoreSession();
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
      .filter((o) => o.priceLabel !== "TO_CONFIRM")
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
        o.status !== "CANCELLED" && o.priceLabel !== "TO_CONFIRM"
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description="CRM simples: quem pediu, quanto gastou e quando voltou."
        actions={
          <PageAction href="/painel/clientes/novo">
            <Plus className="h-4 w-4" />
            Novo cliente
          </PageAction>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente ainda"
          description="Cadastre um contato ou aguarde os pedidos da vitrine."
          action={{ label: "Novo cliente", href: "/painel/clientes/novo" }}
        />
      ) : (
        <CustomersTable rows={rows} />
      )}
    </div>
  );
}
