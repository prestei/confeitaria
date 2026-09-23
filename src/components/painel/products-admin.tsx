"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
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
  Layers,
  Link2,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Star,
  Trash2,
  Warehouse,
} from "lucide-react";
import {
  formatBRL,
  PRODUCT_TYPE_LABELS,
  AVAILABILITY_LABELS,
} from "@/lib/utils";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";
import { Switch } from "@/components/ui/switch";
import {
  PageAction,
  PageHeader,
  PageShell,
  StatTile,
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
  slug?: string;
  name: string;
  imageUrl: string | null;
  productType: keyof typeof PRODUCT_TYPE_LABELS;
  priceMode: string;
  priceCents: number | null;
  promoPriceCents: number | null;
  availability: keyof typeof AVAILABILITY_LABELS;
  active: boolean;
  featured: boolean;
  suggestInCart?: boolean;
  stockQty: number;
  stockMin?: number;
  trackStock: boolean;
  unit: string;
  sortOrder: number;
  categoryId?: string | null;
  category: Category | null;
  optionGroups?: unknown[];
  addons?: unknown[];
};

type CategoryGroup = {
  key: string;
  categoryId: string | null;
  name: string;
  sortOrder: number;
  products: Product[];
};

type FilterId =
  | "all"
  | "active"
  | "featured"
  | "inactive"
  | "promo"
  | "lowstock"
  | "complements";

const UNCATEGORIZED_KEY = "__none__";

