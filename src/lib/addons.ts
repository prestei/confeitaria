import { AddonSelectionType, type AddonSelectionType as AddonSelectionTypeT } from "@/lib/enums";

export const UPSELL_SOURCE = "UPSELL";

export function visibleCustomizations(
  custom: Record<string, unknown> | null | undefined,
) {
  if (!custom) return {};
  return Object.fromEntries(
    Object.entries(custom).filter(([k]) => !k.startsWith("__")),
  );
}

export type ResolvedAddon = {
  id: string;
  name: string;
  priceCents: number;
  maxQty: number;
  selectionType: AddonSelectionTypeT;
  noteLabel: string | null;
  noteRequired: boolean;
  imageUrl: string | null;
  description: string | null;
};

type ProductAddonLike = {
  id?: string;
  _id?: string;
  name: string;
  priceCents: number;
  maxQty?: number;
};

type CatalogAddonLike = {
  id?: string;
  _id?: string;
  name: string;
  priceCents: number;
  maxQty?: number;
  selectionType?: AddonSelectionTypeT | string;
  noteLabel?: string | null;
  noteRequired?: boolean;
  imageUrl?: string | null;
  description?: string | null;
  categoryIds?: string[] | null;
  active?: boolean;
  sortOrder?: number;
};

export function addonAppliesToCategory(
  addon: { categoryIds?: string[] | null },
  categoryId: string | null | undefined,
) {
  const ids = addon.categoryIds ?? [];
  if (ids.length === 0) return true;
  if (!categoryId) return false;
  return ids.includes(categoryId);
}

function idOf(doc: { id?: string; _id?: string }) {
  return String(doc.id ?? doc._id ?? "");
}

export function productAddonToResolved(addon: ProductAddonLike): ResolvedAddon {
  return {
    id: idOf(addon),
    name: addon.name,
    priceCents: addon.priceCents,
    maxQty: Math.max(1, addon.maxQty ?? 5),
    selectionType: AddonSelectionType.QTY,
    noteLabel: null,
    noteRequired: false,
    imageUrl: null,
    description: null,
  };
}

export function catalogAddonToResolved(addon: CatalogAddonLike): ResolvedAddon {
  const type = Object.values(AddonSelectionType).includes(
    addon.selectionType as AddonSelectionTypeT,
  )
    ? (addon.selectionType as AddonSelectionTypeT)
    : AddonSelectionType.QTY;
  const maxQty =
    type === AddonSelectionType.QTY
      ? Math.max(1, addon.maxQty ?? 10)
      : 1;
  return {
    id: idOf(addon),
    name: addon.name,
    priceCents: addon.priceCents,
    maxQty,
    selectionType: type,
    noteLabel: addon.noteLabel ?? null,
    noteRequired: Boolean(addon.noteRequired),
    imageUrl: addon.imageUrl ?? null,
    description: addon.description ?? null,
  };
}

export function mergeProductAddons(
  productAddons: ProductAddonLike[] | null | undefined,
  catalogAddons: unknown[] | null | undefined,
  categoryId: string | null | undefined,
): ResolvedAddon[] {
  const catalog = (catalogAddons ?? [])
    .filter((item): item is CatalogAddonLike => {
      if (!item || typeof item !== "object") return false;
      const a = item as CatalogAddonLike;
      return typeof a.name === "string" && typeof a.priceCents === "number";
    })
    .filter((a) => a.active !== false)
    .filter((a) => addonAppliesToCategory(a, categoryId))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "pt"))
    .map(catalogAddonToResolved);

  const catalogNames = new Set(catalog.map((a) => a.name.trim().toLowerCase()));
  const product = (productAddons ?? [])
    .filter((a) => a.name.trim())
    .filter((a) => !catalogNames.has(a.name.trim().toLowerCase()))
    .map(productAddonToResolved);

  return [...catalog, ...product];
}

export function formatAddonLine(name: string, qty: number, note?: string | null) {
  const base = `${qty}x ${name}`;
  const extra = note?.trim();
  return extra ? `${base} — ${extra}` : base;
}

export function parseAddonLine(entry: unknown): {
  qty: number;
  name: string;
  note: string | null;
} | null {
  const m = String(entry).match(/^(\d+)x\s+(.+)$/);
  if (!m) return null;
  const qty = Number(m[1]);
  if (!Number.isFinite(qty) || qty <= 0) return null;
  let rest = m[2].trim();
  let note: string | null = null;
  const sep = " — ";
  const idx = rest.lastIndexOf(sep);
  if (idx >= 0) {
    note = rest.slice(idx + sep.length).trim() || null;
    rest = rest.slice(0, idx).trim();
  }
  if (!rest) return null;
  return { qty, name: rest, note };
}

export function addonsTotalCents(
  addons: Array<{ name: string; priceCents: number; maxQty?: number }>,
  customizations: Record<string, unknown> | null | undefined,
): number {
  const list = customizations?.["Adicionais"];
  if (!Array.isArray(list)) return 0;
  let total = 0;
  for (const entry of list) {
    const parsed = parseAddonLine(entry);
    if (!parsed) continue;
    const addon = addons.find((a) => a.name === parsed.name);
    if (!addon) continue;
    const maxQty = Math.max(1, addon.maxQty ?? 1);
    const qty = Math.min(parsed.qty, maxQty);
    if (qty > 0) total += addon.priceCents * qty;
  }
  return total;
}
