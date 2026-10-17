"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ReactNode,
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
  CalendarDays,
  ChevronRight,
  GripVertical,
  Package,
  Percent,
  Pencil,
  Plus,
  Power,
  Search,
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
import { PageAction, PageShell, PageTitle } from "@/components/painel/page-header";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useClientMounted } from "@/lib/use-client-mounted";
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
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-cocoa outline-none transition placeholder:text-[#B0AAA6] focus:border-[var(--painel-brand)]/40 focus:ring-2 focus:ring-[var(--painel-brand)]/10";

const CATEGORY_AVATAR_PALETTES = [
  "bg-[#FCE8EE]",
  "bg-[#FFF0E3]",
  "bg-[#E8F5EE]",
  "bg-[#EDE8F5]",
  "bg-[#E5EEF8]",
  "bg-[#FCE8EE]",
  "bg-[#FFF0E3]",
] as const;

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
    <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 gap-3">
            {Icon ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--painel-subtle,#eff3f6)] text-[var(--painel-brand,#0f352e)]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-cocoa">{title}</h3>
              <p className="mt-0.5 hidden text-xs leading-relaxed text-[#8C8682] sm:block">
                {description}
              </p>
            </div>
          </div>
          {action ? <div className="hidden shrink-0 sm:block">{action}</div> : null}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[#8C8682] sm:hidden">
          {description}
        </p>
        {action ? <div className="mt-2 sm:hidden">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

type Category = {
  id: string;
  name: string;
  description?: string | null;
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
  description: string;
  emoji: string;
  active: boolean;
  discountPercent: string;
  surchargePercent: string;
  displayDays: CategoryDayKey[];
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  emoji: DEFAULT_CATEGORY_EMOJI,
  active: true,
  discountPercent: "0",
  surchargePercent: "0",
  displayDays: [...ALL_CATEGORY_DAYS],
});

function formFromCategory(c: Category): FormState {
  return {
    name: c.name,
    description: c.description ?? "",
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
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const dndMounted = useClientMounted();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const desc = c.description?.toLowerCase() ?? "";
      return c.name.toLowerCase().includes(q) || desc.includes(q);
    });
  }, [categories, search]);

  const ids = useMemo(
    () => filteredCategories.map((c) => c.id),
    [filteredCategories],
  );
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
      description: form.description.trim() || null,
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
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E8F5F0] text-[var(--painel-brand,#0f352e)]"
            aria-hidden
          >
            <Tags className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <PageTitle className="text-lg sm:text-2xl">Categorias</PageTitle>
            <p className="mt-1 max-w-xl text-pretty text-[13px] leading-snug text-[var(--painel-muted,#6b7280)] sm:text-sm sm:leading-normal">
              Organize seus produtos em categorias para facilitar a navegação
              dos seus clientes.
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto lg:shrink-0">
          <label className="relative block w-full min-w-0 sm:max-w-[240px]">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar categoria..."
              aria-label="Buscar categoria"
              className="h-10 w-full rounded-full border border-[#E5E7EB] bg-white py-0 pl-10 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[var(--painel-brand)]/25 focus:ring-2 focus:ring-[var(--painel-brand)]/10"
            />
          </label>
          <PageAction
            onClick={openCreate}
            aria-label="Nova categoria"
            className="h-10 shrink-0 justify-center px-4"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Nova categoria
          </PageAction>
        </div>
      </header>

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
            <SheetBody className="space-y-5">
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
                    <label className={fieldLabel} htmlFor="category-description">
                      Descrição
                    </label>
                    <textarea
                      id="category-description"
                      className={cn(
                        fieldInput,
                        "min-h-[4.5rem] resize-y py-2.5",
                      )}
                      placeholder="Ex.: Brownies tradicionais e especiais."
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      rows={2}
                      maxLength={280}
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
                                ? "bg-[var(--painel-brand)] shadow-sm ring-2 ring-[var(--painel-brand)]/25"
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
                    className="shrink-0 text-xs font-semibold text-[var(--painel-brand)] underline-offset-2 transition hover:underline"
                  >
                    Marcar todos os dias
                  </button>
                }
              >
                <div className="grid grid-cols-7 gap-1 max-[380px]:gap-0.5 sm:flex sm:flex-wrap sm:gap-1.5">
                  {CATEGORY_DAY_LABELS.map(({ key, short }) => {
                    const selected = form.displayDays.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDay(key)}
                        className={cn(
                          "inline-flex aspect-square w-full max-w-10 items-center justify-center rounded-full border p-0 text-[10px] font-semibold transition max-sm:mx-auto sm:size-10 sm:text-xs",
                          selected
                            ? "border-[var(--painel-brand)] bg-[var(--painel-brand)] text-white"
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

              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--painel-border)] bg-[var(--painel-subtle,#eff3f6)] px-4 py-3.5">
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
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[5.5rem] animate-pulse rounded-xl border border-[var(--painel-border)] bg-white"
            />
          ))}
        </div>
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
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhum resultado"
          description="Tente outro termo na busca."
        />
      ) : dndMounted && !search.trim() ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {filteredCategories.map((c) => (
                <SortableCategoryRow
                  key={c.id}
                  category={c}
                  order={c.sortOrder + 1}
                  onEdit={() => openEdit(c)}
                  onToggle={() => patch({ id: c.id, active: !c.active })}
                  onRemove={() => remove(c.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {filteredCategories.map((c) => (
            <CategoryRow
              key={c.id}
              category={c}
              order={c.sortOrder + 1}
              onEdit={() => openEdit(c)}
              onToggle={() => patch({ id: c.id, active: !c.active })}
              onRemove={() => remove(c.id)}
            />
          ))}
        </ul>
      )}
    </PageShell>
  );
}

function SortableCategoryRow({
  category,
  order,
  onEdit,
  onToggle,
  onRemove,
}: {
  category: Category;
  order: number;
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

  return (
    <CategoryRow
      category={category}
      order={order}
      onEdit={onEdit}
      onToggle={onToggle}
      onRemove={onRemove}
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

function CategoryRow({
  category,
  order,
  onEdit,
  onToggle,
  onRemove,
  sortable,
}: {
  category: Category;
  order: number;
  onEdit: () => void;
  onToggle: () => void;
  onRemove: () => void;
  sortable?: {
    setNodeRef: (node: HTMLElement | null) => void;
    style: CSSProperties;
    isDragging: boolean;
    handleProps: ButtonHTMLAttributes<HTMLButtonElement>;
  };
}) {
  const count = category._count?.products ?? 0;
  const discount = category.discountPercent ?? 0;
  const surcharge = category.surchargePercent ?? 0;
  const avatarBg =
    CATEGORY_AVATAR_PALETTES[(order - 1) % CATEGORY_AVATAR_PALETTES.length];
  const description = category.description?.trim();

  return (
    <li
      ref={sortable?.setNodeRef}
      style={sortable?.style}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-[var(--painel-border)] bg-white px-3 py-3.5 shadow-[0_1px_2px_rgba(15,53,46,0.04)] sm:gap-3 sm:px-4",
        sortable?.isDragging &&
          "relative z-10 shadow-md ring-1 ring-[var(--painel-border)]",
        !category.active && "opacity-75",
      )}
    >
      <button
        type="button"
        disabled={!sortable}
        className={cn(
          "inline-flex h-9 w-8 shrink-0 touch-none items-center justify-center rounded-md text-[#C4C0BC] hover:bg-[#F0F2F5] hover:text-[#8C8682]",
          !sortable &&
            "cursor-default opacity-30 hover:bg-transparent hover:text-[#C4C0BC]",
        )}
        aria-label={`Arrastar ${category.name}`}
        {...(sortable?.handleProps ?? {})}
      >
        <GripVertical className="h-4 w-4" strokeWidth={1.5} />
      </button>

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={onEdit}
      >
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl",
            avatarBg,
          )}
        >
          {category.emoji ? (
            <span aria-hidden>{category.emoji}</span>
          ) : (
            <Tags className="h-5 w-5 text-[var(--painel-brand,#0f352e)]" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-cocoa">
              {category.name}
            </p>
            <span
              className="inline-flex shrink-0 rounded-md bg-[#E8F5F0] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#1e6b5c]"
            >
              #{order}
            </span>
            {discount > 0 && (
              <span className="rounded-md bg-[#FFF4E5] px-1.5 py-0.5 text-[11px] font-medium text-[#C47A1A]">
                −{discount}%
              </span>
            )}
            {surcharge > 0 && (
              <span className="rounded-md bg-[#EEF2FF] px-1.5 py-0.5 text-[11px] font-medium text-[#4A5DB0]">
                +{surcharge}%
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#8C8682]">
            <Package className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
            <span>
              {count} {count === 1 ? "produto" : "produtos"}
            </span>
          </p>
          {description ? (
            <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-[#9CA3AF]">
              {description}
            </p>
          ) : null}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <Switch
          checked={category.active}
          onCheckedChange={onToggle}
          aria-label={
            category.active
              ? `Desativar ${category.name}`
              : `Ativar ${category.name}`
          }
        />
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#B0AAA6] transition hover:bg-[#F0F2F5] hover:text-cocoa"
          aria-label={`Abrir ${category.name}`}
        >
          <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </button>
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
