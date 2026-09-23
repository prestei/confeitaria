import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { connectDB } from "@/lib/db";
import { leanDoc, leanList } from "@/lib/serialize";
import { formatBRL } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { PageHeader, SectionCard, StatTile } from "@/components/painel/page-header";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { CustomerProfileForm } from "@/components/painel/customer-profile-form";
import {
  CustomerSourceBadge,
  CustomerWhatsappButton,
} from "@/components/painel/customer-actions";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStoreSession();
  const { id } = await params;
  await connectDB();

  const customer = leanDoc(
    await Customer.findOne({ _id: id, storeId: session.storeId }).lean(),
  );
  if (!customer) notFound();

  const orders = leanList(
    await Order.find({
      storeId: session.storeId,
      $or: [{ customerId: id }, { customerPhone: customer.phone }],
    })
      .sort({ createdAt: -1 })
      .lean(),
  );

  const spent = orders
    .filter((o) => o.status !== "CANCELLED" && o.priceLabel !== "TO_CONFIRM")
    .reduce((s, o) => s + o.totalCents, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={customer.name}
        description="Perfil no CRM — alinhado ao checkout da vitrine."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CustomerWhatsappButton name={customer.name} phone={customer.phone} />
            <Link
              href="/painel/clientes"
              className="btn-secondary !py-2.5 text-sm"
            >
              Voltar
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <CustomerSourceBadge source="registered" />
        <span className="text-sm text-cocoa-soft/70">
          {customer.phone}
          {customer.email ? ` · ${customer.email}` : ""}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <StatTile label="Pedidos" value={orders.length} />
        <StatTile label="Total gasto" value={formatBRL(spent)} />
        <StatTile
          label="Última compra"
          value={orders[0] ? format(orders[0].createdAt, "dd/MM/yy") : "—"}
        />
      </div>

      <SectionCard title="Dados do cliente">
        <div className="p-5">
          <CustomerProfileForm
            customerId={customer.id}
            initial={{
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              notes: customer.notes,
              referenceNote: customer.referenceNote ?? null,
            }}
          />
        </div>
      </SectionCard>

      <SectionCard title="Histórico de pedidos">
        {orders.length === 0 ? (
          <p className="px-5 py-6 text-sm text-cocoa-soft/60">Sem pedidos.</p>
        ) : (
          <ul className="divide-y divide-cocoa/6">
            {orders.map((o) => (
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
                      {o.items?.[0]?.productName || "Pedido"}
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
