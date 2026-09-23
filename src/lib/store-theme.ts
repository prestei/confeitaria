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

export type StoreThemeFieldGroup = "surfaces" | "brand" | "type" | "structure";

export const STORE_THEME_FIELDS: {
  key: keyof StoreTheme;
  label: string;
  hint: string;
  group: StoreThemeFieldGroup;
}[] = [
  {
    key: "background",
    label: "Fundo da página",
    hint: "Cor de fundo do cardápio",
    group: "surfaces",
  },
  {
    key: "surface",
    label: "Cards e painéis",
    hint: "Fundos de cards e header",
    group: "surfaces",
  },
  {
    key: "muted",
    label: "Superfície suave",
    hint: "Faixas e seções",
    group: "surfaces",
  },
  {
    key: "accent",
    label: "Destaque",
    hint: "Botões, preços e seleção",
    group: "brand",
  },
  {
    key: "accentDeep",
    label: "Destaque escuro",
    hint: "Hover e ênfase",
    group: "brand",
  },
  {
    key: "complement",
    label: "Complemento",
    hint: "Ícones e detalhes",
    group: "brand",
  },
  {
    key: "text",
    label: "Texto",
    hint: "Títulos e corpo",
    group: "type",
  },
  {
    key: "textMuted",
    label: "Texto secundário",
    hint: "Legendas",
    group: "type",
  },
  {
    key: "secondary",
    label: "Títulos da marca",
    hint: "Nome da loja",
    group: "type",
  },
  {
    key: "chrome",
    label: "Barra e rodapé",
    hint: "Categorias e rodapé",
    group: "structure",
  },
];

export const STORE_THEME_GROUPS: {
  id: StoreThemeFieldGroup;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "surfaces",
    title: "Superfícies",
    subtitle: "Onde o cardápio respira",
  },
  {
    id: "brand",
    title: "Marca",
    subtitle: "O que chama atenção",
  },
  {
    id: "type",
    title: "Textos",
    subtitle: "Leitura e hierarquia",
  },
  {
    id: "structure",
    title: "Estrutura",
    subtitle: "Navegação e rodapé",
  },
];

export const STORE_THEME_PRESETS: { id: string; label: string; theme: StoreTheme }[] =
  [
    { id: "classic", label: "Doce clássico", theme: DEFAULT_STORE_THEME },
    {
      id: "chocolate",
      label: "Chocolate",
      theme: {
        background: "#f4ebe3",
        surface: "#fffaf6",
        muted: "#e8d5c4",
        accent: "#7a4a32",
        accentDeep: "#5c3424",
        text: "#2a1810",
        textMuted: "#7a5c4d",
        secondary: "#3d2418",
        chrome: "#2a1810",
        complement: "#c4a574",
      },
    },
    {
      id: "pistachio",
      label: "Pistache",
      theme: {
        background: "#f3f6f1",
        surface: "#fcfdfb",
        muted: "#e2eadc",
        accent: "#5f7a58",
        accentDeep: "#466044",
        text: "#243022",
        textMuted: "#66705f",
        secondary: "#2f3d2c",
        chrome: "#243022",
        complement: "#b7c4a6",
      },
    },
    {
      id: "blueberry",
      label: "Blueberry",
      theme: {
        background: "#f3f6fb",
        surface: "#ffffff",
        muted: "#e4ebf4",
        accent: "#4f6fa8",
        accentDeep: "#3b5685",
        text: "#1f2a3d",
        textMuted: "#66748a",
        secondary: "#243044",
        chrome: "#1c2433",
        complement: "#8eb4c8",
      },
    },
    {
      id: "ink",
      label: "Tinta",
      theme: {
        background: "#f6f4f1",
        surface: "#fffcfa",
        muted: "#e7e2dc",
        accent: "#1f1f1f",
        accentDeep: "#111111",
        text: "#171717",
        textMuted: "#6b6560",
        secondary: "#111111",
        chrome: "#141414",
        complement: "#a89f96",
      },
    },
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

export function resolveStoreTheme(store: {
  accentColor?: string | null;
  secondaryColor?: string | null;
  themeColors?: Partial<StoreTheme> | null;
}): StoreTheme {
  const fromLegacy: Partial<StoreTheme> = {};
  if (isHexColor(store.accentColor)) fromLegacy.accent = store.accentColor;
  if (isHexColor(store.secondaryColor)) fromLegacy.secondary = store.secondaryColor;
  return {
    ...DEFAULT_STORE_THEME,
    ...fromLegacy,
    ...sanitizeThemePartial(store.themeColors),
  };
}

export function themesEqual(a: StoreTheme, b: StoreTheme) {
  return (Object.keys(DEFAULT_STORE_THEME) as (keyof StoreTheme)[]).every(
    (key) => a[key].toLowerCase() === b[key].toLowerCase(),
  );
}

function hexLuminance(hex: string) {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
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
