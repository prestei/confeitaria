"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatBRL } from "@/lib/utils";

export type PricingStockItem = {
  id: string;
  name: string;
  unit: string;
  unitCostCents: number | null;
};

export type RecipeDraft = { stockItemId: string; quantity: string };

function reaisToCents(value: string) {
  const n = Number(value.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function productCostCents({
  lines,
  stockItems,
  packaging,
  labor,
  other,
  indirect,
}: {
  lines: RecipeDraft[];
  stockItems: PricingStockItem[];
  packaging: string;
  labor: string;
  other: string;
  indirect: string;
}) {
  const itemById = new Map(stockItems.map((item) => [item.id, item]));
  const ingredientCents = lines.reduce((sum, line) => {
    const item = itemById.get(line.stockItemId);
    const quantity = Number(line.quantity.replace(",", "."));
    if (!item?.unitCostCents || !Number.isFinite(quantity) || quantity <= 0) {
      return sum;
    }
    return sum + Math.round(item.unitCostCents * quantity);
  }, 0);
  const extras =
    reaisToCents(packaging) +
    reaisToCents(labor) +
    reaisToCents(other) +
    reaisToCents(indirect);
  return { ingredientCents, extras, costCents: ingredientCents + extras };
}

export function ProductPricingFields({
  stockItems,
  lines,
  onLines,
  packaging,
  labor,
  other,
  indirect,
  onPackaging,
  onLabor,
  onOther,
  onIndirect,
  saleCents,
}: {
  stockItems: PricingStockItem[];
  lines: RecipeDraft[];
  onLines: (lines: RecipeDraft[]) => void;
  packaging: string;
  labor: string;
  other: string;
  indirect: string;
  onPackaging: (value: string) => void;
  onLabor: (value: string) => void;
  onOther: (value: string) => void;
  onIndirect: (value: string) => void;
  saleCents: number;
}) {
  const itemById = useMemo(
    () => new Map(stockItems.map((item) => [item.id, item])),
    [stockItems],
  );
  const { ingredientCents, costCents } = productCostCents({
    lines,
    stockItems,
    packaging,
    labor,
    other,
    indirect,
  });
  const profit = saleCents - costCents;
  const margin = saleCents > 0 ? (profit / saleCents) * 100 : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-cocoa">Receita</p>
          <p className="text-xs text-cocoa-soft/60">
            Escolha os insumos e a quantidade usada neste produto.
          </p>
        </div>

        {stockItems.length === 0 ? (
          <p className="text-sm text-cocoa-soft/70">
            Nenhum insumo cadastrado.{" "}
            <Link href="/painel/insumos" className="font-medium text-rosewood">
              Cadastre os insumos
            </Link>{" "}
            e volte para montar a receita.
          </p>
        ) : lines.length === 0 ? (
          <p className="text-sm text-cocoa-soft/70">
            Adicione os insumos que entram neste produto.
          </p>
        ) : (
          lines.map((line, index) => {
            const item = itemById.get(line.stockItemId);
            const quantity = Number(line.quantity.replace(",", "."));
            const lineCents =
              item?.unitCostCents != null && Number.isFinite(quantity) && quantity > 0
                ? Math.round(item.unitCostCents * quantity)
                : 0;
            return (
              <div key={index} className="grid grid-cols-[1fr_88px_auto] gap-2">
                <select
                  className="input"
                  value={line.stockItemId}
                  onChange={(e) =>
                    onLines(
                      lines.map((row, i) =>
                        i === index ? { ...row, stockItemId: e.target.value } : row,
                      ),
                    )
                  }
                >
                  <option value="">Selecionar</option>
                  {stockItems.map((stock) => (
                    <option key={stock.id} value={stock.id}>
                      {stock.name}
                      {stock.unit ? ` (${stock.unit})` : ""}
                    </option>
                  ))}
                </select>
                <input
                  className="input"
                  inputMode="decimal"
                  placeholder="Qtd"
                  value={line.quantity}
                  onChange={(e) =>
                    onLines(
                      lines.map((row, i) =>
                        i === index ? { ...row, quantity: e.target.value } : row,
                      ),
                    )
                  }
                />
                <div className="flex items-center gap-2 text-sm text-cocoa">
                  <span className="w-20 text-right">{formatBRL(lineCents)}</span>
                  <button
                    type="button"
                    className="text-cocoa-soft/50"
                    onClick={() => onLines(lines.filter((_, i) => i !== index))}
                    aria-label="Remover insumo"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })
        )}

        {stockItems.length > 0 && (
          <button
            type="button"
            className="text-sm font-medium text-rosewood"
            onClick={() => onLines([...lines, { stockItemId: "", quantity: "1" }])}
          >
            Adicionar insumo
          </button>
        )}
        <p className="text-sm text-cocoa-soft/70">
          Subtotal dos insumos: {formatBRL(ingredientCents)}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <MoneyField label="Embalagem" value={packaging} onChange={onPackaging} />
          <MoneyField label="Mão de obra" value={labor} onChange={onLabor} />
          <MoneyField label="Outros custos" value={other} onChange={onOther} />
          <MoneyField label="Custos indiretos" value={indirect} onChange={onIndirect} />
        </div>
      </div>

      <aside className="h-fit space-y-3 rounded-xl bg-[#F7F4F1] p-4">
        <Result label="Custo total" value={formatBRL(costCents)} />
        <Result label="Preço de venda" value={saleCents > 0 ? formatBRL(saleCents) : "—"} />
        <Result label="Lucro" value={formatBRL(profit)} />
        <Result label="Margem" value={`${margin.toFixed(1).replace(".", ",")}%`} />
      </aside>
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        inputMode="decimal"
        placeholder="0,00"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-cocoa-soft/55">{label}</p>
      <p className="font-display text-2xl text-cocoa">{value}</p>
    </div>
  );
}
