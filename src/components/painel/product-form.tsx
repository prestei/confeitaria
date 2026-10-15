"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { PageAction, PageHeader, PageShell } from "@/components/painel/page-header";
import { ImageField } from "@/components/painel/image-field";
import {
  ProductPricingFields,
  productCostCents,
  type PricingStockItem,
  type RecipeDraft,
} from "@/components/painel/product-pricing-fields";
import { Field } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PRODUCT_UNIT,
  isStandardProductUnit,
  PRODUCT_UNITS,
} from "@/lib/product-units";
import { formatBRL, parseMoneyToCents } from "@/lib/utils";
import { cn } from "@/lib/cn";

type Category = { id: string; name: string };

type OptionRow = { name: string; priceDelta: string };
type GroupRow = { name: string; options: OptionRow[] };
type AddonRow = { name: string; price: string };

const STEPS = [
  { id: 1, label: "Básico" },
  { id: 2, label: "Preço e estoque" },
  { id: 3, label: "Receita e custo" },
  { id: 4, label: "Revisar" },
] as const;

const DESCRIPTION_MAX = 500;

function reaisToCents(value: string) {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export type ProductFormInitial = {
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
  active: boolean;
  showOnStorefront?: boolean;
  trackStock: boolean;
  hideWhenOutOfStock?: boolean;
  stockQty: string;
  stockMin: string;
  unit: string;
  optionGroups: GroupRow[];
  addons: AddonRow[];
  packaging?: string;
  labor?: string;
  otherCosts?: string;
  indirect?: string;
  recipe?: RecipeDraft[];
};

export function ProductForm({
  productId,
  initial,
  layout = "page",
  onSaved,
  onCancel,
}: {
  layout?: "page" | "sheet";
  productId?: string;
  initial?: ProductFormInitial;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockItems, setStockItems] = useState<PricingStockItem[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [gallery] = useState(initial?.gallery ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [productType] = useState(initial?.productType ?? "READY");
  const [priceMode] = useState(initial?.priceMode ?? "FIXED");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [promoPrice, setPromoPrice] = useState(initial?.promoPrice ?? "");
  const [availability] = useState(initial?.availability ?? "AVAILABLE");
  const [unit, setUnit] = useState(initial?.unit ?? DEFAULT_PRODUCT_UNIT);
  const [trackStock, setTrackStock] = useState(initial?.trackStock ?? false);
  const [hideWhenOutOfStock] = useState(initial?.hideWhenOutOfStock ?? false);
  const [stockQty, setStockQty] = useState(initial?.stockQty ?? "0");
  const [stockMin] = useState(initial?.stockMin ?? "5");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [showOnStorefront, setShowOnStorefront] = useState(
    initial?.showOnStorefront ?? true,
  );
  const [groups] = useState<GroupRow[]>(
    initial?.optionGroups?.length ? initial.optionGroups : [],
  );
  const [addons] = useState<AddonRow[]>(
    initial?.addons?.length ? initial.addons : [],
  );
  const [packaging, setPackaging] = useState(initial?.packaging ?? "");
  const [labor, setLabor] = useState(initial?.labor ?? "");
  const [otherCosts, setOtherCosts] = useState(initial?.otherCosts ?? "");
  const [indirect, setIndirect] = useState(initial?.indirect ?? "");
  const [recipe, setRecipe] = useState<RecipeDraft[]>(initial?.recipe ?? []);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories)
      .catch(() => setCategories([]));
    fetch("/api/stock-items")
      .then((r) => r.json())
      .then((data) => setStockItems(Array.isArray(data) ? data : []))
      .catch(() => setStockItems([]));
  }, []);

  function canGoNext() {
    if (step === 1) return name.trim().length >= 2;
    return true;
  }

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");

    const priceCents =
      priceMode === "QUOTE" || !price ? null : parseMoneyToCents(price);
    const promoPriceCents = promoPrice ? parseMoneyToCents(promoPrice) : null;

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
      active,
      showOnStorefront,
      trackStock,
      hideWhenOutOfStock: trackStock ? hideWhenOutOfStock : false,
      stockQty: Number(stockQty || 0),
      stockMin: Number(stockMin || 5),
      unit: unit || DEFAULT_PRODUCT_UNIT,
      optionGroups: groups
        .filter((g) => g.name.trim())
        .map((g) => ({
          name: g.name,
          required: true,
          options: g.options
            .filter((o) => o.name.trim())
            .map((o) => ({
              name: o.name,
              priceDeltaCents: Math.round(
                Number(o.priceDelta.replace(",", ".") || 0) * 100,
              ),
            })),
        })),
      addons: addons
        .filter((a) => a.name.trim())
        .map((a) => ({
          name: a.name,
          priceCents: Math.round(Number(a.price.replace(",", ".") || 0) * 100),
        })),
      packagingCents: reaisToCents(packaging),
      laborCents: reaisToCents(labor),
      otherCostsCents: reaisToCents(otherCosts),
      indirectCents: reaisToCents(indirect),
      recipe: recipe
        .map((line) => ({
          stockItemId: line.stockItemId,
          quantity: Number(line.quantity.replace(",", ".")),
        }))
        .filter((line) => line.stockItemId && line.quantity > 0),
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
    if (onSaved) {
      onSaved();
      return;
    }
    router.push("/painel/produtos");
    router.refresh();
  }

  const priceLabel: Record<string, string> = {
    FIXED: "Fixo",
    FROM: "A partir de",
    QUOTE: "Sob consulta",
  };

  const shell = layout === "page";
  const sheet = layout === "sheet";
  const fieldRound = sheet ? "!rounded-xl" : undefined;

  function goToStep(id: number) {
    if (id < step || (id === step + 1 && canGoNext())) setStep(id);
    else if (id < step) setStep(id);
  }

  const stepperNav = sheet ? (
    <nav
      aria-label="Etapas"
      className="shrink-0 overflow-x-hidden border-b border-[var(--painel-border)]"
    >
      <ol className="flex px-1 sm:px-2">
        {STEPS.map((s) => {
          const done = step > s.id;
          const current = step === s.id;
          return (
            <li key={s.id} className="relative min-w-0 flex-1">
              <button
                type="button"
                onClick={() => goToStep(s.id)}
                className="flex w-full flex-col items-center gap-1.5 px-0.5 pb-3 pt-4"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    current && "bg-[var(--painel-brand)] text-white",
                    done && !current && "bg-[#E7F8ED] text-[#31A24C]",
                    !done && !current && "bg-[#F0F2F5] text-[#8C8682]",
                  )}
                >
                  {done && !current ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    s.id
                  )}
                </span>
                <span
                  className={cn(
                    "text-center text-[10px] font-semibold leading-tight text-balance sm:text-[11px]",
                    current ? "text-[var(--painel-brand)]" : "text-[#8C8682]",
                  )}
                >
                  {s.label}
                </span>
              </button>
              {current ? (
                <span
                  className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-[var(--painel-brand)]"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  ) : (
    <nav aria-label="Etapas" className="overflow-x-auto">
      <ol className="flex min-w-max items-center gap-2">
        {STEPS.map((s, i) => {
          const done = step > s.id;
          const current = step === s.id;
          return (
            <li key={s.id} className="flex items-center gap-2">
              {i > 0 && (
                <span className="mx-1 h-px w-6 bg-[#CED0D4] sm:w-10" aria-hidden />
              )}
              <button
                type="button"
                onClick={() => goToStep(s.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold transition",
                  current && "bg-[var(--painel-brand)] text-white",
                  done && !current && "bg-[#E7F8ED] text-[#31A24C]",
                  !done && !current && "bg-white text-[#65676B] ring-1 ring-[#CED0D4]",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
                    current && "bg-white/20",
                    done && !current && "bg-[#31A24C] text-white",
                    !done && !current && "bg-[#F0F2F5]",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : s.id}
                </span>
                {s.label}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  const formBody = (
    <>
        {step === 1 && (
          <section
            className={cn(
              sheet
                ? "space-y-4"
                : "grid gap-4 rounded-2xl border border-cocoa/8 bg-white p-5 sm:grid-cols-2",
            )}
          >
            <Field
              className={sheet ? undefined : "sm:col-span-2"}
              label={sheet ? "Nome do produto" : "Nome"}
              placeholder={sheet ? "Ex.: Bolo de chocolate belga" : undefined}
              controlClassName={fieldRound}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <Field
              className={sheet ? undefined : "sm:col-span-2"}
              as="textarea"
              label="Descrição"
              placeholder={
                sheet ? "Descreva o produto para seus clientes…" : undefined
              }
              controlClassName={cn(fieldRound, "min-h-28")}
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              footer={
                sheet ? (
                  <p className="mt-1 text-right text-xs text-[#8C8682]">
                    {description.length}/{DESCRIPTION_MAX}
                  </p>
                ) : undefined
              }
            />
            <Field
              as="select"
              label="Categoria"
              controlClassName={fieldRound}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Field>
            <ImageField
              label="Foto principal"
              value={imageUrl}
              onChange={setImageUrl}
              variant={sheet ? "dropzone" : "compact"}
              className={sheet ? undefined : "sm:col-span-2"}
            />
          </section>
        )}

        {step === 2 && (
          <section
            className={cn(
              "min-w-0",
              sheet ? "space-y-4" : "grid gap-4 sm:grid-cols-2",
            )}
          >
            <div
              className={cn(
                "grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2",
                !sheet && "sm:col-span-2",
              )}
            >
              <Field
                className="min-w-0"
                label="Preço (R$)"
                control={
                  <MaskedInput
                    kind="money"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    disabled={priceMode === "QUOTE"}
                    className={cn(fieldRound, "min-w-0 w-full")}
                  />
                }
              />
              <Field
                className="min-w-0"
                label="Preço promocional (R$)"
                control={
                  <MaskedInput
                    kind="money"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    className={cn(fieldRound, "min-w-0 w-full")}
                  />
                }
              />
            </div>
            <Field
              as="select"
              className={cn("min-w-0", !sheet ? "sm:col-span-2" : undefined)}
              label="Unidade"
              controlClassName={cn(fieldRound, "max-w-full")}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {!isStandardProductUnit(unit) && unit ? (
                <option value={unit}>{unit}</option>
              ) : null}
              {PRODUCT_UNITS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </Field>
            <div
              className={cn(
                "flex flex-col gap-3",
                !sheet && "sm:col-span-2",
              )}
            >
              <Switch
                id="product-track-stock"
                checked={trackStock}
                onCheckedChange={setTrackStock}
                label="Usar estoque"
              />
              {trackStock ? (
                <Field
                  label="Qtd. disponível"
                  type="number"
                  min={0}
                  step={1}
                  inputMode="numeric"
                  controlClassName={fieldRound}
                  value={stockQty}
                  onChange={(e) => {
                    const next = e.target.value;
                    if (next === "" || /^\d+$/.test(next)) setStockQty(next);
                  }}
                />
              ) : null}
              <Switch
                id="product-featured"
                checked={featured}
                onCheckedChange={setFeatured}
                label="Produto em destaque"
              />
              <Switch
                id="product-active"
                checked={active}
                onCheckedChange={setActive}
                label="Produto ativo"
              />
              <Switch
                id="product-storefront"
                checked={showOnStorefront}
                onCheckedChange={setShowOnStorefront}
                label="Exibir na vitrine"
              />
            </div>
          </section>
        )}

        {step === 3 && (
          <section
            className={cn(
              "min-w-0",
              sheet
                ? undefined
                : "rounded-2xl border border-cocoa/8 bg-white p-5",
            )}
          >
            <ProductPricingFields
              variant={sheet ? "sheet" : "default"}
              stockItems={stockItems}
              lines={recipe}
              onLines={setRecipe}
              packaging={packaging}
              labor={labor}
              other={otherCosts}
              indirect={indirect}
              onPackaging={setPackaging}
              onLabor={setLabor}
              onOther={setOtherCosts}
              onIndirect={setIndirect}
              saleCents={
                priceMode === "QUOTE" || !price ? 0 : parseMoneyToCents(price)
              }
            />
          </section>
        )}

        {step === 4 && (
          <section className="space-y-4 rounded-2xl border border-cocoa/8 bg-white p-5">
            <p className="text-sm font-semibold text-cocoa">Revisão</p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-cocoa-soft/55">Nome</dt>
                <dd className="font-medium text-cocoa">{name || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-cocoa-soft/55">Categoria</dt>
                <dd className="font-medium text-cocoa">
                  {categories.find((c) => c.id === categoryId)?.name || "Sem categoria"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-cocoa-soft/55">Preço</dt>
                <dd className="font-medium text-cocoa">
                  {priceMode === "QUOTE"
                    ? "Sob consulta"
                    : `${priceLabel[priceMode]} ${price ? `R$ ${price}` : "—"}`}
                  {promoPrice ? ` · Promo R$ ${promoPrice}` : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-cocoa-soft/55">Estoque</dt>
                <dd className="font-medium text-cocoa">
                  {trackStock ? `${stockQty} ${unit}` : "Sem controle"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-cocoa-soft/55">Receita e custo</dt>
                <dd className="font-medium text-cocoa">
                  {recipe.filter((line) => line.stockItemId).length} insumos · custo{" "}
                  {formatBRL(
                    productCostCents({
                      lines: recipe,
                      stockItems,
                      packaging,
                      labor,
                      other: otherCosts,
                      indirect,
                    }).costCents,
                  )}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-cocoa-soft/55">Status</dt>
                <dd className="font-medium text-cocoa">
                  {active ? "Ativo na vitrine" : "Inativo"}
                  {featured ? " · Destaque" : ""}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {error && <p className="text-sm text-berry-deep">{error}</p>}
    </>
  );

  const formFooter = sheet ? (
    <div
      className="sticky bottom-0 z-10 mt-auto flex shrink-0 items-center justify-between gap-2 border-t border-[var(--painel-border)] bg-white px-4 py-3 shadow-[0_-6px_16px_-6px_rgba(45,41,38,0.08)] sm:gap-3 sm:px-6 sm:py-4"
    >
      {step === 1 ? (
        <button
          type="button"
          className="btn-secondary shrink-0 !rounded-xl !px-4 !py-2.5 text-sm sm:!px-5"
          onClick={() => onCancel?.()}
        >
          Cancelar
        </button>
      ) : (
        <button
          type="button"
          className="btn-secondary shrink-0 !rounded-xl !px-3 !py-2.5 text-sm sm:!px-5"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          Voltar
        </button>
      )}
      {step < 4 ? (
        <button
          type="submit"
          className="btn-primary inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 !rounded-xl !px-4 !py-2.5 text-sm sm:flex-none sm:!px-5"
          disabled={!canGoNext()}
        >
          Continuar
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      ) : (
        <button
          type="submit"
          className="btn-primary min-w-0 flex-1 !rounded-xl !px-4 !py-2.5 text-sm sm:flex-none sm:!px-5"
          disabled={loading}
        >
          {loading ? "Salvando…" : "Criar produto"}
        </button>
      )}
    </div>
  ) : (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        className="btn-secondary !py-2.5 text-sm"
        disabled={step === 1}
        onClick={() => setStep((s) => Math.max(1, s - 1))}
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </button>
      {step < 4 ? (
        <button
          type="submit"
          className="btn-primary !py-2.5 text-sm"
          disabled={!canGoNext()}
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="submit"
          className="btn-primary !py-2.5 text-sm"
          disabled={loading}
        >
          {loading
            ? "Salvando…"
            : productId
              ? "Salvar alterações"
              : "Criar produto"}
        </button>
      )}
    </div>
  );

  const form = (
    <form
      id={sheet ? "product-form-sheet" : undefined}
      onSubmit={(e) => {
        e.preventDefault();
        if (step < 4) {
          if (canGoNext()) setStep((s) => s + 1);
          return;
        }
        onSubmit();
      }}
      className={sheet ? "flex min-h-0 flex-1 flex-col" : "space-y-5"}
    >
      {sheet ? (
        <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto px-4 py-5 scrollbar-thin sm:px-6">
          {formBody}
        </div>
      ) : (
        formBody
      )}
      {formFooter}
    </form>
  );

  if (!shell) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {stepperNav}
        {form}
      </div>
    );
  }

  const content = (
    <>
      {stepperNav}
      {form}
    </>
  );

  return (
    <PageShell>
      <PageHeader
        title={productId ? "Editar produto" : "Novo produto"}
        description="Passo a passo: fotos, preço, receita com insumos e estoque."
        actions={
          <PageAction href="/painel/produtos" variant="secondary">
            Voltar
          </PageAction>
        }
      />
      {content}
    </PageShell>
  );
}
