"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  Copy,
  GripVertical,
  Pencil,
  Plus,
  Star,
  Trash2,
  Package,
} from "lucide-react";
import {
  formatBRL,
  PRODUCT_TYPE_LABELS,
  AVAILABILITY_LABELS,
} from "@/lib/utils";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";
import {
  PageAction,
  PageHeader,
  PageShell,
  StatusDot,
} from "@/components/painel/page-header";
import {
  RowActionsMenu,
  type RowActionItem,
} from "@/components/painel/row-actions-menu";
import { useToast } from "@/components/ui/toast";

type Category = { id: string; name: string; sortOrder?: number };
type Product = {
  id: string;
  name: string;
  imageUrl: string | null;
  productType: keyof typeof PRODUCT_TYPE_LABELS;
  priceMode: string;
  priceCents: number | null;
  promoPriceCents: number | null;
  availability: keyof typeof AVAILABILITY_LABELS;
  active: boolean;
  featured: boolean;
  stockQty: number;
  trackStock: boolean;
  unit: string;
  sortOrder: number;
  categoryId?: string | null;
  category: Category | null;
};

type CategoryGroup = {
  key: string;
  categoryId: string | null;
  name: string;
  sortOrder: number;
  products: Product[];
};

const UNCATEGORIZED_KEY = "__none__";

