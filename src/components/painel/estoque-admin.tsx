"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  Equal,
  Layers,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  Warehouse,
} from "lucide-react";
import { format } from "date-fns";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPrimary,
} from "@/components/ui/dialog";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";
import {
  PageAction,
  PageHeader,
  PageShell,
  StatTile,
  StatusDot,
} from "@/components/painel/page-header";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Category = { id: string; name: string; sortOrder?: number };

type Product = {
  id: string;
  name: string;
  imageUrl?: string | null;
  stockQty: number;
  stockMin: number;
  unit: string;
  trackStock: boolean;
  availability: string;
  active: boolean;
  sortOrder?: number;
  categoryId?: string | null;
  category?: Category | null;
};

type CategoryGroup = {
  key: string;
  categoryId: string | null;
  name: string;
  sortOrder: number;
  products: Product[];
};

const UNCATEGORIZED_KEY = "__none__";

type Movement = {
  id: string;
  productId?: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string };
};

type StockFilter = "all" | "ok" | "low" | "out" | "off";
type MoveType = "IN" | "OUT" | "ADJUST";

const UNITS = ["un", "cx", "pct", "kg", "g", "fatia"];

const fieldLabel = "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";

function statusOf(p: Product) {
  if (!p.trackStock) return { tone: "neutral" as const, label: "Sem controle" };
  if (p.stockQty <= 0) return { tone: "danger" as const, label: "Esgotado" };
  if (p.stockQty <= p.stockMin)
    return { tone: "warning" as const, label: "Estoque baixo" };
  return { tone: "success" as const, label: "Em dia" };
}

function fillPct(p: Product) {
  if (!p.trackStock) return 0;
  const target = Math.max(p.stockMin * 2, 4);
  return Math.min(100, Math.round((p.stockQty / target) * 100));
}

function barTone(p: Product) {
  if (!p.trackStock) return "bg-[#D8DADF]";
  if (p.stockQty <= 0) return "bg-[#C85A5A]";
  if (p.stockQty <= p.stockMin) return "bg-[#C98F86]";
  return "bg-[#5A6F5C]";
}

