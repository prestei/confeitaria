import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { formatBRL, whatsappLink, ORDER_STATUS_LABELS } from "@/lib/utils";
import { PageHeader, SectionCard } from "@/components/painel/page-header";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { OrderStatusUpdater } from "@/components/painel/order-status-updater";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStoreSession();
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, storeId: session.storeId },
    include: { items: true, store: true },
  });
  if (!order) notFound();

  const waMessage =
    order.whatsappMessage ||
    `Olá ${order.customerName}! Sobre o seu pedido na ${order.store.name}…`;
  const wa = whatsappLink(order.customerPhone, waMessage);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Pedido de ${order.customerName}`}
        description={`Recebido em ${format(order.createdAt, "dd/MM/yyyy 'às' HH:mm")}`}
        actions={
          <>
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="btn-berry !py-2.5 text-sm"
            >
              <MessageCircle className="h-4 w-4" />
              Conversar no WhatsApp
            </a>
            <Link href="/painel/pedidos" className="btn-secondary !py-2.5 text-sm">
              Voltar à central
            </Link>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        <div className="space-y-5">
          <SectionCard title="Itens">
            <ul className="divide-y divide-cocoa/6">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-cocoa">
                      {item.quantity}× {item.productName}
                    </p>
                    {item.customizations != null && (
                      <p className="mt-1 text-xs text-cocoa-soft/60">
                        {typeof item.customizations === "string"
                          ? item.customizations
                          : JSON.stringify(item.customizations)}
                      </p>
                    )}
                  </div>
                  <p className="shrink-0 text-sm font-medium text-cocoa">
                    {formatBRL(item.lineTotalCents)}
                  </p>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-cocoa/6 px-5 py-4 text-sm">
              <span className="text-cocoa-soft/70">Total</span>
              <span className="font-semibold text-cocoa">
                {order.priceLabel === "TO_CONFIRM"
                  ? "A confirmar"
                  : formatBRL(order.totalCents)}
              </span>
            </div>
          </SectionCard>

          {order.notes && (
            <SectionCard title="Observações">
              <p className="px-5 py-4 text-sm leading-relaxed text-cocoa-soft/80">
                {order.notes}
              </p>
            </SectionCard>
          )}
        </div>

        <div className="space-y-5">
          <SectionCard title="Status">
            <div className="space-y-3 p-5">
              <OrderStatusBadge status={order.status} />
              <OrderStatusUpdater
                orderId={order.id}
                current={order.status}
                labels={ORDER_STATUS_LABELS}
              />
            </div>
          </SectionCard>

          <SectionCard title="Cliente">
            <dl className="space-y-3 px-5 py-4 text-sm">
              <div>
                <dt className="text-xs text-cocoa-soft/50">Nome</dt>
                <dd className="font-medium text-cocoa">{order.customerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-cocoa-soft/50">WhatsApp</dt>
                <dd className="font-medium text-cocoa">{order.customerPhone}</dd>
              </div>
              {order.customerEmail && (
                <div>
                  <dt className="text-xs text-cocoa-soft/50">E-mail</dt>
                  <dd className="font-medium text-cocoa">{order.customerEmail}</dd>
                </div>
              )}
              {order.paymentMethod && (
                <div>
                  <dt className="text-xs text-cocoa-soft/50">Pagamento</dt>
                  <dd className="font-medium text-cocoa">{order.paymentMethod}</dd>
                </div>
              )}
              {order.eventDate && (
                <div>
                  <dt className="text-xs text-cocoa-soft/50">Entrega</dt>
                  <dd className="font-medium text-cocoa">
                    {format(order.eventDate, "dd/MM/yyyy")}
                    {order.eventTime ? ` · ${order.eventTime}` : ""}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-cocoa-soft/50">Retirada/entrega</dt>
                <dd className="font-medium text-cocoa">
                  {order.fulfillment === "DELIVERY" ? "Entrega" : "Retirada"}
                  {order.deliveryZone ? ` · ${order.deliveryZone}` : ""}
                </dd>
              </div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