export default function ProductsAdminPage({
  initialProducts = [],
}: {
  initialProducts?: Product[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "featured" | "inactive">("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  async function load() {
    const res = await fetch("/api/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (initialProducts.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter === "active" && !p.active) return false;
      if (filter === "inactive" && p.active) return false;
      if (filter === "featured" && !p.featured) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [products, filter, q]);

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
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name),
      );
    }

    return [...map.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name),
    );
  }, [filtered]);

  function isOpen(key: string) {
    if (collapsed[key] === true) return false;
    if (collapsed[key] === false) return true;
    // Default: open when searching, otherwise open
    return true;
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => ({
      ...prev,
      [key]: isOpen(key),
    }));
  }

  async function patch(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast({ title: "Falha ao atualizar", tone: "error" });
      return;
    }
    toast({ title: "Produto atualizado", tone: "success" });
    load();
  }

  async function duplicate(id: string) {
    const res = await fetch(`/api/products/${id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      toast({ title: "Não foi possível duplicar", tone: "error" });
      return;
    }
    toast({ title: "Produto duplicado", tone: "success" });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast({ title: "Não foi possível excluir", tone: "error" });
      return;
    }
    toast({ title: "Produto excluído", tone: "success" });
    load();
  }

  async function persistOrder(orderedIds: string[]) {
    const res = await fetch("/api/products", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok) {
      toast({ title: "Não foi possível reordenar", tone: "error" });
      load();
    }
  }

  function onDragEnd(group: CategoryGroup) {
    return async (event: DragEndEvent) => {
      if (q || filter !== "all") return;

      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = group.products.findIndex((p) => p.id === active.id);
      const newIndex = group.products.findIndex((p) => p.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return;

      const reordered = arrayMove(group.products, oldIndex, newIndex).map(
        (p, i) => ({ ...p, sortOrder: i }),
      );

      setProducts((prev) =>
        prev.map((p) => {
          const next = reordered.find((r) => r.id === p.id);
          return next ? { ...p, sortOrder: next.sortOrder } : p;
        }),
      );

      void persistOrder(reordered.map((p) => p.id));
    };
  }

  const canReorder = !q && filter === "all";

  function productActions(p: Product) {
    return [
      {
        label: "Editar",
        icon: Pencil,
        href: `/painel/produtos/${p.id}`,
      },
      {
        label: "Duplicar",
        icon: Copy,
        onClick: () => duplicate(p.id),
      },
      {
        label: p.featured ? "Remover destaque" : "Marcar destaque",
        icon: Star,
        onClick: () => patch(p.id, { featured: !p.featured }),
      },
      {
        label: p.active ? "Desativar" : "Ativar",
        icon: Package,
        onClick: () => patch(p.id, { active: !p.active }),
      },
      {
        label: "Excluir",
        icon: Trash2,
        tone: "danger" as const,
        separator: true,
        onClick: () => remove(p.id),
      },
    ];
  }

  return (
    <PageShell>
      <PageHeader
        title="Produtos"
        description="Agrupe por categoria e arraste para ordenar na vitrine."
        actions={
          <PageAction href="/painel/produtos/novo">
            <Plus className="h-4 w-4" />
            Novo produto
          </PageAction>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input h-9 max-w-xs !py-0 text-sm"
          placeholder="Buscar produto…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <FilterChipGroup>
          {(
            [
              ["all", "Todos"],
              ["active", "Ativos"],
              ["featured", "Destaques"],
              ["inactive", "Inativos"],
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

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Sua vitrine ainda não possui produtos"
          description="Adicione o primeiro produto para começar a receber pedidos."
          action={{ label: "Adicionar primeiro produto", href: "/painel/produtos/novo" }}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const open = isOpen(group.key);
            const ids = group.products.map((p) => p.id);

            return (
              <div
                key={group.key}
                className="rounded-lg border border-[#E8E2DE] bg-white"
              >
                <div className="sticky top-0 z-20 rounded-t-lg border-b border-[#E8E2DE] bg-[#F0F2F5] shadow-[0_1px_0_rgba(45,41,38,0.04)]">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#E8E2DE]/60"
                    aria-expanded={open}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-[#8C8682] transition-transform",
                        !open && "-rotate-90",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#2D2926]">
                        {group.name}
                      </p>
                      <p className="text-xs text-[#8C8682]">
                        {group.products.length}{" "}
                        {group.products.length === 1 ? "produto" : "produtos"}
                      </p>
                    </div>
                  </button>

                  {open && (
                    <div className="hidden border-t border-[#E8E2DE] bg-white px-2 py-2.5 text-xs uppercase tracking-wide text-[#8C8682] md:grid md:grid-cols-[2.5rem_minmax(0,1.8fr)_1fr_0.8fr_1.1fr_3rem] md:gap-2 md:px-4">
                      <span />
                      <span className="font-semibold">Produto</span>
                      <span className="font-semibold">Preço</span>
                      <span className="font-semibold">Estoque</span>
                      <span className="font-semibold">Status</span>
                      <span className="text-right font-semibold">Ações</span>
                    </div>
                  )}
                </div>

                {open && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={onDragEnd(group)}
                  >
                    <SortableContext
                      items={ids}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="divide-y divide-[#E8E2DE]">
                        {group.products.map((p) => (
                          <SortableProductItem
                            key={p.id}
                            product={p}
                            actions={productActions(p)}
                            disabled={!canReorder}
                          />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

function SortableProductItem({
  product: p,
  actions,
  disabled = false,
}: {
  product: Product;
  actions: RowActionItem[];
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 px-2 py-3 md:grid-cols-[2.5rem_minmax(0,1.8fr)_1fr_0.8fr_1.1fr_3rem] md:gap-2 md:px-4",
        "hover:bg-fog/30",
        isDragging && "relative z-10 bg-[#F7F8FA] shadow-md",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex h-8 w-8 touch-none items-center justify-center rounded-md text-[#B0AAA6] hover:bg-[#F0F2F5] hover:text-[#2D2926]",
          disabled && "cursor-default opacity-30 hover:bg-transparent hover:text-[#B0AAA6]",
        )}
        aria-label={`Arrastar ${p.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 items-center gap-3">
        <Thumb src={p.imageUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-cocoa">
            {p.name}
            {p.featured && (
              <Star className="ml-1 inline h-3.5 w-3.5 fill-warning text-warning" />
            )}
          </p>
          <p className="text-xs text-cocoa-soft/55">
            {PRODUCT_TYPE_LABELS[p.productType]}
          </p>
          <div className="mt-1 md:hidden">
            <PriceCell product={p} />
          </div>
        </div>
      </div>

      <div className="hidden text-sm md:block">
        <PriceCell product={p} />
      </div>
      <div className="hidden text-sm text-cocoa-soft/70 md:block">
        {p.trackStock ? `${p.stockQty} ${p.unit}` : "—"}
      </div>
      <div className="hidden md:block">
        <StatusDot
          tone={
            !p.active
              ? "neutral"
              : p.availability === "SOLD_OUT"
                ? "danger"
                : "success"
          }
          label={
            !p.active ? "Inativo" : AVAILABILITY_LABELS[p.availability]
          }
        />
      </div>

      <div className="flex justify-end">
        <RowActionsMenu items={actions} />
      </div>
    </li>
  );
}

function PriceCell({ product: p }: { product: Product }) {
  if (p.promoPriceCents != null) {
    return (
      <span>
        <span className="font-medium text-berry-deep">
          {formatBRL(p.promoPriceCents)}
        </span>
        <span className="ml-1 text-xs text-cocoa-soft/45 line-through">
          {formatBRL(p.priceCents)}
        </span>
      </span>
    );
  }
  return (
    <span className="font-medium text-cocoa">
      {p.priceMode === "QUOTE" ? "Sob consulta" : formatBRL(p.priceCents)}
    </span>
  );
}

function Thumb({ src }: { src: string | null }) {
  return (
    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[#F0F2F5]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-[#B0AAA6]">
          Sem foto
        </div>
      )}
    </div>
  );
}
