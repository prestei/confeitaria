"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  ClipboardCheck,
  Copy,
  Layers,
  LayoutList,
  Link2,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  Warehouse,
} from "lucide-react";
import { GalleryField, ImageField } from "@/components/painel/image-field";
import {
  PageAction,
  PageHeader,
  PageShell,
} from "@/components/painel/page-header";
import { buttonClassName } from "@/components/ui/button-styles";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { AVAILABILITY_LABELS, PRODUCT_TYPE_LABELS } from "@/lib/utils";

type Category = { id: string; name: string };
type TabId = "geral" | "complementos" | "vitrine" | "revisao";
type OptionRow = { name: string; priceDelta: string };
type GroupRow = {
  name: string;
  required: boolean;
  minSelect: string;
  maxSelect: string;
  open: boolean;
  options: OptionRow[];
};
type AddonRow = { name: string; price: string };

const TABS: {
  id: TabId;
  label: string;
  icon: typeof LayoutList;
}[] = [
  { id: "geral", label: "Geral", icon: LayoutList },
  { id: "complementos", label: "Complementos", icon: Layers },
  { id: "vitrine", label: "Vitrine e estoque", icon: ShoppingBag },
  { id: "revisao", label: "Revisão", icon: ClipboardCheck },
];

const emptyGroup = (): GroupRow => ({
  name: "",
  required: true,
  minSelect: "1",
  maxSelect: "1",
  open: true,
  options: [{ name: "", priceDelta: "0" }],
});

const PRICE_MODE_LABELS: Record<string, string> = {
  FIXED: "Preço fixo",
  FROM: "A partir de",
  QUOTE: "Sob consulta",
};

