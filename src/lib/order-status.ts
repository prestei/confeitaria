/** Status that count as a confirmed sale (faturamento e total gasto). */
export const SALE_STATUSES = new Set([
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
  "DELIVERED",
]);

const NEXT: Record<string, string[]> = {
  NEW: ["REVIEWING", "CONFIRMED", "CANCELLED"],
  REVIEWING: ["NEW", "CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["READY", "CANCELLED"],
  READY: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["CANCELLED"],
  CANCELLED: [],
};

export function canTransitionStatus(from: string, to: string) {
  if (from === to) return true;
  return (NEXT[from] ?? []).includes(to);
}

export function allowedStatuses(from: string) {
  return [from, ...(NEXT[from] ?? [])];
}
