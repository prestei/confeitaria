"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowDown,
  ChevronDown,
  FileClock,
  Package,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  PageAction,
  PageHeader,
  PageShell,
} from "@/components/painel/page-header";
import {
  PainelMetricCard,
  PainelMetricRow,
  PainelMetricSlide,
} from "@/components/painel/metric-card";
import { Field } from "@/components/ui/input";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import {
  ColumnsTable,
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  type TableColumn,
} from "@/components/painel/data-table";
import { MaskedInput } from "@/components/ui/masked-input";
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
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatBRL, parseMoneyToCents } from "@/lib/utils";

const fieldLabel =
  "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-cocoa outline-none transition placeholder:text-[#B0AAA6] focus:border-[var(--painel-brand)]/40 focus:ring-2 focus:ring-[var(--painel-brand)]/10";

const UNIT_PRESETS = ["kg", "g", "un", "L", "ml"] as const;

const tableInCard =
  "rounded-none border-0 border-t border-[var(--painel-border)] shadow-none";

type StatusFilter = "all" | "zero" | "low" | "ok";

const STATUS_FILTER_LABELS: Record<StatusFilter, string> = {
  all: "Todos os status",
  zero: "Estoque zerado",
  low: "Abaixo do mínimo",
  ok: "Disponível",
};

function insumoEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes("leite")) return "🥛";
  if (n.includes("farinha")) return "🌾";
  if (n.includes("açúcar") || n.includes("acucar")) return "🍬";
  if (n.includes("ovo")) return "🥚";
  if (n.includes("manteiga")) return "🧈";
  if (n.includes("chocolate")) return "🍫";
  return "📦";
}

