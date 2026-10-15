"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL, isQuoteFlow, PRODUCT_TYPE_LABELS } from "@/lib/utils";
import { priceLabel } from "@/components/store/product-card";
import { effectivePriceCents, hasPromoPrice } from "@/lib/pricing";
import { formatAddonLine, type ResolvedAddon } from "@/lib/addons";
import { StoreAddonsPicker } from "@/components/store/store-addons-picker";
import type { PriceMode, ProductType } from "@/lib/enums";

type ProductOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
  sortOrder: number;
};

type OptionGroup = {
  id: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: ProductOption[];
};

type Addon = ResolvedAddon;

type ProductDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  productType: ProductType;
  priceMode: PriceMode;
  priceCents: number | null;
  promoPriceCents?: number | null;
  kitContents: string | null;
  minAdvanceDays: number | null;
  featured?: boolean;
  trackStock?: boolean;
  stockQty?: number;
  unit?: string;
  availability?: string;
  optionGroups: OptionGroup[];
  addons: Addon[];
};

export function ProductConfigurator({
  storeSlug,
  product,
  minAdvanceDays,
  compact = false,
  storeOpen = true,
  onSuccess,
}: {
  storeSlug: string;
  product: ProductDetail;
  minAdvanceDays: number;
  /** Layout for modal (split + sticky CTA) */
  compact?: boolean;
  /** When false, SCHEDULED_DAYS products cannot be added. */
  storeOpen?: boolean;
  /** Called after add — if omitted, navigates to cart */
  onSuccess?: () => void;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const quote = isQuoteFlow(product.productType) || product.priceMode === "QUOTE";
  const maxQty =
    product.trackStock && typeof product.stockQty === "number"
      ? Math.max(0, product.stockQty)
      : null;
  const scheduledClosed =
    product.availability === "SCHEDULED_DAYS" && !storeOpen;
  const soldOut =
    product.availability === "SOLD_OUT" ||
    scheduledClosed ||
    (maxQty != null && maxQty <= 0);

  const [selected, setSelected] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const g of product.optionGroups) {
      const min = g.minSelect ?? (g.required ? 1 : 0);
      const max = Math.max(g.maxSelect || 1, min || 1);
      if (min > 0 && g.options.length) {
        init[g.id] = g.options
          .slice(0, Math.min(min, max, g.options.length))
          .map((o) => o.id);
      } else {
        init[g.id] = [];
      }
    }
    return init;
  });
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [addonNotes, setAddonNotes] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [theme, setTheme] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [guests, setGuests] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [notes, setNotes] = useState("");
  const [needsInvoice, setNeedsInvoice] = useState(false);

  const optionDelta = useMemo(() => {
    let delta = 0;
    for (const g of product.optionGroups) {
      const ids = new Set(selected[g.id] || []);
      for (const opt of g.options) {
        if (ids.has(opt.id)) delta += opt.priceDeltaCents;
      }
    }
    return delta;
  }, [product.optionGroups, selected]);

  const addonsTotal = useMemo(() => {
    return product.addons.reduce((sum, a) => {
      const q = addonQty[a.id] || 0;
      return sum + a.priceCents * q;
    }, 0);
  }, [product.addons, addonQty]);

  const missingAddonNote = product.addons.some(
    (a) =>
      (addonQty[a.id] || 0) > 0 &&
      a.noteRequired &&
      !(addonNotes[a.id] || "").trim(),
  );

  const basePrice = effectivePriceCents(product) ?? 0;
  const unitPrice =
    product.priceMode === "QUOTE" ? 0 : basePrice + optionDelta + addonsTotal;

  const lineTotal = unitPrice * qty;
  const hasEstimateBump =
    product.priceMode !== "QUOTE" && unitPrice > basePrice;
  const showPromo = hasPromoPrice(product);

  function buildCustomizations() {
    const custom: Record<string, string | number | string[]> = {};
    for (const g of product.optionGroups) {
      const ids = new Set(selected[g.id] || []);
      const names = g.options.filter((o) => ids.has(o.id)).map((o) => o.name);
      if (names.length === 1) custom[g.name] = names[0];
      else if (names.length > 1) custom[g.name] = names;
    }
    const chosenAddons = product.addons
      .filter((a) => (addonQty[a.id] || 0) > 0)
      .map((a) => formatAddonLine(a.name, addonQty[a.id] || 0, addonNotes[a.id]));
    if (chosenAddons.length) custom["Adicionais"] = chosenAddons;
    if (theme) custom["Tema"] = theme;
    if (eventDate) custom["Data desejada"] = eventDate;
    if (guests) custom["Convidados"] = Number(guests);
    if (companyName) custom["Empresa"] = companyName;
    if (referenceNote) custom["Referência"] = referenceNote;
    if (notes) custom["Observações"] = notes;
    if (needsInvoice) custom["Nota fiscal"] = "Sim";
    if (product.kitContents) custom["Incluso no kit"] = product.kitContents;
    return custom;
  }

  function toggleOption(group: OptionGroup, optionId: string) {
    const min = group.minSelect ?? (group.required ? 1 : 0);
    const max = Math.max(group.maxSelect || 1, min || 1);
    setSelected((s) => {
      const current = s[group.id] || [];
      if (max <= 1) return { ...s, [group.id]: [optionId] };
      if (current.includes(optionId)) {
        return { ...s, [group.id]: current.filter((id) => id !== optionId) };
      }
      if (current.length >= max) return s;
      return { ...s, [group.id]: [...current, optionId] };
    });
  }

  const missingGroup = product.optionGroups.find((g) => {
    const min = g.minSelect ?? (g.required ? 1 : 0);
    return (selected[g.id]?.length || 0) < min;
  });

  function handleAdd() {
    if (soldOut || missingGroup) return;
    const missingNote = product.addons.find(
      (a) =>
        (addonQty[a.id] || 0) > 0 &&
        a.noteRequired &&
        !(addonNotes[a.id] || "").trim(),
    );
    if (missingNote) return;
    const safeQty =
      maxQty != null ? Math.min(Math.max(1, qty), maxQty) : Math.max(1, qty);
    addItem({
      productId: product.id,
      productName: product.name,
      productType: product.productType,
      quantity: safeQty,
      unitPriceCents: unitPrice,
      priceMode: product.priceMode as "FIXED" | "FROM" | "QUOTE",
      customizations: buildCustomizations(),
      imageUrl: product.imageUrl,
    });
    if (onSuccess) {
      onSuccess();
      return;
    }
    router.push(`/${storeSlug}/carrinho`);
  }

  const advance = product.minAdvanceDays ?? minAdvanceDays;

  const ctaLabel =
    quote || product.priceMode === "QUOTE"
      ? "Solicitar orçamento"
      : product.priceMode === "FROM"
        ? "Adicionar estimativa"
        : "Adicionar ao pedido";

  const imageBlock = (
    <div
      className={
        compact
          ? "relative overflow-hidden bg-sand md:h-full md:min-h-[22rem] md:rounded-none"
          : "overflow-hidden rounded-[1.8rem] bg-fog"
      }
    >
      {product.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          className={
            compact
              ? "aspect-[16/11] w-full object-cover md:absolute md:inset-0 md:aspect-auto md:h-full"
              : "aspect-[4/3] w-full object-cover"
          }
        />
      ) : (
        <div
          className={
            compact
              ? "flex aspect-[16/11] items-center justify-center bg-sand text-4xl md:absolute md:inset-0 md:aspect-auto md:h-full"
              : "flex aspect-[4/3] items-center justify-center text-6xl"
          }
        >
          🍰
        </div>
      )}
      {compact && product.featured && (
        <span className="absolute left-3 top-3 rounded-full bg-surface/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rosewood shadow-sm">
          Destaque
        </span>
      )}
    </div>
  );

  const headerBlock = (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-rosewood">
        {PRODUCT_TYPE_LABELS[product.productType as ProductType]}
      </p>
      <h1
        className={
          compact
            ? "mt-1.5 font-display text-[1.65rem] leading-[1.15] text-cocoa sm:text-[1.85rem]"
            : "mt-2 font-display text-4xl text-cocoa sm:text-5xl"
        }
      >
        {product.name}
      </h1>
      {product.description && (
        <p
          className={
            compact
              ? "mt-2 text-sm leading-relaxed text-cocoa-soft"
              : "mt-2 text-sm leading-relaxed text-cocoa-soft/80 sm:text-base"
          }
        >
          {product.description}
        </p>
      )}
      <div className={compact ? "mt-4 flex flex-wrap items-end gap-x-3 gap-y-1" : "mt-3"}>
        <p
          className={
            compact
              ? "font-display text-2xl font-semibold tracking-tight text-cocoa sm:text-[1.75rem]"
              : "text-xl font-semibold text-berry sm:text-2xl"
          }
        >
          {priceLabel(
            product.priceMode as PriceMode,
            basePrice || null,
            showPromo ? product.priceCents : null,
          )}
        </p>
        {showPromo && !hasEstimateBump && (
          <p className="pb-0.5 text-xs font-medium text-rosewood">
            Preço promocional
          </p>
        )}
        {hasEstimateBump && (
          <p className="pb-0.5 text-sm text-cocoa-soft">
            Com opções: {formatBRL(unitPrice)}
            {product.priceMode === "FROM" ? " (estimativa)" : ""}
          </p>
        )}
      </div>
      {scheduledClosed && (
        <p className="mt-2 text-sm font-medium text-rosewood">
          Indisponível fora do horário de funcionamento
        </p>
      )}
      {product.trackStock && !scheduledClosed && (
        <p
          className={`mt-2 text-sm font-medium ${
            soldOut ? "text-rosewood" : "text-cocoa-soft"
          }`}
        >
          {soldOut
            ? "Esgotado no momento"
            : maxQty === 1
              ? `1 ${product.unit || "un"} disponível`
              : `${maxQty} ${product.unit || "un"} disponíveis`}
        </p>
      )}
    </div>
  );

  const formBlock = (
    <div className={compact ? "space-y-5" : "mt-6 space-y-5"}>
      {product.kitContents && (
        <div
          className={
            compact
              ? "rounded-xl border border-rosewood/15 bg-blush/40 px-4 py-3.5"
              : "panel mt-5 p-4"
          }
        >
          <p className="text-sm font-semibold text-cocoa">O que está incluso</p>
          <pre className="mt-1.5 whitespace-pre-wrap font-sans text-sm leading-relaxed text-cocoa-soft">
            {product.kitContents}
          </pre>
        </div>
      )}

      {product.optionGroups.map((g) => {
        const min = g.minSelect ?? (g.required ? 1 : 0);
        const max = Math.max(g.maxSelect || 1, min || 1);
        const picked = selected[g.id]?.length || 0;
        const incomplete = picked < min;
        return (
          <div key={g.id}>
            <p className="label">
              {g.name}
              <span className="ml-1.5 font-normal normal-case tracking-normal text-cocoa-soft/70">
                {min === max ? `Escolha ${min}` : `De ${min} a ${max}`}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {g.options.map((o) => {
                const active = (selected[g.id] || []).includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggleOption(g, o.id)}
                    className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? "border-berry bg-berry text-white shadow-sm"
                        : "border-cocoa/10 bg-surface text-cocoa hover:border-rosewood/40 hover:bg-sand/60"
                    }`}
                  >
                    {o.name}
                    {o.priceDeltaCents > 0
                      ? ` (+${formatBRL(o.priceDeltaCents)})`
                      : ""}
                  </button>
                );
              })}
            </div>
            {incomplete ? (
              <p className="mt-1.5 text-xs text-rosewood-deep">
                Selecione pelo menos {min} {min === 1 ? "opção" : "opções"}.
              </p>
            ) : null}
          </div>
        );
      })}

      {product.addons.length > 0 && (
        <StoreAddonsPicker
          addons={product.addons}
          qty={addonQty}
          notes={addonNotes}
          onQty={(id, next) => setAddonQty((s) => ({ ...s, [id]: next }))}
          onNote={(id, value) => setAddonNotes((s) => ({ ...s, [id]: value }))}
        />
      )}

      {(product.productType === "CAKE" ||
        product.productType === "CUSTOM" ||
        product.productType === "PARTY_KIT") && (
        <div
          className={
            compact
              ? "space-y-4 rounded-xl border border-cocoa/8 bg-sand/30 p-4"
              : "space-y-5"
          }
        >
          {compact && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-cocoa-soft">
              Personalização
            </p>
          )}
          {product.productType === "CAKE" && (
            <div>
              <label className="label">Tema / decoração</label>
              <input
                className="input"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="Ex: floral, personagem, casamento"
              />
            </div>
          )}
          <div>
            <label className="label">Data do evento / retirada</label>
            <div className="relative">
              <CalendarDays
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-rosewood/70"
                aria-hidden
              />
              <input
                type="date"
                className="input !pl-10"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <p className="mt-1.5 text-xs text-cocoa-soft">
              Prazo mínimo: {advance}{" "}
              {advance === 1 ? "dia" : "dias"} de antecedência
            </p>
          </div>
          {product.productType === "PARTY_KIT" && (
            <div>
              <label className="label">Quantidade de convidados</label>
              <input
                type="number"
                min={1}
                className="input"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              />
            </div>
          )}
          <div>
            <label className="label">Referência / observações</label>
            <textarea
              className="input min-h-[5.5rem] resize-y"
              value={referenceNote || notes}
              onChange={(e) => {
                setReferenceNote(e.target.value);
                setNotes(e.target.value);
              }}
              placeholder="Descreva a referência ou detalhes que ajudem no orçamento"
            />
          </div>
        </div>
      )}

      {product.productType === "CORPORATE" && (
        <div
          className={
            compact
              ? "space-y-4 rounded-xl border border-cocoa/8 bg-sand/30 p-4"
              : "space-y-5"
          }
        >
          <div>
            <label className="label">Empresa</label>
            <input
              className="input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Quantidade aproximada</label>
            <input
              type="number"
              min={1}
              className="input"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value) || 1)}
            />
          </div>
          <div>
            <label className="label">Prazo desejado</label>
            <input
              type="date"
              className="input"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-cocoa">
            <input
              type="checkbox"
              checked={needsInvoice}
              onChange={(e) => setNeedsInvoice(e.target.checked)}
              className="h-4 w-4 rounded border-cocoa/20 text-berry accent-[var(--berry)]"
            />
            Preciso de nota fiscal
          </label>
          <div>
            <label className="label">Personalização / logo</label>
            <textarea
              className="input min-h-[5.5rem] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva branding, cores, embalagem..."
            />
          </div>
        </div>
      )}

      {!quote && product.productType === "READY" && (
        <div>
          <p className="label">Quantidade</p>
          <div className="inline-flex items-center gap-1 rounded-xl border border-cocoa/10 bg-sand/40 p-1">
            <button
              type="button"
              aria-label="Diminuir quantidade"
              disabled={qty <= 1 || soldOut}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cocoa transition hover:bg-surface disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums text-cocoa">
              {qty}
            </span>
            <button
              type="button"
              aria-label="Aumentar quantidade"
              disabled={soldOut || (maxQty != null && qty >= maxQty)}
              onClick={() =>
                setQty((q) =>
                  maxQty != null ? Math.min(maxQty, q + 1) : q + 1,
                )
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cocoa transition hover:bg-surface disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {maxQty != null && !soldOut && (
            <p className="mt-1.5 text-xs text-cocoa-soft">
              Máximo: {maxQty} {product.unit || "un"}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const ctaButton = (
    <button
      type="button"
      onClick={handleAdd}
      disabled={soldOut || missingAddonNote || Boolean(missingGroup)}
      className={
        compact
          ? "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rosewood px-5 py-3.5 text-[0.95rem] font-semibold text-white shadow-[0_10px_28px_rgba(185,111,125,0.28)] transition hover:bg-rosewood-deep disabled:cursor-not-allowed disabled:opacity-50"
          : "inline-flex mt-8 w-full items-center justify-center gap-2 rounded-lg bg-rosewood px-5 py-3.5 text-base font-semibold text-white shadow-[0_10px_28px_rgba(185,111,125,0.28)] transition hover:bg-rosewood-deep disabled:cursor-not-allowed disabled:opacity-50"
      }
    >
      {soldOut
        ? scheduledClosed
          ? "Indisponível agora"
          : "Esgotado"
        : missingAddonNote
          ? "Preencha o detalhe do adicional"
          : ctaLabel}
      {!soldOut && !quote && product.priceMode !== "QUOTE" && lineTotal > 0 && (
        <span className="ml-1.5 opacity-90">· {formatBRL(lineTotal)}</span>
      )}
    </button>
  );

  if (compact) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="grid md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] md:items-stretch">
            {imageBlock}
            <div className="flex flex-col gap-5 px-5 py-5 sm:px-6 sm:py-6">
              {headerBlock}
              {formBlock}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-cocoa/8 bg-surface/95 px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-cocoa">
                {product.name}
              </p>
              <p className="text-xs text-cocoa-soft">
                {quote || product.priceMode === "QUOTE"
                  ? "Valor a confirmar no atendimento"
                  : product.priceMode === "FROM"
                    ? `Estimativa · ${formatBRL(lineTotal || unitPrice)}`
                    : formatBRL(lineTotal || unitPrice)}
              </p>
            </div>
            <div className="w-full sm:max-w-xs sm:shrink-0">{ctaButton}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      {imageBlock}
      <div>
        {headerBlock}
        {formBlock}
        {ctaButton}
      </div>
    </div>
  );
}