function formatPreviewPrice(price: string, priceMode: string) {
  if (priceMode === "QUOTE") return "Sob consulta";
  const n = Number(price.replace(",", "."));
  if (!price || Number.isNaN(n)) return "R$ —";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const TAB_IDS: TabId[] = ["geral", "complementos", "vitrine", "revisao"];

const LEGACY_TABS: Record<string, TabId> = {
  venda: "vitrine",
  estoque: "vitrine",
  estrategia: "vitrine",
};

function resolveInitialTab(initialTab?: string): TabId {
  if (initialTab && LEGACY_TABS[initialTab]) return LEGACY_TABS[initialTab];
  if (TAB_IDS.includes(initialTab as TabId)) return initialTab as TabId;
  return "geral";
}

export function ProductForm({
  productId,
  storeSlug,
  productSlug,
  origin,
  initialTab,
  initial,
}: {
  productId?: string;
  storeSlug?: string;
  productSlug?: string;
  origin?: string;
  initialTab?: string;
  initial?: {
    name: string;
    description: string;
    imageUrl: string;
    gallery: string;
    categoryId: string;
    productType: string;
    priceMode: string;
    price: string;
    promoPrice: string;
    availability: string;
    featured: boolean;
    suggestInCart: boolean;
    active: boolean;
    trackStock: boolean;
    stockQty: string;
    stockMin: string;
    unit: string;
    kitContents: string;
    minAdvanceDays: string;
    optionGroups: GroupRow[];
    addons: AddonRow[];
  };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>(() => resolveInitialTab(initialTab));
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [gallery, setGallery] = useState(initial?.gallery ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [productType, setProductType] = useState(initial?.productType ?? "READY");
  const [priceMode, setPriceMode] = useState(initial?.priceMode ?? "FIXED");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [promoPrice, setPromoPrice] = useState(initial?.promoPrice ?? "");
  const [promoEnabled, setPromoEnabled] = useState(Boolean(initial?.promoPrice));
  const [availability, setAvailability] = useState(
    initial?.availability ?? "AVAILABLE",
  );
  const [unit, setUnit] = useState(initial?.unit ?? "un");
  const [trackStock, setTrackStock] = useState(initial?.trackStock ?? false);
  const [stockQty, setStockQty] = useState(initial?.stockQty ?? "0");
  const [stockMin, setStockMin] = useState(initial?.stockMin ?? "5");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [suggestInCart, setSuggestInCart] = useState(
    initial?.suggestInCart ?? false,
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [kitContents, setKitContents] = useState(initial?.kitContents ?? "");
  const [minAdvanceDays, setMinAdvanceDays] = useState(
    initial?.minAdvanceDays ?? "",
  );
  const [groups, setGroups] = useState<GroupRow[]>(
    initial?.optionGroups?.length
      ? initial.optionGroups.map((g) => ({ ...g, open: true }))
      : [],
  );
  const [addons, setAddons] = useState<AddonRow[]>(
    initial?.addons?.length ? initial.addons : [],
  );

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const publicUrl = useMemo(() => {
    if (!origin || !storeSlug || !productSlug) return "";
    return `${origin.replace(/\/$/, "")}/${storeSlug}/produto/${productSlug}`;
  }, [origin, storeSlug, productSlug]);

  const showKit = productType === "PARTY_KIT";
  const showAdvance =
    productType === "CAKE" ||
    productType === "CUSTOM" ||
    productType === "PARTY_KIT";

  const reviewItems = [
    { ok: name.trim().length >= 2, label: "Nome do produto" },
    { ok: Boolean(categoryId), label: "Categoria", optional: true },
    { ok: Boolean(imageUrl), label: "Foto principal", optional: true },
    {
      ok: priceMode === "QUOTE" || Boolean(price),
      label: "Preço de venda",
    },
    { ok: true, label: active ? "Ativo na vitrine" : "Inativo (rascunho)" },
  ];

  async function copyLink() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast({ tone: "success", title: "Link copiado" });
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast({ tone: "error", title: "Não foi possível copiar o link" });
    }
  }

  async function onSubmit(e?: FormEvent, nextActive?: boolean) {
    e?.preventDefault();
    if (name.trim().length < 2) {
      setError("Informe o nome do produto (mínimo 2 caracteres).");
      setTab("geral");
      return;
    }

    setLoading(true);
    setError("");
    const publish = nextActive ?? active;

    const priceCents =
      priceMode === "QUOTE" || !price
        ? null
        : Math.round(Number(price.replace(",", ".")) * 100);
    const promoPriceCents =
      promoEnabled && promoPrice
        ? Math.round(Number(promoPrice.replace(",", ".")) * 100)
        : null;

    const galleryUrls = gallery
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name,
      description,
      imageUrl,
      gallery: galleryUrls,
      categoryId: categoryId || null,
      productType,
      priceMode,
      priceCents,
      promoPriceCents,
      availability,
      featured,
      suggestInCart,
      active: publish,
      trackStock,
      stockQty: Number(stockQty || 0),
      stockMin: Number(stockMin || 5),
      unit: unit || "un",
      kitContents: kitContents || null,
      minAdvanceDays: minAdvanceDays ? Number(minAdvanceDays) : null,
      optionGroups: groups
        .filter((g) => g.name.trim())
        .map((g) => {
          const minSelect = Math.max(0, Number(g.minSelect || 0));
          const maxSelect = Math.max(minSelect, Number(g.maxSelect || 1));
          return {
            name: g.name,
            required: g.required,
            minSelect: g.required ? Math.max(1, minSelect) : minSelect,
            maxSelect,
            options: g.options
              .filter((o) => o.name.trim())
              .map((o) => ({
                name: o.name,
                priceDeltaCents: Math.round(
                  Number(o.priceDelta.replace(",", ".") || 0) * 100,
                ),
              })),
          };
        }),
      addons: addons
        .filter((a) => a.name.trim())
        .map((a) => ({
          name: a.name,
          priceCents: Math.round(Number(a.price.replace(",", ".") || 0) * 100),
        })),
    };

    const res = await fetch(
      productId ? `/api/products/${productId}` : "/api/products",
      {
        method: productId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Erro ao salvar produto");
      return;
    }

    const saved = await res.json().catch(() => null);
    toast({
      tone: "success",
      title: productId
        ? "Alterações salvas"
        : publish
          ? "Produto publicado"
          : "Rascunho salvo",
    });

    if (!productId && saved?.id) {
      router.push(`/painel/produtos/${saved.id}`);
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={(e) => onSubmit(e)} className="w-full">
      <PageShell>
      <nav className="text-xs text-[#8C8682]">
        <Link href="/painel/produtos" className="hover:text-[#2D2926]">
          Produtos
        </Link>
        <span className="mx-1.5">›</span>
        <span className="text-[#2D2926]">
          {productId ? "Editar produto" : "Novo produto"}
        </span>
      </nav>

      <PageHeader
        title={name.trim() || (productId ? "Editar produto" : "Novo produto")}
        description="Nome, preço, fotos e opções — o que o cliente vê no cardápio."
        actions={
          <>
            <span className="rounded-full bg-[#F8EEEF] px-2.5 py-1 text-xs font-semibold text-[#9A5966]">
              {formatPreviewPrice(price, priceMode)}
            </span>
            <Switch
              size="sm"
              checked={active}
              onCheckedChange={setActive}
              label={active ? "Ativo" : "Inativo"}
            />
            <PageAction href="/painel/produtos" variant="secondary">
              Voltar
            </PageAction>
            {publicUrl ? (
              <button
                type="button"
                className={buttonClassName({ variant: "secondary" })}
                onClick={copyLink}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                Copiar link
              </button>
            ) : null}
            {productId ? (
              <button
                type="submit"
                disabled={loading}
                className={buttonClassName({ variant: "primary" })}
              >
                <Check className="h-4 w-4" />
                {loading ? "Salvando…" : "Salvar alterações"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={loading}
                  className={buttonClassName({ variant: "secondary" })}
                  onClick={() => onSubmit(undefined, false)}
                >
                  Salvar rascunho
                </button>
                <button
                  type="button"
                  disabled={loading}
                  className={buttonClassName({ variant: "primary" })}
                  onClick={() => onSubmit(undefined, true)}
                >
                  Publicar
                </button>
              </>
            )}
          </>
        }
      />

      <div className="overflow-hidden rounded-xl border border-[#E8E2DE] bg-white">
        <div className="overflow-x-auto border-b border-[#E8E2DE]">
          <nav className="flex min-w-max items-center gap-0.5 px-2" aria-label="Seções do produto">
            {TABS.map((item, i) => {
              const Icon = item.icon;
              const current = tab === item.id;
              return (
                <div key={item.id} className="flex items-center">
                  {i > 0 ? (
                    <ChevronRight
                      className="mx-0.5 h-3.5 w-3.5 shrink-0 text-[#C8C2BE]"
                      aria-hidden
                    />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 border-b-2 px-3 py-3 text-[13px] font-semibold transition",
                      current
                        ? "border-[#483129] text-[#483129]"
                        : "border-transparent text-[#8C8682] hover:text-[#2D2926]",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {item.label}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 p-4">
          {tab === "geral" && (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(11rem,15rem)] lg:items-start">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome do produto" required className="sm:col-span-2">
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Bolo de banana e aveia"
                    required
                    autoFocus
                  />
                </Field>
                <Field label="Categoria">
                  <select
                    className="input"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                  >
                    <option value="">Nenhum</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Disponibilidade">
                  <select
                    className="input"
                    value={availability}
                    onChange={(e) => setAvailability(e.target.value)}
                  >
                    {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Tipo">
                  <select
                    className="input"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                  >
                    {Object.entries(PRODUCT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Unidade">
                  <select
                    className="input"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    {!["un", "kg", "g", "fatia", "cx"].includes(unit) && unit ? (
                      <option value={unit}>{unit}</option>
                    ) : null}
                    <option value="un">Unidade (UN)</option>
                    <option value="kg">Quilograma (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="fatia">Fatia</option>
                    <option value="cx">Caixa</option>
                  </select>
                </Field>
                <Field label="Modo de preço">
                  <select
                    className="input"
                    value={priceMode}
                    onChange={(e) => setPriceMode(e.target.value)}
                  >
                    <option value="FIXED">Preço fixo</option>
                    <option value="FROM">A partir de</option>
                    <option value="QUOTE">Sob consulta</option>
                  </select>
                </Field>
                <Field label="Preço de venda">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8C8682]">
                      R$
                    </span>
                    <input
                      className="input pl-10"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={priceMode === "QUOTE"}
                      placeholder="0,00"
                      inputMode="decimal"
                    />
                  </div>
                </Field>
                {showAdvance ? (
                  <Field
                    label="Antecedência (dias)"
                    hint="Vazio = prazo geral da loja"
                  >
                    <input
                      className="input"
                      value={minAdvanceDays}
                      onChange={(e) => setMinAdvanceDays(e.target.value)}
                      inputMode="numeric"
                      placeholder="Ex.: 2"
                    />
                  </Field>
                ) : null}
                <Field
                  label="Descrição"
                  className="sm:col-span-2"
                  hint={`${description.length}/500`}
                >
                  <textarea
                    className="input min-h-20"
                    maxLength={500}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ingredientes, ocasião, tamanho…"
                  />
                </Field>
                {showKit ? (
                  <Field label="Conteúdo do kit" className="sm:col-span-2">
                    <textarea
                      className="input min-h-16"
                      value={kitContents}
                      onChange={(e) => setKitContents(e.target.value)}
                      placeholder="Ex.: 20 brigadeiros, 10 beijinhos…"
                    />
                  </Field>
                ) : null}
                {availability === "SCHEDULED_DAYS" ? (
                  <p className="sm:col-span-2 text-[11px] text-[#3B5B7A]">
                    Só pode ser pedido com a loja aberta (horários em
                    Configurações).
                  </p>
                ) : null}
              </div>
              <div className="space-y-3">
                <ImageField
                  label="Foto principal"
                  value={imageUrl}
                  onChange={setImageUrl}
                  hint="Até 5 MB · quadrada"
                  previewClassName="h-36 w-full"
                />
                <GalleryField
                  label="Mais fotos"
                  value={gallery}
                  onChange={setGallery}
                />
              </div>
            </div>
          )}

          {tab === "complementos" && (
            <>
              <Section
                icon={<Layers className="h-4 w-4" />}
                title="Complementos"
                action={
                  <button
                    type="button"
                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                    onClick={() => setGroups((g) => [...g, emptyGroup()])}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Criar complemento
                  </button>
                }
              >
                {groups.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#E8E2DE] bg-[#F7F5F3] px-4 py-8 text-center">
                    <p className="text-sm font-medium text-[#2D2926]">
                      Nenhum complemento ainda
                    </p>
                    <p className="mt-1 text-xs text-[#8C8682]">
                      Ex.: Tamanho, sabor do recheio, cobertura.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map((g, gi) => (
                      <div
                        key={gi}
                        className="overflow-hidden rounded-xl border border-[#E8E2DE]"
                      >
                        <div className="flex flex-wrap items-center gap-2 border-b border-[#E8E2DE] bg-[#FAFAF9] px-3 py-2.5">
                          <button
                            type="button"
                            className="min-w-0 flex-1 text-left"
                            onClick={() =>
                              setGroups((list) =>
                                list.map((item, i) =>
                                  i === gi ? { ...item, open: !item.open } : item,
                                ),
                              )
                            }
                          >
                            <p className="truncate text-sm font-semibold text-[#2D2926]">
                              {g.name.trim() || "Novo complemento"}
                            </p>
                            <p className="text-[11px] text-[#8C8682]">
                              De {g.minSelect || 0} até {g.maxSelect || 1}{" "}
                              {Number(g.maxSelect || 1) === 1
                                ? "opção"
                                : "opções"}
                            </p>
                          </button>
                          {g.required ? (
                            <span className="rounded-full bg-[#F8EEEF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9A5966]">
                              Obrigatório
                            </span>
                          ) : (
                            <span className="rounded-full bg-[#F0F2F5] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#65676B]">
                              Opcional
                            </span>
                          )}
                          <Switch
                            checked={g.required}
                            onCheckedChange={(v) =>
                              setGroups((list) =>
                                list.map((item, i) =>
                                  i === gi
                                    ? {
                                        ...item,
                                        required: v,
                                        minSelect: v
                                          ? String(Math.max(1, Number(item.minSelect || 1)))
                                          : item.minSelect,
                                      }
                                    : item,
                                ),
                              )
                            }
                            label="Obrigatório"
                          />
                          <button
                            type="button"
                            className="rounded-lg p-2 text-[#8C8682] hover:bg-white hover:text-[#C85A5A]"
                            onClick={() =>
                              setGroups((list) => list.filter((_, i) => i !== gi))
                            }
                            aria-label="Remover complemento"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {g.open ? (
                          <div className="space-y-4 p-3 sm:p-4">
                            <div className="grid gap-3 sm:grid-cols-[1fr_5.5rem_5.5rem]">
                              <Field label="Nome do complemento" required>
                                <input
                                  className="input"
                                  placeholder="Ex.: Tamanho"
                                  value={g.name}
                                  onChange={(e) =>
                                    setGroups((list) =>
                                      list.map((item, i) =>
                                        i === gi
                                          ? { ...item, name: e.target.value }
                                          : item,
                                      ),
                                    )
                                  }
                                />
                              </Field>
                              <Field label="Mínimo">
                                <input
                                  className="input"
                                  inputMode="numeric"
                                  value={g.minSelect}
                                  onChange={(e) =>
                                    setGroups((list) =>
                                      list.map((item, i) =>
                                        i === gi
                                          ? { ...item, minSelect: e.target.value }
                                          : item,
                                      ),
                                    )
                                  }
                                />
                              </Field>
                              <Field label="Máximo">
                                <input
                                  className="input"
                                  inputMode="numeric"
                                  value={g.maxSelect}
                                  onChange={(e) =>
                                    setGroups((list) =>
                                      list.map((item, i) =>
                                        i === gi
                                          ? { ...item, maxSelect: e.target.value }
                                          : item,
                                      ),
                                    )
                                  }
                                />
                              </Field>
                            </div>

                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#8C8682]">
                                  Opções do complemento
                                </p>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#483129]"
                                  onClick={() =>
                                    setGroups((list) =>
                                      list.map((item, i) =>
                                        i === gi
                                          ? {
                                              ...item,
                                              options: [
                                                ...item.options,
                                                { name: "", priceDelta: "0" },
                                              ],
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  Adicionar opção
                                </button>
                              </div>
                              <div className="space-y-2">
                                {g.options.map((o, oi) => (
                                  <div
                                    key={oi}
                                    className="grid grid-cols-[1fr_7.5rem_auto] items-center gap-2"
                                  >
                                    <input
                                      className="input !py-2 text-sm"
                                      placeholder="Nome da opção"
                                      value={o.name}
                                      onChange={(e) =>
                                        patchOption(setGroups, gi, oi, {
                                          name: e.target.value,
                                        })
                                      }
                                    />
                                    <div className="relative">
                                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#8C8682]">
                                        + R$
                                      </span>
                                      <input
                                        className="input !py-2 pl-11 text-sm"
                                        placeholder="0,00"
                                        value={o.priceDelta}
                                        onChange={(e) =>
                                          patchOption(setGroups, gi, oi, {
                                            priceDelta: e.target.value,
                                          })
                                        }
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      className="rounded-lg p-2 text-[#C8C2BE] hover:bg-[#F7F5F3] hover:text-[#C85A5A]"
                                      onClick={() =>
                                        setGroups((list) =>
                                          list.map((item, i) =>
                                            i === gi
                                              ? {
                                                  ...item,
                                                  options: item.options.filter(
                                                    (_, j) => j !== oi,
                                                  ),
                                                }
                                              : item,
                                          ),
                                        )
                                      }
                                      aria-label="Remover opção"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              <Section
                icon={<Plus className="h-4 w-4" />}
                title="Extras deste produto"
                action={
                  <button
                    type="button"
                    className={buttonClassName({ variant: "secondary", size: "sm" })}
                    onClick={() =>
                      setAddons((a) => [...a, { name: "", price: "0" }])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Extra
                  </button>
                }
              >
                {addons.length === 0 ? (
                  <p className="text-sm text-[#8C8682]">
                    Nenhum extra. Itens globais em{" "}
                    <Link
                      href="/painel/adicionais"
                      className="font-semibold text-[#483129] hover:underline"
                    >
                      Adicionais
                    </Link>
                    .
                  </p>
                ) : (
                  <div className="space-y-2">
                    {addons.map((a, ai) => (
                      <div
                        key={ai}
                        className="grid grid-cols-[1fr_7.5rem_auto] gap-2"
                      >
                        <input
                          className="input !py-2 text-sm"
                          placeholder="Nome"
                          value={a.name}
                          onChange={(e) =>
                            setAddons((list) =>
                              list.map((item, i) =>
                                i === ai ? { ...item, name: e.target.value } : item,
                              ),
                            )
                          }
                        />
                        <div className="relative">
                          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-[#8C8682]">
                            R$
                          </span>
                          <input
                            className="input !py-2 pl-8 text-sm"
                            placeholder="0,00"
                            value={a.price}
                            onChange={(e) =>
                              setAddons((list) =>
                                list.map((item, i) =>
                                  i === ai ? { ...item, price: e.target.value } : item,
                                ),
                              )
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-[#C8C2BE] hover:bg-[#F7F5F3] hover:text-[#C85A5A]"
                          onClick={() =>
                            setAddons((list) => list.filter((_, i) => i !== ai))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}

          {tab === "vitrine" && (
            <div className="grid gap-3 lg:grid-cols-2">
              <Section icon={<Star className="h-4 w-4" />} title="Destaque e promo">
                <div className="space-y-1">
                  <SettingRow title="Produto em destaque">
                    <Switch checked={featured} onCheckedChange={setFeatured} />
                  </SettingRow>
                  <SettingRow title="Sugestão no carrinho">
                    <Switch
                      checked={suggestInCart}
                      onCheckedChange={setSuggestInCart}
                    />
                  </SettingRow>
                  <SettingRow title="Preço promocional">
                    <Switch
                      checked={promoEnabled}
                      onCheckedChange={(v) => {
                        setPromoEnabled(v);
                        if (!v) setPromoPrice("");
                      }}
                    />
                  </SettingRow>
                </div>
                {promoEnabled ? (
                  <Field label="Valor promocional" className="mt-3">
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8C8682]">
                        R$
                      </span>
                      <input
                        className="input pl-10"
                        value={promoPrice}
                        onChange={(e) => setPromoPrice(e.target.value)}
                        placeholder="0,00"
                        inputMode="decimal"
                      />
                    </div>
                  </Field>
                ) : null}
                <p className="mt-2 text-[11px] text-[#8C8682]">
                  Ativo/inativo no cardápio: interruptor no topo da página.
                </p>
              </Section>

              <Section icon={<Warehouse className="h-4 w-4" />} title="Estoque">
                <SettingRow title="Controlar saldo deste produto">
                  <Switch checked={trackStock} onCheckedChange={setTrackStock} />
                </SettingRow>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="Quantidade">
                    <input
                      className="input"
                      value={stockQty}
                      onChange={(e) => setStockQty(e.target.value)}
                      disabled={!trackStock}
                      inputMode="numeric"
                    />
                  </Field>
                  <Field label="Mínimo (alerta)">
                    <input
                      className="input"
                      value={stockMin}
                      onChange={(e) => setStockMin(e.target.value)}
                      disabled={!trackStock}
                      inputMode="numeric"
                    />
                  </Field>
                </div>
                <Link
                  href="/painel/estoque"
                  className="mt-2 inline-flex text-xs font-semibold text-[#483129] hover:underline"
                >
                  Movimentações de estoque
                </Link>
              </Section>
            </div>
          )}

          {tab === "revisao" && (
            <>
              <Section
                icon={<ClipboardCheck className="h-4 w-4" />}
                title="Checklist"
              >
                <ul className="space-y-2">
                  {reviewItems.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#E8E2DE] px-3 py-2.5"
                    >
                      <span className="text-sm text-[#2D2926]">
                        {item.label}
                        {"optional" in item && item.optional ? (
                          <span className="ml-1 text-xs text-[#8C8682]">
                            (opcional)
                          </span>
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full",
                          item.ok
                            ? "bg-[#E7F8ED] text-[#31A24C]"
                            : "bg-[#F0F2F5] text-[#8C8682]",
                        )}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Resumo">
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <ReviewItem label="Nome" value={name || "—"} />
                  <ReviewItem
                    label="Tipo"
                    value={
                      PRODUCT_TYPE_LABELS[
                        productType as keyof typeof PRODUCT_TYPE_LABELS
                      ] || productType
                    }
                  />
                  <ReviewItem
                    label="Categoria"
                    value={
                      categories.find((c) => c.id === categoryId)?.name ||
                      "Sem categoria"
                    }
                  />
                  <ReviewItem
                    label="Preço"
                    value={`${PRICE_MODE_LABELS[priceMode] || priceMode} · ${formatPreviewPrice(price, priceMode)}${
                      promoEnabled && promoPrice ? ` · Promo R$ ${promoPrice}` : ""
                    }`}
                  />
                  <ReviewItem
                    label="Estoque"
                    value={
                      trackStock
                        ? `${stockQty} ${unit} (mín. ${stockMin})`
                        : "Sem controle"
                    }
                  />
                  <ReviewItem
                    label="Complementos"
                    value={`${groups.filter((g) => g.name.trim()).length} grupos · ${addons.filter((a) => a.name.trim()).length} extras`}
                  />
                  <ReviewItem
                    label="Status"
                    value={`${active ? "Ativo na vitrine" : "Inativo"}${featured ? " · Destaque" : ""}`}
                  />
                  <ReviewItem
                    label="Disponibilidade"
                    value={
                      AVAILABILITY_LABELS[
                        availability as keyof typeof AVAILABILITY_LABELS
                      ] || availability
                    }
                  />
                </dl>
                {publicUrl ? (
                  <p className="flex items-center gap-2 text-xs text-[#8C8682]">
                    <Link2 className="h-3.5 w-3.5" />
                    {publicUrl}
                  </p>
                ) : null}
              </Section>
            </>
          )}

          {error ? <p className="text-sm font-medium text-[#C85A5A]">{error}</p> : null}
        </div>
      </div>
      </PageShell>
    </form>
  );
}

function patchOption(
  setGroups: Dispatch<SetStateAction<GroupRow[]>>,
  gi: number,
  oi: number,
  patch: Partial<OptionRow>,
) {
  setGroups((list) =>
    list.map((item, i) =>
      i === gi
        ? {
            ...item,
            options: item.options.map((opt, j) =>
              j === oi ? { ...opt, ...patch } : opt,
            ),
          }
        : item,
    ),
  );
}

function Section({
  title,
  description,
  icon,
  action,
  children,
}: {
  title: string;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#E8E2DE]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2DE] px-3 py-2.5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-[#2D2926]">
            {icon ? <span className="text-[#8C8682]">{icon}</span> : null}
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 text-xs leading-relaxed text-[#8C8682]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="space-y-3 p-3 sm:p-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label !mb-1">
        {label}
        {required ? <span className="ml-0.5 text-[#C85A5A]">*</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-0.5 text-[11px] text-[#8C8682]">{hint}</p> : null}
    </div>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0EBE7] py-2 last:border-0 last:pb-0 first:pt-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[#2D2926]">{title}</p>
        {description ? (
          <p className="text-[11px] leading-snug text-[#8C8682]">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#8C8682]">{label}</dt>
      <dd className="mt-0.5 font-medium text-[#2D2926]">{value}</dd>
    </div>
  );
}
