"use client";

import { format } from "date-fns";
import { MessageCircle } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { buttonClassName } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { OrderStatusUpdater } from "@/components/painel/order-status-updater";
import {
  formatBRL,
  ORDER_STATUS_LABELS,
  whatsappLink,
} from "@/lib/utils";
import type { OrderStatus } from "@/lib/enums";

export type OrderDetailData = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  status: OrderStatus;
  priceLabel: string;
  totalCents: number;
  eventDate: string | null;
  eventTime: string | null;
  paymentMethod: string | null;
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryZone: string | null;
  notes: string | null;
  whatsappMessage?: string | null;
  createdAt: string;
  items: Array<{
    id?: string;
    productName: string;
    quantity: number;
    lineTotalCents?: number;
    customizations?: Record<string, string> | string | null;
  }>;
};

function customizationText(
  customizations: OrderDetailData["items"][number]["customizations"],
) {
  if (customizations == null) return null;
  if (typeof customizations === "string") return customizations;
  return Object.entries(customizations)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}

export function OrderDetailSheet({
  order,
  open,
  onClose,
  onStatusChange,
}: {
  order: OrderDetailData | null;
  open: boolean;
  onClose: () => void;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
}) {
  const visible = open && order != null;

  return (
    <Drawer
      open={visible}
      onClose={onClose}
      title={order ? `Pedido de ${order.customerName}` : "Pedido"}
      className="max-w-lg"
    >
      {order ? (
        <OrderDetailBody order={order} onStatusChange={onStatusChange} />
      ) : null}
    </Drawer>
  );
}

function OrderDetailBody({
  order,
  onStatusChange,
}: {
  order: OrderDetailData;
  onStatusChange?: (orderId: string, status: OrderStatus) => void;
}) {
  const waMessage =
    order.whatsappMessage ||
    `Olá ${order.customerName}! Sobre o seu pedido…`;
  const wa = whatsappLink(order.customerPhone, waMessage);
  const createdLabel = format(
    new Date(order.createdAt),
    "dd/MM/yyyy 'às' HH:mm",
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-cocoa-soft/70">Recebido em {createdLabel}</p>

      <a
        href={wa}
        target="_blank"
        rel="noreferrer"
        className={buttonClassName({ variant: "accent", className: "w-full" })}
      >
        <MessageCircle className="h-4 w-4" />
        Conversar no WhatsApp
      </a>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-cocoa-soft/55">
          Status
        </h3>
        <OrderStatusBadge status={order.status} />
        <OrderStatusUpdater
          orderId={order.id}
          current={order.status}
          labels={ORDER_STATUS_LABELS}
          onUpdated={(next) =>
            onStatusChange?.(order.id, next as OrderStatus)
          }
        />
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cocoa-soft/55">
          Itens
        </h3>
        <ul className="divide-y divide-cocoa/6 overflow-hidden rounded-xl border border-cocoa/8 bg-white">
          {order.items.map((item, idx) => {
            const extras = customizationText(item.customizations);
            return (
              <li
                key={item.id || `${item.productName}-${idx}`}
                className="flex justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-cocoa">
                    {item.quantity}× {item.productName}
                  </p>
                  {extras && (
                    <p className="mt-1 text-xs text-cocoa-soft/60">{extras}</p>
                  )}
                </div>
                {typeof item.lineTotalCents === "number" && (
                  <p className="shrink-0 text-sm font-medium text-cocoa">
                    {formatBRL(item.lineTotalCents)}
                  </p>
                )}
              </li>
            );
          })}
          <li className="flex justify-between px-4 py-3 text-sm">
            <span className="text-cocoa-soft/70">Total</span>
            <span className="font-semibold text-cocoa">
              {order.priceLabel === "TO_CONFIRM"
                ? "A confirmar"
                : formatBRL(order.totalCents)}
            </span>
          </li>
        </ul>
      </section>

      {order.notes && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cocoa-soft/55">
            Observações
          </h3>
          <p className="rounded-xl border border-cocoa/8 bg-white px-4 py-3 text-sm leading-relaxed text-cocoa-soft/80">
            {order.notes}
          </p>
        </section>
      )}

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-cocoa-soft/55">
          Cliente
        </h3>
        <dl className="space-y-3 rounded-xl border border-cocoa/8 bg-white px-4 py-3 text-sm">
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
                {format(new Date(order.eventDate), "dd/MM/yyyy")}
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
      </section>
    </div>
  );
}
