"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import { Field } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { cn } from "@/lib/cn";
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
  variant = "default",
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
  variant?: "default" | "sheet";
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
  const sheet = variant === "sheet";
  const fieldRound = sheet ? "!rounded-xl" : undefined;

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

  const summary = (
    <aside
      className={cn(
        "space-y-3 rounded-xl bg-[#F7F4F1] p-4",
        sheet
          ? "grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4"
          : "h-fit lg:sticky lg:top-4",
      )}
    >
      <Result compact={sheet} label="Custo total" value={formatBRL(costCents)} />
      <Result
        compact={sheet}
        label="Preço de venda"
        value={saleCents > 0 ? formatBRL(saleCents) : "—"}
      />
      <Result compact={sheet} label="Lucro" value={formatBRL(profit)} />
      <Result
        compact={sheet}
        label="Margem"
        value={`${margin.toFixed(1).replace(".", ",")}%`}
      />
    </aside>
  );

  return (
    <div
      className={cn(
        "grid min-w-0 gap-5",
        sheet ? "grid-cols-1" : "lg:grid-cols-[1fr_240px]",
      )}
    >
      {sheet ? summary : null}

      <div className="min-w-0 space-y-4">
        <section
          className={cn(
            sheet && "rounded-xl border border-[var(--painel-border)] bg-white p-4",
          )}
        >
          <div className={cn(sheet ? "mb-4" : "mb-0")}>
            <h3 className="text-sm font-semibold text-cocoa">Receita</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[#8C8682]">
              Escolha os insumos e as quantidades. O custo é calculado
              automaticamente.
            </p>
          </div>

          <div className={cn(sheet && "space-y-4")}>
        {stockItems.length === 0 ? (
          <p className="text-sm text-cocoa-soft/70">
            Nenhum insumo ainda.{" "}
            <Link href="/painel/insumos" className="font-medium text-rosewood">
              Cadastre em Insumos
            </Link>{" "}
            (menu ao lado) e volte aqui.
          </p>
        ) : lines.length === 0 ? (
          <p className="rounded-xl border border-dashed border-cocoa/12 bg-[#FAFAF8] px-4 py-6 text-center text-sm text-cocoa-soft/70">
            Nenhum insumo na receita ainda.
          </p>
        ) : (
          <ul className="min-w-0 space-y-4">
            {lines.map((line, index) => {
              const item = itemById.get(line.stockItemId);
              const quantity = Number(line.quantity.replace(",", "."));
              const lineCents =
                item?.unitCostCents != null &&
                Number.isFinite(quantity) &&
                quantity > 0
                  ? Math.round(item.unitCostCents * quantity)
                  : 0;
              if (!sheet) {
                return (
                  <li key={index} className="min-w-0">
                    <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-[1fr_88px_auto]">
                      <select
                        className="input min-w-0"
                        value={line.stockItemId}
                        onChange={(e) =>
                          onLines(
                            lines.map((row, i) =>
                              i === index
                                ? { ...row, stockItemId: e.target.value }
                                : row,
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
                        className="input min-w-0"
                        type="number"
                        min={0}
                        step="any"
                        inputMode="decimal"
                        placeholder="Qtd"
                        value={line.quantity}
                        onChange={(e) =>
                          onLines(
                            lines.map((row, i) =>
                              i === index
                                ? { ...row, quantity: e.target.value }
                                : row,
                            ),
                          )
                        }
                      />
                      <div className="flex items-center justify-end gap-2 text-sm text-cocoa">
                        <span className="min-w-20 text-right">
                          {formatBRL(lineCents)}
                        </span>
                        <button
                          type="button"
                          className="text-cocoa-soft/50 hover:text-cocoa"
                          onClick={() =>
                            onLines(lines.filter((_, i) => i !== index))
                          }
                          aria-label="Remover insumo"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </li>
                );
              }

              return (
                <li
                  key={index}
                  className="min-w-0 overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white p-3"
                >
                  <div
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_4.5rem_minmax(4.25rem,auto)_2.25rem] items-center gap-2"
                  >
                    <select
                      className={cn(
                        "input !w-full min-w-0 max-w-full",
                        fieldRound,
                      )}
                      value={line.stockItemId}
                      aria-label="Insumo"
                      onChange={(e) =>
                        onLines(
                          lines.map((row, i) =>
                            i === index
                              ? { ...row, stockItemId: e.target.value }
                              : row,
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
                      className={cn(
                        "input !w-full min-w-0 max-w-full",
                        fieldRound,
                      )}
                      type="number"
                      min={0}
                      step="any"
                      inputMode="decimal"
                      placeholder="Qtd"
                      aria-label="Quantidade"
                      value={line.quantity}
                      onChange={(e) =>
                        onLines(
                          lines.map((row, i) =>
                            i === index
                              ? { ...row, quantity: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                    <p
                      className="min-w-0 truncate text-right text-sm font-medium tabular-nums text-cocoa"
                    >
                      {formatBRL(lineCents)}
                    </p>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-cocoa-soft/55 transition hover:bg-[#F0F2F5] hover:text-cocoa"
                      onClick={() =>
                        onLines(lines.filter((_, i) => i !== index))
                      }
                      aria-label="Remover insumo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {stockItems.length > 0 && (
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center gap-1.5 text-sm font-medium text-[var(--painel-brand,#0f352e)]",
              sheet &&
                "w-full rounded-xl border border-dashed border-[var(--painel-brand,#0f352e)] py-2.5 transition hover:bg-[var(--painel-brand,#0f352e)]/5",
            )}
            onClick={() =>
              onLines([...lines, { stockItemId: "", quantity: "1" }])
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar insumo
          </button>
        )}

        <p className="text-sm text-cocoa-soft/70">
          Subtotal dos insumos:{" "}
          <span className="font-medium text-cocoa">
            {formatBRL(ingredientCents)}
          </span>
        </p>
          </div>
        </section>

        <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-cocoa">Outros custos</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-[#8C8682]">
              Embalagem, mão de obra e valores fixos por unidade.
            </p>
          </div>
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <MoneyField
              label="Embalagem"
              value={packaging}
              onChange={onPackaging}
              controlClassName={fieldRound}
            />
            <MoneyField
              label="Mão de obra"
              value={labor}
              onChange={onLabor}
              controlClassName={fieldRound}
            />
            <MoneyField
              label="Outros custos"
              value={other}
              onChange={onOther}
              controlClassName={fieldRound}
            />
            <MoneyField
              label="Custos indiretos"
              value={indirect}
              onChange={onIndirect}
              controlClassName={fieldRound}
            />
          </div>
        </section>
      </div>

      {!sheet ? summary : null}
    </div>
  );
}

function MoneyField({
  label,
  value,
  onChange,
  controlClassName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  controlClassName?: string;
}) {
  return (
    <Field
      className="min-w-0"
      label={label}
      control={
        <MaskedInput
          kind="money"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn("min-w-0 w-full", controlClassName)}
        />
      }
    />
  );
}

function Result({
  label,
  value,
  compact,
}: {
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-cocoa-soft/55">{label}</p>
      <p
        className={cn(
          "truncate font-display text-cocoa",
          compact ? "text-lg font-semibold" : "text-2xl",
        )}
      >
        {value}
      </p>
    </div>
  );
}