export function EstoqueAdmin({
  initialProducts = [],
  initialMovements = [],
}: {
  initialProducts?: Product[];
  initialMovements?: Movement[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [moveOpen, setMoveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<"all" | MoveType>("all");
  const { toast } = useToast();

  const [move, setMove] = useState({
    productId: initialProducts.find((p) => p.trackStock)?.id || initialProducts[0]?.id || "",
    type: "IN" as MoveType,
    qty: "1",
    note: "",
  });

  const [edit, setEdit] = useState({
    productId: "",
    name: "",
    trackStock: true,
    stockQty: "0",
    stockMin: "5",
    unit: "un",
    note: "",
  });

  async function load() {
    const res = await fetch("/api/stock");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setMovements(data.movements);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (initialProducts.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const tracked = products.filter((p) => p.trackStock);
    return {
      tracked: tracked.length,
      ok: tracked.filter((p) => p.stockQty > p.stockMin).length,
      low: tracked.filter((p) => p.stockQty > 0 && p.stockQty <= p.stockMin).length,
      out: tracked.filter((p) => p.stockQty <= 0).length,
      off: products.filter((p) => !p.trackStock).length,
    };
  }, [products]);

  const categoryOptions = useMemo(() => {
    const map = new Map<
      string,
      { key: string; name: string; sortOrder: number; count: number }
    >();
    for (const p of products) {
      const categoryId = p.category?.id ?? p.categoryId ?? null;
      const key = categoryId ?? UNCATEGORIZED_KEY;
      let row = map.get(key);
      if (!row) {
        row = {
          key,
          name: p.category?.name || "Sem categoria",
          sortOrder:
            categoryId == null
              ? Number.MAX_SAFE_INTEGER
              : (p.category?.sortOrder ?? 0),
          count: 0,
        };
        map.set(key, row);
      }
      row.count += 1;
    }
    return [...map.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (categoryFilter !== "all") {
        const key = (p.category?.id ?? p.categoryId) ?? UNCATEGORIZED_KEY;
        if (key !== categoryFilter) return false;
      }
      if (filter === "ok") return p.trackStock && p.stockQty > p.stockMin;
      if (filter === "low")
        return p.trackStock && p.stockQty > 0 && p.stockQty <= p.stockMin;
      if (filter === "out") return p.trackStock && p.stockQty <= 0;
      if (filter === "off") return !p.trackStock;
      return true;
    });
  }, [products, q, filter, categoryFilter]);

  const groups = useMemo(() => {
    const map = new Map<string, CategoryGroup>();

    for (const p of filtered) {
      const categoryId = p.category?.id ?? p.categoryId ?? null;
      const key = categoryId ?? UNCATEGORIZED_KEY;
      let group = map.get(key);
      if (!group) {
        group = {
          key,
          categoryId,
          name: p.category?.name || "Sem categoria",
          sortOrder:
            categoryId == null
              ? Number.MAX_SAFE_INTEGER
              : (p.category?.sortOrder ?? 0),
          products: [],
        };
        map.set(key, group);
      }
      group.products.push(p);
    }

    for (const group of map.values()) {
      group.products.sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.name.localeCompare(b.name),
      );
    }

    return [...map.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }, [filtered]);

  function isGroupOpen(key: string) {
    if (collapsed[key] === true) return false;
    if (collapsed[key] === false) return true;
    return true;
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => ({
      ...prev,
      [key]: isGroupOpen(key),
    }));
  }

  const visibleMovements = useMemo(() => {
    if (historyFilter === "all") return movements;
    return movements.filter((m) => m.type === historyFilter);
  }, [movements, historyFilter]);

  function openMove(product?: Product, type: MoveType = "IN") {
    setMove({
      productId: product?.id || move.productId || products[0]?.id || "",
      type,
      qty: type === "ADJUST" ? String(product?.stockQty ?? 0) : "1",
      note: "",
    });
    setMoveOpen(true);
  }

  function openEdit(p: Product) {
    setEdit({
      productId: p.id,
      name: p.name,
      trackStock: p.trackStock,
      stockQty: String(p.stockQty ?? 0),
      stockMin: String(p.stockMin ?? 5),
      unit: p.unit || "un",
      note: "",
    });
    setEditOpen(true);
  }

  async function onMove(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: move.productId,
        type: move.type,
        quantity: Number(move.qty),
        note: move.note,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Não foi possível registrar", tone: "error" });
      return;
    }
    toast({ title: "Movimentação registrada", tone: "success" });
    setMoveOpen(false);
    load();
  }

  async function onEdit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: edit.productId,
        trackStock: edit.trackStock,
        stockQty: Number(edit.stockQty),
        stockMin: Number(edit.stockMin),
        unit: edit.unit,
        note: edit.note || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Não foi possível salvar", tone: "error" });
      return;
    }
    toast({ title: "Estoque atualizado", tone: "success" });
    setEditOpen(false);
    load();
  }

  async function quickMove(p: Product, type: "IN" | "OUT", quantity = 1) {
    if (type === "OUT" && p.stockQty <= 0) return;
    setBusyId(p.id);
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: p.id,
        type,
        quantity,
        note: type === "IN" ? "Entrada rápida" : "Saída rápida",
      }),
    });
    setBusyId(null);
    if (!res.ok) {
      toast({ title: "Não foi possível atualizar", tone: "error" });
      return;
    }
    load();
  }

  async function toggleTrack(p: Product, trackStock: boolean) {
    setBusyId(p.id);
    const res = await fetch("/api/stock", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: p.id, trackStock }),
    });
    setBusyId(null);
    if (!res.ok) {
      toast({ title: "Não foi possível atualizar", tone: "error" });
      return;
    }
    toast({
      title: trackStock ? "Controle de estoque ativado" : "Controle desativado",
      tone: "success",
    });
    load();
  }

  return (
    <PageShell>
      <PageHeader
        title="Estoque"
        description="Ajuste quantidades, mínimo de alerta e controle por produto. Zero marca como esgotado na vitrine."
        actions={
          products.length > 0 ? (
            <PageAction onClick={() => openMove()}>
              <Plus className="h-4 w-4" />
              Nova movimentação
            </PageAction>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile
          label="Controlados"
          value={stats.tracked}
          hint={`${stats.off} sem controle`}
        />
        <StatTile label="Em dia" value={stats.ok} />
        <StatTile
          label="Baixo"
          value={stats.low}
          hint={stats.low > 0 ? "Reposição sugerida" : undefined}
        />
        <StatTile
          label="Esgotados"
          value={stats.out}
          hint={stats.out > 0 ? "Sumiram da vitrine" : undefined}
        />
      </div>

      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent>
          <DialogHeader
            title="Nova movimentação"
            description="Entrada, saída ou ajuste para um valor exato."
          />
          <form onSubmit={onMove}>
            <DialogBody className="space-y-4">
              <div>
                <label className={fieldLabel} htmlFor="stock-product">
                  Produto
                </label>
                <select
                  id="stock-product"
                  className={fieldInput}
                  value={move.productId}
                  onChange={(e) =>
                    setMove((m) => ({ ...m, productId: e.target.value }))
                  }
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.trackStock ? ` · ${p.stockQty} ${p.unit}` : " · sem controle"}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <span className={fieldLabel}>Tipo</span>
                <div
                  role="group"
                  className="flex h-10 overflow-hidden rounded-lg border border-[#CED0D4] bg-white p-0.5"
                >
                  {(
                    [
                      { value: "IN", label: "Entrada" },
                      { value: "OUT", label: "Saída" },
                      { value: "ADJUST", label: "Ajuste" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setMove((m) => ({ ...m, type: opt.value }))
                      }
                      className={cn(
                        "flex-1 rounded-md px-1 text-[12px] font-semibold transition sm:text-[13px]",
                        move.type === opt.value
                          ? "bg-[#EEF2F7] text-[#2D2926]"
                          : "text-[#8C8682] hover:text-[#2D2926]",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="stock-qty">
                  {move.type === "ADJUST" ? "Quantidade final" : "Quantidade"}
                </label>
                <input
                  id="stock-qty"
                  className={fieldInput}
                  type="number"
                  min={move.type === "ADJUST" ? 0 : 1}
                  required
                  value={move.qty}
                  onChange={(e) =>
                    setMove((m) => ({ ...m, qty: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="stock-note">
                  Observação
                </label>
                <input
                  id="stock-note"
                  className={fieldInput}
                  value={move.note}
                  onChange={(e) =>
                    setMove((m) => ({ ...m, note: e.target.value }))
                  }
                  placeholder="Compra, perda, contagem…"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogCancel />
              <DialogPrimary disabled={saving}>
                {saving ? "Registrando…" : "Registrar"}
              </DialogPrimary>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader
            title={`Editar · ${edit.name}`}
            description="Ative o controle, defina o mínimo de alerta e ajuste a quantidade."
          />
          <form onSubmit={onEdit}>
            <DialogBody className="space-y-4">
              <label className="flex items-start gap-3 rounded-lg border border-[#E8E2DE] bg-[#FBF7F2] px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={edit.trackStock}
                  onChange={(e) =>
                    setEdit((f) => ({ ...f, trackStock: e.target.checked }))
                  }
                />
                <span>
                  <span className="font-semibold text-[#2D2926]">
                    Controlar estoque deste produto
                  </span>
                  <span className="mt-0.5 block text-xs text-[#8C8682]">
                    Quantidade zero marca como esgotado na vitrine.
                  </span>
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel} htmlFor="edit-qty">
                    Quantidade atual
                  </label>
                  <input
                    id="edit-qty"
                    className={fieldInput}
                    type="number"
                    min={0}
                    required
                    value={edit.stockQty}
                    onChange={(e) =>
                      setEdit((f) => ({ ...f, stockQty: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabel} htmlFor="edit-min">
                    Mínimo (alerta)
                  </label>
                  <input
                    id="edit-min"
                    className={fieldInput}
                    type="number"
                    min={0}
                    required
                    value={edit.stockMin}
                    onChange={(e) =>
                      setEdit((f) => ({ ...f, stockMin: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="edit-unit">
                  Unidade
                </label>
                <select
                  id="edit-unit"
                  className={fieldInput}
                  value={edit.unit}
                  onChange={(e) =>
                    setEdit((f) => ({ ...f, unit: e.target.value }))
                  }
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  {!UNITS.includes(edit.unit) && (
                    <option value={edit.unit}>{edit.unit}</option>
                  )}
                </select>
              </div>
              <div>
                <label className={fieldLabel} htmlFor="edit-note">
                  Motivo do ajuste (opcional)
                </label>
                <input
                  id="edit-note"
                  className={fieldInput}
                  value={edit.note}
                  onChange={(e) =>
                    setEdit((f) => ({ ...f, note: e.target.value }))
                  }
                  placeholder="Contagem, conferência, correção…"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogCancel />
              <DialogPrimary disabled={saving}>
                {saving ? "Salvando…" : "Salvar estoque"}
              </DialogPrimary>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-white" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="Nenhum produto cadastrado"
          description="Cadastre produtos para controlar o estoque da vitrine."
          action={{ label: "Ver produtos", href: "/painel/produtos" }}
        />
      ) : (
        <>
          <div className="flex flex-col gap-2 rounded-lg border border-[#E8E2DE] bg-white p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[12rem] flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0AAA6]" />
                <input
                  className="input h-9 w-full !py-0 pl-9 text-sm"
                  placeholder="Buscar produto…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <select
                className="input h-9 min-w-[10rem] max-w-full text-sm sm:max-w-[14rem]"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filtrar por categoria"
              >
                <option value="all">
                  Todas as categorias ({products.length})
                </option>
                {categoryOptions.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name} ({c.count})
                  </option>
                ))}
              </select>
            </div>
            <FilterChipGroup>
              {(
                [
                  ["all", `Todos (${products.length})`],
                  ["ok", `Em dia (${stats.ok})`],
                  ["low", `Baixo (${stats.low})`],
                  ["out", `Esgotado (${stats.out})`],
                  ["off", `Sem controle (${stats.off})`],
                ] as const
              ).map(([id, label]) => (
                <FilterChip
                  key={id}
                  label={label}
                  active={filter === id}
                  onClick={() => setFilter(id)}
                />
              ))}
            </FilterChipGroup>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhum produto neste filtro"
              description="Tente outro status ou limpe a busca."
            />
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const open = isGroupOpen(group.key);
                const lowInGroup = group.products.filter(
                  (p) =>
                    p.trackStock &&
                    p.stockQty > 0 &&
                    p.stockQty <= p.stockMin,
                ).length;
                const outInGroup = group.products.filter(
                  (p) => p.trackStock && p.stockQty <= 0,
                ).length;

                return (
                  <div
                    key={group.key}
                    className="overflow-hidden rounded-lg border border-[#E8E2DE] bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className="flex w-full items-center gap-3 border-b border-[#E8E2DE] bg-[#FBF7F2] px-4 py-3 text-left transition-colors hover:bg-[#F3F0ED]"
                      aria-expanded={open}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3EEEA] text-[#483129]">
                        <Layers className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#2D2926]">
                          {group.name}
                        </p>
                        <p className="text-xs text-[#8C8682]">
                          {group.products.length}{" "}
                          {group.products.length === 1 ? "produto" : "produtos"}
                          {lowInGroup > 0 ? ` · ${lowInGroup} baixo` : ""}
                          {outInGroup > 0 ? ` · ${outInGroup} esgotado` : ""}
                        </p>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-[#8C8682] transition-transform",
                          !open && "-rotate-90",
                        )}
                      />
                    </button>
                    {open ? (
                      <ul className="divide-y divide-[#F0EBE6]">
                        {group.products.map((p) => {
                          const s = statusOf(p);
                          const busy = busyId === p.id;
                          return (
                            <li
                              key={p.id}
                              className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E8E2DE] bg-[#F7F5F3]">
                                  {p.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={p.imageUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <Warehouse className="h-5 w-5 text-[#B0AAA6]" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-[#2D2926]">
                                      {p.name}
                                    </p>
                                    <StatusDot tone={s.tone} label={s.label} />
                                    {!p.active ? (
                                      <span className="text-[11px] font-medium text-[#8C8682]">
                                        Inativo
                                      </span>
                                    ) : null}
                                  </div>
                                  {p.trackStock ? (
                                    <div className="mt-1.5 max-w-xs">
                                      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs text-[#8C8682]">
                                        <span className="tabular-nums font-semibold text-[#2D2926]">
                                          {p.stockQty} {p.unit}
                                        </span>
                                        <span>mín. {p.stockMin}</span>
                                      </div>
                                      <div className="h-1.5 overflow-hidden rounded-full bg-[#F0EBE7]">
                                        <div
                                          className={cn(
                                            "h-full rounded-full",
                                            barTone(p),
                                          )}
                                          style={{ width: `${fillPct(p)}%` }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-xs text-[#8C8682]">
                                      Este produto não baixa estoque nos pedidos.
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                {p.trackStock ? (
                                  <>
                                    <div className="inline-flex overflow-hidden rounded-lg border border-[#CED0D4]">
                                      <button
                                        type="button"
                                        disabled={busy || p.stockQty <= 0}
                                        onClick={() => quickMove(p, "OUT")}
                                        className="inline-flex h-9 w-9 items-center justify-center text-[#8C8682] transition hover:bg-[#F0F2F5] hover:text-[#2D2926] disabled:opacity-40"
                                        aria-label={`Retirar 1 de ${p.name}`}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>
                                      <span className="inline-flex h-9 min-w-[2.5rem] items-center justify-center border-x border-[#CED0D4] px-2 text-sm font-semibold tabular-nums text-[#2D2926]">
                                        {p.stockQty}
                                      </span>
                                      <button
                                        type="button"
                                        disabled={busy}
                                        onClick={() => quickMove(p, "IN")}
                                        className="inline-flex h-9 w-9 items-center justify-center text-[#8C8682] transition hover:bg-[#F0F2F5] hover:text-[#2D2926] disabled:opacity-40"
                                        aria-label={`Adicionar 1 em ${p.name}`}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => openEdit(p)}
                                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#CED0D4] bg-white px-3 text-xs font-semibold text-[#2D2926] hover:bg-[#F0F2F5]"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      Editar
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => openEdit(p)}
                                    className="inline-flex h-9 items-center rounded-lg bg-[#483129] px-3 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
                                  >
                                    Ativar controle
                                  </button>
                                )}
                                <RowActionsMenu
                                  items={[
                                    {
                                      label: "Editar estoque",
                                      icon: Pencil,
                                      onClick: () => openEdit(p),
                                    },
                                    {
                                      label: "Registrar entrada",
                                      icon: ArrowDownToLine,
                                      onClick: () => openMove(p, "IN"),
                                    },
                                    {
                                      label: "Registrar saída",
                                      icon: ArrowUpFromLine,
                                      onClick: () => openMove(p, "OUT"),
                                    },
                                    {
                                      label: "Ajuste manual",
                                      icon: Equal,
                                      onClick: () => openMove(p, "ADJUST"),
                                    },
                                    p.trackStock
                                      ? {
                                          label: "Desativar controle",
                                          icon: AlertTriangle,
                                          tone: "danger" as const,
                                          separator: true,
                                          onClick: () => toggleTrack(p, false),
                                        }
                                      : {
                                          label: "Ativar controle",
                                          icon: Warehouse,
                                          onClick: () => toggleTrack(p, true),
                                        },
                                  ]}
                                />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <section className="overflow-hidden rounded-lg border border-[#E8E2DE] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2DE] bg-[#FBF7F2] px-4 py-3">
              <h2 className="text-sm font-semibold text-[#2D2926]">
                Histórico de movimentações
              </h2>
              <FilterChipGroup>
                {(
                  [
                    ["all", "Todas"],
                    ["IN", "Entradas"],
                    ["OUT", "Saídas"],
                    ["ADJUST", "Ajustes"],
                  ] as const
                ).map(([id, label]) => (
                  <FilterChip
                    key={id}
                    label={label}
                    active={historyFilter === id}
                    onClick={() => setHistoryFilter(id)}
                  />
                ))}
              </FilterChipGroup>
            </div>
            {visibleMovements.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[#8C8682]">
                Nenhuma movimentação neste filtro.
              </p>
            ) : (
              <ul className="divide-y divide-[#F0EBE7]">
                {visibleMovements.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#2D2926]">
                        {m.product.name}
                      </p>
                      <p className="text-xs text-[#8C8682]">
                        {format(new Date(m.createdAt), "dd/MM/yyyy HH:mm")}
                        {m.note ? ` · ${m.note}` : ""}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums",
                        m.type === "IN" && "bg-emerald-50 text-[#5A6F5C]",
                        m.type === "OUT" && "bg-[#FDECEC] text-[#C85A5A]",
                        m.type === "ADJUST" && "bg-[#EEF2F7] text-[#2D2926]",
                      )}
                    >
                      {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "="}
                      {m.quantity}
                      <span className="font-medium opacity-70">
                        {m.type === "IN"
                          ? "entrada"
                          : m.type === "OUT"
                            ? "saída"
                            : "ajuste"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}
