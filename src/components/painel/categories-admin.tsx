"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
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
  GripVertical,
  Percent,
  Pencil,
  Plus,
  Power,
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
} from "@/components/painel/page-header";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import {
  ALL_CATEGORY_DAYS,
  CATEGORY_DAY_LABELS,
  CATEGORY_MENU_EMOJIS,
  DEFAULT_CATEGORY_EMOJI,
  type CategoryDayKey,
} from "@/lib/category";

const fieldLabel =
  "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-cocoa outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";

function CategoryFormSection({
  icon: Icon,
  title,
  description,
  children,
  action,
}: {
  icon?: typeof Percent;
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#E8E2DE] bg-white p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
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
        {action}
      </div>
      {children}
    </section>
  );
}

type Category = {
  id: string;
  name: string;
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

const emptyForm = (): FormState => ({
  name: "",
  emoji: DEFAULT_CATEGORY_EMOJI,
  active: true,
  discountPercent: "0",
  surchargePercent: "0",
  displayDays: [...ALL_CATEGORY_DAYS],
});

function formFromCategory(c: Category): FormState {
  return {
    name: c.name,
    emoji: c.emoji || DEFAULT_CATEGORY_EMOJI,
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
}: {
  initialCategories?: Category[];
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

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      emoji: form.emoji,
      active: form.active,
      discountPercent: Math.min(100, Math.max(0, parsePercent(form.discountPercent))),
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
        description="Ordene, defina desconto ou acréscimo e os dias de exibição na vitrine."
        actions={
          <PageAction onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova categoria
          </PageAction>
        }
      />

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
            <SheetBody className="space-y-4">
              <div className="rounded-xl border border-[#2D2926]/20 bg-[#2D2926] px-4 py-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Prévia no menu da vitrine
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#E8A4B8] px-3 py-1.5 text-xs font-semibold text-[#2D2926]">
                    <span className="text-base leading-none" aria-hidden>
                      {form.emoji}
                    </span>
                    {form.name.trim() || "Sua categoria"}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/45">
                    Outra categoria
                  </span>
                </div>
              </div>

              <CategoryFormSection
                title="Identidade na vitrine"
                description="Nome e ícone do menu horizontal do cardápio."
              >
                <div className="space-y-4">
                  <div>
                    <label className={fieldLabel} htmlFor="category-name">
                      Nome
                    </label>
                    <input
                      id="category-name"
                      className={fieldInput}
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
                    <span className={fieldLabel}>Ícone no menu</span>
                    <div
                      className="grid grid-cols-8 gap-2"
                      role="listbox"
                      aria-label="Ícone no menu"
                    >
                      {CATEGORY_MENU_EMOJIS.map((emoji) => {
                        const selected = form.emoji === emoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() =>
                              setForm((p) => ({ ...p, emoji }))
                            }
                            className={cn(
                              "flex aspect-square items-center justify-center rounded-full text-xl transition",
                              selected
                                ? "bg-[#483129] shadow-sm ring-2 ring-[#483129]/25"
                                : "bg-[#F7F8FA] hover:bg-[#F0F2F5]",
                            )}
                          >
                            <span aria-hidden>{emoji}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CategoryFormSection>

              <CategoryFormSection
                icon={Percent}
                title="Preços dos produtos"
                description="Aplica-se a todos os itens desta categoria no cardápio."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={fieldLabel} htmlFor="category-discount">
                      Desconto (%)
                    </label>
                    <input
                      id="category-discount"
                      className={fieldInput}
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
                    <label className={fieldLabel} htmlFor="category-surcharge">
                      Acréscimo (%)
                    </label>
                    <input
                      id="category-surcharge"
                      className={fieldInput}
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
              </CategoryFormSection>

              <CategoryFormSection
                icon={CalendarDays}
                title="Dias de exibição"
                description="Fora desses dias a categoria some do menu da vitrine."
                action={
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({
                        ...p,
                        displayDays: [...ALL_CATEGORY_DAYS],
                      }))
                    }
                    className="shrink-0 text-xs font-semibold text-[#483129] underline-offset-2 transition hover:underline"
                  >
                    Marcar todos os dias
                  </button>
                }
              >
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_DAY_LABELS.map(({ key, short }) => {
                    const selected = form.displayDays.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDay(key)}
                        className={cn(
                          "inline-flex size-10 shrink-0 items-center justify-center rounded-full border p-0 text-xs font-semibold transition",
                          selected
                            ? "border-[#483129] bg-[#483129] text-white"
                            : "border-[#CED0D4] bg-white text-[#5C5652] hover:border-[#B0AAA6] hover:bg-[#F7F8FA]",
                        )}
                        aria-pressed={selected}
                      >
                        {short}
                      </button>
                    );
                  })}
                </div>
              </CategoryFormSection>

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E8E2DE] bg-[#FBF7F2] px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cocoa">
                    Publicada na vitrine
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-[#8C8682]">
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
        <div className="h-40 animate-pulse rounded-lg bg-white" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria"
          description="Crie categorias para organizar os produtos na vitrine."
          action={{
            label: "Nova categoria",
            onClick: openCreate,
          }}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="overflow-hidden rounded-lg border border-[#E8E2DE] bg-white">
              {categories.map((c, index) => (
                <SortableCategoryRow
                  key={c.id}
                  category={c}
                  index={index}
                  onEdit={() => openEdit(c)}
                  onToggle={() => patch({ id: c.id, active: !c.active })}
                  onRemove={() => remove(c.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </PageShell>
  );
}

function SortableCategoryRow({
  category,
  index,
  onEdit,
  onToggle,
  onRemove,
}: {
  category: Category;
  index: number;
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

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-[#E8E2DE] px-3 py-3 last:border-b-0 sm:gap-4 sm:px-4",
        isDragging && "relative z-10 bg-[#F7F8FA] shadow-md ring-1 ring-[#CED0D4]",
        !category.active && "opacity-70",
      )}
    >
      <button
        type="button"
        className="inline-flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-md text-[#B0AAA6] hover:bg-[#F0F2F5] hover:text-cocoa"
        aria-label={`Arrastar ${category.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        className="flex min-w-0 items-center gap-3 text-left"
        onClick={onEdit}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#F3EEE8] text-lg text-[#483129]">
          {category.emoji ? (
            <span aria-hidden>{category.emoji}</span>
          ) : (
            <Tags className="h-4 w-4" aria-hidden />
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-cocoa">
              {category.name}
            </p>
            <span className="hidden text-[11px] tabular-nums text-[#B0AAA6] sm:inline">
              #{index + 1}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#8C8682]">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-medium",
                category.active
                  ? "bg-[#E7F8ED] text-[#31A24C]"
                  : "bg-[#F0F2F5] text-[#65676B]",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  category.active ? "bg-[#31A24C]" : "bg-[#B0AAA6]",
                )}
              />
              {category.active ? "Ativa" : "Inativa"}
            </span>
            <span>
              {count} {count === 1 ? "produto" : "produtos"}
            </span>
            {discount > 0 && (
              <span className="rounded-md bg-[#FFF4E5] px-1.5 py-0.5 font-medium text-[#C47A1A]">
                −{discount}%
              </span>
            )}
            {surcharge > 0 && (
              <span className="rounded-md bg-[#EEF2FF] px-1.5 py-0.5 font-medium text-[#4A5DB0]">
                +{surcharge}%
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="flex items-center justify-end gap-2">
        <Switch
          checked={category.active}
          onCheckedChange={onToggle}
          aria-label={
            category.active
              ? `Desativar ${category.name}`
              : `Ativar ${category.name}`
          }
        />
        <RowActionsMenu
          label={`Ações de ${category.name}`}
          items={[
            {
              label: "Editar",
              icon: Pencil,
              onClick: onEdit,
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
    </li>
  );
}
