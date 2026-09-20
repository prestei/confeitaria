"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";

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
}: {
  store: VitrineStore;
  origin: string;
  products: PreviewProduct[];
}) {
  const [form, setForm] = useState(store);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"identity" | "appearance">("identity");

  const publicUrl = `${origin}/${form.slug}`;

  const previewProducts = useMemo(() => {
    const featured = products.filter((p) => p.featured).slice(0, 2);
    const rest = products.filter((p) => !p.featured).slice(0, 4);
    return { featured, list: rest.length ? rest : products.slice(0, 4) };
  }, [products]);

  function set<K extends keyof VitrineStore>(key: K, value: VitrineStore[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

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
        accentColor: form.accentColor,
        secondaryColor: form.secondaryColor,
        typography: form.typography,
        cardStyle: form.cardStyle,
        pageLayout: form.pageLayout,
        businessHours: form.businessHours || "",
        isPublished: form.isPublished,
      }),
    });
    setLoading(false);
    setMessage(res.ok ? "Vitrine salva" : "Não foi possível salvar");
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

        <div className="inline-flex rounded-xl border border-cocoa/10 bg-white p-0.5">
          {(
            [
              ["identity", "Identidade"],
              ["appearance", "Aparência"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-semibold transition",
                tab === id ? "bg-fog text-cocoa" : "text-cocoa-soft/65",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "identity" ? (
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
            <Field label="URL do logo">
              <input
                className="input"
                value={form.logoUrl || ""}
                onChange={(e) => set("logoUrl", e.target.value)}
              />
            </Field>
            <Field label="URL da capa">
              <input
                className="input"
                value={form.coverUrl || ""}
                onChange={(e) => set("coverUrl", e.target.value)}
              />
            </Field>
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
          <div className="grid gap-4 rounded-2xl border border-cocoa/8 bg-white p-5 sm:grid-cols-2">
            <Field label="Cor principal">
              <input
                type="color"
                className="h-11 w-full cursor-pointer rounded-xl border border-cocoa/10 bg-white p-1"
                value={form.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
              />
            </Field>
            <Field label="Cor secundária">
              <input
                type="color"
                className="h-11 w-full cursor-pointer rounded-xl border border-cocoa/10 bg-white p-1"
                value={form.secondaryColor}
                onChange={(e) => set("secondaryColor", e.target.value)}
              />
            </Field>
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
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn-primary !py-2.5 text-sm" disabled={loading}>
            {loading ? "Salvando…" : "Salvar vitrine"}
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
          <div className="max-h-[560px] overflow-y-auto bg-white scrollbar-thin">
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
                  style={{ backgroundColor: form.accentColor }}
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
                    style={{ color: form.secondaryColor }}
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
                        accent={form.accentColor}
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
                        accent={form.accentColor}
                        cardStyle={form.cardStyle}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-fog/80 px-3 py-2.5 text-[10px] text-cocoa-soft/70">
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
                style={{ backgroundColor: form.accentColor }}
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
    <div className={cn("flex gap-2 border border-cocoa/8 bg-white p-2", radius)}>
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
