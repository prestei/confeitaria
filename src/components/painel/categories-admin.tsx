"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
  CalendarDays,
  ExternalLink,
  GripVertical,
  Package,
  Percent,
  Pencil,
  Plus,
  Power,
  Sparkles,
  Store,
  Tags,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/switch";
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
import {
  PageAction,
  PageHeader,
  PageShell,
  StatTile,
} from "@/components/painel/page-header";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  ALL_CATEGORY_DAYS,
  CATEGORY_DAY_LABELS,
  formatDisplayDaysShort,
  isCategoryVisibleToday,
  resolveCategoryEmoji,
  type CategoryDayKey,
} from "@/lib/category";

type Category = {
  id: string;
  name: string;
  slug: string;
  emoji?: string | null;
  active: boolean;
  sortOrder: number;
  discountPercent?: number;
  surchargePercent?: number;
  displayDays?: CategoryDayKey[];
  _count?: { products: number };
};

type FormState = {
  name: string;
  emoji: string;
  active: boolean;
  discountPercent: string;
  surchargePercent: string;
  displayDays: CategoryDayKey[];
};

const CATEGORY_EMOJIS = [
  "🍰",
  "🎂",
  "🧁",
  "🍪",
  "🍩",
  "🍫",
  "🥧",
  "🍮",
  "🍓",
  "☕",
  "🎁",
  "⭐",
  "🥂",
  "🥞",
  "🎉",
  "🎄",
];

const emptyForm = (): FormState => ({
  name: "",
  emoji: "🍰",
  active: true,
  discountPercent: "0",
  surchargePercent: "0",
  displayDays: [...ALL_CATEGORY_DAYS],
});

function formFromCategory(c: Category): FormState {
  return {
    name: c.name,
    emoji: resolveCategoryEmoji(c.name, c.emoji),
    active: c.active,
    discountPercent: String(c.discountPercent ?? 0),
    surchargePercent: String(c.surchargePercent ?? 0),
    displayDays:
      c.displayDays?.length ? [...c.displayDays] : [...ALL_CATEGORY_DAYS],
  };
}

