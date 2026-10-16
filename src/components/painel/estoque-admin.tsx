"use client";

import Image from "next/image";
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
  ArrowRight,
  Box,
  Cake,
  CalendarDays,
  ChevronDown,
  Clock,
  Pencil,
  Plus,
  Search,
  Warehouse,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Field } from "@/components/ui/input";
import {
  PageAction,
  PageShell,
} from "@/components/painel/page-header";
import {
  PainelMetricCard,
  PainelMetricRow,
  PainelMetricSlide,
} from "@/components/painel/metric-card";
import {
  ColumnsTable,
  DataTablePagination,
  type TableColumn,
} from "@/components/painel/data-table";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";

const PAGE_SIZE = 8;
const tableInCard =
  "rounded-none border-0 border-t border-[var(--painel-border)] shadow-none";

type TabKey = "insumos" | "produtos";

type StockItemRow = {
  id: string;
  name: string;
  unit: string;
  unitCostCents: number | null;
  quantity: number;
  minQuantity: number;
};

type ProductRow = {
  id: string;
  name: string;
  imageUrl: string | null;
  stockQty: number;
  stockMin: number;
  unit: string;
  trackStock: boolean;
  priceCents: number | null;
  category: { id: string; name: string } | null;
};

type Movement = {
  id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  note: string | null;
  createdAt: string;
  productId?: string | null;
  stockItemId?: string | null;
  product: { name: string } | null;
  stockItem: { name: string } | null;
};

type SituationFilter = "all" | "normal" | "low" | "critical";
type SortKey = "name-asc" | "name-desc" | "qty-asc" | "qty-desc";

const SITUATION_LABELS: Record<SituationFilter, string> = {
  all: "Todos",
  normal: "Normal",
  low: "Estoque baixo",
  critical: "Estoque crítico",
};

const SORT_LABELS: Record<SortKey, string> = {
  "name-asc": "Nome (A–Z)",
  "name-desc": "Nome (Z–A)",
  "qty-asc": "Quantidade (menor)",
  "qty-desc": "Quantidade (maior)",
};

const INSUMO_CATEGORIES = ["Ingredientes", "Embalagens", "Outros"] as const;

function insumoCategory(name: string): (typeof INSUMO_CATEGORIES)[number] {
  const n = name.toLowerCase();
  if (
    n.includes("embal") ||
    n.includes("caixa") ||
    n.includes("saco") ||
    n.includes("forma")
  ) {
    return "Embalagens";
  }
  return "Ingredientes";
}

function categoryPillClass(category: string) {
  if (category === "Embalagens") return "bg-[#EDE8F5] text-[#5C4A8A]";
  if (category === "Ingredientes") return "bg-[#FCE8EC] text-[#A63D52]";
  return "bg-[#E8F0EE] text-[var(--painel-brand,#0f352e)]";
}

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

function formatQty(qty: number, unit: string) {
  const value = Number.isInteger(qty)
    ? String(qty)
    : qty.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  return `${value} ${unit}`;
}

type StockLevel = "normal" | "low" | "critical";

function stockLevel(qty: number, min: number): StockLevel {
  if (qty <= 0) return "critical";
  if (min > 0 && qty <= min * 0.25) return "critical";
  if (min > 0 && qty <= min) return "low";
  return "normal";
}

function stockPercent(qty: number, min: number) {
  if (min <= 0) return qty > 0 ? 100 : 0;
  return Math.min(100, Math.round((qty / min) * 100));
}

function matchesSituation(level: StockLevel, filter: SituationFilter) {
  if (filter === "all") return true;
  return level === filter;
}

