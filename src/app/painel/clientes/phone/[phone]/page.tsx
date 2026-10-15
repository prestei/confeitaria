import Link from "next/link";
import { format } from "date-fns";
import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { formatBRL } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { Order } from "@/models/Order";
import { PageHeader, SectionCard, StatTile } from "@/components/painel/page-header";
import { OrderStatusBadge } from "@/components/ui/order-status";
import {
  CustomerSourceBadge,
  CustomerWhatsappButton,
  RegisterFromVitrineButton,
} from "@/components/painel/customer-actions";

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
  const email = orders.find((o) => o.customerEmail)?.customerEmail ?? null;
  const spent = orders
    .filter((o) => o.status !== "CANCELLED" && o.priceLabel !== "TO_CONFIRM")
    .reduce((s, o) => s + o.totalCents, 0);

  const lastNotes = orders.find((o) => o.notes)?.notes;
  const lastRef = orders.find((o) => o.referenceNote)?.referenceNote;

  return (
    <div className="space-y-4">
      <PageHeader
        title={name}
        description="Contato que pediu pela vitrine — ainda não está no CRM."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RegisterFromVitrineButton
              name={name}
              phone={phone}
              email={email}
            />
            <CustomerWhatsappButton name={name} phone={phone} />
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
        <CustomerSourceBadge source="vitrine" />
        <span className="text-sm text-cocoa-soft/70">
          {phone}
          {email ? ` · ${email}` : ""}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <StatTile label="Pedidos" value={orders.length} />
        <StatTile label="Total gasto" value={formatBRL(spent)} />
        <StatTile
          label="Última compra"
          value={format(orders[0].createdAt, "dd/MM/yy")}
        />
      </div>

      {(lastNotes || lastRef) && (
        <SectionCard title="Dados dos pedidos na vitrine">
          <dl className="grid gap-4 p-5 text-sm sm:grid-cols-2">
            {lastNotes && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-cocoa-soft/55">
                  Observações (checkout)
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-cocoa">
                  {lastNotes}
                </dd>
              </div>
            )}
            {lastRef && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-medium uppercase tracking-wide text-cocoa-soft/55">
                  Referência
                </dt>
                <dd className="mt-1 text-cocoa">{lastRef}</dd>
              </div>
            )}
          </dl>
        </SectionCard>
      )}

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
                  <span className="text-sm font-medium">
                    {formatBRL(o.totalCents)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
