import type { Order, OrderItem, Store } from "@prisma/client";
import { formatBRL } from "./utils";

type OrderWithItems = Order & { items: OrderItem[] };

export function buildWhatsAppMessage(store: Store, order: OrderWithItems) {
  const kindLabel = order.kind === "QUOTE" ? "Solicitação de orçamento" : "Novo pedido";
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
  if (order.paymentMethod) lines.push(`Pagamento: ${order.paymentMethod}`);
  lines.push("");
  lines.push("Itens:");

  for (const item of order.items) {
    lines.push(`• ${item.quantity}x ${item.productName}`);
    const custom = item.customizations as Record<string, unknown> | null;
    if (custom && typeof custom === "object") {
      for (const [key, value] of Object.entries(custom)) {
        if (value == null || value === "") continue;
        if (typeof value === "object") {
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
  if (order.deliveryFeeCents > 0) {
    lines.push(`Taxa de entrega: ${formatBRL(order.deliveryFeeCents)}`);
  }

  const priceMap: Record<string, string> = {
    TOTAL: "Total",
    ESTIMATE: "Total estimado",
    TO_CONFIRM: "Valor a confirmar",
  };
  const label = priceMap[order.priceLabel] ?? "Total";

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
