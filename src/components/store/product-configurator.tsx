"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL, isQuoteFlow, PRODUCT_TYPE_LABELS } from "@/lib/utils";
import { priceLabel } from "@/components/store/product-card";
import type {
  Addon,
  OptionGroup,
  PriceMode,
  Product,
  ProductOption,
  ProductType,
} from "@prisma/client";

type ProductDetail = Product & {
  optionGroups: (OptionGroup & { options: ProductOption[] })[];
  addons: Addon[];
};

export function ProductConfigurator({
  storeSlug,
  product,
  minAdvanceDays,
}: {
  storeSlug: string;
  product: ProductDetail;
  minAdvanceDays: number;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const quote = isQuoteFlow(product.productType) || product.priceMode === "QUOTE";

  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const g of product.optionGroups) {
      if (g.options[0]) init[g.id] = g.options[0].id;
    }
    return init;
  });
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
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
      const opt = g.options.find((o) => o.id === selected[g.id]);
      if (opt) delta += opt.priceDeltaCents;
    }
    return delta;
  }, [product.optionGroups, selected]);

  const addonsTotal = useMemo(() => {
    return product.addons.reduce((sum, a) => {
      const q = addonQty[a.id] || 0;
      return sum + a.priceCents * q;
    }, 0);
  }, [product.addons, addonQty]);

  const unitPrice =
    product.priceMode === "QUOTE"
      ? 0
      : (product.priceCents ?? 0) + optionDelta + addonsTotal;

  function buildCustomizations() {
    const custom: Record<string, string | number | string[]> = {};
    for (const g of product.optionGroups) {
      const opt = g.options.find((o) => o.id === selected[g.id]);
      if (opt) custom[g.name] = opt.name;
    }
    const chosenAddons = product.addons
      .filter((a) => (addonQty[a.id] || 0) > 0)
      .map((a) => `${addonQty[a.id]}x ${a.name}`);
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

  function handleAdd() {
    addItem({
      productId: product.id,
      productName: product.name,
      productType: product.productType,
      quantity: qty,
      unitPriceCents: unitPrice,
      priceMode: product.priceMode as "FIXED" | "FROM" | "QUOTE",
      customizations: buildCustomizations(),
    });
    router.push(`/${storeSlug}/carrinho`);
  }

  const advance = product.minAdvanceDays ?? minAdvanceDays;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="overflow-hidden rounded-[1.8rem] bg-fog">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="aspect-[4/3] w-full object-cover"
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center text-6xl">🍰</div>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-berry">
          {PRODUCT_TYPE_LABELS[product.productType as ProductType]}
        </p>
        <h1 className="mt-2 font-display text-4xl text-cocoa sm:text-5xl">
          {product.name}
        </h1>
        {product.description && (
          <p className="mt-3 leading-relaxed text-cocoa-soft/80">
            {product.description}
          </p>
        )}
        <p className="mt-4 text-2xl font-semibold text-berry-deep">
          {priceLabel(product.priceMode as PriceMode, product.priceCents)}
        </p>
        {product.priceMode !== "QUOTE" && unitPrice > (product.priceCents ?? 0) && (
          <p className="mt-1 text-sm text-cocoa-soft/70">
            Com opções selecionadas: {formatBRL(unitPrice)}
            {product.priceMode === "FROM" ? " (estimativa)" : ""}
          </p>
        )}

        {product.kitContents && (
          <div className="panel mt-5 p-4">
            <p className="font-semibold text-cocoa">O que está incluso</p>
            <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-cocoa-soft/80">
              {product.kitContents}
            </pre>
          </div>
        )}

        <div className="mt-6 space-y-5">
          {product.optionGroups.map((g) => (
            <div key={g.id}>
              <p className="label">{g.name}</p>
              <div className="flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const active = selected[g.id] === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() =>
                        setSelected((s) => ({ ...s, [g.id]: o.id }))
                      }
                      className={`rounded-full border px-3 py-2 text-sm transition ${
                        active
                          ? "border-berry bg-berry text-white"
                          : "border-cocoa/15 bg-white/70 text-cocoa hover:border-berry"
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
            </div>
          ))}

          {product.addons.length > 0 && (
            <div>
              <p className="label">Adicionais</p>
              <div className="space-y-2">
                {product.addons.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-cocoa/10 bg-white/60 px-3 py-2"
                  >
                    <span className="text-sm">
                      {a.name} · {formatBRL(a.priceCents)}
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={a.maxQty}
                      className="input !w-20 !py-1.5"
                      value={addonQty[a.id] || 0}
                      onChange={(e) =>
                        setAddonQty((s) => ({
                          ...s,
                          [a.id]: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {(product.productType === "CAKE" ||
            product.productType === "CUSTOM" ||
            product.productType === "PARTY_KIT") && (
            <>
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
                <input
                  type="date"
                  className="input"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
                <p className="mt-1 text-xs text-cocoa-soft/65">
                  Prazo mínimo: {advance} dias de antecedência
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
                  className="input min-h-24"
                  value={referenceNote || notes}
                  onChange={(e) => {
                    setReferenceNote(e.target.value);
                    setNotes(e.target.value);
                  }}
                  placeholder="Descreva a referência ou anexe detalhes que ajudem no orçamento"
                />
              </div>
            </>
          )}

          {product.productType === "CORPORATE" && (
            <>
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
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={needsInvoice}
                  onChange={(e) => setNeedsInvoice(e.target.checked)}
                />
                Preciso de nota fiscal
              </label>
              <div>
                <label className="label">Personalização / logo</label>
                <textarea
                  className="input min-h-24"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Descreva branding, cores, embalagem..."
                />
              </div>
            </>
          )}

          {!quote && product.productType === "READY" && (
            <div>
              <label className="label">Quantidade</label>
              <input
                type="number"
                min={1}
                className="input !w-28"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value) || 1)}
              />
            </div>
          )}
        </div>

        <button type="button" onClick={handleAdd} className="btn-berry mt-8 w-full">
          {quote || product.priceMode === "QUOTE"
            ? "Solicitar orçamento"
            : product.priceMode === "FROM"
              ? "Adicionar estimativa ao pedido"
              : "Adicionar ao pedido"}
        </button>
      </div>
    </div>
  );
}
