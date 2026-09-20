import Link from "next/link";
import { format } from "date-fns";
import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { formatBRL } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { Order } from "@/models/Order";
import { PageHeader, SectionCard } from "@/components/painel/page-header";
import { OrderStatusBadge } from "@/components/ui/order-status";

export default async function CustomerByPhonePage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const session = await requireStoreSession();
  const { phone: raw } = await params;
  const phone = decodeURIComponent(raw);
  await connectDB();

  const orders = leanList(
    await Order.find({ storeId: session.storeId, customerPhone: phone })
      .sort({ createdAt: -1 })
      .lean(),
  );

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Cliente" description="Não encontrado." />
        <Link href="/painel/clientes" className="btn-secondary text-sm">
          Voltar
        </Link>
      </div>
    );
  }

  const name = orders[0].customerName;
  const email = orders.find((o) => o.customerEmail)?.customerEmail;
  const spent = orders
    .filter((o) => o.status !== "CANCELLED" && o.priceLabel !== "TO_CONFIRM")
    .reduce((s, o) => s + o.totalCents, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title={name}
        description={`${phone}${email ? ` · ${email}` : ""}`}
        actions={
          <Link href="/painel/clientes" className="btn-secondary !py-2.5 text-sm">
            Voltar
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-cocoa/8 bg-white px-4 py-4">
          <p className="text-xs text-cocoa-soft/55">Pedidos</p>
          <p className="mt-1 font-display text-2xl">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-cocoa/8 bg-white px-4 py-4">
          <p className="text-xs text-cocoa-soft/55">Total gasto</p>
          <p className="mt-1 font-display text-2xl">{formatBRL(spent)}</p>
        </div>
        <div className="rounded-2xl border border-cocoa/8 bg-white px-4 py-4">
          <p className="text-xs text-cocoa-soft/55">Última compra</p>
          <p className="mt-1 font-display text-2xl">
            {format(orders[0].createdAt, "dd/MM/yy")}
          </p>
        </div>
      </div>

      <SectionCard title="Histórico de pedidos">
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
                  <span className="text-sm font-medium">{formatBRL(o.totalCents)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