function StockStatusBadge({ level }: { level: StockLevel }) {
  const config = {
    normal: {
      label: "Normal",
      pill: "bg-[#E4F0E8] text-[#3D8A5A]",
      dot: "bg-[#3D8A5A]",
    },
    low: {
      label: "Estoque baixo",
      pill: "bg-[#FDF0E0] text-[#B87A2A]",
      dot: "bg-[#C47A2A]",
    },
    critical: {
      label: "Estoque crítico",
      pill: "bg-[#FCE8E8] text-[#C44B4B]",
      dot: "bg-[#E05A5A]",
    },
  }[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        config.pill,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

function StockQtyBar({
  qty,
  min,
  unit,
}: {
  qty: number;
  min: number;
  unit: string;
}) {
  const level = stockLevel(qty, min);
  const pct = stockPercent(qty, min);
  const barTone =
    level === "critical"
      ? "bg-[#E05A5A]"
      : level === "low"
        ? "bg-[#E0A04A]"
        : "bg-[#3D8A5A]";

  return (
    <div className="min-w-[120px]">
      <p className="text-sm font-semibold tabular-nums text-cocoa">
        {formatQty(qty, unit)}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E5E7EB]">
          <div
            className={cn("h-full rounded-full transition-all", barTone)}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#8C8682]">
          {pct}%
        </span>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
  selectClassName,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  selectClassName?: string;
}) {
  return (
    <div className={cn("w-full min-w-0 sm:w-auto", className)}>
      <span className="mb-1 block text-[11px] font-semibold text-[#8C8682] sm:sr-only">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className={cn(
            "h-9 w-full min-w-0 cursor-pointer appearance-none rounded-lg border border-[#E5E7EB] bg-white py-0 pl-3 pr-9 text-sm font-medium text-[#5C5652] outline-none transition focus:border-[var(--painel-brand,#0f352e)]/25 focus:ring-2 focus:ring-[var(--painel-brand,#0f352e)]/10 sm:min-w-[180px]",
            selectClassName,
          )}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C8682]"
          aria-hidden
        />
      </div>
    </div>
  );
}

const TAB_ITEMS: {
  key: TabKey;
  label: string;
  countKey: "productCount" | "insumoCount";
}[] = [
  { key: "produtos", label: "Produtos", countKey: "productCount" },
  { key: "insumos", label: "Insumos", countKey: "insumoCount" },
];

