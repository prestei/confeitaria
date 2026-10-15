export function formatBRL(cents: number | null | undefined) {
  if (cents == null) return "Sob consulta";
  const negative = cents < 0;
  const abs = Math.abs(Math.round(cents));
  const reais = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const grouped = String(reais).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}R$ ${grouped},${frac}`;
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

/** Máscara de telefone BR enquanto digita: (11) 99999-8888. */
export function maskPhone(value: string) {
  let d = digitsOnly(value);
  if (d.startsWith("55") && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Máscara de reais digitando da direita: 1 → 0,01, 1250 → 12,50. */
export function maskMoney(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (!digits) return "";
  const amount = digits.replace(/^0+(?=\d)/, "");
  const padded = amount.padStart(3, "0");
  const cents = padded.slice(-2);
  const reais = padded
    .slice(0, -2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${reais},${cents}`;
}

/** Converte o texto mascarado (ou só dígitos de centavos) em centavos. */
export function parseMoneyToCents(value: string) {
  const digits = digitsOnly(value);
  if (!digits) return 0;
  const n = Number(digits);
  return Number.isFinite(n) ? n : 0;
}

/** Formata BR celular/fixo (ex.: (11) 99999-8888). */
export function formatPhone(phone: string) {
  if (!digitsOnly(phone)) return phone;
  return maskPhone(phone);
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
  NEW: "Aguardando confirmação",
  REVIEWING: "Em análise",
  CONFIRMED: "Confirmado",
  IN_PRODUCTION: "Em produção",
  READY: "Pronto",
  DELIVERED: "Entregue",
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

/** Formas aceitas na retirada ou entrega (combinadas pelo WhatsApp). */
export const OFFLINE_PAYMENT_PRESETS = [
  "Pix",
  "Dinheiro",
  "Cartão de débito",
  "Cartão de crédito",
  "Vale-refeição (VR)",
  "Vale-alimentação (VA)",
  "Transferência bancária",
  "Sinal para encomenda",
] as const;

/** Valores padrão para lojas novas — pagar na entrega/retirada. */
export const DEFAULT_ON_DELIVERY_PAYMENT_METHODS: readonly string[] = [
  "Pix",
  "Dinheiro",
  "Cartão de débito",
  "Cartão de crédito",
  "Vale-refeição (VR)",
  "Vale-alimentação (VA)",
];

export const CARD_BRAND_PRESETS = [
  "Visa",
  "Mastercard",
  "Elo",
  "American Express",
  "Hipercard",
] as const;

export function acceptsCardBrands(methods: string[]) {
  return methods.some((m) => /cartão de crédito|cartão de débito/i.test(m));
}

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
  if (/vale-refeição|vale-alimentação|\(vr\)|\(va\)/i.test(method)) {
    return "Aceito na retirada ou entrega";
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
