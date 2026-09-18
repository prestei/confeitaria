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
  NEW: "Novo",
  REVIEWING: "Em análise",
  CONFIRMED: "Confirmado",
  IN_PRODUCTION: "Em produção",
  READY: "Pronto",
  DELIVERED: "Entregue/Retirado",
  CANCELLED: "Cancelado",
} as const;

export function isQuoteFlow(type: keyof typeof PRODUCT_TYPE_LABELS) {
  return type === "CUSTOM" || type === "CAKE" || type === "CORPORATE";
}
