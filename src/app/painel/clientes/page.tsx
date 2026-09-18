import { Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { PageAction, PageHeader } from "@/components/painel/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  CustomersTable,
  type CustomerRow,
} from "@/components/painel/customers-table";

export default async function ClientesPage() {
  const session = await requireStoreSession();
  const storeId = session.storeId;

  const customers = await prisma.customer.findMany({
    where: { storeId },
    include: {
      orders: {
        where: { status: { not: "CANCELLED" } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  let rows: CustomerRow[] = customers.map((c) => {
    const spent = c.orders
      .filter((o) => o.priceLabel !== "TO_CONFIRM")
      .reduce((s, o) => s + o.totalCents, 0);
    return {
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      orders: c.orders.length,
      spent,
      lastOrder: (c.orders[0]?.createdAt || c.createdAt).toISOString(),
      href: `/painel/clientes/${c.id}`,
    };
  });

  if (rows.length === 0) {
    const orders = await prisma.order.findMany({
      where: { storeId },
      orderBy: { createdAt: "desc" },
    });
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