export default function ProductsAdminPage({
  initialProducts = [],
  storeSlug,
  origin,
}: {
  initialProducts?: Product[];
  storeSlug?: string;
  origin?: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
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

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.active).length;
    const featured = products.filter((p) => p.featured).length;
    const promo = products.filter((p) => p.promoPriceCents != null).length;
    const complements = products.filter(
      (p) => (p.optionGroups?.length || 0) + (p.addons?.length || 0) > 0,
    ).length;
    const low = products.filter(
      (p) => p.trackStock && p.stockQty <= (p.stockMin ?? 0),
    ).length;
    return { total, active, featured, promo, complements, low };
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (filter === "active" && !p.active) return false;
      if (filter === "inactive" && p.active) return false;
      if (filter === "featured" && !p.featured) return false;
      if (filter === "promo" && p.promoPriceCents == null) return false;
      if (filter === "lowstock" && !(p.trackStock && p.stockQty <= (p.stockMin ?? 0)))
        return false;
      if (
        filter === "complements" &&
        (p.optionGroups?.length || 0) + (p.addons?.length || 0) === 0
      )
        return false;
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
    return true;
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => ({
      ...prev,
      [key]: isOpen(key),
    }));
  }

  async function patch(id: string, data: Record<string, unknown>) {
    const prev = products;
    setProducts((list) =>
      list.map((p) => (p.id === id ? { ...p, ...data } : p)),
    );
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setProducts(prev);
      toast({ title: "Falha ao atualizar", tone: "error" });
      return;
    }
    toast({ title: "Produto atualizado", tone: "success" });
  }

  async function duplicate(id: string) {
    const res = await fetch(`/api/products/${id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      toast({ title: "Não foi possível duplicar", tone: "error" });
      return;
    }
    toast({ title: "Produto duplicado como rascunho", tone: "success" });
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

  async function copyLink(p: Product) {
    const base =
      origin ||
      (typeof window !== "undefined" ? window.location.origin : "");
    if (!base || !storeSlug || !p.slug) {
      toast({ title: "Publique o produto para copiar o link", tone: "info" });
      return;
    }
    const url = `${base.replace(/\/$/, "")}/${storeSlug}/produto/${p.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link da vitrine copiado", tone: "success" });
    } catch {
      toast({ title: "Não foi possível copiar o link", tone: "error" });
    }
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

  function productActions(p: Product): RowActionItem[] {
    return [
      {
        label: "Editar",
        icon: Pencil,
        href: `/painel/produtos/${p.id}`,
      },
      {
        label: "Complementos",
        icon: Layers,
        href: `/painel/produtos/${p.id}?tab=complementos`,
      },
      {
        label: "Vitrine e estoque",
        icon: Warehouse,
        href: `/painel/produtos/${p.id}?tab=vitrine`,
      },
      {
        label: "Copiar link",
        icon: Link2,
        onClick: () => copyLink(p),
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
        label: p.suggestInCart
          ? "Tirar do carrinho"
          : "Sugerir no carrinho",
        icon: ShoppingBag,
        onClick: () => patch(p.id, { suggestInCart: !p.suggestInCart }),
      },
      {
        label: "Excluir",
        icon: Trash2,
        tone: "danger",
        separator: true,
        onClick: () => remove(p.id),
      },
    ];
  }

  const filters: { id: FilterId; label: string }[] = [
    { id: "all", label: `Todos (${stats.total})` },
    { id: "active", label: `Ativos (${stats.active})` },
    { id: "featured", label: `Destaques (${stats.featured})` },
    { id: "promo", label: `Promoção (${stats.promo})` },
    { id: "complements", label: `Complementos (${stats.complements})` },
    { id: "lowstock", label: `Estoque baixo (${stats.low})` },
    { id: "inactive", label: `Inativos (${stats.total - stats.active})` },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Produtos"
        description="Monte o cardápio, ative na vitrine e arraste para ordenar por categoria."
        actions={
          <PageAction href="/painel/produtos/novo">
            <Plus className="h-4 w-4" />
            Novo produto
          </PageAction>
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="No cardápio"
          value={stats.total}
          hint={`${stats.active} ativos na vitrine`}
        />
        <StatTile
          label="Destaques"
          value={stats.featured}
          hint="Aparecem na vitrine de destaques"
        />
        <StatTile
          label="Com promoção"
          value={stats.promo}
          hint="Preço promocional ativo"
        />
        <StatTile
          label="Estoque baixo"
          value={stats.low}
          hint={stats.low ? "Revise saldo e alerta mínimo" : "Nenhum alerta agora"}
          href={stats.low ? "/painel/estoque" : undefined}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#E8E2DE] bg-white p-3 sm:flex-row sm:items-center sm:p-3.5">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0AAA6]" />
          <input
            className="input h-9 w-full max-w-md !py-0 pl-9 text-sm"
            placeholder="Buscar por nome…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <FilterChipGroup>
          {filters.map((f) => (
            <FilterChip
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onClick={() => setFilter(f.id)}
            />
          ))}
        </FilterChipGroup>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={
            products.length === 0
              ? "Sua vitrine ainda não possui produtos"
              : "Nenhum produto neste filtro"
          }
          description={
            products.length === 0
              ? "Cadastre o primeiro item com fotos, preço, complementos e estoque."
              : "Tente outro filtro ou limpe a busca."
          }
          action={
            products.length === 0
              ? {
                  label: "Adicionar primeiro produto",
                  href: "/painel/produtos/novo",
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const open = isOpen(group.key);
            const ids = group.products.map((p) => p.id);
            const activeInGroup = group.products.filter((p) => p.active).length;
            const lowInGroup = group.products.filter(
              (p) => p.trackStock && p.stockQty <= (p.stockMin ?? 0),
            ).length;

            return (
              <div
                key={group.key}
                className="rounded-xl border border-[#E8E2DE] bg-white"
              >
                <div className="rounded-t-xl border-b border-[#E8E2DE] bg-[#FAFAF8]">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.key)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#F3F0ED]"
                    aria-expanded={open}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3EEEA] text-[#483129]">
                      <Package className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#2D2926]">
                        {group.name}
                      </p>
                      <p className="text-xs text-[#8C8682]">
                        {group.products.length}{" "}
                        {group.products.length === 1 ? "produto" : "produtos"}
                        {" · "}
                        {activeInGroup} na vitrine
                        {lowInGroup > 0 ? ` · ${lowInGroup} com estoque baixo` : ""}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-[#8C8682] transition-transform",
                        !open && "-rotate-90",
                      )}
                    />
                  </button>

                  {open && (
                    <div className="hidden border-t border-[#E8E2DE] bg-white px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#8C8682] lg:grid lg:grid-cols-[2.25rem_minmax(0,1.7fr)_0.9fr_0.85fr_5.5rem_6.5rem_2.5rem] lg:items-center lg:gap-2 lg:px-4">
                      <span />
                      <span>Produto</span>
                      <span>Preço</span>
                      <span>Estoque</span>
                      <span>Na vitrine</span>
                      <span>Status</span>
                      <span className="text-right">Ações</span>
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
                      <ul>
                        {group.products.map((p) => (
                          <SortableProductItem
                            key={p.id}
                            product={p}
                            actions={productActions(p)}
                            disabled={!canReorder}
                            onToggleActive={(v) => patch(p.id, { active: v })}
                          />
                        ))}
                      </ul>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            );
          })}
          {canReorder ? (
            <p className="px-1 text-xs text-[#8C8682]">
              Arraste pelo ícone ⋮⋮ para definir a ordem na vitrine. Filtros e
              busca desativam o reordenamento.
            </p>
          ) : (
            <p className="px-1 text-xs text-[#8C8682]">
              Limpe busca e filtros para reordenar os produtos.
            </p>
          )}
        </div>
      )}
    </PageShell>
  );
}

