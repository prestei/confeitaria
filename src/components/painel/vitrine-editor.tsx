"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ImageField } from "@/components/painel/image-field";
import { cn } from "@/lib/cn";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";
import {
  isHexColor,
  isLightHex,
  resolveStoreTheme,
  STORE_THEME_CHANNEL,
  STORE_THEME_FIELDS,
  STORE_THEME_GROUPS,
  STORE_THEME_PRESETS,
  storeThemeToCssVars,
  type StoreTheme,
} from "@/lib/store-theme";

export type VitrineStore = {
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  whatsapp: string;
  whatsappMessage: string | null;
  instagram: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  accentColor: string;
  secondaryColor: string;
  themeColors?: Partial<StoreTheme> | null;
  typography: string;
  cardStyle: string;
  pageLayout: string;
  businessHours: string | null;
  address: string | null;
  city: string | null;
  isPublished: boolean;
};

type PreviewProduct = {
  name: string;
  priceLabel: string;
  imageUrl: string | null;
  featured?: boolean;
};

export function VitrineEditor({
  store,
  origin,
  products,
  initialTab = "identity",
  appearanceOnly = false,
}: {
  store: VitrineStore;
  origin: string;
  products: PreviewProduct[];
  initialTab?: "identity" | "appearance";
  appearanceOnly?: boolean;
}) {
  const [form, setForm] = useState({
    ...store,
    themeColors: resolveStoreTheme(store),
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState("");
  const [tab, setTab] = useState<"identity" | "appearance">(
    appearanceOnly ? "appearance" : initialTab,
  );
  const skipLiveSave = useRef(true);
  const theme = resolveStoreTheme(form);

  const publicUrl = `${origin}/${form.slug}`;

  const previewProducts = useMemo(() => {
    const featured = products.filter((p) => p.featured).slice(0, 2);
    const rest = products.filter((p) => !p.featured).slice(0, 4);
    return { featured, list: rest.length ? rest : products.slice(0, 4) };
  }, [products]);

  function set<K extends keyof VitrineStore>(key: K, value: VitrineStore[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function patchTheme(patch: Partial<StoreTheme>) {
    setForm((f) => {
      const next = { ...resolveStoreTheme(f), ...patch };
      for (const key of Object.keys(next) as (keyof StoreTheme)[]) {
        next[key] = next[key].toLowerCase();
      }
      return {
        ...f,
        themeColors: next,
        accentColor: next.accent,
        secondaryColor: next.secondary,
      };
    });
  }

  function broadcastTheme(next: StoreTheme) {
    try {
      const channel = new BroadcastChannel(STORE_THEME_CHANNEL);
      channel.postMessage({ slug: form.slug, theme: next });
      channel.close();
    } catch {
      /* some browsers block BroadcastChannel */
    }
  }

  useEffect(() => {
    if (skipLiveSave.current) {
      skipLiveSave.current = false;
      return;
    }
    const next = resolveStoreTheme(form);
    broadcastTheme(next);
    const timer = window.setTimeout(async () => {
      setLiveStatus("Atualizando cardápio…");
      const res = await fetch("/api/store", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeColors: next }),
      });
      setLiveStatus(
        res.ok
          ? "Cores no cardápio em tempo real"
          : "Não foi possível atualizar as cores",
      );
    }, 350);
    return () => window.clearTimeout(timer);
    // Persist only when the palette changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.themeColors, form.accentColor, form.secondaryColor]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        tagline: form.tagline || "",
        description: form.description || "",
        whatsapp: form.whatsapp,
        whatsappMessage: form.whatsappMessage || "",
        instagram: form.instagram || "",
        address: form.address || "",
        city: form.city || "",
        coverUrl: form.coverUrl || "",
        logoUrl: form.logoUrl || "",
        accentColor: theme.accent,
        secondaryColor: theme.secondary,
        themeColors: theme,
        typography: form.typography,
        cardStyle: form.cardStyle,
        pageLayout: form.pageLayout,
        businessHours: form.businessHours || "",
        isPublished: form.isPublished,
      }),
    });
    setLoading(false);
    setMessage(res.ok ? "Vitrine salva" : "Não foi possível salvar");
    if (res.ok) broadcastTheme(theme);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cocoa/8 bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-cocoa-soft/50">
              Link da vitrine
            </p>
            <p className="truncate text-sm font-medium text-berry">{publicUrl}</p>
          </div>
          <Link
            href={`/${form.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl bg-cocoa px-3 py-2 text-xs font-semibold text-white"
          >
            Ver minha vitrine
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {!appearanceOnly ? (
        <FilterChipGroup>
          {(
            [
              ["identity", "Identidade"],
              ["appearance", "Cores e aparência"],
            ] as const
          ).map(([id, label]) => (
            <FilterChip
              key={id}
              label={label}
              active={tab === id}
              onClick={() => setTab(id)}
            />
          ))}
        </FilterChipGroup>
        ) : null}

        {tab === "identity" && !appearanceOnly ? (
          <div className="grid gap-4 rounded-2xl border border-cocoa/8 bg-white p-5 sm:grid-cols-2">
            <Field label="Nome da marca">
              <input
                className="input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
              />
            </Field>
            <Field label="WhatsApp">
              <input
                className="input"
                value={form.whatsapp}
                onChange={(e) => set("whatsapp", e.target.value)}
                required
              />
            </Field>
            <Field label="Instagram" className="sm:col-span-2">
              <input
                className="input"
                placeholder="@suamarca"
                value={form.instagram || ""}
                onChange={(e) => set("instagram", e.target.value)}
              />
            </Field>
            <Field label="Tagline" className="sm:col-span-2">
              <input
                className="input"
                value={form.tagline || ""}
                onChange={(e) => set("tagline", e.target.value)}
              />
            </Field>
            <Field label="Descrição" className="sm:col-span-2">
              <textarea
                className="input min-h-24"
                value={form.description || ""}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <div className="sm:col-span-2">
              <ImageField
                label="Logo"
                value={form.logoUrl || ""}
                onChange={(url) => set("logoUrl", url || null)}
                hint="Aparece no card da loja, sobre o banner. JPEG, PNG, WebP ou GIF · até 5 MB"
              />
            </div>
            <div className="sm:col-span-2">
              <ImageField
                label="Banner"
                value={form.coverUrl || ""}
                onChange={(url) => set("coverUrl", url || null)}
                previewClassName="h-28 w-full max-w-md sm:h-32"
                hint="Foto de capa no topo da vitrine. Use uma imagem larga (cerca de 1600×400)."
              />
            </div>
            <Field label="Endereço">
              <input
                className="input"
                value={form.address || ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <Field label="Cidade">
              <input
                className="input"
                value={form.city || ""}
                onChange={(e) => set("city", e.target.value)}
              />
            </Field>
            <Field label="Horário de atendimento" className="sm:col-span-2">
              <input
                className="input"
                placeholder="Seg–Sex 9h–18h · Sáb 9h–13h"
                value={form.businessHours || ""}
                onChange={(e) => set("businessHours", e.target.value)}
              />
            </Field>
            <Field label="Mensagem automática do WhatsApp" className="sm:col-span-2">
              <textarea
                className="input min-h-20"
                placeholder="Olá! Vi sua vitrine e gostaria de fazer um pedido."
                value={form.whatsappMessage || ""}
                onChange={(e) => set("whatsappMessage", e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-cocoa sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => set("isPublished", e.target.checked)}
              />
              Vitrine publicada
            </label>
          </div>
        ) : (
          <div className="space-y-7 rounded-2xl border border-cocoa/8 bg-white p-5 sm:p-6">
            <div>
              <p className="text-sm font-semibold tracking-tight text-cocoa">
                Paletas prontas
              </p>
              <p className="mt-0.5 text-[11px] text-cocoa-soft/55">
                {liveStatus ||
                  "As cores atualizam a prévia na hora e o cardápio aberto em outra aba."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STORE_THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => patchTheme(preset.theme)}
                    className="inline-flex items-center gap-2.5 rounded-full border border-cocoa/10 bg-fog/30 px-3 py-1.5 text-xs font-semibold text-cocoa shadow-sm transition hover:-translate-y-0.5 hover:border-cocoa/20 hover:bg-white hover:shadow-md"
                  >
                    <span className="flex overflow-hidden rounded-full ring-1 ring-black/5">
                      {[
                        preset.theme.accent,
                        preset.theme.background,
                        preset.theme.chrome,
                      ].map((c) => (
                        <span
                          key={`${preset.id}-${c}`}
                          className="h-4 w-4"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </span>
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {STORE_THEME_GROUPS.map((group) => {
              const fields = STORE_THEME_FIELDS.filter((f) => f.group === group.id);
              return (
                <div key={group.id}>
                  <div className="mb-3">
                    <p className="text-sm font-semibold tracking-tight text-cocoa">
                      {group.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-cocoa-soft/55">
                      {group.subtitle}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {fields.map((field) => (
                      <ColorSwatch
                        key={field.key}
                        label={field.label}
                        hint={field.hint}
                        value={theme[field.key]}
                        onChange={(value) => patchTheme({ [field.key]: value })}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="grid gap-4 border-t border-cocoa/8 pt-6 sm:grid-cols-2">
            <Field label="Tipografia">
              <select
                className="input"
                value={form.typography}
                onChange={(e) => set("typography", e.target.value)}
              >
                <option value="elegant">Elegante (serif)</option>
                <option value="sans">Moderna (sans)</option>
                <option value="soft">Acolhedora</option>
              </select>
            </Field>
            <Field label="Estilo dos cards">
              <select
                className="input"
                value={form.cardStyle}
                onChange={(e) => set("cardStyle", e.target.value)}
              >
                <option value="soft">Suave</option>
                <option value="sharp">Reto</option>
                <option value="minimal">Minimal</option>
              </select>
            </Field>
            <Field label="Organização da página" className="sm:col-span-2">
              <select
                className="input"
                value={form.pageLayout}
                onChange={(e) => set("pageLayout", e.target.value)}
              >
                <option value="classic">Clássica — capa + destaques + lista</option>
                <option value="catalog">Catálogo — categorias em evidência</option>
                <option value="showcase">Vitrine — foco em imagens</option>
              </select>
            </Field>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary !py-2.5 text-sm" disabled={loading}>
            {loading
              ? "Salvando…"
              : appearanceOnly
                ? "Salvar tipografia e layout"
                : "Salvar vitrine"}
          </button>
          {message && (
            <p className="text-sm text-cocoa-soft/70">{message}</p>
          )}
        </div>
      </form>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-cocoa-soft/50">
          Prévia mobile
        </p>
        <div className="mx-auto w-[280px] overflow-hidden rounded-[1.75rem] border-[6px] border-cocoa shadow-lg">
          <div
            className="store-theme max-h-[560px] overflow-y-auto bg-ivory scrollbar-thin"
            style={storeThemeToCssVars(theme)}
          >
            <div
              className="relative h-28 bg-fog"
              style={{
                backgroundImage: form.coverUrl
                  ? `url(${form.coverUrl})`
                  : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
            </div>
            <div className="-mt-8 px-3 pb-4">
              <div className="flex items-end gap-2">
                <div
                  className="h-14 w-14 overflow-hidden rounded-2xl border-2 border-white bg-fog shadow"
                  style={{ backgroundColor: theme.accent }}
                >
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.logoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="pb-1">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      form.typography === "sans" ? "font-sans" : "font-display",
                    )}
                    style={{ color: theme.secondary }}
                  >
                    {form.name || "Sua marca"}
                  </p>
                  {form.tagline && (
                    <p className="text-[10px] text-cocoa-soft/65 line-clamp-1">
                      {form.tagline}
                    </p>
                  )}
                </div>
              </div>

              {form.description && (
                <p className="mt-3 text-[11px] leading-relaxed text-cocoa-soft/75 line-clamp-3">
                  {form.description}
                </p>
              )}

              <div
                className="mt-3 flex gap-1 overflow-hidden rounded-lg px-2 py-1.5"
                style={{
                  backgroundColor: theme.chrome,
                  color: "var(--store-chrome-fg)",
                }}
              >
                {["Bolos", "Doces", "Kits"].map((label, i) => (
                  <span
                    key={label}
                    className={cn(
                      "rounded-md px-2 py-1 text-[10px] font-semibold",
                      i === 0 ? "bg-rosewood text-white" : "opacity-75",
                    )}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {previewProducts.featured.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-cocoa-soft/45">
                    Em destaque
                  </p>
                  <div className="mt-2 space-y-2">
                    {previewProducts.featured.map((p) => (
                      <PreviewCard
                        key={p.name}
                        product={p}
                        accent={theme.accent}
                        cardStyle={form.cardStyle}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-cocoa-soft/45">
                  Produtos
                </p>
                <div className="mt-2 space-y-2">
                  {previewProducts.list.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-cocoa/15 px-3 py-4 text-center text-[11px] text-cocoa-soft/55">
                      Cadastre produtos para ver a vitrine completa
                    </p>
                  ) : (
                    previewProducts.list.map((p) => (
                      <PreviewCard
                        key={p.name}
                        product={p}
                        accent={theme.accent}
                        cardStyle={form.cardStyle}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-sand px-3 py-2.5 text-[10px] text-cocoa-soft">
                {form.businessHours && <p>{form.businessHours}</p>}
                {(form.address || form.city) && (
                  <p className="mt-0.5">
                    {[form.address, form.city].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              <button
                type="button"
                className="mt-3 w-full rounded-xl py-2.5 text-xs font-semibold text-white"
                style={{ backgroundColor: theme.accent }}
              >
                Pedir no WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorSwatch({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  const pickerRef = useRef<HTMLInputElement>(null);
  const hex = isHexColor(value) ? value.toLowerCase() : "#000000";
  const light = isLightHex(hex);

  useEffect(() => {
    setText(value);
  }, [value]);

  function commit(next: string) {
    const normalized = next.startsWith("#") ? next : `#${next}`;
    if (!isHexColor(normalized)) return;
    onChange(normalized.toLowerCase());
  }

  function openPicker() {
    const el = pickerRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* fall back to click() */
      }
    }
    el.click();
  }

  return (
    <div className="group relative rounded-2xl border border-cocoa/8 bg-white shadow-[0_8px_24px_rgba(51,37,34,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-cocoa/16 hover:shadow-[0_16px_32px_rgba(51,37,34,0.08)]">
      <button
        type="button"
        onClick={openPicker}
        className="block w-full text-left"
        aria-label={`Escolher ${label}`}
      >
        <span className="relative block h-[5.5rem] overflow-hidden rounded-t-2xl">
          <span
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(45deg, #ece7e2 25%, transparent 25%), linear-gradient(-45deg, #ece7e2 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ece7e2 75%), linear-gradient(-45deg, transparent 75%, #ece7e2 75%)",
              backgroundSize: "12px 12px",
              backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
            }}
          />
          <span
            className="absolute inset-0"
            style={{ backgroundColor: hex }}
          />
          <span
            className={cn(
              "absolute right-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md",
              light ? "bg-white/80 text-cocoa" : "bg-white/15 text-white",
            )}
          >
            Editar
          </span>
        </span>
        <span className="block px-3.5 pt-3">
          <span className="block text-sm font-semibold leading-tight text-cocoa">
            {label}
          </span>
          <span className="mt-0.5 block text-[11px] leading-snug text-cocoa-soft/55">
            {hint}
          </span>
        </span>
      </button>
      <div className="px-3.5 pb-3 pt-2">
        <input
          className="w-full rounded-lg border border-cocoa/8 bg-fog/50 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wide text-cocoa outline-none transition focus:border-cocoa/25 focus:bg-white"
          value={text}
          onChange={(e) => {
            const next = e.target.value.startsWith("#")
              ? e.target.value
              : `#${e.target.value}`;
            setText(next);
            commit(next);
          }}
          maxLength={7}
          spellCheck={false}
          aria-label={`Código hexadecimal de ${label}`}
        />
      </div>
      <input
        ref={pickerRef}
        type="color"
        className="pointer-events-none absolute h-px w-px opacity-0"
        value={hex}
        onChange={(e) => commit(e.target.value)}
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function PreviewCard({
  product,
  accent,
  cardStyle,
}: {
  product: PreviewProduct;
  accent: string;
  cardStyle: string;
}) {
  const radius =
    cardStyle === "sharp"
      ? "rounded-md"
      : cardStyle === "minimal"
        ? "rounded-lg"
        : "rounded-xl";
  return (
    <div className={cn("flex gap-2 border border-cocoa/8 bg-surface p-2", radius)}>
      <div
        className={cn("h-12 w-12 shrink-0 overflow-hidden bg-fog", radius)}
        style={{ backgroundColor: `${accent}22` }}
      >
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-cocoa">
          {product.name}
        </p>
        <p className="text-[10px] font-medium" style={{ color: accent }}>
          {product.priceLabel}
        </p>
      </div>
    </div>
  );
}