function parsePercent(value: string) {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function CategoriesAdmin({
  initialCategories = [],
  storeSlug,
  origin,
}: {
  initialCategories?: Category[];
  storeSlug?: string;
  origin?: string;
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ids = useMemo(() => categories.map((c) => c.id), [categories]);
  const isEditing = editingId != null;

  const stats = useMemo(() => {
    const active = categories.filter((c) => c.active).length;
    const withPricing = categories.filter(
      (c) => (c.discountPercent ?? 0) > 0 || (c.surchargePercent ?? 0) > 0,
    ).length;
    const visibleToday = categories.filter((c) =>
      isCategoryVisibleToday(c),
    ).length;
    const products = categories.reduce(
      (n, c) => n + (c._count?.products ?? 0),
      0,
    );
    return { total: categories.length, active, withPricing, visibleToday, products };
  }, [categories]);

  const vitrineUrl =
    storeSlug && origin
      ? `${origin.replace(/\/$/, "")}/${storeSlug}#cardapio`
      : storeSlug
        ? `/${storeSlug}#cardapio`
        : null;

  async function load() {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (initialCategories.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(c: Category) {
    setEditingId(c.id);
    setForm(formFromCategory(c));
    setOpen(true);
  }

  function toggleDay(day: CategoryDayKey) {
    setForm((prev) => {
      const has = prev.displayDays.includes(day);
      if (has && prev.displayDays.length === 1) return prev;
      return {
        ...prev,
        displayDays: has
          ? prev.displayDays.filter((d) => d !== day)
          : [...prev.displayDays, day],
      };
    });
  }

  function setAllDays() {
    setForm((prev) => ({ ...prev, displayDays: [...ALL_CATEGORY_DAYS] }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      emoji: form.emoji || null,
      active: form.active,
      discountPercent: Math.min(
        100,
        Math.max(0, parsePercent(form.discountPercent)),
      ),
      surchargePercent: Math.max(0, parsePercent(form.surchargePercent)),
      displayDays: form.displayDays,
    };

    const res = await fetch("/api/categories", {
      method: isEditing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEditing ? { id: editingId, ...payload } : payload,
      ),
    });
    setSaving(false);

    if (!res.ok) {
      toast({
        title: isEditing
          ? "Não foi possível salvar"
          : "Não foi possível criar",
        tone: "error",
      });
      return;
    }

    setOpen(false);
    setEditingId(null);
    setForm(emptyForm());
    toast({
      title: isEditing ? "Categoria atualizada" : "Categoria criada",
      tone: "success",
    });
    load();
  }

  async function persistOrder(next: Category[]) {
    const orderedIds = next.map((c) => c.id);
    const res = await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
    if (!res.ok) {
      toast({ title: "Não foi possível reordenar", tone: "error" });
      load();
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(categories, oldIndex, newIndex).map((c, i) => ({
      ...c,
      sortOrder: i,
    }));
    setCategories(next);
    await persistOrder(next);
  }

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      toast({ title: "Falha ao atualizar", tone: "error" });
      return;
    }
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta categoria?")) return;
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      toast({ title: "Não foi possível excluir", tone: "error" });
      return;
    }
    toast({ title: "Categoria excluída", tone: "success" });
    load();
  }

  return (
    <PageShell>
      <PageHeader
        title="Categorias"
        description="Organize o cardápio como na vitrine: ícone, ordem, preços por categoria e dias de exibição."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {vitrineUrl && (
              <PageAction href={vitrineUrl} variant="secondary">
                <Store className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Ver vitrine</span>
                <span className="sm:hidden">Vitrine</span>
              </PageAction>
            )}
            <PageAction onClick={openCreate}>
              <Plus className="h-4 w-4 shrink-0" />
              Nova categoria
            </PageAction>
          </div>
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Categorias"
          value={stats.total}
          hint={`${stats.active} ativas na loja`}
        />
        <StatTile
          label="Na vitrine hoje"
          value={stats.visibleToday}
          hint="Ativas e no dia da semana"
        />
        <StatTile
          label="Regras de preço"
          value={stats.withPricing}
          hint="Com desconto ou acréscimo"
        />
        <StatTile
          label="Produtos"
          value={stats.products}
          hint="Distribuídos nas categorias"
          href="/painel/produtos"
        />
      </div>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) {
            setEditingId(null);
            setForm(emptyForm());
          }
        }}
      >
        <SheetContent size="md">
          <SheetHeader
            title={isEditing ? "Editar categoria" : "Nova categoria"}
            description="Mesmas opções que impactam o menu e os preços na vitrine."
          />
          <SheetForm onSubmit={save}>
            <SheetBody className="space-y-6">
              <VitrinePillPreview
                name={form.name.trim() || "Sua categoria"}
                emoji={form.emoji}
                active={form.active}
              />

              <FormSection
                icon={Sparkles}
                title="Identidade na vitrine"
                hint="Nome e ícone do menu horizontal do cardápio."
              >
                <div>
                  <label className="label" htmlFor="category-name">
                    Nome
                  </label>
                  <input
                    id="category-name"
                    className="input"
                    placeholder="Ex.: Bolos personalizados"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Ícone no menu</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_EMOJIS.map((emoji) => {
                      const selected = form.emoji === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, emoji }))}
                          className={cn(
                            "flex h-11 w-11 items-center justify-center rounded-full text-xl transition hover:-translate-y-0.5",
                            selected
                              ? "bg-[#483129] text-white shadow-md ring-2 ring-[#483129]/25"
                              : "bg-[#F3EEE8] hover:bg-[#E8E2DE]",
                          )}
                          aria-pressed={selected}
                          aria-label={`Ícone ${emoji}`}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={Percent}
                title="Preços dos produtos"
                hint="Aplica-se a todos os itens desta categoria no cardápio."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="category-discount">
                      Desconto (%)
                    </label>
                    <input
                      id="category-discount"
                      className="input"
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      inputMode="decimal"
                      value={form.discountPercent}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          discountPercent: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="category-surcharge">
                      Acréscimo (%)
                    </label>
                    <input
                      id="category-surcharge"
                      className="input"
                      type="number"
                      min={0}
                      max={500}
                      step={0.5}
                      inputMode="decimal"
                      value={form.surchargePercent}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          surchargePercent: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={CalendarDays}
                title="Dias de exibição"
                hint="Fora desses dias a categoria some do menu da vitrine."
              >
                <div className="mb-2 flex justify-end">
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#8C8682] transition hover:text-[#483129]"
                    onClick={setAllDays}
                  >
                    Marcar todos os dias
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_DAY_LABELS.map(({ key, short, label }) => {
                    const selected = form.displayDays.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        title={label}
                        onClick={() => toggleDay(key)}
                        className={cn(
                          "min-w-[2.85rem] rounded-full px-3 py-2 text-xs font-bold transition",
                          selected
                            ? "bg-[#483129] text-white shadow-sm"
                            : "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E8E2DE]",
                        )}
                        aria-pressed={selected}
                      >
                        {short}
                      </button>
                    );
                  })}
                </div>
              </FormSection>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8E2DE] bg-gradient-to-br from-[#FBF7F2] to-white px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2D2926]">
                    Publicada na vitrine
                  </p>
                  <p className="mt-0.5 text-xs text-[#8C8682]">
                    Desligada, some do cardápio mesmo nos dias marcados.
                  </p>
                </div>
                <Switch
                  id="category-active"
                  checked={form.active}
                  onCheckedChange={(active) =>
                    setForm((p) => ({ ...p, active }))
                  }
                />
              </div>
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary disabled={saving}>
                {saving
                  ? "Salvando…"
                  : isEditing
                    ? "Salvar alterações"
                    : "Criar categoria"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
          <div className="hidden h-64 animate-pulse rounded-2xl bg-white lg:block" />
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria"
          description="Crie categorias para montar o menu do cardápio na vitrine."
          action={{
            label: "Nova categoria",
            onClick: openCreate,
          }}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_300px] lg:items-start">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <ul className="space-y-3">
                {categories.map((c, index) => (
                  <SortableCategoryCard
                    key={c.id}
                    category={c}
                    index={index}
                    storeSlug={storeSlug}
                    vitrineUrl={vitrineUrl}
                    onEdit={() => openEdit(c)}
                    onToggle={() => patch({ id: c.id, active: !c.active })}
                    onRemove={() => remove(c.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <aside className="lg:sticky lg:top-24">
            <VitrineMenuPreview categories={categories} />
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#8C8682]">
              Arraste os cards para mudar a ordem no cardápio. A prévia reflete
              categorias ativas e visíveis hoje.
            </p>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function FormSection({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E8E2DE] bg-[#FAFAFA] p-4">
      <div className="mb-3 flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#483129] shadow-sm ring-1 ring-[#E8E2DE]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-bold text-[#2D2926]">{title}</h3>
          <p className="text-xs text-[#8C8682]">{hint}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function VitrinePillPreview({
  name,
  active,
}: {
  name: string;
  emoji: string;
  active: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E2DE] bg-[#2a1f1c]/95 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">
        Prévia no menu da vitrine
      </p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold",
            active
              ? "bg-[#C45B7A] text-white shadow-md"
              : "bg-white/8 text-white/75 opacity-40",
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          {name}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/8 px-3 py-2 text-xs font-semibold text-white/50 opacity-40">
          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
          Outra categoria
        </span>
      </div>
    </div>
  );
}

function VitrineMenuPreview({ categories }: { categories: Category[] }) {
  const visible = categories.filter((c) => isCategoryVisibleToday(c));

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E2DE] bg-white shadow-[0_12px_40px_rgba(51,37,34,0.06)]">
      <div className="border-b border-[#E8E2DE] bg-[#FBF7F2] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#8C8682]">
          Menu na vitrine
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#2D2926]">
          {visible.length} de {categories.length} visíveis agora
        </p>
      </div>
      <div className="flex items-center gap-1.5 border-t border-white/10 bg-[#2a1f1c]/95 px-2 py-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-white/80">
          ▦
        </span>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.length === 0 ? (
            <p className="px-2 py-1 text-center text-xs text-white/50">
              Nenhuma categoria visível hoje
            </p>
          ) : (
            visible.map((c, i) => (
              <span
                key={c.id}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold",
                  i === 0
                    ? "bg-[#C45B7A] text-white shadow-md"
                    : "bg-white/8 text-white/80",
                )}
              >
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-90"
                  aria-hidden
                />
                {c.name}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SortableCategoryCard({
  category,
  index,
  storeSlug,
  vitrineUrl,
  onEdit,
  onToggle,
  onRemove,
}: {
  category: Category;
  index: number;
  storeSlug?: string;
  vitrineUrl: string | null;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const count = category._count?.products ?? 0;
  const discount = category.discountPercent ?? 0;
  const surcharge = category.surchargePercent ?? 0;
  const emoji = resolveCategoryEmoji(category.name, category.emoji);
  const visibleToday = isCategoryVisibleToday(category);
  const daysLabel = formatDisplayDaysShort(category.displayDays);
  const allDays =
    (category.displayDays?.length ?? 7) >= ALL_CATEGORY_DAYS.length;

  const sectionHref =
    storeSlug && category.slug
      ? `/${storeSlug}#cat-${category.slug}`
      : vitrineUrl;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E8E2DE] bg-white shadow-[0_4px_20px_rgba(51,37,34,0.04)] transition hover:border-[#CED0D4] hover:shadow-[0_8px_28px_rgba(51,37,34,0.08)]",
        isDragging && "relative z-20 ring-2 ring-[#483129]/20",
        !category.active && "opacity-80",
      )}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          className="flex w-10 shrink-0 touch-none items-center justify-center border-r border-[#E8E2DE] bg-[#FAFAFA] text-[#B0AAA6] hover:bg-[#F0F2F5] hover:text-[#483129]"
          aria-label={`Arrastar ${category.name}`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex flex-wrap items-start gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onEdit}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F3EEE8] to-[#E8E2DE] text-2xl shadow-inner ring-1 ring-[#E8E2DE] transition hover:scale-[1.03]"
            >
              {emoji}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="truncate text-left font-sans text-lg font-bold text-[#2D2926] hover:text-[#483129]"
                >
                  {category.name}
                </button>
                <span className="rounded-full bg-[#F0F2F5] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#8C8682]">
                  #{index + 1}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusChip
                  tone={category.active ? "success" : "neutral"}
                  label={category.active ? "Ativa" : "Inativa"}
                />
                <StatusChip
                  tone={visibleToday ? "info" : "warning"}
                  label={
                    visibleToday ? "Na vitrine hoje" : "Oculta hoje"
                  }
                />
                <StatusChip
                  tone="neutral"
                  label={`${count} ${count === 1 ? "produto" : "produtos"}`}
                />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-1">
              {sectionHref && (
                <Link
                  href={sectionHref}
                  target="_blank"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#8C8682] hover:bg-[#F0F2F5] hover:text-[#483129]"
                  aria-label={`Abrir ${category.name} na vitrine`}
                  title="Ver na vitrine"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
              <RowActionsMenu
                label={`Ações de ${category.name}`}
                items={[
                  { label: "Editar", icon: Pencil, onClick: onEdit },
                  {
                    label: "Ver produtos",
                    icon: Package,
                    href: `/painel/produtos`,
                  },
                  {
                    label: category.active ? "Desativar" : "Ativar",
                    icon: Power,
                    onClick: onToggle,
                  },
                  {
                    label: "Excluir",
                    icon: Trash2,
                    tone: "danger",
                    separator: true,
                    onClick: onRemove,
                  },
                ]}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SpecBlock title="Preço na vitrine" icon={Percent}>
              {discount <= 0 && surcharge <= 0 ? (
                <p className="text-sm text-[#8C8682]">Preço normal dos produtos</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {discount > 0 && (
                    <span className="rounded-lg bg-[#FFF4E5] px-2 py-1 text-xs font-bold text-[#C47A1A]">
                      −{discount}% desconto
                    </span>
                  )}
                  {surcharge > 0 && (
                    <span className="rounded-lg bg-[#EEF2FF] px-2 py-1 text-xs font-bold text-[#4A5DB0]">
                      +{surcharge}% acréscimo
                    </span>
                  )}
                </div>
              )}
            </SpecBlock>

            <SpecBlock title="Agenda" icon={CalendarDays}>
              <p className="text-sm font-medium text-[#2D2926]">{daysLabel}</p>
              {!allDays && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {CATEGORY_DAY_LABELS.map(({ key, short }) => {
                    const on = category.displayDays?.includes(key);
                    return (
                      <span
                        key={key}
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-bold",
                          on
                            ? "bg-[#483129] text-white"
                            : "bg-[#F0F2F5] text-[#B0AAA6]",
                        )}
                      >
                        {short}
                      </span>
                    );
                  })}
                </div>
              )}
            </SpecBlock>

            <SpecBlock title="Menu" icon={Store}>
              <div className="inline-flex flex-col items-center gap-1">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#483129] text-lg text-white">
                  {emoji}
                </span>
                <span className="max-w-[6rem] truncate text-[11px] font-semibold text-[#2D2926]">
                  {category.name}
                </span>
              </div>
            </SpecBlock>
          </div>
        </div>
      </div>
    </li>
  );
}

function SpecBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Percent;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#E8E2DE] bg-[#FAFAFA] p-3">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#8C8682]">
        <Icon className="h-3 w-3" aria-hidden />
        {title}
      </p>
      {children}
    </div>
  );
}

function StatusChip({
  tone,
  label,
}: {
  tone: "success" | "warning" | "info" | "neutral";
  label: string;
}) {
  const styles = {
    success: "bg-[#E7F8ED] text-[#1E7A3A]",
    warning: "bg-[#FFF4E5] text-[#A65E00]",
    info: "bg-[#E8F0FA] text-[#3D5A80]",
    neutral: "bg-[#F0F2F5] text-[#65676B]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        styles[tone],
      )}
    >
      {label}
    </span>
  );
}