function SortableProductItem({
  product: p,
  actions,
  disabled = false,
  onToggleActive,
}: {
  product: Product;
  actions: RowActionItem[];
  disabled?: boolean;
  onToggleActive: (active: boolean) => void;
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

  const complements =
    (p.optionGroups?.length || 0) + (p.addons?.length || 0);
  const lowStock = p.trackStock && p.stockQty <= (p.stockMin ?? 0);

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-2 border-t border-[#F0EBE7] px-2 py-3 lg:grid-cols-[2.25rem_minmax(0,1.7fr)_0.9fr_0.85fr_5.5rem_6.5rem_2.5rem] lg:gap-2 lg:px-4",
        "transition-colors hover:bg-[#FBF9F7]",
        !p.active && "bg-[#FAFAF9] opacity-80",
        isDragging && "relative z-10 bg-white shadow-md",
      )}
    >
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex h-8 w-8 touch-none items-center justify-center rounded-md text-[#B0AAA6] hover:bg-[#F0F2F5] hover:text-[#2D2926]",
          disabled &&
            "cursor-default opacity-30 hover:bg-transparent hover:text-[#B0AAA6]",
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
          <Link
            href={`/painel/produtos/${p.id}`}
            className="truncate text-sm font-semibold text-[#2D2926] hover:underline"
          >
            {p.name}
          </Link>
          <p className="text-xs text-[#8C8682]">
            {PRODUCT_TYPE_LABELS[p.productType]}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {p.featured ? (
              <Chip tone="gold">
                <Star className="h-3 w-3 fill-current" />
                Destaque
              </Chip>
            ) : null}
            {p.promoPriceCents != null ? <Chip tone="rose">Promo</Chip> : null}
            {complements > 0 ? (
              <Chip>
                <Layers className="h-3 w-3" />
                {complements} {complements === 1 ? "complemento" : "complementos"}
              </Chip>
            ) : null}
            {p.suggestInCart ? (
              <Chip>
                <ShoppingBag className="h-3 w-3" />
                Carrinho
              </Chip>
            ) : null}
          </div>
          <div className="mt-1.5 lg:hidden">
            <PriceCell product={p} />
          </div>
        </div>
      </div>

      <div className="hidden text-sm lg:block">
        <PriceCell product={p} />
      </div>
      <div className="hidden text-sm lg:block">
        {p.trackStock ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-medium",
              lowStock ? "text-[#C2410C]" : "text-[#2D2926]",
            )}
          >
            {lowStock ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
            {p.stockQty} {p.unit}
          </span>
        ) : (
          <span className="text-[#B0AAA6]">Sem controle</span>
        )}
      </div>
      <div
        className="hidden lg:flex"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Switch
          size="sm"
          checked={p.active}
          onCheckedChange={onToggleActive}
        />
      </div>
      <div className="hidden lg:block">
        <StatusDot
          tone={
            !p.active
              ? "neutral"
              : p.availability === "SOLD_OUT" || lowStock
                ? "danger"
                : p.availability === "LAST_UNITS"
                  ? "warning"
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

function Chip({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "rose";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
        tone === "gold" && "bg-[#F8F1E3] text-[#9A6B1F]",
        tone === "rose" && "bg-[#F8EEEF] text-[#9A5966]",
        tone === "neutral" && "bg-[#F0F2F5] text-[#65676B]",
      )}
    >
      {children}
    </span>
  );
}

function PriceCell({ product: p }: { product: Product }) {
  if (p.promoPriceCents != null) {
    return (
      <span>
        <span className="font-semibold text-[#9A5966]">
          {formatBRL(p.promoPriceCents)}
        </span>
        <span className="ml-1 text-xs text-[#B0AAA6] line-through">
          {formatBRL(p.priceCents)}
        </span>
      </span>
    );
  }
  return (
    <span className="font-semibold text-[#2D2926]">
      {p.priceMode === "QUOTE" ? "Sob consulta" : formatBRL(p.priceCents)}
    </span>
  );
}

function Thumb({ src }: { src: string | null }) {
  return (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F3EEEA] ring-1 ring-[#E8E2DE]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#C8C2BE]">
          <Package className="h-5 w-5" />
        </div>
      )}
    </div>
  );
}
