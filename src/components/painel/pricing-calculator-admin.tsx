"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, type ReactNode } from "react";
import { Calculator, Percent, Plus, Trash2, Wallet } from "lucide-react";
import {
  Sheet,
  SheetBody,
  SheetCancel,
  SheetContent,
  SheetFooter,
  SheetForm,
  SheetHeader,
  SheetPrimary,
} from "@/components/ui/sheet";
import { calculateSuggestedPrice } from "@/lib/pricing";
import { formatBRL } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { SectionCard } from "@/components/painel/page-header";
import { cn } from "@/lib/cn";

const fieldLabel =
  "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-cocoa outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";

function CalcFormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: typeof Percent;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E8E2DE] bg-white p-4">
      <div className="mb-4 flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F3EEE8] text-[#483129]">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-cocoa">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-[#8C8682]">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export type SavedCalculation = {
  id: string;
  name: string;
  ingredientCostCents: number;
  packagingCents: number;
  laborCents: number;
  otherCents: number;
  feePercent: number;
  marginPercent: number;
  batchQty: number;
  totalBatchCents: number;
  unitCostCents: number;
  suggestedUnitPriceCents: number;
  estimatedProfitPerUnitCents: number;
  updatedAt: string;
};

function reaisToCents(value: string) {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

function centsToReaisInput(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function PricingCalculatorAdmin({
  initialCalculations,
}: {
  initialCalculations: SavedCalculation[];
}) {
  const { toast } = useToast();
  const [history, setHistory] = useState(initialCalculations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [packaging, setPackaging] = useState("");
  const [labor, setLabor] = useState("");
  const [other, setOther] = useState("");
  const [fees, setFees] = useState("0");
  const [margin, setMargin] = useState("30");
  const [batchQty, setBatchQty] = useState("1");
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const preview = useMemo(() => {
    return calculateSuggestedPrice({
      ingredientCostCents: reaisToCents(ingredients),
      packagingCents: reaisToCents(packaging),
      laborCents: reaisToCents(labor),
      otherCents: reaisToCents(other),
      feePercent: Number(fees.replace(",", ".")) || 0,
      marginPercent: Number(margin.replace(",", ".")) || 0,
      batchQty: Math.max(1, Number(batchQty) || 1),
    });
  }, [ingredients, packaging, labor, other, fees, margin, batchQty]);

  function loadRow(row: SavedCalculation) {
    setEditingId(row.id);
    setName(row.name);
    setIngredients(centsToReaisInput(row.ingredientCostCents));
    setPackaging(centsToReaisInput(row.packagingCents));
    setLabor(centsToReaisInput(row.laborCents));
    setOther(centsToReaisInput(row.otherCents));
    setFees(String(row.feePercent));
    setMargin(String(row.marginPercent));
    setBatchQty(String(row.batchQty));
    setFormOpen(true);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setIngredients("");
    setPackaging("");
    setLabor("");
    setOther("");
    setFees("0");
    setMargin("30");
    setBatchQty("1");
  }

  function openNew() {
    resetForm();
    setFormOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Informe o nome do produto", tone: "warning" });
      return;
    }
    if (!preview.ok) {
      toast({ title: preview.error, tone: "error" });
      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      ingredientCostCents: reaisToCents(ingredients),
      packagingCents: reaisToCents(packaging),
      laborCents: reaisToCents(labor),
      otherCents: reaisToCents(other),
      feePercent: Number(fees.replace(",", ".")) || 0,
      marginPercent: Number(margin.replace(",", ".")) || 0,
      batchQty: Math.max(1, Number(batchQty) || 1),
    };

    const url = editingId
      ? `/api/pricing-calculations/${editingId}`
      : "/api/pricing-calculations";
    const res = await fetch(url, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok) {
      toast({
        title: json?.error || "Não foi possível salvar",
        tone: "error",
      });
      return;
    }

    const row = json as SavedCalculation;
    setHistory((prev) => {
      const next = prev.filter((r) => r.id !== row.id);
      return [row, ...next].slice(0, 50);
    });
    toast({
      title: editingId ? "Cálculo atualizado" : "Cálculo salvo",
      tone: "success",
    });
    if (!editingId) resetForm();
    setFormOpen(false);
  }

  async function remove(id: string) {
    if (!confirm("Excluir este cálculo?")) return;
    const res = await fetch(`/api/pricing-calculations/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      toast({ title: "Não foi possível excluir", tone: "error" });
      return;
    }
    setHistory((prev) => prev.filter((r) => r.id !== id));
    if (editingId === id) resetForm();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[#8C8682]">
          Salve cálculos para reutilizar e abra um item para editar.
        </p>
        <button
          type="button"
          className="btn-primary !py-2 text-sm"
          onClick={openNew}
        >
          <Plus className="h-4 w-4" />
          Novo cálculo
        </button>
      </div>

      <SectionCard
        title="Cálculos recentes"
        action={
          <Calculator className="h-4 w-4 text-[#8C8682]" aria-hidden />
        }
      >
        {history.length === 0 ? (
          <p className="p-5 text-sm text-[#8C8682]">
            Nenhum cálculo salvo ainda.
          </p>
        ) : (
          <ul className="divide-y divide-[#E8E2DE]">
            {history.map((row) => (
              <li key={row.id} className="flex items-start gap-2 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => loadRow(row)}
                >
                  <p className="truncate text-sm font-semibold text-cocoa">
                    {row.name}
                  </p>
                  <p className="text-xs text-[#8C8682]">
                    {formatBRL(row.suggestedUnitPriceCents)} ·{" "}
                    {new Date(row.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </button>
                <button
                  type="button"
                  className="p-1 text-[#8C8682] hover:text-cocoa"
                  onClick={() => remove(row.id)}
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Sheet
        open={formOpen}
        onOpenChange={(next) => !saving && setFormOpen(next)}
      >
        <SheetContent size="lg" side="right">
          <SheetHeader title={editingId ? "Editar cálculo" : "Novo cálculo"} />
          <SheetForm onSubmit={onSubmit}>
            <SheetBody className="space-y-5">
              <CalcFormSection
                title="Produto"
                description="Nome para identificar este cálculo na lista."
              >
                <div>
                  <label className={fieldLabel} htmlFor="calc-name">
                    Nome do produto
                  </label>
                  <input
                    id="calc-name"
                    className={fieldInput}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Bolo de chocolate"
                    required
                  />
                </div>
              </CalcFormSection>

              <CalcFormSection
                icon={Wallet}
                title="Custos do lote"
                description="Valores totais da receita antes de dividir por unidade."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabel} htmlFor="calc-ingredients">
                      Custo dos ingredientes (R$)
                    </label>
                    <input
                      id="calc-ingredients"
                      className={fieldInput}
                      inputMode="decimal"
                      value={ingredients}
                      onChange={(e) => setIngredients(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className={fieldLabel} htmlFor="calc-packaging">
                      Embalagem (R$)
                    </label>
                    <input
                      id="calc-packaging"
                      className={fieldInput}
                      inputMode="decimal"
                      value={packaging}
                      onChange={(e) => setPackaging(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className={fieldLabel} htmlFor="calc-labor">
                      Mão de obra (R$)
                    </label>
                    <input
                      id="calc-labor"
                      className={fieldInput}
                      inputMode="decimal"
                      value={labor}
                      onChange={(e) => setLabor(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                  <div>
                    <label className={fieldLabel} htmlFor="calc-other">
                      Outras despesas (R$)
                    </label>
                    <input
                      id="calc-other"
                      className={fieldInput}
                      inputMode="decimal"
                      value={other}
                      onChange={(e) => setOther(e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </CalcFormSection>

              <CalcFormSection
                icon={Percent}
                title="Preço e margem"
                description="Taxas, margem sobre o preço de venda e quantidade do lote."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabel} htmlFor="calc-fees">
                      Taxas sobre a venda (%)
                    </label>
                    <input
                      id="calc-fees"
                      className={fieldInput}
                      inputMode="decimal"
                      value={fees}
                      onChange={(e) => setFees(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={fieldLabel} htmlFor="calc-margin">
                      Margem de lucro desejada (%)
                    </label>
                    <input
                      id="calc-margin"
                      className={fieldInput}
                      inputMode="decimal"
                      value={margin}
                      onChange={(e) => setMargin(e.target.value)}
                    />
                    <p className="mt-1.5 text-xs text-[#8C8682]">
                      Margem sobre o preço de venda, não sobre o custo.
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={fieldLabel} htmlFor="calc-batch">
                      Quantidade produzida
                    </label>
                    <input
                      id="calc-batch"
                      className={cn(fieldInput, "max-w-[12rem]")}
                      type="number"
                      min={1}
                      value={batchQty}
                      onChange={(e) => setBatchQty(e.target.value)}
                    />
                  </div>
                </div>
              </CalcFormSection>

              {preview.ok ? (
                <section className="rounded-xl border border-[#E8E2DE] bg-[#F7F4F1] p-4">
                  <h3 className="text-sm font-semibold text-cocoa">Resultado</h3>
                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-[#8C8682]">
                        Custo total do lote
                      </dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-cocoa">
                        {formatBRL(preview.totalBatchCents)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#8C8682]">Custo unitário</dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-cocoa">
                        {formatBRL(preview.unitCostCents)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#8C8682]">
                        Preço de venda sugerido
                      </dt>
                      <dd className="mt-0.5 font-display text-xl tabular-nums text-cocoa">
                        {formatBRL(preview.suggestedUnitPriceCents)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-[#8C8682]">
                        Lucro estimado por unidade
                      </dt>
                      <dd className="mt-0.5 font-semibold tabular-nums text-cocoa">
                        {formatBRL(preview.estimatedProfitPerUnitCents)}
                      </dd>
                    </div>
                  </dl>
                  {preview.suggestedUnitPriceCents > 0 ? (
                    <Link
                      href={`/painel/produtos/novo?preco=${(preview.suggestedUnitPriceCents / 100).toFixed(2)}&nome=${encodeURIComponent(name.trim())}`}
                      className="mt-4 inline-block text-sm font-semibold text-[var(--painel-brand,#0f352e)] hover:underline"
                      onClick={() => setFormOpen(false)}
                    >
                      Usar preço no cadastro de produto
                    </Link>
                  ) : null}
                </section>
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {preview.error}
                </p>
              )}
            </SheetBody>
            <SheetFooter>
              {editingId ? (
                <button
                  type="button"
                  className="btn-secondary !py-2 text-sm"
                  onClick={() => {
                    resetForm();
                  }}
                >
                  Novo cálculo
                </button>
              ) : (
                <SheetCancel />
              )}
              <SheetPrimary disabled={saving}>
                {saving ? "Salvando…" : editingId ? "Atualizar" : "Salvar cálculo"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>
    </div>
  );
}