function EstoqueTabs({
  tab,
  onTab,
  insumoCount,
  productCount,
  historyAction,
}: {
  tab: TabKey;
  onTab: (tab: TabKey) => void;
  insumoCount: number;
  productCount: number;
  historyAction: ReactNode;
}) {
  const counts = { productCount, insumoCount };

  return (
    <div className="border-b border-[var(--painel-border)]">
      <div className="flex items-end justify-between gap-2 sm:gap-3">
        <div
          className="flex min-w-0 flex-1 gap-4 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-6 [&::-webkit-scrollbar]:hidden"
          role="tablist"
        >
        {TAB_ITEMS.map((item) => {
          const count = counts[item.countKey];
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTab(item.key)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-[13px] font-semibold transition sm:gap-2 sm:pb-3 sm:text-sm",
                active
                  ? "border-[var(--painel-brand,#0f352e)] text-[var(--painel-brand,#0f352e)]"
                  : "border-transparent text-[#8C8682] hover:text-cocoa",
              )}
            >
              {item.label}
              <span
                className={cn(
                  "inline-flex min-w-[1.35rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums sm:min-w-[1.5rem] sm:px-2 sm:text-[11px]",
                  active
                    ? "bg-[var(--painel-brand,#0f352e)] text-white"
                    : "bg-[#E5E7EB] text-[#5C5652]",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
        </div>
        <div className="shrink-0 pb-2.5 sm:pb-3">{historyAction}</div>
      </div>
    </div>
  );
}

function EstoqueMobileList({
  children,
  footer,
}: {
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="border-t border-[var(--painel-border)] md:hidden">
      <ul className="divide-y divide-[var(--painel-border)]">{children}</ul>
      {footer}
    </div>
  );
}

export function EstoqueAdmin({
  initialStockItems = [],
  initialProducts = [],
  initialMovements = [],
}: {
  initialStockItems?: StockItemRow[];
  initialProducts?: ProductRow[];
  initialMovements?: Movement[];
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>("produtos");
  const [stockItems, setStockItems] = useState(initialStockItems);
  const [products, setProducts] = useState(initialProducts);
  const [movements, setMovements] = useState(initialMovements);
  const [loading, setLoading] = useState(
    initialStockItems.length === 0 && initialProducts.length === 0,
  );
  const [moveOpen, setMoveOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [moveTarget, setMoveTarget] = useState<"insumo" | "produto">("produto");
  const [stockItemId, setStockItemId] = useState(initialStockItems[0]?.id ?? "");
  const [productId, setProductId] = useState(initialProducts[0]?.id ?? "");
  const [moveType, setMoveType] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [moveQty, setMoveQty] = useState("1");
  const [moveNote, setMoveNote] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [situationFilter, setSituationFilter] = useState<SituationFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name-asc");
  const [page, setPage] = useState(1);
  const [selectedInsumos, setSelectedInsumos] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    () => new Set(),
  );

  async function load() {
    const [itemsRes, stockRes] = await Promise.all([
      fetch("/api/stock-items"),
      fetch("/api/stock"),
    ]);
    if (itemsRes.ok) {
      setStockItems(await itemsRes.json());
    }
    if (stockRes.ok) {
      const data = await stockRes.json();
      setProducts(data.products ?? []);
      setMovements(data.movements ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (initialStockItems.length === 0 && initialProducts.length === 0) {
      void load();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [tab, search, categoryFilter, situationFilter, sortKey]);

  useEffect(() => {
    setCategoryFilter("all");
  }, [tab]);

  const insumoStats = useMemo(() => {
    const low = stockItems.filter(
      (item) => stockLevel(item.quantity, item.minQuantity) === "low",
    ).length;
    const critical = stockItems.filter(
      (item) => stockLevel(item.quantity, item.minQuantity) === "critical",
    ).length;
    const lowOrCritical = low + critical;
    const totalValue = stockItems.reduce(
      (sum, item) =>
        sum +
        (item.unitCostCents != null ? item.quantity * item.unitCostCents : 0),
      0,
    );
    return {
      total: stockItems.length,
      lowOrCritical,
      low,
      critical,
      totalValue,
    };
  }, [stockItems]);

  const productStats = useMemo(() => {
    const out = products.filter((p) => p.stockQty <= 0).length;
    const low = products.filter(
      (p) =>
        p.stockQty > 0 &&
        p.stockMin > 0 &&
        p.stockQty <= p.stockMin,
    ).length;
    return { total: products.length, out, low };
  }, [products]);

  const combinedLowCount = insumoStats.lowOrCritical + productStats.out + productStats.low;

  const filteredInsumos = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = stockItems.filter((item) => {
      const category = insumoCategory(item.name);
      if (categoryFilter !== "all" && category !== categoryFilter) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      const level = stockLevel(item.quantity, item.minQuantity);
      if (!matchesSituation(level, situationFilter)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortKey) {
        case "name-desc":
          return b.name.localeCompare(a.name, "pt-BR");
        case "qty-asc":
          return a.quantity - b.quantity;
        case "qty-desc":
          return b.quantity - a.quantity;
        default:
          return a.name.localeCompare(b.name, "pt-BR");
      }
    });
    return rows;
  }, [stockItems, search, categoryFilter, situationFilter, sortKey]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = products.filter((p) => {
      const categoryName = p.category?.name ?? "Sem categoria";
      if (categoryFilter !== "all" && categoryName !== categoryFilter) {
        return false;
      }
      if (q && !p.name.toLowerCase().includes(q)) return false;
      const level = stockLevel(p.stockQty, p.stockMin);
      if (!matchesSituation(level, situationFilter)) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => {
      switch (sortKey) {
        case "name-desc":
          return b.name.localeCompare(a.name, "pt-BR");
        case "qty-asc":
          return a.stockQty - b.stockQty;
        case "qty-desc":
          return b.stockQty - a.stockQty;
        default:
          return a.name.localeCompare(b.name, "pt-BR");
      }
    });
    return rows;
  }, [products, search, categoryFilter, situationFilter, sortKey]);

  const activeRows = tab === "insumos" ? filteredInsumos : filteredProducts;
  const pageCount = Math.max(1, Math.ceil(activeRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageInsumos = filteredInsumos.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const pageProducts = filteredProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const productCategories = useMemo(() => {
    const names = new Set<string>();
    for (const p of products) {
      names.add(p.category?.name ?? "Sem categoria");
    }
    return [...names].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [products]);

  function openMoveSheet(kind: TabKey, id?: string) {
    if (kind === "insumos") {
      setMoveTarget("insumo");
      if (id) setStockItemId(id);
      else if (!stockItemId && stockItems[0]) setStockItemId(stockItems[0].id);
    } else {
      setMoveTarget("produto");
      if (id) setProductId(id);
      else if (!productId && products[0]) setProductId(products[0].id);
    }
    setMoveOpen(true);
  }

  async function onMove(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res =
      moveTarget === "insumo"
        ? await fetch("/api/stock-items/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stockItemId,
              type: moveType,
              quantity: Number(moveQty),
              note: moveNote,
            }),
          })
        : await fetch("/api/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId,
              type: moveType,
              quantity: Number(moveQty),
              note: moveNote,
            }),
          });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Não foi possível registrar", tone: "error" });
      return;
    }
    toast({ title: "Movimentação registrada", tone: "success" });
    setMoveNote("");
    setMoveQty("1");
    setMoveOpen(false);
    void load();
  }

  function toggleSelectAll(checked: boolean) {
    if (tab === "insumos") {
      setSelectedInsumos(
        checked ? new Set(pageInsumos.map((r) => r.id)) : new Set(),
      );
    } else {
      setSelectedProducts(
        checked ? new Set(pageProducts.map((r) => r.id)) : new Set(),
      );
    }
  }

  function toggleRow(id: string, checked: boolean) {
    if (tab === "insumos") {
      setSelectedInsumos((prev) => {
        const next = new Set(prev);
        if (checked) next.add(id);
        else next.delete(id);
        return next;
      });
    } else {
      setSelectedProducts((prev) => {
        const next = new Set(prev);
        if (checked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  }

  const insumoColumns: TableColumn<StockItemRow>[] = [
    {
      id: "select",
      header: (
        <input
          type="checkbox"
          aria-label="Selecionar todos"
          checked={
            pageInsumos.length > 0 &&
            pageInsumos.every((r) => selectedInsumos.has(r.id))
          }
          onChange={(e) => toggleSelectAll(e.target.checked)}
          className="h-4 w-4 rounded border-[#CED0D4] text-[var(--painel-brand)]"
        />
      ),
      headerClassName: "w-10",
      className: "w-10",
      render: (item) => (
        <input
          type="checkbox"
          aria-label={`Selecionar ${item.name}`}
          checked={selectedInsumos.has(item.id)}
          onChange={(e) => toggleRow(item.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[#CED0D4] text-[var(--painel-brand)]"
        />
      ),
    },
    {
      id: "name",
      header: "Insumo",
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F5F4F2] text-lg"
            aria-hidden
          >
            {insumoEmoji(item.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-cocoa">{item.name}</p>
          </div>
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoria",
      render: (item) => {
        const cat = insumoCategory(item.name);
        return (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              categoryPillClass(cat),
            )}
          >
            {cat}
          </span>
        );
      },
    },
    {
      id: "unit",
      header: "Unidade",
      tone: "soft",
      render: (item) => item.unit,
    },
    {
      id: "qty",
      header: "Estoque atual",
      render: (item) => (
        <StockQtyBar
          qty={item.quantity}
          min={item.minQuantity}
          unit={item.unit}
        />
      ),
    },
    {
      id: "min",
      header: "Estoque mínimo",
      tone: "muted",
      numeric: true,
      render: (item) => formatQty(item.minQuantity, item.unit),
    },
    {
      id: "cost",
      header: "Custo de compra",
      tone: "body",
      numeric: true,
      render: (item) =>
        item.unitCostCents != null
          ? `${formatBRL(item.unitCostCents)} / ${item.unit}`
          : "—",
    },
    {
      id: "status",
      header: "Status",
      render: (item) => (
        <StockStatusBadge
          level={stockLevel(item.quantity, item.minQuantity)}
        />
      ),
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
            {
              label: "Movimentar",
              onClick: () => openMoveSheet("insumos", item.id),
            },
            {
              label: "Editar cadastro",
              icon: Pencil,
              href: "/painel/insumos",
            },
          ]}
        />
      ),
    },
  ];

  const productColumns: TableColumn<ProductRow>[] = [
    {
      id: "select",
      header: (
        <input
          type="checkbox"
          aria-label="Selecionar todos"
          checked={
            pageProducts.length > 0 &&
            pageProducts.every((r) => selectedProducts.has(r.id))
          }
          onChange={(e) => toggleSelectAll(e.target.checked)}
          className="h-4 w-4 rounded border-[#CED0D4] text-[var(--painel-brand)]"
        />
      ),
      headerClassName: "w-10",
      className: "w-10",
      render: (product) => (
        <input
          type="checkbox"
          aria-label={`Selecionar ${product.name}`}
          checked={selectedProducts.has(product.id)}
          onChange={(e) => toggleRow(product.id, e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-[#CED0D4] text-[var(--painel-brand)]"
        />
      ),
    },
    {
      id: "name",
      header: "Produto",
      render: (product) => (
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F5F4F2]">
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-lg">
                🧁
              </span>
            )}
          </span>
          <p className="truncate font-semibold text-cocoa">{product.name}</p>
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoria",
      render: (product) => {
        const cat = product.category?.name ?? "Sem categoria";
        return (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              categoryPillClass(cat === "Sem categoria" ? "Outros" : cat),
            )}
          >
            {cat}
          </span>
        );
      },
    },
    {
      id: "unit",
      header: "Unidade",
      tone: "soft",
      render: (product) => product.unit,
    },
    {
      id: "qty",
      header: "Estoque atual",
      render: (product) => (
        <StockQtyBar
          qty={product.stockQty}
          min={product.stockMin}
          unit={product.unit}
        />
      ),
    },
    {
      id: "min",
      header: "Estoque mínimo",
      tone: "muted",
      numeric: true,
      render: (product) => formatQty(product.stockMin, product.unit),
    },
    {
      id: "cost",
      header: "Preço",
      tone: "body",
      numeric: true,
      render: (product) =>
        product.priceCents != null ? formatBRL(product.priceCents) : "—",
    },
    {
      id: "status",
      header: "Status",
      render: (product) => (
        <StockStatusBadge level={stockLevel(product.stockQty, product.stockMin)} />
      ),
    },
    {
      id: "actions",
      header: "Ações",
      align: "center",
      headerClassName: "w-14",
      render: (product) => (
        <RowActionsMenu
          label={`Ações de ${product.name}`}
          items={[
            {
              label: "Movimentar",
              onClick: () => openMoveSheet("produtos", product.id),
            },
            {
              label: "Editar produto",
              icon: Pencil,
              href: `/painel/produtos/${product.id}`,
            },
          ]}
        />
      ),
    },
  ];

  const categoryOptions =
    tab === "insumos"
      ? [
          { value: "all", label: "Todas as categorias" },
          ...INSUMO_CATEGORIES.map((c) => ({ value: c, label: c })),
        ]
      : [
          { value: "all", label: "Todas as categorias" },
          ...productCategories.map((c) => ({ value: c, label: c })),
        ];

  const emptyTitle =
    tab === "insumos" ? "Nenhum insumo cadastrado" : "Nenhum produto com estoque";
  const emptyDescription =
    tab === "insumos"
      ? "Cadastre insumos para controlar entradas e saídas aqui."
      : "Ative o controle de estoque nos produtos para acompanhar as unidades prontas.";

  return (
    <PageShell>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex min-w-0 gap-2.5 sm:gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F0EE] text-[var(--painel-brand,#0f352e)] sm:h-11 sm:w-11"
            aria-hidden
          >
            <Warehouse className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h1 className="font-sans text-lg font-bold tracking-tight text-[var(--painel-brand,#0f352e)] sm:text-xl">
              Estoque
            </h1>
            <p className="mt-0.5 max-w-2xl text-pretty text-xs leading-snug text-[var(--painel-muted,#6b7280)] sm:mt-1 sm:text-sm sm:leading-relaxed">
              Controle simples de entradas, saídas e ajustes. Mantenha seu estoque
              sempre em dia para garantir a produção e o bom funcionamento da sua
              confeitaria.
            </p>
          </div>
        </div>
        <PageAction
          onClick={() => openMoveSheet(tab)}
          className="w-full shrink-0 sm:w-auto sm:self-start"
        >
          <Plus className="h-4 w-4" />
          Nova movimentação
        </PageAction>
      </header>

      <PainelMetricRow>
        <PainelMetricSlide>
          <PainelMetricCard
            icon={Cake}
            iconClassName="bg-[#FCE8EC] text-[#C45A7A]"
            label="Produtos prontos"
            value={productStats.total}
          >
            {productStats.out > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setTab("produtos");
                  setSituationFilter("critical");
                }}
                className="inline-flex max-w-full items-center gap-0.5 whitespace-nowrap text-[10px] font-semibold text-[var(--painel-accent,#1e6b5c)] hover:underline sm:text-xs"
              >
                {productStats.out} sem estoque
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : (
              <span className="text-[10px] text-[var(--painel-muted)] sm:text-xs">
                Todos com unidades
              </span>
            )}
          </PainelMetricCard>
        </PainelMetricSlide>
        <PainelMetricSlide>
          <PainelMetricCard
            icon={Box}
            iconClassName="bg-[#E4F0E8] text-[#2D6B4F]"
            label="Total de insumos"
            value={insumoStats.total}
          >
            {insumoStats.lowOrCritical > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setTab("insumos");
                  setSituationFilter("low");
                }}
                className="inline-flex max-w-full items-center gap-0.5 whitespace-nowrap text-[10px] font-semibold text-[var(--painel-accent,#1e6b5c)] hover:underline sm:text-xs"
              >
                {insumoStats.lowOrCritical} com estoque baixo
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : (
              <span className="text-[10px] text-[var(--painel-muted)] sm:text-xs">
                Estoque em dia
              </span>
            )}
          </PainelMetricCard>
        </PainelMetricSlide>
        <PainelMetricSlide>
          <PainelMetricCard
            icon={AlertTriangle}
            iconClassName="bg-[#FDF0E0] text-[#B87A2A]"
            label="Itens em estoque baixo"
            value={combinedLowCount}
          >
            <button
              type="button"
              onClick={() => setSituationFilter("low")}
              className="inline-flex max-w-full items-center gap-0.5 whitespace-nowrap text-[10px] font-semibold text-[var(--painel-accent,#1e6b5c)] hover:underline sm:text-xs"
            >
              Ver detalhes
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </button>
          </PainelMetricCard>
        </PainelMetricSlide>
        <PainelMetricSlide>
          <PainelMetricCard
            icon={CalendarDays}
            iconClassName="bg-[#EDE8F5] text-[#6B4FA8]"
            label="Valor total em estoque"
            value={formatBRL(insumoStats.totalValue)}
            hint="Soma do custo dos insumos"
          />
        </PainelMetricSlide>
      </PainelMetricRow>

      <section className="overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white">
        <div className="px-3 pt-3 sm:px-4 sm:pt-4">
          <EstoqueTabs
            tab={tab}
            onTab={setTab}
            insumoCount={stockItems.length}
            productCount={products.length}
            historyAction={
              <PageAction
                variant="secondary"
                onClick={() => setHistoryOpen(true)}
                className="h-9 whitespace-nowrap px-2.5 text-xs sm:px-3 sm:text-sm"
              >
                <Clock className="h-4 w-4 shrink-0" />
                <span className="max-[380px]:hidden sm:inline">Ver histórico</span>
                <span className="hidden max-[380px]:inline">Histórico</span>
              </PageAction>
            }
          />

          <div className="mt-3 flex flex-col gap-2.5 pb-3 sm:mt-4 sm:gap-3 sm:pb-4 lg:flex-row lg:flex-wrap lg:items-center">
            <label className="relative min-w-0 flex-1 lg:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
                strokeWidth={1.75}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === "insumos" ? "Buscar insumo..." : "Buscar produto..."
                }
                aria-label={
                  tab === "insumos" ? "Buscar insumo" : "Buscar produto"
                }
                className="h-9 w-full rounded-lg border border-[#E5E7EB] bg-white py-0 pl-9 pr-3 text-sm text-cocoa outline-none transition placeholder:text-[#9CA3AF] focus:border-[var(--painel-brand,#0f352e)]/25 focus:ring-2 focus:ring-[var(--painel-brand,#0f352e)]/10"
              />
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
              <FilterSelect
                label="Categoria"
                value={categoryFilter}
                onChange={setCategoryFilter}
                options={categoryOptions}
              />
              <FilterSelect
                label="Situação"
                value={situationFilter}
                onChange={(v) => setSituationFilter(v as SituationFilter)}
                options={(
                  Object.keys(SITUATION_LABELS) as SituationFilter[]
                ).map((key) => ({
                  value: key,
                  label: SITUATION_LABELS[key],
                }))}
              />
              <FilterSelect
                label="Ordenar por"
                value={sortKey}
                onChange={(v) => setSortKey(v as SortKey)}
                options={(
                  Object.keys(SORT_LABELS) as SortKey[]
                ).map((key) => ({
                  value: key,
                  label: SORT_LABELS[key],
                }))}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse border-t border-[var(--painel-border)] bg-[var(--painel-subtle,#eff3f6)]" />
        ) : tab === "insumos" && stockItems.length === 0 ? (
          <EmptyState
            icon={Warehouse}
            title={emptyTitle}
            description={emptyDescription}
            action={{ label: "Cadastrar insumos", href: "/painel/insumos" }}
            className="border-t border-[var(--painel-border)]"
          />
        ) : tab === "produtos" && products.length === 0 ? (
          <EmptyState
            icon={Warehouse}
            title={emptyTitle}
            description={emptyDescription}
            action={{ label: "Ver produtos", href: "/painel/produtos" }}
            className="border-t border-[var(--painel-border)]"
          />
        ) : activeRows.length === 0 ? (
          <p className="border-t border-[var(--painel-border)] px-4 py-12 text-center text-sm text-[#8C8682]">
            Nenhum item encontrado com esses filtros.
          </p>
        ) : tab === "insumos" ? (
          <>
            <EstoqueMobileList
              footer={
                <DataTablePagination
                  page={safePage}
                  pageCount={pageCount}
                  onPageChange={setPage}
                  summary={`Mostrando ${pageInsumos.length} de ${filteredInsumos.length} insumo${filteredInsumos.length === 1 ? "" : "s"}`}
                />
              }
            >
              {pageInsumos.map((item) => {
                const cat = insumoCategory(item.name);
                const level = stockLevel(item.quantity, item.minQuantity);
                return (
                  <li key={item.id} className="px-3 py-3.5 sm:px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 gap-2.5">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F4F2] text-lg"
                          aria-hidden
                        >
                          {insumoEmoji(item.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-cocoa">
                            {item.name}
                          </p>
                          <span
                            className={cn(
                              "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
                              categoryPillClass(cat),
                            )}
                          >
                            {cat}
                          </span>
                        </div>
                      </div>
                      <RowActionsMenu
                        label={`Ações de ${item.name}`}
                        items={[
                          {
                            label: "Movimentar",
                            onClick: () => openMoveSheet("insumos", item.id),
                          },
                          {
                            label: "Editar cadastro",
                            icon: Pencil,
                            href: "/painel/insumos",
                          },
                        ]}
                      />
                    </div>
                    <div className="mt-3 space-y-2">
                      <StockQtyBar
                        qty={item.quantity}
                        min={item.minQuantity}
                        unit={item.unit}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StockStatusBadge level={level} />
                        <span className="text-xs text-[#8C8682]">
                          Mín. {formatQty(item.minQuantity, item.unit)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </EstoqueMobileList>
            <div className="hidden md:block">
              <ColumnsTable
                className={tableInCard}
                minWidth="1040px"
                rows={pageInsumos}
                rowKey={(item) => item.id}
                columns={insumoColumns}
                footer={
                  <DataTablePagination
                    page={safePage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                    summary={`Mostrando ${pageInsumos.length} de ${filteredInsumos.length} insumo${filteredInsumos.length === 1 ? "" : "s"}`}
                  />
                }
              />
            </div>
          </>
        ) : (
          <>
            <EstoqueMobileList
              footer={
                <DataTablePagination
                  page={safePage}
                  pageCount={pageCount}
                  onPageChange={setPage}
                  summary={`Mostrando ${pageProducts.length} de ${filteredProducts.length} produto${filteredProducts.length === 1 ? "" : "s"}`}
                />
              }
            >
              {pageProducts.map((product) => {
                const cat = product.category?.name ?? "Sem categoria";
                const level = stockLevel(product.stockQty, product.stockMin);
                return (
                  <li key={product.id} className="px-3 py-3.5 sm:px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-1 gap-2.5">
                        <span className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F5F4F2]">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg">
                              🧁
                            </span>
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-cocoa">
                            {product.name}
                          </p>
                          <span
                            className={cn(
                              "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold sm:text-xs",
                              categoryPillClass(
                                cat === "Sem categoria" ? "Outros" : cat,
                              ),
                            )}
                          >
                            {cat}
                          </span>
                        </div>
                      </div>
                      <RowActionsMenu
                        label={`Ações de ${product.name}`}
                        items={[
                          {
                            label: "Movimentar",
                            onClick: () =>
                              openMoveSheet("produtos", product.id),
                          },
                          {
                            label: "Editar produto",
                            icon: Pencil,
                            href: `/painel/produtos/${product.id}`,
                          },
                        ]}
                      />
                    </div>
                    <div className="mt-3 space-y-2">
                      <StockQtyBar
                        qty={product.stockQty}
                        min={product.stockMin}
                        unit={product.unit}
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <StockStatusBadge level={level} />
                        <span className="text-xs font-medium tabular-nums text-[#5C5652]">
                          {product.priceCents != null
                            ? formatBRL(product.priceCents)
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </EstoqueMobileList>
            <div className="hidden md:block">
              <ColumnsTable
                className={tableInCard}
                minWidth="1040px"
                rows={pageProducts}
                rowKey={(product) => product.id}
                columns={productColumns}
                footer={
                  <DataTablePagination
                    page={safePage}
                    pageCount={pageCount}
                    onPageChange={setPage}
                    summary={`Mostrando ${pageProducts.length} de ${filteredProducts.length} produto${filteredProducts.length === 1 ? "" : "s"}`}
                  />
                }
              />
            </div>
          </>
        )}
      </section>

      <Sheet open={moveOpen} onOpenChange={setMoveOpen}>
        <SheetContent size="md">
          <SheetHeader title="Nova movimentação" />
          <SheetForm onSubmit={(e) => void onMove(e)}>
            <SheetBody className="space-y-4">
              <Field
                as="select"
                label="Tipo de item"
                value={moveTarget}
                onChange={(e) =>
                  setMoveTarget(e.target.value as "insumo" | "produto")
                }
              >
                <option value="produto">Produto pronto</option>
                <option value="insumo">Insumo</option>
              </Field>
              {moveTarget === "insumo" ? (
                <Field
                  as="select"
                  label="Insumo"
                  value={stockItemId}
                  onChange={(e) => setStockItemId(e.target.value)}
                  required
                >
                  {stockItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Field>
              ) : (
                <Field
                  as="select"
                  label="Produto"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </Field>
              )}
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
                  <option value="ADJUST">Ajuste manual</option>
                </Field>
                <Field
                  label="Quantidade"
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
                placeholder="Opcional"
              />
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary disabled={saving}>
                {saving ? "Registrando…" : "Registrar"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent size="md">
          <SheetHeader
            title="Histórico de movimentações"
            description="Entradas, saídas e ajustes recentes de insumos e produtos."
          />
          <SheetBody>
            {movements.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#8C8682]">
                Nenhuma movimentação registrada.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--painel-border)]">
                {movements.map((m) => {
                  const label =
                    m.stockItem?.name || m.product?.name || "Item";
                  const kind = m.stockItemId ? "Insumo" : "Produto";
                  return (
                    <li
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3.5 text-sm"
                    >
                      <div>
                        <p className="font-semibold text-cocoa">{label}</p>
                        <p className="text-xs text-[#8C8682]">
                          {kind} ·{" "}
                          {format(new Date(m.createdAt), "dd/MM/yyyy HH:mm")}
                          {m.note ? ` · ${m.note}` : ""}
                        </p>
                      </div>
                      <span className="font-semibold tabular-nums text-cocoa">
                        {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "="}
                        {m.quantity}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </SheetBody>
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
