export function formatBRL(cents: number | null | undefined) {
  if (cents == null) return "Sob consulta";
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

/** Formata BR celular/fixo de forma leve (ex.: (11) 99999-8888). */
export function formatPhone(phone: string) {
  const d = digitsOnly(phone);
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  if (d.length === 13 && d.startsWith("55")) {
    return formatPhone(d.slice(2));
  }
  return phone;
}

export function whatsappLink(phone: string, message: string) {
  const digits = digitsOnly(phone);
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(message)}`;
}

export const PRODUCT_TYPE_LABELS = {
  READY: "Pronta entrega",
  CUSTOM: "Sob encomenda",
  CAKE: "Bolo personalizado",
  PARTY_KIT: "Kit festa",
  CORPORATE: "Corporativo",
} as const;

export const AVAILABILITY_LABELS = {
  AVAILABLE: "Disponível",
  SOLD_OUT: "Esgotado",
  MADE_TO_ORDER: "Sob encomenda",
  LAST_UNITS: "Últimas unidades",
  SCHEDULED_DAYS: "Dias específicos",
} as const;

export const ORDER_STATUS_LABELS = {
  NEW: "Solicitado",
  REVIEWING: "Em análise",
  CONFIRMED: "Confirmado",
  IN_PRODUCTION: "Em produção",
  READY: "Pronto",
  DELIVERED: "Entregue/Retirado",
  CANCELLED: "Cancelado",
} as const;

export const PAYMENT_STATUS_LABELS = {
  NONE: "Sem pagamento online",
  PENDING: "Pagamento pendente",
  APPROVED: "Pago",
  REJECTED: "Pagamento recusado",
  CANCELLED: "Pagamento cancelado",
} as const;

export const ONLINE_PAYMENT_METHOD = "Mercado Pago";

/** Formas manuais sugeridas no painel (além do Mercado Pago online). */
export const OFFLINE_PAYMENT_PRESETS = [
  "Pix",
  "Sinal para encomenda",
] as const;

export const DEPOSIT_PAYMENT_METHOD = "Sinal para encomenda";

export function isDepositPaymentMethod(method: string | null | undefined) {
  return (method || "").toLowerCase().includes("sinal");
}

/** Texto curto sob cada opção no checkout. */
export function paymentMethodHint(
  method: string,
  opts?: { mpReady?: boolean },
): string {
  if (method === ONLINE_PAYMENT_METHOD) {
    return opts?.mpReady === false
      ? "Carregando checkout online…"
      : "Pague agora com Pix, cartão ou boleto";
  }
  if (isDepositPaymentMethod(method)) {
    return "50% de entrada + 50% na retirada ou entrega";
  }
  if (method.toLowerCase() === "pix") {
    return "Combinar pelo WhatsApp na retirada ou entrega";
  }
  return "Combinar pelo WhatsApp com a loja";
}

/** Texto de confirmação / resumo do método escolhido. */
export function paymentMethodSummary(
  method: string,
  totalCents?: number,
): string {
  if (method === ONLINE_PAYMENT_METHOD) {
    return "Você será direcionado ao checkout seguro";
  }
  if (isDepositPaymentMethod(method) && totalCents != null && totalCents > 0) {
    const half = Math.round(totalCents / 2);
    return `Entrada de ${formatBRL(half)} (50%) + ${formatBRL(totalCents - half)} ao finalizar`;
  }
  if (isDepositPaymentMethod(method)) {
    return "50% de entrada agora e 50% ao finalizar o produto";
  }
  if (method.toLowerCase() === "pix") {
    return "A loja combina o Pix com você pelo WhatsApp";
  }
  return "Será combinado com a loja no WhatsApp";
}

/** Checkout online abandonado: pedido criado, mas o cliente ainda não iniciou o pagamento no MP. */
export function isAbandonedOnlineCheckout(order: {
  paymentMethod?: string | null;
  paymentStatus?: string | null;
  mpPaymentId?: string | null;
}) {
  return (
    order.paymentMethod === ONLINE_PAYMENT_METHOD &&
    order.paymentStatus === "PENDING" &&
    !order.mpPaymentId
  );
}

/** Pedido online que ainda não teve pagamento aprovado (Pix/cartão pendente ou abandonado). */
export function isOnlinePaymentOutstanding(order: {
  paymentMethod?: string | null;
  paymentStatus?: string | null;
}) {
  return (
    order.paymentMethod === ONLINE_PAYMENT_METHOD &&
    order.paymentStatus !== "APPROVED" &&
    order.paymentStatus !== "NONE"
  );
}

export function isQuoteFlow(type: keyof typeof PRODUCT_TYPE_LABELS) {
  return type === "CUSTOM" || type === "CAKE" || type === "CORPORATE";
}
