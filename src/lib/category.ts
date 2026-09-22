import {
  ALL_CATEGORY_DAYS,
  CATEGORY_DAY_KEYS,
  type CategoryDayKey,
} from "@/lib/category-days";

export {
  ALL_CATEGORY_DAYS,
  CATEGORY_DAY_KEYS,
  type CategoryDayKey,
} from "@/lib/category-days";

export const CATEGORY_DAY_LABELS: {
  key: CategoryDayKey;
  label: string;
  short: string;
}[] = [
  { key: "seg", label: "Segunda", short: "Seg" },
  { key: "ter", label: "Terça", short: "Ter" },
  { key: "qua", label: "Quarta", short: "Qua" },
  { key: "qui", label: "Quinta", short: "Qui" },
  { key: "sex", label: "Sexta", short: "Sex" },
  { key: "sab", label: "Sábado", short: "Sáb" },
  { key: "dom", label: "Domingo", short: "Dom" },
];

const DAY_SET = new Set<string>(CATEGORY_DAY_KEYS);

export function isCategoryDayKey(value: string): value is CategoryDayKey {
  return DAY_SET.has(value);
}

export function normalizeDisplayDays(
  days: string[] | null | undefined,
): CategoryDayKey[] {
  if (!days?.length) return [...ALL_CATEGORY_DAYS];
  const unique = [
    ...new Set(days.filter(isCategoryDayKey)),
  ] as CategoryDayKey[];
  return unique.length ? unique : [...ALL_CATEGORY_DAYS];
}

/** JS getDay(): 0=Dom … 6=Sáb → chave seg–dom. */
export function todayCategoryDayKey(date = new Date()): CategoryDayKey {
  const map: CategoryDayKey[] = [
    "dom",
    "seg",
    "ter",
    "qua",
    "qui",
    "sex",
    "sab",
  ];
  return map[date.getDay()]!;
}

export function isCategoryVisibleToday(
  category: {
    active?: boolean;
    displayDays?: string[] | null;
  },
  date = new Date(),
): boolean {
  if (category.active === false) return false;
  const days = normalizeDisplayDays(category.displayDays);
  if (days.length >= ALL_CATEGORY_DAYS.length) return true;
  return days.includes(todayCategoryDayKey(date));
}

/** Ajusta preço com desconto e acréscimo da categoria. */
export function applyCategoryPriceAdjust(
  priceCents: number | null | undefined,
  opts: { discountPercent?: number; surchargePercent?: number },
): number | null {
  if (priceCents == null) return null;
  const discount = Math.min(100, Math.max(0, opts.discountPercent ?? 0));
  const surcharge = Math.max(0, opts.surchargePercent ?? 0);
  const factor = (1 - discount / 100) * (1 + surcharge / 100);
  return Math.max(0, Math.round(priceCents * factor));
}

export function formatDisplayDaysShort(
  days: string[] | null | undefined,
): string {
  const normalized = normalizeDisplayDays(days);
  if (normalized.length >= ALL_CATEGORY_DAYS.length) return "Todos os dias";
  if (normalized.length === 0) return "Todos os dias";
  const order = new Map(CATEGORY_DAY_KEYS.map((k, i) => [k, i]));
  const sorted = [...normalized].sort(
    (a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0),
  );
  const labels = Object.fromEntries(
    CATEGORY_DAY_LABELS.map((d) => [d.key, d.short]),
  );
  return sorted.map((d) => labels[d] ?? d).join(", ");
}