function InsumoFormSection({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon?: typeof Wallet;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4">
      <div className="mb-4 flex min-w-0 items-start gap-3">
        {Icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--painel-subtle,#eff3f6)] text-[var(--painel-brand,#0f352e)]">
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

type Item = {
  id: string;
  name: string;
  unit: string;
  unitCostCents: number | null;
  quantity: number;
  minQuantity: number;
};

type InsumoMovement = {
  id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  note: string | null;
  createdAt: string;
  stockItemId?: string | null;
  stockItem: { name: string };
};

type Draft = {
  id?: string;
  name: string;
  unit: string;
  cost: string;
  minQty: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  unit: "kg",
  cost: "",
  minQty: "0",
});

function costToCents(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const cents = parseMoneyToCents(trimmed);
  return cents > 0 ? cents : null;
}

function centsToReais(cents: number | null) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function stockStatus(item: Item) {
  if (item.quantity <= 0) {
    return { tone: "danger" as const, label: "Estoque zerado" };
  }
  if (item.minQuantity > 0 && item.quantity <= item.minQuantity) {
    return { tone: "warning" as const, label: "Abaixo do mínimo" };
  }
  return { tone: "success" as const, label: "Disponível" };
}

function matchesStatusFilter(item: Item, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "zero") return item.quantity <= 0;
  if (filter === "low") {
    return (
      item.quantity > 0 &&
      item.minQuantity > 0 &&
      item.quantity <= item.minQuantity
    );
  }
  return (
    item.quantity > 0 &&
    (item.minQuantity <= 0 || item.quantity > item.minQuantity)
  );
}

function StockStatusBadge({ item }: { item: Item }) {
  const status = stockStatus(item);
  const pill = {
    danger: "bg-[#FCE8E8] text-[#C44B4B]",
    warning: "bg-[#FDF0E0] text-[#B87A2A]",
    success: "bg-[#E4F0E8] text-[#3D8A5A]",
  };
  const dot = {
    danger: "bg-[#E05A5A]",
    warning: "bg-[#C47A2A]",
    success: "bg-[#3D8A5A]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        pill[status.tone],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status.tone])} />
      {status.label}
    </span>
  );
}

export function InsumosCadastro({
  initialItems,
  initialMovements = [],
}: {
  initialItems: Item[];
  initialMovements?: InsumoMovement[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(
    initialItems.map(
      ({ id, name, unit, unitCostCents, quantity, minQuantity }) => ({
        id,
        name,
        unit,
        unitCostCents,
        quantity: quantity ?? 0,
        minQuantity: minQuantity ?? 0,
      }),
    ),
  );
  const [movements, setMovements] = useState(initialMovements);
  const [open, setOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [stockSaving, setStockSaving] = useState(false);
  const [error, setError] = useState("");
  const [stockItemId, setStockItemId] = useState(initialItems[0]?.id ?? "");
  const [moveType, setMoveType] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [moveQty, setMoveQty] = useState("1");
  const [moveNote, setMoveNote] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const isEditing = Boolean(draft.id);

  const stats = useMemo(() => {
    const zero = items.filter((item) => item.quantity <= 0).length;
    const belowMin = items.filter(
      (item) =>
        item.quantity > 0 &&
        item.minQuantity > 0 &&
        item.quantity <= item.minQuantity,
    ).length;
    return { total: items.length, zero, belowMin };
  }, [items]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return matchesStatusFilter(item, statusFilter);
    });
  }, [items, search, statusFilter]);

  useEffect(() => {
    if (!open) setError("");
  }, [open]);

  function openCreate() {
    setDraft(emptyDraft());
    setError("");
    setOpen(true);
  }

  function openEdit(item: Item) {
    setDraft({
      id: item.id,
      name: item.name,
      unit: item.unit,
      cost: centsToReais(item.unitCostCents),
      minQty: String(item.minQuantity ?? 0),
    });
    setError("");
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const minQuantity = Math.max(
      0,
      Number(draft.minQty.replace(",", ".")) || 0,
    );
    const payload = {
      name: draft.name.trim(),
      unit: draft.unit.trim() || "un",
      unitCostCents: costToCents(draft.cost),
      ...(isEditing ? { minQuantity } : {}),
    };
    const res = await fetch(
      isEditing ? `/api/stock-items/${draft.id}` : "/api/stock-items",
      {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Não foi possível salvar o insumo");
      return;
    }
    const saved = data as Item;
    const row: Item = {
      id: saved.id,
      name: saved.name,
      unit: saved.unit,
      unitCostCents: saved.unitCostCents,
      quantity: saved.quantity ?? 0,
      minQuantity: saved.minQuantity ?? 0,
    };
    setItems((prev) => {
      const next = isEditing
        ? prev.map((item) =>
            item.id === row.id
              ? {
                  ...row,
                  quantity: item.quantity,
                  minQuantity: row.minQuantity ?? item.minQuantity,
                }
              : item,
          )
        : [...prev, row];
      return next.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    });
    if (!stockItemId) setStockItemId(row.id);
    setOpen(false);
    toast({
      title: isEditing ? "Insumo atualizado" : "Insumo cadastrado",
      tone: "success",
    });
  }

  async function remove(item: Item) {
    if (!window.confirm(`Excluir ${item.name}?`)) return;
    const res = await fetch(`/api/stock-items/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: data.error || "Não foi possível excluir o insumo",
        tone: "error",
      });
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    setMovements((prev) =>
      prev.filter((m) => m.stockItemId !== item.id && m.stockItem.name !== item.name),
    );
    toast({ title: "Insumo excluído", tone: "success" });
  }

  async function onStockMove(e: FormEvent) {
    e.preventDefault();
    if (!stockItemId) return;
    setStockSaving(true);
    const res = await fetch("/api/stock-items/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stockItemId,
        type: moveType,
        quantity: Number(moveQty),
        note: moveNote,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setStockSaving(false);
    if (!res.ok) {
      toast({
        title: data.error || "Não foi possível registrar",
        tone: "error",
      });
      return;
    }
    const updated = data.item as Item;
    const movement = data.movement as InsumoMovement & {
      stockItemId: string;
    };
    const item = items.find((row) => row.id === stockItemId);
    setItems((prev) =>
      prev.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              quantity: updated.quantity ?? row.quantity,
            }
          : row,
      ),
    );
    setMovements((prev) =>
      [
        {
          id: movement.id,
          type: movement.type,
          quantity: movement.quantity,
          note: movement.note,
          createdAt:
            typeof movement.createdAt === "string"
              ? movement.createdAt
              : new Date().toISOString(),
          stockItemId,
          stockItem: { name: item?.name ?? "Insumo" },
        },
        ...prev,
      ].slice(0, 40),
    );
    toast({ title: "Movimentação registrada", tone: "success" });
    setMoveNote("");
    setMoveQty("1");
    setStockOpen(false);
  }

  const listColumns: TableColumn<Item>[] = [
    {
      id: "name",
      header: "Insumo",
      render: (item) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5F4F2] text-base leading-none"
            aria-hidden
          >
            {insumoEmoji(item.name)}
          </span>
          <span className="truncate font-semibold text-cocoa">{item.name}</span>
        </div>
      ),
    },
    {
      id: "unit",
      header: "Unidade",
      tone: "soft",
      render: (item) => item.unit,
    },
    {
      id: "cost",
      header: "Custo por unidade",
      tone: "body",
      numeric: true,
      render: (item) =>
        item.unitCostCents != null
          ? `${formatBRL(item.unitCostCents)} / ${item.unit}`
          : "—",
    },
    {
      id: "qty",
      header: "Em estoque",
      tone: "body",
      numeric: true,
      render: (item) => (
        <span
          className={cn(
            "font-medium tabular-nums",
            item.quantity <= 0 && "text-[#C44B4B]",
          )}
        >
          {item.quantity} {item.unit}
        </span>
      ),
    },
    {
      id: "min",
      header: "Estoque mínimo",
      tone: "muted",
      numeric: true,
      render: (item) => `${item.minQuantity} ${item.unit}`,
    },
    {
      id: "status",
      header: "Status",
      render: (item) => <StockStatusBadge item={item} />,
    },
    {
      id: "actions",
      header: "Ações",
      align: "center",
      headerClassName: "w-14",
      render: (item) => (
        <RowActionsMenu
          label={`Ações de ${item.name}`}
          items={[
            { label: "Editar", icon: Pencil, onClick: () => openEdit(item) },
            {
              label: "Excluir",
              icon: Trash2,
              tone: "danger",
              separator: true,
              onClick: () => void remove(item),
            },
          ]}
        />
      ),
    },
  ];

  function openStockSheet() {
    if (items.length === 0) return;
    if (!stockItemId && items[0]) setStockItemId(items[0].id);
    setStockOpen(true);
  }

  return (
    <PageShell>
      <PageHeader
        title="Insumos"
        description="Cadastro dos ingredientes, preço de compra e controle de estoque na mesma página."
        actions={
          <PageAction onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo insumo
          </PageAction>
        }
      />

      <Sheet
        open={open}
        onOpenChange={(v) => {
          if (saving) return;
          setOpen(v);
          if (!v) {
            setDraft(emptyDraft());
            setError("");
          }
        }}
      >
        <SheetContent size="md">
          <SheetHeader
            title={isEditing ? "Editar insumo" : "Novo insumo"}
            description="Cadastro do ingrediente e do que você paga na compra — usado na receita do produto."
          />
          <SheetForm onSubmit={(e) => void onSubmit(e)}>
            <SheetBody className="space-y-5">
              <InsumoFormSection
                title="Nome do ingrediente"
                description="Como aparece na lista e ao montar a receita."
              >
                <div>
                  <label className={fieldLabel} htmlFor="insumo-name">
                    Nome
                  </label>
                  <input
                    id="insumo-name"
                    className={fieldInput}
                    placeholder="Ex.: Farinha de trigo"
                    value={draft.name}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, name: e.target.value }))
                    }
                    required
                    autoFocus
                  />
                </div>
              </InsumoFormSection>

              <InsumoFormSection
                icon={Wallet}
                title="Preço de compra"
                description="Informe a unidade de medida e quanto você pagou por ela."
              >
                <div className="space-y-4">
                  <div>
                    <span className={fieldLabel}>Unidade de medida</span>
                    <div className="flex flex-wrap gap-1.5">
                      {UNIT_PRESETS.map((unit) => {
                        const selected = draft.unit === unit;
                        return (
                          <button
                            key={unit}
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, unit }))}
                            className={cn(
                              "inline-flex h-9 min-w-10 shrink-0 items-center justify-center rounded-full border px-3 text-xs font-semibold transition",
                              selected
                                ? "border-[var(--painel-brand)] bg-[var(--painel-brand)] text-white"
                                : "border-[#CED0D4] bg-white text-[#5C5652] hover:border-[#B0AAA6] hover:bg-[#F7F8FA]",
                            )}
                            aria-pressed={selected}
                          >
                            {unit}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-3">
                      <label
                        className="mb-1.5 block text-xs font-medium text-[#8C8682]"
                        htmlFor="insumo-unit-custom"
                      >
                        Outra unidade (opcional)
                      </label>
                      <input
                        id="insumo-unit-custom"
                        className={fieldInput}
                        placeholder="pacote, bandeja…"
                        value={
                          UNIT_PRESETS.includes(
                            draft.unit as (typeof UNIT_PRESETS)[number],
                          )
                            ? ""
                            : draft.unit
                        }
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            unit: e.target.value.trim() || d.unit,
                          }))
                        }
                      />
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#8C8682]">
                      Ex.: comprou <strong className="font-semibold">1 kg</strong>{" "}
                      de farinha por <strong className="font-semibold">R$ 5,00</strong>{" "}
                      → unidade <strong className="font-semibold">kg</strong> e preço{" "}
                      <strong className="font-semibold">5,00</strong>.
                    </p>
                  </div>
                  <div>
                    <label className={fieldLabel} htmlFor="insumo-cost">
                      Preço por unidade (R$)
                    </label>
                    <MaskedInput
                      kind="money"
                      id="insumo-cost"
                      className={fieldInput}
                      value={draft.cost}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, cost: e.target.value }))
                      }
                    />
                  </div>
                  {isEditing ? (
                    <div>
                      <label className={fieldLabel} htmlFor="insumo-min">
                        Estoque mínimo
                      </label>
                      <input
                        id="insumo-min"
                        type="number"
                        min={0}
                        step="any"
                        className={fieldInput}
                        value={draft.minQty}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, minQty: e.target.value }))
                        }
                      />
                    </div>
                  ) : null}
                </div>
              </InsumoFormSection>

              {error ? (
                <p className="text-sm text-berry-deep">{error}</p>
              ) : null}
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary
                disabled={saving || draft.name.trim().length < 2}
              >
                {saving
                  ? "Salvando…"
                  : isEditing
                    ? "Salvar alterações"
                    : "Cadastrar insumo"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

      <Sheet open={stockOpen} onOpenChange={setStockOpen}>
        <SheetContent size="md">
          <SheetHeader
            title="Movimentar estoque"
            description="Entrada (compra), saída (uso) ou ajuste da quantidade em estoque."
          />
          <SheetForm onSubmit={(e) => void onStockMove(e)}>
            <SheetBody className="space-y-4">
              <Field
                as="select"
                label="Insumo"
                value={stockItemId}
                onChange={(e) => setStockItemId(e.target.value)}
                required
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field
                  as="select"
                  label="Tipo"
                  value={moveType}
                  onChange={(e) =>
                    setMoveType(e.target.value as typeof moveType)
                  }
                >
                  <option value="IN">Entrada</option>
                  <option value="OUT">Saída</option>
                  <option value="ADJUST">Ajuste (quantidade final)</option>
                </Field>
                <Field
                  label={
                    moveType === "ADJUST" ? "Quantidade em estoque" : "Quantidade"
                  }
                  value={moveQty}
                  onChange={(e) => setMoveQty(e.target.value)}
                  inputMode="decimal"
                  required
                />
              </div>
              <Field
                label="Observação"
                value={moveNote}
                onChange={(e) => setMoveNote(e.target.value)}
                placeholder="Opcional — ex.: compra no atacado"
              />
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary disabled={stockSaving || !stockItemId}>
                {stockSaving ? "Registrando…" : "Registrar"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

      <PainelMetricRow className="md:grid-cols-3">
        <PainelMetricSlide>
          <PainelMetricCard
            icon={Package}
            label="Total de insumos"
            value={stats.total}
          />
        </PainelMetricSlide>
        <PainelMetricSlide>
          <PainelMetricCard
            icon={AlertTriangle}
            label="Estoque zerado"
            value={stats.zero}
          />
        </PainelMetricSlide>
        <PainelMetricSlide>
          <PainelMetricCard
            icon={ArrowDown}
            label="Abaixo do mínimo"
            value={stats.belowMin}
          />
        </PainelMetricSlide>
      </PainelMetricRow>

      <section className="overflow-hidden rounded-lg border border-[var(--painel-border)] bg-white">
        <div className="px-4 pb-3 pt-4">
          <h2 className="text-sm font-semibold text-cocoa">Lista de insumos</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative w-full min-w-0 sm:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar insumo..."
                aria-label="Buscar insumo"
                className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white py-0 pl-9 pr-3 text-sm text-cocoa outline-none transition placeholder:text-[#9CA3AF] focus:border-[var(--painel-brand,#0f352e)]/25 focus:ring-2 focus:ring-[var(--painel-brand,#0f352e)]/10"
              />
            </label>
            <div className="relative w-full shrink-0 sm:w-auto">
              <SlidersHorizontal
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C8682]"
                strokeWidth={1.75}
                aria-hidden
              />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                aria-label="Filtrar por status"
                className="h-9 w-full min-w-[200px] cursor-pointer appearance-none rounded-lg border border-[#E5E7EB] bg-white py-0 pl-9 pr-9 text-sm font-medium text-[#5C5652] outline-none transition focus:border-[var(--painel-brand,#0f352e)]/25 focus:ring-2 focus:ring-[var(--painel-brand,#0f352e)]/10 sm:w-auto"
              >
                {(Object.keys(STATUS_FILTER_LABELS) as StatusFilter[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {STATUS_FILTER_LABELS[key]}
                    </option>
                  ),
                )}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C8682]"
                aria-hidden
              />
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <DataTable minWidth="720px" className={tableInCard}>
            <DataTableHeader>
              <tr>
                {listColumns.map((column) => (
                  <DataTableHead
                    key={column.id}
                    align={column.align}
                    className={column.headerClassName}
                  >
                    {column.header}
                  </DataTableHead>
                ))}
              </tr>
            </DataTableHeader>
            <DataTableBody>
              <DataTableRow>
                <td
                  colSpan={listColumns.length}
                  className="px-4 py-10 text-center text-sm text-[#8C8682]"
                >
                  Nenhum insumo cadastrado.
                </td>
              </DataTableRow>
            </DataTableBody>
          </DataTable>
        ) : filteredItems.length === 0 ? (
          <DataTable minWidth="720px" className={tableInCard}>
            <DataTableHeader>
              <tr>
                {listColumns.map((column) => (
                  <DataTableHead
                    key={column.id}
                    align={column.align}
                    className={column.headerClassName}
                  >
                    {column.header}
                  </DataTableHead>
                ))}
              </tr>
            </DataTableHeader>
            <DataTableBody>
              <DataTableRow>
                <td
                  colSpan={listColumns.length}
                  className="px-4 py-10 text-center text-sm text-[#8C8682]"
                >
                  Nenhum insumo encontrado com esse filtro.
                </td>
              </DataTableRow>
            </DataTableBody>
          </DataTable>
        ) : (
          <ColumnsTable
            className={tableInCard}
            minWidth="720px"
            rows={filteredItems}
            rowKey={(item) => item.id}
            columns={listColumns}
          />
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-[var(--painel-border)] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--painel-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-cocoa">
            Movimentações recentes
          </h2>
          <PageAction onClick={openStockSheet}>
            <Plus className="h-4 w-4" />
            Registrar movimentação
          </PageAction>
        </div>
        {movements.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <FileClock
              className="h-10 w-10 text-[#C5C0BC]"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="mt-4 text-sm font-semibold text-cocoa">
              Nenhuma movimentação registrada
            </p>
            <p className="mt-1 max-w-sm text-sm text-[#8C8682]">
              Registre uma compra ou consumo para acompanhar o estoque.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--painel-border)]">
            {movements.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 text-sm"
              >
                <div>
                  <p className="font-semibold text-cocoa">{m.stockItem.name}</p>
                  <p className="text-xs text-[#8C8682]">
                    {format(new Date(m.createdAt), "dd/MM/yyyy HH:mm")}
                    {m.note ? ` · ${m.note}` : ""}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-cocoa">
                  {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "="}
                  {m.quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
