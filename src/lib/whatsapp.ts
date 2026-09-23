import { formatBRL, isDepositPaymentMethod } from "./utils";
import { visibleCustomizations } from "./addons";

type StoreLike = {
  name: string;
};

type OrderItemLike = {
  productName: string;
  quantity: number;
  lineTotalCents: number;
  customizations?: unknown;
};

type OrderLike = {
  kind: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  companyName?: string | null;
  needsInvoice?: boolean;
  guests?: number | null;
  eventDate?: Date | string | null;
  eventTime?: string | null;
  fulfillment: string;
  deliveryZone?: string | null;
  deliveryFeeCents?: number;
  discountCents?: number;
  promoCode?: string | null;
  paymentMethod?: string | null;
  notes?: string | null;
  referenceNote?: string | null;
  totalCents: number;
  priceLabel?: string;
  items: OrderItemLike[];
};

export function buildWhatsAppMessage(store: StoreLike, order: OrderLike) {
  const kindLabel =
    order.kind === "QUOTE" ? "Solicitação de orçamento" : "Novo pedido";
  const lines: string[] = [
    `🍰 ${kindLabel} — ${store.name}`,
    "",
    `Cliente: ${order.customerName}`,
    `Telefone: ${order.customerPhone}`,
  ];

  if (order.customerEmail) lines.push(`E-mail: ${order.customerEmail}`);
  if (order.companyName) lines.push(`Empresa: ${order.companyName}`);
  if (order.needsInvoice) lines.push("Nota fiscal: Sim");
  if (order.guests) lines.push(`Convidados: ${order.guests}`);
  if (order.eventDate) {
    const d = new Date(order.eventDate);
    lines.push(`Data: ${d.toLocaleDateString("pt-BR")}`);
  }
  if (order.eventTime) lines.push(`Horário: ${order.eventTime}`);

  lines.push(
    `Retirada/Entrega: ${order.fulfillment === "DELIVERY" ? "Entrega" : "Retirada"}`,
  );
  if (order.deliveryZone) lines.push(`Região: ${order.deliveryZone}`);
  if (order.paymentMethod) {
    if (isDepositPaymentMethod(order.paymentMethod) && order.totalCents > 0) {
      const half = Math.round(order.totalCents / 2);
      lines.push(
        `Pagamento: Sinal — entrada ${formatBRL(half)} (50%) + ${formatBRL(order.totalCents - half)} ao finalizar`,
      );
    } else {
      lines.push(`Pagamento: ${order.paymentMethod}`);
    }
  }
  lines.push("");
  lines.push("Itens:");

  for (const item of order.items) {
    lines.push(`• ${item.quantity}x ${item.productName}`);
    const custom = visibleCustomizations(
      item.customizations as Record<string, unknown> | null,
    );
    if (Object.keys(custom).length) {
      for (const [key, value] of Object.entries(custom)) {
        if (value == null || value === "") continue;
        if (Array.isArray(value)) {
          lines.push(`  - ${key}: ${value.join(", ")}`);
        } else if (typeof value === "object") {
          lines.push(`  - ${key}: ${JSON.stringify(value)}`);
        } else {
          lines.push(`  - ${key}: ${String(value)}`);
        }
      }
    }
    if (item.lineTotalCents > 0) {
      lines.push(`  Subtotal: ${formatBRL(item.lineTotalCents)}`);
    }
  }

  lines.push("");
  if ((order.deliveryFeeCents ?? 0) > 0) {
    lines.push(`Taxa de entrega: ${formatBRL(order.deliveryFeeCents!)}`);
  }
  if ((order.discountCents ?? 0) > 0) {
    lines.push(
      `Desconto${order.promoCode ? ` (${order.promoCode})` : ""}: -${formatBRL(order.discountCents!)}`,
    );
  }

  const priceMap: Record<string, string> = {
    TOTAL: "Total",
    ESTIMATE: "Total estimado",
    TO_CONFIRM: "Valor a confirmar",
  };
  const label = priceMap[order.priceLabel ?? "TOTAL"] ?? "Total";

  if (order.kind === "QUOTE" || order.priceLabel === "TO_CONFIRM") {
    lines.push(`${label}: a combinar / orçamento`);
  } else {
    lines.push(`${label}: ${formatBRL(order.totalCents)}`);
  }

  if (order.notes) {
    lines.push("");
    lines.push(`Observações: ${order.notes}`);
  }
  if (order.referenceNote) {
    lines.push(`Referência: ${order.referenceNote}`);
  }

  lines.push("");
  lines.push("Enviado pelo cardápio online ✨");

  return lines.join("\n");
}

export function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}
