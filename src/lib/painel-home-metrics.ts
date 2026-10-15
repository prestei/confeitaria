import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export function pctChange(current: number, previous: number): number | null {
  if (current === 0 && previous === 0) return null;
  if (previous === 0) return 100;
  return Math.round(((current - previous) / previous) * 100);
}

export function isSameCalendarDay(a: Date, b: Date) {
  const start = startOfDay(a);
  const end = subDays(start, -1);
  return b >= start && b < end;
}

export function buildLast7DaySales(
  orders: { createdAt: Date; totalCents: number }[],
  end = new Date(),
) {
  const endDay = startOfDay(end);
  const startDay = subDays(endDay, 6);
  const days = eachDayOfInterval({ start: startDay, end: endDay });
  return days.map((day) => {
    const next = subDays(day, -1);
    const valueCents = orders
      .filter((o) => o.createdAt >= day && o.createdAt < next)
      .reduce((s, o) => s + (o.totalCents || 0), 0);
    return {
      label: format(day, "dd/MM", { locale: ptBR }),
      valueCents,
    };
  });
}

export type InsumoStockLevel = "critical" | "warning" | "attention";

export function insumoStockLevel(
  quantity: number,
  minQuantity: number,
): InsumoStockLevel {
  if (minQuantity <= 0) return "warning";
  const ratio = quantity / minQuantity;
  if (quantity <= 0 || ratio <= 0.25) return "critical";
  if (ratio <= 0.5) return "warning";
  return "attention";
}

export function insumoLevelLabel(level: InsumoStockLevel) {
  if (level === "critical") return "Crítico";
  if (level === "warning") return "Baixo";
  return "Atenção";
}

export function formatPainelHomeDate(date = new Date()) {
  return format(date, "d 'de' MMM 'de' yyyy", { locale: ptBR }).replace(
    /\./g,
    "",
  );
}

export function formatQtyWithUnit(quantity: number, unit: string) {
  const u = unit.trim() || "un";
  const formatted =
    quantity % 1 === 0
      ? quantity.toLocaleString("pt-BR")
      : quantity.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${formatted} ${u}`;
}

const CATEGORY_COLORS = [
  "#1e6b5c",
  "#7B5BA8",
  "#C47A2A",
  "#3B7CB8",
  "#1e4d45",
  "#C45A7A",
];

export function categoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

export type OrderSalesSnapshot = {
  salesTodayCents: number;
  ordersToday: number;
  salesMonthCents: number;
  unitsSoldMonth: number;
};

export function computeOrderSalesSnapshot(
  orders: {
    createdAt: Date;
    totalCents: number;
    items?: { quantity: number }[];
  }[],
  today = startOfDay(new Date()),
): OrderSalesSnapshot {
  const ordersToday = orders.filter((o) =>
    isSameCalendarDay(today, new Date(o.createdAt)),
  );
  const salesTodayCents = ordersToday.reduce(
    (s, o) => s + (o.totalCents || 0),
    0,
  );
  const salesMonthCents = orders.reduce(
    (s, o) => s + (o.totalCents || 0),
    0,
  );
  let unitsSoldMonth = 0;
  for (const order of orders) {
    for (const line of order.items || []) {
      unitsSoldMonth += line.quantity || 0;
    }
  }
  return {
    salesTodayCents,
    ordersToday: ordersToday.length,
    salesMonthCents,
    unitsSoldMonth,
  };
}
