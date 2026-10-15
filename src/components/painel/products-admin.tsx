"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
} from "react";
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
  AlertTriangle,
  ChevronDown,
  Copy,
  GripVertical,
  PauseCircle,
  Pencil,
  Plus,
  Star,
  Trash2,
  Package,
  PackageCheck,
} from "lucide-react";
import {
  formatBRL,
  PRODUCT_TYPE_LABELS,
  AVAILABILITY_LABELS,
} from "@/lib/utils";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import { PageAction, PageHeader, PageShell } from "@/components/painel/page-header";
import {
  PainelMetricCard,
  PainelMetricRow,
  PainelMetricSlide,
} from "@/components/painel/metric-card";
import { Switch } from "@/components/ui/switch";
import {
  RowActionsMenu,
  type RowActionItem,
} from "@/components/painel/row-actions-menu";
import { useToast } from "@/components/ui/toast";
import { useClientMounted } from "@/lib/use-client-mounted";
import {
  ProductSheet,
} from "@/components/painel/product-sheet";
import type { ProductFormInitial } from "@/components/painel/product-form";

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
  startCreateOpen = false,
  createInitial,
}: {
  initialProducts?: Product[];
  startCreateOpen?: boolean;
  createInitial?: ProductFormInitial;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [createOpen, setCreateOpen] = useState(startCreateOpen);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "featured" | "inactive">("all");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const dndMounted = useClientMounted();

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

  const onCreateOpenChange = useCallback(
    (open: boolean) => {
      setCreateOpen(open);
      if (!open) router.replace("/painel/produtos");
    },
    [router],
  );

  const openCreate = useCallback(() => setCreateOpen(true), []);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const paused = products.filter((p) => !p.active).length;
    const lowStock = products.filter(
      (p) => p.trackStock && p.stockQty <= p.stockMin,
    ).length;
    return { total, active, paused, lowStock };
  }, [products]);

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

  async function patch(
    id: string,
    data: Record<string, unknown>,
    options?: { silent?: boolean },
  ) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast({ title: "Falha ao atualizar", tone: "error" });
      return false;
    }
    if (!options?.silent) {
      toast({ title: "Produto atualizado", tone: "success" });
    }
    return true;
  }

  async function toggleActive(id: string, active: boolean) {
    const previous = products.find((p) => p.id === id)?.active;
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active } : p)),
    );
    const ok = await patch(id, { active }, { silent: true });
    if (!ok && previous !== undefined) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: previous } : p)),
      );
      return;
    }
    toast({
      title: active ? "Produto ativo na vitrine" : "Produto oculto na vitrine",
      tone: "success",
    });
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
        description={
          <>
            <span className="sm:hidden">
              Arraste os produtos para ordenar a vitrine.
            </span>
            <span className="hidden sm:inline">
              Agrupe por categoria e arraste para ordenar na vitrine.
            </span>
          </>
        }
        actions={
          <PageAction
            onClick={openCreate}
            aria-label="Novo produto"
            className="max-sm:h-9 max-sm:w-9 max-sm:gap-0 max-sm:px-0"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Novo produto</span>
          </PageAction>
        }
      />

      <ListFilterBar
        search={{
          value: q,
          onChange: setQ,
          placeholder: "Buscar produto...",
          "aria-label": "Buscar produto",
        }}
        filters={{
          value: filter,
          onChange: setFilter,
          options: [
            { value: "all", label: "Todos" },
            { value: "active", label: "Ativos" },
            { value: "featured", label: "Destaques" },
            { value: "inactive", label: "Inativos" },
          ],
        }}
      />

      <PainelMetricRow>
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <PainelMetricSlide key={i}>
              <div
                className="h-[4.25rem] animate-pulse rounded-xl border border-[var(--painel-border)] bg-white sm:h-[5.5rem]"
              />
            </PainelMetricSlide>
          ))
        ) : (
          <>
            <PainelMetricSlide>
              <PainelMetricCard
                icon={Package}
                label="Total de produtos"
                value={stats.total}
              />
            </PainelMetricSlide>
            <PainelMetricSlide>
              <PainelMetricCard
                icon={PackageCheck}
                label="Ativos"
                value={stats.active}
              />
            </PainelMetricSlide>
            <PainelMetricSlide>
              <PainelMetricCard
                icon={PauseCircle}
                label="Pausados"
                value={stats.paused}
              />
            </PainelMetricSlide>
            <PainelMetricSlide>
              <PainelMetricCard
                icon={AlertTriangle}
                label="Estoque baixo"
                value={stats.lowStock}
              />
            </PainelMetricSlide>
          </>
        )}
      </PainelMetricRow>

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
          action={{ label: "Adicionar primeiro produto", onClick: openCreate }}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const open = isOpen(group.key);
            const ids = group.products.map((p) => p.id);

            return (
              <div
                key={group.key}
                className="rounded-lg border border-[var(--painel-border)] bg-white"
              >
                <div className="sticky top-0 z-20 rounded-t-lg border-b border-[var(--painel-border)] bg-[#F0F2F5] shadow-[0_1px_0_rgba(45,41,38,0.04)]">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--painel-border)]/60"
                    aria-expanded={open}
                  >
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-[#8C8682] transition-transform",
                        !open && "-rotate-90",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-cocoa">
                        {group.name}
                      </p>
                      <p className="text-xs text-[#8C8682]">
                        {group.products.length}{" "}
                        {group.products.length === 1 ? "produto" : "produtos"}
                      </p>
                    </div>
                  </button>

                  {open && (
                    <div className="hidden border-t border-[var(--painel-border)] bg-white px-4 py-2.5 text-xs text-[#8C8682] md:grid md:grid-cols-[2.5rem_minmax(0,1.8fr)_1fr_0.8fr_1.1fr_3rem] md:gap-2">
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
                  dndMounted ? (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={onDragEnd(group)}
                    >
                      <SortableContext
                        items={ids}
                        strategy={verticalListSortingStrategy}
                      >
                        <ul className="divide-y divide-[var(--painel-border)]">
                          {group.products.map((p) => (
                            <SortableProductItem
                              key={p.id}
                              product={p}
                              actions={productActions(p)}
                              disabled={!canReorder}
                              onToggleActive={toggleActive}
                            />
                          ))}
                        </ul>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <ul className="divide-y divide-[var(--painel-border)]">
                      {group.products.map((p) => (
                        <ProductRow
                          key={p.id}
                          product={p}
                          actions={productActions(p)}
                          reorderDisabled={!canReorder}
                          onToggleActive={toggleActive}
                        />
                      ))}
                    </ul>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
      <ProductSheet
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        initial={createInitial}
        onSaved={() => void load()}
      />
    </PageShell>
  );
}

function SortableProductItem({
  product,
  actions,
  disabled = false,
  onToggleActive,
}: {
  product: Product;
  actions: RowActionItem[];
  disabled?: boolean;
  onToggleActive: (id: string, active: boolean) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id, disabled });

  return (
    <ProductRow
      product={product}
      actions={actions}
      reorderDisabled={disabled}
      onToggleActive={onToggleActive}
      sortable={{
        setNodeRef,
        style: {
          transform: CSS.Transform.toString(transform),
          transition,
        },
        isDragging,
        handleProps: { ...attributes, ...listeners },
      }}
    />
  );
}

function ProductRow({
  product: p,
  actions,
  reorderDisabled = false,
  onToggleActive,
  sortable,
}: {
  product: Product;
  actions: RowActionItem[];
  reorderDisabled?: boolean;
  onToggleActive: (id: string, active: boolean) => void;
  sortable?: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: CSSProperties;
    isDragging: boolean;
    handleProps: ButtonHTMLAttributes<HTMLButtonElement>;
  };
}) {
  const statusLabel = !p.active
    ? "Inativo"
    : AVAILABILITY_LABELS[p.availability];

  const dragDisabled = reorderDisabled || !sortable;

  return (
    <li
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      className={cn(
        "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-2 px-4 py-3 md:grid-cols-[2.5rem_minmax(0,1.8fr)_1fr_0.8fr_1.1fr_3rem] md:gap-2",
        "hover:bg-[var(--painel-subtle,#eff3f6)]",
        sortable?.isDragging && "relative z-10 bg-[#F7F8FA] shadow-md",
      )}
    >
      <button
        type="button"
        disabled={dragDisabled}
        className={cn(
          "inline-flex h-8 w-8 touch-none items-center justify-center rounded-md text-[#B0AAA6] hover:bg-[#F0F2F5] hover:text-cocoa",
          dragDisabled &&
            "cursor-default opacity-30 hover:bg-transparent hover:text-[#B0AAA6]",
        )}
        aria-label={`Arrastar ${p.name}`}
        {...(sortable?.handleProps ?? {})}
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
      <div className="hidden md:flex md:items-center md:gap-2">
        <Switch
          id={`product-active-${p.id}`}
          checked={p.active}
          onCheckedChange={(checked) => onToggleActive(p.id, checked)}
          label={statusLabel}
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
