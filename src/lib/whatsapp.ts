import { formatBRL } from "./utils";

type StoreLike = {
  name: string;
};

type OrderItemLike = {
  productName: string;
  quantity: number;
  lineTotalCents: number;
};

type OrderLike = {
  kind: string;
  customerName: string;
  fulfillment?: string;
  deliveryFeeCents?: number;
  subtotalCents?: number;
  eventDate?: Date | string | null;
  eventTime?: string | null;
  notes?: string | null;
  deliveryAddress?: string | null;
  totalCents: number;
  priceLabel?: string;
  items: OrderItemLike[];
};

export function buildWhatsAppMessage(_store: StoreLike, order: OrderLike) {
  const lines: string[] = ["Olá! Gostaria de fazer este pedido:", ""];

  for (const item of order.items) {
    const unit =
      item.quantity > 0
        ? Math.round(item.lineTotalCents / item.quantity)
        : item.lineTotalCents;
    lines.push(`🍰 ${item.productName} — ${item.quantity}x`);
    if (item.lineTotalCents > 0) {
      lines.push(
        `   ${formatBRL(unit)} cada · subtotal ${formatBRL(item.lineTotalCents)}`,
      );
    }
    lines.push("");
  }

  if (order.fulfillment === "DELIVERY") {
    lines.push("📦 Modalidade: entrega");
  } else if (order.fulfillment === "PICKUP") {
    lines.push("📦 Modalidade: retirada");
  }

  if (order.deliveryFeeCents && order.deliveryFeeCents > 0) {
    lines.push(`🚚 Taxa de entrega: ${formatBRL(order.deliveryFeeCents)}`);
  }

  if (order.eventDate) {
    const d = new Date(order.eventDate);
    lines.push(`📅 Data: ${d.toLocaleDateString("pt-BR")}`);
  }
  if (order.eventTime) lines.push(`⏰ Horário: ${order.eventTime}`);
  if (order.deliveryAddress) lines.push(`📍 Endereço: ${order.deliveryAddress}`);

  lines.push("");
  if (order.kind === "QUOTE" || order.priceLabel === "TO_CONFIRM") {
    lines.push("💰 Total: a combinar");
  } else {
    lines.push(`💰 Total: ${formatBRL(order.totalCents)}`);
  }

  if (order.notes) {
    lines.push("");
    lines.push("Observações:");
    lines.push(order.notes);
  }

  lines.push("");
  lines.push(`Nome: ${order.customerName}`);

  return lines.join("\n");
}

export function whatsappUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}
