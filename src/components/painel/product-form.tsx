"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { PageAction, PageHeader, PageShell } from "@/components/painel/page-header";
import { cn } from "@/lib/cn";

type Category = { id: string; name: string };

type OptionRow = { name: string; priceDelta: string };
type GroupRow = { name: string; options: OptionRow[] };
type AddonRow = { name: string; price: string };

const emptyGroup = (): GroupRow => ({
  name: "",
  options: [{ name: "", priceDelta: "0" }],
});

const STEPS = [
  { id: 1, label: "Básico" },
  { id: 2, label: "Preço e estoque" },
  { id: 3, label: "Opções" },
  { id: 4, label: "Revisar" },
] as const;

export function ProductForm({
  productId,
  initial,
}: {
  productId?: string;
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
    active: boolean;
    trackStock: boolean;
    stockQty: string;
    stockMin: string;
    unit: string;
    optionGroups: GroupRow[];
    addons: AddonRow[];
  };
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [gallery, setGallery] = useState(initial?.gallery ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [productType, setProductType] = useState(initial?.productType ?? "READY");
  const [priceMode, setPriceMode] = useState(initial?.priceMode ?? "FIXED");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [promoPrice, setPromoPrice] = useState(initial?.promoPrice ?? "");
  const [availability, setAvailability] = useState(
    initial?.availability ?? "AVAILABLE",
  );
  const [unit, setUnit] = useState(initial?.unit ?? "un");
  const [trackStock, setTrackStock] = useState(initial?.trackStock ?? false);
  const [stockQty, setStockQty] = useState(initial?.stockQty ?? "0");
  const [stockMin, setStockMin] = useState(initial?.stockMin ?? "5");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  const [groups, setGroups] = useState<GroupRow[]>(
    initial?.optionGroups?.length ? initial.optionGroups : [],
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

  function canGoNext() {
    if (step === 1) return name.trim().length >= 2;
    return true;
  }

  async function onSubmit(e?: FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError("");

    const priceCents =
      priceMode === "QUOTE" || !price
        ? null
        : Math.round(Number(price.replace(",", ".")) * 100);
    const promoPriceCents = promoPrice
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
      active,
      trackStock,
      stockQty: Number(stockQty || 0),
      stockMin: Number(stockMin || 5),
      unit: unit || "un",
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
    router.push("/painel/produtos");
    router.refresh();
  }

  const typeLabel: Record<string, string> = {
    READY: "Pronta entrega",
    CUSTOM: "Sob encomenda",
    CAKE: "Bolo personalizado",
    PARTY_KIT: "Kit festa",
    CORPORATE: "Corporativo",
  };
  const priceLabel: Record<string, string> = {
    FIXED: "Fixo",
    FROM: "A partir de",
    QUOTE: "Sob consulta",
  };

  return (
    <PageShell>
      <PageHeader
        title={productId ? "Editar produto" : "Novo produto"}
        description="Cadastro completo em etapas — fotos, preços, opções e estoque."
        actions={
          <PageAction href="/painel/produtos" variant="secondary">
            Voltar
          </PageAction>
        }
      />

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
                  onClick={() => {
                    if (s.id < step || (s.id === step + 1 && canGoNext())) {
                      setStep(s.id);
                    } else if (s.id < step) {
                      setStep(s.id);
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    current && "bg-[#2D2926] text-white",
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step < 4) {
            if (canGoNext()) setStep((s) => s + 1);
            return;
          }
          onSubmit();
        }}
        className="space-y-5"
      >
        {step === 1 && (
          <section className="grid gap-4 rounded-2xl border border-cocoa/8 bg-white p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-3 text-sm font-semibold text-cocoa">
                Informações básicas
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Nome</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descrição</label>
              <textarea
                className="input min-h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Foto principal (URL)</label>
              <input
                className="input"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
              />
            </div>
            <div>
              <label className="label">Categoria</label>
              <select
                className="input"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Galeria (uma URL por linha)</label>
              <textarea
                className="input min-h-20"
                value={gallery}
                onChange={(e) => setGallery(e.target.value)}
                placeholder="https://foto-1.jpg"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Tipo</label>
              <select
                className="input"
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
              >
                <option value="READY">Pronta entrega</option>
                <option value="CUSTOM">Sob encomenda</option>
                <option value="CAKE">Bolo personalizado</option>
                <option value="PARTY_KIT">Kit festa</option>
                <option value="CORPORATE">Corporativo</option>
              </select>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="grid gap-4 rounded-2xl border border-cocoa/8 bg-white p-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="mb-3 text-sm font-semibold text-cocoa">
                Preço, disponibilidade e estoque
              </p>
            </div>
            <div>
              <label className="label">Modo de preço</label>
              <select
                className="input"
                value={priceMode}
                onChange={(e) => setPriceMode(e.target.value)}
              >
                <option value="FIXED">Fixo</option>
                <option value="FROM">A partir de</option>
                <option value="QUOTE">Sob consulta</option>
              </select>
            </div>
            <div>
              <label className="label">Preço (R$)</label>
              <input
                className="input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={priceMode === "QUOTE"}
              />
            </div>
            <div>
              <label className="label">Preço promocional (R$)</label>
              <input
                className="input"
                value={promoPrice}
                onChange={(e) => setPromoPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Disponibilidade</label>
              <select
                className="input"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                <option value="AVAILABLE">Disponível</option>
                <option value="SOLD_OUT">Esgotado</option>
                <option value="MADE_TO_ORDER">Sob encomenda</option>
                <option value="LAST_UNITS">Últimas unidades</option>
              </select>
            </div>
            <div>
              <label className="label">Unidade</label>
              <input
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-cocoa">
              <input
                type="checkbox"
                checked={trackStock}
                onChange={(e) => setTrackStock(e.target.checked)}
              />
              Controlar estoque
            </label>
            <div className="grid grid-cols-2 gap-3 sm:col-span-2">
              <div>
                <label className="label">Qtd. disponível</label>
                <input
                  className="input"
                  value={stockQty}
                  onChange={(e) => setStockQty(e.target.value)}
                  disabled={!trackStock}
                />
              </div>
              <div>
                <label className="label">Estoque mínimo</label>
                <input
                  className="input"
                  value={stockMin}
                  onChange={(e) => setStockMin(e.target.value)}
                  disabled={!trackStock}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-cocoa">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              Produto em destaque
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-cocoa">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Ativo na vitrine
            </label>
          </section>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <section className="rounded-2xl border border-cocoa/8 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-cocoa">Opções</h2>
                  <p className="text-xs text-cocoa-soft/60">
                    Ex.: Tamanho, Sabor — cada opção pode alterar o preço.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-1.5 text-xs"
                  onClick={() => setGroups((g) => [...g, emptyGroup()])}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Grupo
                </button>
              </div>
              <div className="mt-4 space-y-4">
                {groups.length === 0 && (
                  <p className="text-sm text-cocoa-soft/55">
                    Nenhum grupo de opções. Pode pular esta etapa.
                  </p>
                )}
                {groups.map((g, gi) => (
                  <div key={gi} className="rounded-xl border border-cocoa/8 p-4">
                    <div className="flex gap-2">
                      <input
                        className="input"
                        placeholder="Nome do grupo (ex.: Tamanho)"
                        value={g.name}
                        onChange={(e) =>
                          setGroups((list) =>
                            list.map((item, i) =>
                              i === gi ? { ...item, name: e.target.value } : item,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="rounded-xl p-2 text-cocoa-soft/50 hover:bg-fog"
                        onClick={() =>
                          setGroups((list) => list.filter((_, i) => i !== gi))
                        }
                        aria-label="Remover grupo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {g.options.map((o, oi) => (
                        <div
                          key={oi}
                          className="grid grid-cols-[1fr_100px_auto] gap-2"
                        >
                          <input
                            className="input !py-2 text-sm"
                            placeholder="Opção"
                            value={o.name}
                            onChange={(e) =>
                              setGroups((list) =>
                                list.map((item, i) =>
                                  i === gi
                                    ? {
                                        ...item,
                                        options: item.options.map((opt, j) =>
                                          j === oi
                                            ? { ...opt, name: e.target.value }
                                            : opt,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          <input
                            className="input !py-2 text-sm"
                            placeholder="+R$"
                            value={o.priceDelta}
                            onChange={(e) =>
                              setGroups((list) =>
                                list.map((item, i) =>
                                  i === gi
                                    ? {
                                        ...item,
                                        options: item.options.map((opt, j) =>
                                          j === oi
                                            ? {
                                                ...opt,
                                                priceDelta: e.target.value,
                                              }
                                            : opt,
                                        ),
                                      }
                                    : item,
                                ),
                              )
                            }
                          />
                          <button
                            type="button"
                            className="rounded-xl p-2 text-cocoa-soft/50 hover:bg-fog"
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="text-xs font-semibold text-berry-deep"
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
                        + Opção
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-cocoa/8 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-cocoa">Adicionais</h2>
                  <p className="text-xs text-cocoa-soft/60">
                    Ex.: Morangos, brigadeiros, decoração especial.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-secondary !px-3 !py-1.5 text-xs"
                  onClick={() =>
                    setAddons((a) => [...a, { name: "", price: "0" }])
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicional
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {addons.map((a, ai) => (
                  <div key={ai} className="grid grid-cols-[1fr_100px_auto] gap-2">
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
                    <input
                      className="input !py-2 text-sm"
                      placeholder="R$"
                      value={a.price}
                      onChange={(e) =>
                        setAddons((list) =>
                          list.map((item, i) =>
                            i === ai ? { ...item, price: e.target.value } : item,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="rounded-xl p-2 text-cocoa-soft/50 hover:bg-fog"
                      onClick={() =>
                        setAddons((list) => list.filter((_, i) => i !== ai))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
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
                <dt className="text-xs text-cocoa-soft/55">Tipo</dt>
                <dd className="font-medium text-cocoa">
                  {typeLabel[productType] || productType}
                </dd>
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
                  {trackStock
                    ? `${stockQty} ${unit} (mín. ${stockMin})`
                    : "Sem controle"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-cocoa-soft/55">Opções / adicionais</dt>
                <dd className="font-medium text-cocoa">
                  {groups.filter((g) => g.name.trim()).length} grupos ·{" "}
                  {addons.filter((a) => a.name.trim()).length} adicionais
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
      </form>
    </PageShell>
  );
}
