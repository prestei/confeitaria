"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
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
import { GripVertical, Pencil, Plus, Power, Tags, Trash2 } from "lucide-react";
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
  formatDisplayDaysShort,
  type CategoryDayKey,
} from "@/lib/category";

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
  active: boolean;
  discountPercent: string;
  surchargePercent: string;
  displayDays: CategoryDayKey[];
};

const emptyForm = (): FormState => ({
  name: "",
  active: true,
  discountPercent: "0",
  surchargePercent: "0",
  displayDays: [...ALL_CATEGORY_DAYS],
});

function formFromCategory(c: Category): FormState {
  return {
    name: c.name,
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

  function setAllDays() {
    setForm((prev) => ({ ...prev, displayDays: [...ALL_CATEGORY_DAYS] }));
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      active: form.active,
      discountPercent: Math.min(100, Math.max(0, parsePercent(form.discountPercent))),
      surchargePercent: Math.max(0, parsePercent(form.surchargePercent)),
      displayDays: form.displayDays,
      ...(isEditing ? {} : { emoji: null }),
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
            description="Controla como a categoria aparece e o preço dos produtos."
          />
          <SheetForm onSubmit={save}>
            <SheetBody className="space-y-5">
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

              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label className="label mb-0">Dias de exibição</label>
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#8C8682] transition hover:text-[#483129]"
                    onClick={setAllDays}
                  >
                    Todos os dias
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_DAY_LABELS.map(({ key, short }) => {
                    const selected = form.displayDays.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDay(key)}
                        className={cn(
                          "min-w-[2.75rem] rounded border px-2.5 py-1.5 text-xs font-semibold transition",
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
              </div>

              <div className="flex items-center justify-between gap-4 rounded border border-[#E8E2DE] bg-[#FBF7F2] px-3.5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2D2926]">
                    Categoria ativa na vitrine
                  </p>
                  <p className="mt-0.5 text-xs text-[#8C8682]">
                    Quando desativada, some da loja.
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
        className="inline-flex h-9 w-9 shrink-0 touch-none items-center justify-center rounded-md text-[#B0AAA6] hover:bg-[#F0F2F5] hover:text-[#2D2926]"
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
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#F3EEE8] text-[#483129]">
          <Tags className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-[#2D2926]">
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
            <span className="hidden sm:inline">
              {formatDisplayDaysShort(category.displayDays)}
            </span>
          </div>
        </div>
      </button>

      <div className="flex justify-end">
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
