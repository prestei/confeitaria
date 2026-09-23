export type StoreTypography = "elegant" | "sans" | "soft";
export type StoreCardStyle = "soft" | "sharp" | "minimal";
export type StorePageLayout = "classic" | "catalog" | "showcase";

export type StoreAppearance = {
  typography: StoreTypography;
  cardStyle: StoreCardStyle;
  pageLayout: StorePageLayout;
};

export const DEFAULT_STORE_APPEARANCE: StoreAppearance = {
  typography: "elegant",
  cardStyle: "soft",
  pageLayout: "classic",
};

export function normalizeTypography(
  value: string | null | undefined,
): StoreTypography {
  if (value === "sans" || value === "soft") return value;
  return "elegant";
}

export function normalizeCardStyle(
  value: string | null | undefined,
): StoreCardStyle {
  if (value === "sharp" || value === "minimal") return value;
  return "soft";
}

export function normalizePageLayout(
  value: string | null | undefined,
): StorePageLayout {
  if (value === "catalog" || value === "showcase") return value;
  return "classic";
}

export function resolveStoreAppearance(partial?: {
  typography?: string | null;
  cardStyle?: string | null;
  pageLayout?: string | null;
} | null): StoreAppearance {
  if (!partial) return DEFAULT_STORE_APPEARANCE;
  return {
    typography: normalizeTypography(partial.typography),
    cardStyle: normalizeCardStyle(partial.cardStyle),
    pageLayout: normalizePageLayout(partial.pageLayout),
  };
}

export function storeTypographyClass(typography: StoreTypography): string {
  return `store-typography-${typography}`;
}

/** Border radius shared by product thumbnails and desktop cards. */
export function productCardRadius(cardStyle: StoreCardStyle): string {
  if (cardStyle === "sharp") return "rounded-md";
  if (cardStyle === "minimal") return "rounded-lg";
  return "rounded-xl";
}

export function desktopProductCardShell(cardStyle: StoreCardStyle): string {
  if (cardStyle === "sharp") {
    return "rounded-md border border-cocoa/15 bg-surface shadow-none";
  }
  if (cardStyle === "minimal") {
    return "rounded-lg border border-cocoa/10 bg-surface shadow-[0_2px_12px_rgba(51,37,34,0.04)]";
  }
  return "rounded-2xl border border-sky/20 bg-surface shadow-[0_8px_28px_rgba(106,155,184,0.08)]";
}
