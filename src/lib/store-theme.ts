import type { CSSProperties } from "react";

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

export type StoreTheme = {
  background: string;
  surface: string;
  muted: string;
  accent: string;
  accentDeep: string;
  text: string;
  textMuted: string;
  secondary: string;
  chrome: string;
  complement: string;
};

export const DEFAULT_STORE_THEME: StoreTheme = {
  background: "#f8f5f0",
  surface: "#fffdfc",
  muted: "#efe7de",
  accent: "#C45B7A",
  accentDeep: "#9a5966",
  text: "#332522",
  textMuted: "#756761",
  secondary: "#4A2F26",
  chrome: "#2a1f1c",
  complement: "#c98f86",
};

export const STORE_THEME_FIELDS: {
  key: "accent" | "secondary";
  label: string;
  hint: string;
}[] = [
  {
    key: "accent",
    label: "Cor primária",
    hint: "Botões, preços e seleção",
  },
  {
    key: "secondary",
    label: "Cor secundária",
    hint: "Nome da loja, textos e barra",
  },
];

export const STORE_THEME_PRESETS: {
  id: string;
  label: string;
  primary: string;
  secondary: string;
}[] = [
  {
    id: "classic",
    label: "Doce clássico",
    primary: DEFAULT_STORE_THEME.accent,
    secondary: DEFAULT_STORE_THEME.secondary,
  },
  { id: "chocolate", label: "Chocolate", primary: "#7a4a32", secondary: "#3d2418" },
  { id: "pistachio", label: "Pistache", primary: "#5f7a58", secondary: "#2f3d2c" },
  { id: "blueberry", label: "Blueberry", primary: "#4f6fa8", secondary: "#243044" },
  { id: "ink", label: "Tinta", primary: "#1f1f1f", secondary: "#111111" },
];

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value);
}

export function sanitizeThemePartial(
  input: unknown,
): Partial<StoreTheme> {
  if (!input || typeof input !== "object") return {};
  const raw = input as Record<string, unknown>;
  const next: Partial<StoreTheme> = {};
  for (const key of Object.keys(DEFAULT_STORE_THEME) as (keyof StoreTheme)[]) {
    if (isHexColor(raw[key])) next[key] = raw[key].toLowerCase();
  }
  return next;
}

export function themeFromBrand(primary: string, secondary: string): StoreTheme {
  const accent = isHexColor(primary)
    ? primary.toLowerCase()
    : DEFAULT_STORE_THEME.accent;
  const brand = isHexColor(secondary)
    ? secondary.toLowerCase()
    : DEFAULT_STORE_THEME.secondary;
  const ink = hexLuminance(brand) < 0.42 ? brand : mixHex(brand, "#1a1210", 0.55);
  const warm = mixHex(accent, brand, 0.45);

  if (
    accent === DEFAULT_STORE_THEME.accent.toLowerCase() &&
    brand === DEFAULT_STORE_THEME.secondary.toLowerCase()
  ) {
    return {
      ...DEFAULT_STORE_THEME,
      accent: DEFAULT_STORE_THEME.accent.toLowerCase(),
      secondary: DEFAULT_STORE_THEME.secondary.toLowerCase(),
    };
  }

  return {
    accent,
    accentDeep: mixHex(accent, "#1a1210", 0.22),
    complement: mixHex(accent, "#ffffff", 0.28),
    secondary: brand,
    chrome: mixHex(ink, "#0d0807", 0.18),
    text: mixHex(ink, "#1a1210", 0.2),
    textMuted: mixHex(ink, "#c4b8b0", 0.52),
    background: mixHex("#ffffff", warm, 0.07),
    surface: mixHex("#ffffff", accent, 0.025),
    muted: mixHex("#ffffff", warm, 0.14),
  };
}

export function resolveStoreTheme(store: {
  accentColor?: string | null;
  secondaryColor?: string | null;
  themeColors?: Partial<StoreTheme> | null;
}): StoreTheme {
  const saved = sanitizeThemePartial(store.themeColors);
  const primary = isHexColor(saved.accent)
    ? saved.accent
    : isHexColor(store.accentColor)
      ? store.accentColor
      : DEFAULT_STORE_THEME.accent;
  const secondary = isHexColor(saved.secondary)
    ? saved.secondary
    : isHexColor(store.secondaryColor)
      ? store.secondaryColor
      : DEFAULT_STORE_THEME.secondary;
  return themeFromBrand(primary, secondary);
}

export function themesEqual(a: StoreTheme, b: StoreTheme) {
  return (Object.keys(DEFAULT_STORE_THEME) as (keyof StoreTheme)[]).every(
    (key) => a[key].toLowerCase() === b[key].toLowerCase(),
  );
}

function parseHex(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

function mixHex(a: string, b: string, amountOfB: number) {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(
    ar + (br - ar) * amountOfB,
    ag + (bg - ag) * amountOfB,
    ab + (bb - ab) * amountOfB,
  );
}

function hexLuminance(hex: string) {
  const [r, g, b] = parseHex(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function isLightHex(hex: string) {
  return isHexColor(hex) && hexLuminance(hex) > 0.62;
}

export function storeThemeToCssVars(theme: StoreTheme): CSSProperties {
  const blush = `color-mix(in oklab, ${theme.accent} 16%, white)`;
  const babySoft = `color-mix(in oklab, ${theme.muted} 70%, ${theme.background})`;
  const babyMid = `color-mix(in oklab, ${theme.muted} 85%, ${theme.accent})`;
  const sky = `color-mix(in oklab, ${theme.accent} 35%, ${theme.muted})`;
  const hairline = `color-mix(in oklab, ${theme.text} 10%, transparent)`;

  const tokens: Record<string, string> = {
    "--ivory": theme.background,
    "--sand": theme.muted,
    "--fog": theme.muted,
    "--stone": theme.muted,
    "--surface": theme.surface,
    "--cream": theme.background,
    "--background": theme.background,
    "--cocoa": theme.text,
    "--foreground": theme.text,
    "--cocoa-soft": theme.textMuted,
    "--ink-muted": theme.textMuted,
    "--rosewood": theme.accent,
    "--rosewood-deep": theme.accentDeep,
    "--berry": theme.accent,
    "--berry-deep": theme.accentDeep,
    "--blush": blush,
    "--butter": theme.muted,
    "--caramel": theme.complement,
    "--terracotta": theme.complement,
    "--rose": theme.accent,
    "--sage": theme.complement,
    "--baby": theme.background,
    "--baby-soft": babySoft,
    "--baby-mid": babyMid,
    "--sky": sky,
    "--sky-deep": theme.accentDeep,
    "--hairline": hairline,
    "--store-chrome": theme.chrome,
    "--store-chrome-fg":
      hexLuminance(theme.chrome) > 0.62 ? theme.text : "#fffdfc",
    "--store-secondary": theme.secondary,
  };

  for (const [key, value] of Object.entries(tokens)) {
    tokens[`--color-${key.slice(2)}`] = value;
  }
  tokens["--color-background"] = theme.background;
  tokens["--color-foreground"] = theme.text;

  return tokens as CSSProperties;
}

export const STORE_THEME_CHANNEL = "docepedido-store-theme";
