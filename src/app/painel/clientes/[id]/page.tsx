import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { PageHeader, SectionCard } from "@/components/painel/page-header";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { CustomerNotesForm } from "@/components/painel/customer-notes-form";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStoreSession();
  const { id } = await params;

  const customer = await prisma.customer.findFirst({
    where: { id, storeId: session.storeId },
    include: {
      orders: {
        include: { items: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!customer) notFound();

  const spent = customer.orders
    .filter((o) => o.status !== "CANCELLED" && o.priceLabel !== "TO_CONFIRM")
    .reduce((s, o) => s + o.totalCents, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={customer.name}
        description={`${customer.phone}${customer.email ? ` · ${customer.email}` : ""}`}
        actions={
          <Link href="/painel/clientes" className="btn-secondary !py-2.5 text-sm">
            Voltar
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cocoa/8 bg-white px-4 py-4">
          <p className="text-xs text-cocoa-soft/55">Pedidos</p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {customer.orders.length}
          </p>
        </div>
        <div className="rounded-2xl border border-cocoa/8 bg-white px-4 py-4">
          <p className="text-xs text-cocoa-soft/55">Total gasto</p>
          <p className="mt-1 font-display text-2xl text-cocoa">{formatBRL(spent)}</p>
        </div>
        <div className="rounded-2xl border border-cocoa/8 bg-white px-4 py-4">
          <p className="text-xs text-cocoa-soft/55">Última compra</p>
          <p className="mt-1 font-display text-2xl text-cocoa">
            {customer.orders[0]
              ? format(customer.orders[0].createdAt, "dd/MM/yy")
              : "—"}
          </p>
        </div>
      </div>

      <SectionCard title="Observações">
        <div className="p-5">
          <CustomerNotesForm customerId={customer.id} notes={customer.notes || ""} />
        </div>
      </SectionCard>

      <SectionCard title="Histórico de pedidos">
        {customer.orders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-cocoa-soft/60">Sem pedidos.</p>
        ) : (
          <ul className="divide-y divide-cocoa/6">
            {customer.orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/painel/pedidos/${o.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-fog/40"
                >
                  <div>
                    <p className="text-sm font-medium text-cocoa">
                      {format(o.createdAt, "dd/MM/yyyy")}
                    </p>
                    <p className="text-xs text-cocoa-soft/60">
                      {o.items[0]?.productName || "Pedido"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={o.status} />
                    <span className="text-sm font-medium">
                      {formatBRL(o.totalCents)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
