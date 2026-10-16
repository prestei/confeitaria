"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  Info,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
} from "lucide-react";
import { SectionCard } from "@/components/painel/page-header";
import { Field, Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
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
  collectAddress?: boolean;
};

type PreviewProduct = {
  name: string;
  priceLabel: string;
  imageUrl: string | null;
  featured?: boolean;
};

type EditorTab = "basic" | "brand" | "hours" | "social";

const DESCRIPTION_MAX = 500;

const TABS: {
  id: EditorTab;
  label: string;
  shortLabel: string;
  icon: typeof FileText;
}[] = [
  {
    id: "basic",
    label: "Informações básicas",
    shortLabel: "Básico",
    icon: FileText,
  },
  {
    id: "brand",
    label: "Logo e identidade",
    shortLabel: "Visual",
    icon: ImageIcon,
  },
  {
    id: "hours",
    label: "Horário de funcionamento",
    shortLabel: "Horários",
    icon: Clock3,
  },
  {
    id: "social",
    label: "Redes sociais",
    shortLabel: "Redes",
    icon: Share2,
  },
];

const formSectionPadding = "gap-4 p-4 sm:gap-5 sm:p-5 md:p-6";

function isValidWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function IconInput({
  icon: Icon,
  trailing,
  className,
  id,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "className"> & {
  icon: typeof Phone;
  trailing?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "input flex min-h-[2.75rem] items-center gap-2.5 focus-within:border-[color-mix(in_oklab,var(--painel-brand)_35%,var(--painel-border))] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--painel-brand)_14%,transparent)]",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-[#8C8682]" aria-hidden />
      <input
        id={id}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-normal text-cocoa outline-none placeholder:text-[#8C8682]/80 md:text-sm"
        {...props}
      />
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}

export function VitrineEditor({
  store,
  origin,
  products,
}: {
  store: VitrineStore;
  origin: string;
  products: PreviewProduct[];
}) {
  const { toast } = useToast();
  const [form, setForm] = useState(store);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<EditorTab>("basic");
  const [previewOpen, setPreviewOpen] = useState(false);

  const publicUrl = `${origin}/${form.slug}`;
  const whatsappOk = isValidWhatsapp(form.whatsapp);
  const descriptionLen = form.description?.length ?? 0;

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
        collectAddress: Boolean(form.collectAddress),
      }),
    });
    setLoading(false);
    toast({
      title: res.ok ? "Alterações salvas" : "Não foi possível salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  return (
    <div className="painel-form-comfortable flex min-h-0 max-w-full flex-1 flex-col gap-4 overflow-x-hidden md:gap-6 md:overflow-visible">
      <nav
        className="grid shrink-0 grid-cols-4 gap-1 rounded-xl border border-[var(--painel-border)] bg-white p-1.5 shadow-sm lg:flex lg:gap-2 lg:p-2"
        aria-label="Seções do estabelecimento"
      >
        {TABS.map(({ id, label, shortLabel, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "inline-flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-center transition sm:px-2 lg:min-w-0 lg:flex-1 lg:flex-row lg:gap-2.5 lg:px-4 lg:py-3 lg:text-left",
                active
                  ? "bg-[#F8FAF9] font-semibold text-[var(--painel-brand,#0f352e)] ring-1 ring-inset ring-[var(--painel-accent,#1e6b5c)]/35"
                  : "text-[#5C5652] hover:bg-[#F5F4F2]",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  active
                    ? "text-[var(--painel-accent,#1e6b5c)]"
                    : "text-[#8C8682]",
                )}
                aria-hidden
              />
              <span className="w-full truncate text-[10px] leading-tight font-medium tracking-normal sm:text-[11px] lg:hidden">
                {shortLabel}
              </span>
              <span className="hidden text-xs leading-snug font-medium tracking-normal lg:inline lg:text-sm">
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] xl:items-start">
        <aside
          className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-4 xl:col-start-2 xl:row-start-1 xl:self-start"
        >
          <div className="overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white xl:border-0 xl:bg-transparent">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 p-4 text-left xl:hidden"
              onClick={() => setPreviewOpen((open) => !open)}
              aria-expanded={previewOpen}
            >
              <div className="flex min-w-0 items-start gap-2">
                <Eye
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--painel-accent,#1e6b5c)]"
                  aria-hidden
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-[var(--painel-brand,#0f352e)]">
                    Prévia da sua loja
                  </h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#8C8682]">
                    Toque para {previewOpen ? "ocultar" : "ver"} a vitrine no
                    celular.
                  </p>
                </div>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-[#8C8682] transition-transform",
                  previewOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            <div className="mb-3 hidden items-start gap-2 xl:flex">
              <Eye
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--painel-accent,#1e6b5c)]"
                aria-hidden
              />
              <div>
                <h2 className="text-sm font-semibold text-[var(--painel-brand,#0f352e)]">
                  Prévia da sua loja
                </h2>
                <p className="mt-0.5 text-xs leading-relaxed text-[#8C8682]">
                  Veja como suas informações aparecem para os clientes na sua
                  vitrine.
                </p>
              </div>
            </div>
            <div
              className={cn(
                "border-t border-[var(--painel-border)] px-4 pb-4 xl:border-0 xl:px-0 xl:pb-0",
                previewOpen ? "block" : "hidden xl:block",
              )}
            >
              <StorePreview
                form={form}
                previewProducts={previewProducts}
                publicUrl={publicUrl}
              />
            </div>
          </div>
        </aside>

        <form
          onSubmit={onSubmit}
          className="order-2 flex min-h-0 min-w-0 flex-col gap-4 xl:order-1 xl:col-start-1 xl:row-start-1 md:gap-5"
        >
          {tab === "basic" ? (
            <>
              <SectionCard title="Informações da loja">
                <div className={cn("grid sm:grid-cols-2", formSectionPadding)}>
                  <Field
                    label="Nome da marca"
                    className="min-w-0"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="estab-whatsapp">WhatsApp</Label>
                    <IconInput
                      id="estab-whatsapp"
                      icon={Phone}
                      value={form.whatsapp}
                      onChange={(e) => set("whatsapp", e.target.value)}
                      required
                      placeholder="5511999999999"
                      trailing={
                        whatsappOk ? (
                          <CheckCircle2
                            className="h-4 w-4 text-emerald-600"
                            aria-label="Número válido"
                          />
                        ) : null
                      }
                    />
                  </div>
                  <Field
                    label="Instagram"
                    placeholder="@suamarca"
                    value={form.instagram || ""}
                    onChange={(e) => set("instagram", e.target.value)}
                  />
                  <Field
                    label="Tagline"
                    value={form.tagline || ""}
                    onChange={(e) => set("tagline", e.target.value)}
                  />
                  <Field
                    as="textarea"
                    label="Descrição"
                    className="sm:col-span-2"
                    controlClassName="min-h-[8rem] leading-relaxed"
                    value={form.description || ""}
                    maxLength={DESCRIPTION_MAX}
                    onChange={(e) => set("description", e.target.value)}
                    footer={
                      <p className="mt-1 text-right text-xs text-[#8C8682]">
                        {descriptionLen}/{DESCRIPTION_MAX}
                      </p>
                    }
                  />
                </div>
              </SectionCard>

              <SectionCard title="Link e localização">
                <div className={cn("grid sm:grid-cols-2", formSectionPadding)}>
                  <div className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor="estab-logo-url">URL do logo</Label>
                    <IconInput
                      id="estab-logo-url"
                      icon={ImageIcon}
                      value={form.logoUrl || ""}
                      onChange={(e) => set("logoUrl", e.target.value)}
                      trailing={
                        form.logoUrl ? (
                          <a
                            href={form.logoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1 text-[#8C8682] hover:bg-[#F5F4F2] hover:text-[var(--painel-brand)]"
                            aria-label="Abrir URL do logo"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null
                      }
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor="estab-cover-url">URL da capa</Label>
                    <IconInput
                      id="estab-cover-url"
                      icon={ImageIcon}
                      value={form.coverUrl || ""}
                      onChange={(e) => set("coverUrl", e.target.value)}
                      trailing={
                        form.coverUrl ? (
                          <a
                            href={form.coverUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1 text-[#8C8682] hover:bg-[#F5F4F2] hover:text-[var(--painel-brand)]"
                            aria-label="Abrir URL da capa"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null
                      }
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="estab-address">Endereço</Label>
                    <IconInput
                      id="estab-address"
                      icon={MapPin}
                      value={form.address || ""}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="Rua, número, bairro"
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <Label htmlFor="estab-city">Cidade</Label>
                    <IconInput
                      id="estab-city"
                      icon={Building2}
                      value={form.city || ""}
                      onChange={(e) => set("city", e.target.value)}
                    />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 sm:col-span-2">
                    <Label htmlFor="estab-public-url">Link da vitrine</Label>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <Input
                        id="estab-public-url"
                        readOnly
                        value={publicUrl}
                        className="min-w-0 w-full text-[var(--painel-accent,#1e6b5c)]"
                      />
                      <Link
                        href={`/${form.slug}`}
                        target="_blank"
                        className="btn-secondary inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 !px-3 text-xs sm:w-auto"
                      >
                        Abrir loja
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Horário de atendimento">
                <div className={cn("space-y-3", formSectionPadding)}>
                  <div className="flex flex-col gap-2">
                    <Label id="estab-hours-display-label">
                      Resumo exibido na vitrine
                    </Label>
                    <div
                      id="estab-hours-display"
                      role="textbox"
                      aria-readonly="true"
                      aria-labelledby="estab-hours-display-label"
                      className="flex min-h-[2.75rem] items-start gap-3 rounded-lg border border-[var(--painel-border)] bg-[#F8FAF9] px-3.5 py-3 text-sm leading-relaxed text-[#5C5652]"
                    >
                      <Clock3
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#8C8682]"
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 break-words">
                        {form.businessHours?.trim() ||
                          "Nenhum horário configurado"}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-[#8C8682]">
                    O horário de atendimento pode ser ajustado nas{" "}
                    <Link
                      href="/painel/configuracoes/horarios"
                      className="font-medium text-[var(--painel-accent,#1e6b5c)] underline-offset-2 hover:underline"
                    >
                      configurações de horários
                    </Link>
                    .
                  </p>
                </div>
              </SectionCard>
            </>
          ) : null}

          {tab === "brand" ? (
            <SectionCard title="Logo e identidade visual">
              <div className={cn("grid sm:grid-cols-2", formSectionPadding)}>
                <Field
                  label="URL do logo"
                  className="min-w-0"
                  value={form.logoUrl || ""}
                  onChange={(e) => set("logoUrl", e.target.value)}
                />
                <Field
                  label="URL da capa"
                  value={form.coverUrl || ""}
                  onChange={(e) => set("coverUrl", e.target.value)}
                />
                <Field
                  label="Cor principal"
                  type="color"
                  controlClassName="h-11 w-full cursor-pointer rounded-lg border border-[var(--painel-border)] bg-white p-1"
                  value={form.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                />
                <Field
                  label="Cor secundária"
                  type="color"
                  controlClassName="h-11 w-full cursor-pointer rounded-lg border border-[var(--painel-border)] bg-white p-1"
                  value={form.secondaryColor}
                  onChange={(e) => set("secondaryColor", e.target.value)}
                />
                <Field
                  as="select"
                  label="Tipografia"
                  value={form.typography}
                  onChange={(e) => set("typography", e.target.value)}
                >
                  <option value="elegant">Elegante</option>
                  <option value="sans">Moderna (sans)</option>
                  <option value="soft">Acolhedora</option>
                </Field>
                <Field
                  as="select"
                  label="Estilo dos cards"
                  value={form.cardStyle}
                  onChange={(e) => set("cardStyle", e.target.value)}
                >
                  <option value="soft">Suave</option>
                  <option value="sharp">Reto</option>
                  <option value="minimal">Minimal</option>
                </Field>
                <Field
                  as="select"
                  label="Organização da página"
                  className="sm:col-span-2"
                  value={form.pageLayout}
                  onChange={(e) => set("pageLayout", e.target.value)}
                >
                  <option value="classic">Clássica — capa + destaques + lista</option>
                  <option value="catalog">Catálogo — categorias em evidência</option>
                  <option value="showcase">Vitrine — foco em imagens</option>
                </Field>
                <label className="flex items-center gap-2 text-sm font-medium text-cocoa sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => set("isPublished", e.target.checked)}
                  />
                  Vitrine publicada
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-cocoa sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form.collectAddress)}
                    onChange={(e) => set("collectAddress", e.target.checked)}
                  />
                  Pedir endereço no checkout
                </label>
              </div>
            </SectionCard>
          ) : null}

          {tab === "hours" ? (
            <SectionCard title="Horário de funcionamento">
              <div className={cn("space-y-4", formSectionPadding)}>
                <p className="text-sm leading-relaxed text-[#5C5652]">
                  Defina dias e horários em que sua loja atende. O resumo aparece na
                  vitrine e na prévia ao lado.
                </p>
                <div className="rounded-lg border border-[var(--painel-border)] bg-[#F8FAF9] px-4 py-3 text-sm text-[#5C5652]">
                  {form.businessHours?.trim() || "Nenhum horário cadastrado ainda."}
                </div>
                <Link
                  href="/painel/configuracoes/horarios"
                  className="btn-primary inline-flex h-10 w-full items-center justify-center gap-2 !px-4 text-sm sm:w-auto"
                >
                  <Clock3 className="h-4 w-4" aria-hidden />
                  Gerenciar horários
                </Link>
              </div>
            </SectionCard>
          ) : null}

          {tab === "social" ? (
            <SectionCard title="Redes sociais e contato">
              <div className={cn("grid sm:grid-cols-2", formSectionPadding)}>
                <Field
                  label="WhatsApp"
                  className="min-w-0"
                  value={form.whatsapp}
                  onChange={(e) => set("whatsapp", e.target.value)}
                  required
                  hint="Com DDI e DDD, só números."
                />
                <Field
                  label="Instagram"
                  placeholder="@suamarca"
                  value={form.instagram || ""}
                  onChange={(e) => set("instagram", e.target.value)}
                />
                <Field
                  as="textarea"
                  label="Mensagem automática do WhatsApp"
                  className="sm:col-span-2"
                  controlClassName="min-h-24"
                  placeholder="Olá! Vi sua vitrine e gostaria de fazer um pedido."
                  value={form.whatsappMessage || ""}
                  onChange={(e) => set("whatsappMessage", e.target.value)}
                />
              </div>
            </SectionCard>
          ) : null}

          <div
            className="mt-2 flex w-full shrink-0 flex-col gap-4 rounded-xl border border-[var(--painel-border)] bg-white px-4 py-4 shadow-sm md:mt-auto md:flex-row md:items-center md:justify-between md:px-5"
          >
            <p className="hidden min-w-0 flex-1 items-start gap-2 text-xs leading-relaxed text-[#5C5652] md:flex">
              <Info
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--painel-brand)]"
                aria-hidden
              />
              As informações serão exibidas na sua vitrine e no link de
              compartilhamento para seus clientes.
            </p>
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end md:w-auto md:shrink-0">
              <Link
                href="/painel/configuracoes"
                className="btn-secondary inline-flex h-11 w-full items-center justify-center !py-2 text-sm sm:h-10 sm:w-auto"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="btn-primary inline-flex h-11 w-full items-center justify-center gap-2 !py-2 text-sm sm:h-10 sm:w-auto"
                disabled={loading}
              >
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                {loading ? "Salvando…" : "Salvar alterações"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function StorePreview({
  form,
  previewProducts,
  publicUrl,
}: {
  form: VitrineStore;
  previewProducts: {
    featured: PreviewProduct[];
    list: PreviewProduct[];
  };
  publicUrl: string;
}) {
  const locationLine = [form.address, form.city].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto w-full max-w-[min(100%,320px)] overflow-hidden rounded-[1.75rem] border-[6px] border-[#1a1a1a] bg-[#1a1a1a] shadow-xl sm:rounded-[2rem] sm:border-[8px]">
      <div className="max-h-[640px] overflow-y-auto rounded-[1.35rem] bg-white scrollbar-thin">
        <div
          className="relative h-32 bg-[#E8E6E3]"
          style={{
            backgroundImage: form.coverUrl ? `url(${form.coverUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        <div className="-mt-10 px-4 pb-5">
          <div className="flex items-end gap-3">
            <div
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-[3px] border-white bg-[#E8E6E3] shadow-md"
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
            <div className="min-w-0 pb-1">
              <p className="flex items-center gap-1 text-sm font-bold text-[#1a1a1a]">
                <span className="truncate">{form.name || "Sua marca"}</span>
                <CheckCircle2
                  className="h-3.5 w-3.5 shrink-0 text-[var(--painel-accent,#1e6b5c)]"
                  aria-hidden
                />
              </p>
              {form.tagline ? (
                <p className="truncate text-[11px] text-[#8C8682]">{form.tagline}</p>
              ) : null}
            </div>
          </div>

          {form.description ? (
            <p className="mt-3 text-[11px] leading-relaxed text-[#5C5652] line-clamp-4">
              {form.description}
            </p>
          ) : null}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "#25D366" }}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              WhatsApp
            </button>
            <Link
              href={publicUrl}
              target="_blank"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-[var(--painel-border)] bg-white py-2.5 text-xs font-semibold text-[#5C5652]"
            >
              Ver cardápio
            </Link>
          </div>

          {(locationLine || form.businessHours) && (
            <ul className="mt-4 space-y-2 text-[10px] text-[#5C5652]">
              {locationLine ? (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8C8682]" />
                  <span>{locationLine}</span>
                </li>
              ) : null}
              {form.businessHours ? (
                <li className="flex items-start gap-2">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8C8682]" />
                  <span>{form.businessHours}</span>
                </li>
              ) : null}
            </ul>
          )}

          {previewProducts.featured.length > 0 && (
            <div className="mt-5">
              <p className="text-[11px] font-semibold text-[#1a1a1a]">
                Produtos em destaque
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {previewProducts.featured.map((p) => (
                  <PreviewProductCard
                    key={p.name}
                    product={p}
                    accent={form.accentColor}
                  />
                ))}
              </div>
            </div>
          )}

          {previewProducts.list.length > 0 && (
            <div className="mt-4 space-y-2">
              {previewProducts.list.slice(0, 2).map((p) => (
                <PreviewListRow key={p.name} product={p} accent={form.accentColor} />
              ))}
            </div>
          )}

          <div className="mt-5 rounded-xl border border-[var(--painel-border)] bg-[#F8FAF9] px-3 py-3">
            <p className="text-[10px] font-semibold text-[#5C5652]">
              Pagamento seguro
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] font-medium text-[#8C8682]">
              <span className="rounded bg-white px-2 py-1 shadow-sm">Pix</span>
              <span className="rounded bg-white px-2 py-1 shadow-sm">Visa</span>
              <span className="rounded bg-white px-2 py-1 shadow-sm">
                Mastercard
              </span>
              <span className="rounded bg-white px-2 py-1 shadow-sm">
                Apple Pay
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewProductCard({
  product,
  accent,
}: {
  product: PreviewProduct;
  accent: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white">
      <div className="relative aspect-[4/3] bg-[#E8E6E3]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : null}
        <span
          className="absolute top-1.5 right-1.5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[8px] font-bold text-white"
        >
          Ativo
        </span>
      </div>
      <div className="p-2">
        <p className="truncate text-[10px] font-semibold text-[#1a1a1a]">
          {product.name}
        </p>
        <p className="text-[10px] font-medium" style={{ color: accent }}>
          {product.priceLabel}
        </p>
      </div>
    </div>
  );
}

function PreviewListRow({
  product,
  accent,
}: {
  product: PreviewProduct;
  accent: string;
}) {
  return (
    <div className="flex gap-2 rounded-xl border border-[var(--painel-border)] p-2">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[#E8E6E3]">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-[#1a1a1a]">
          {product.name}
        </p>
        <p className="text-[10px] font-medium" style={{ color: accent }}>
          {product.priceLabel}
        </p>
      </div>
    </div>
  );
}
