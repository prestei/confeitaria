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

export function isQuoteFlow(type: keyof typeof PRODUCT_TYPE_LABELS) {
  return type === "CUSTOM" || type === "CAKE" || type === "CORPORATE";
}
