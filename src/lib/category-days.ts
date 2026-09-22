/** Dias da semana em que a categoria aparece na vitrine (seg–dom). */
export const CATEGORY_DAY_KEYS = [
  "seg",
  "ter",
  "qua",
  "qui",
  "sex",
  "sab",
  "dom",
] as const;

export type CategoryDayKey = (typeof CATEGORY_DAY_KEYS)[number];

export const ALL_CATEGORY_DAYS: CategoryDayKey[] = [...CATEGORY_DAY_KEYS];
