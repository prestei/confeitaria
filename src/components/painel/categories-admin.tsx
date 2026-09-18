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
import { GripVertical, Plus, Tags, Trash2 } from "lucide-react";
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
import {
  PageAction,
  PageHeader,
  PageShell,
} from "@/components/painel/page-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Category = {
  id: string;
  name: string;
  emoji?: string | null;
  active: boolean;
  sortOrder: number;
  _count?: { products: number };
};

export function CategoriesAdmin({
  initialCategories = [],
}: {
  initialCategories?: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
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

  async function create(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, emoji: emoji || undefined }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Não foi possível criar", tone: "error" });
      return;
    }
    setName("");
    setEmoji("");
    setOpen(false);
    toast({ title: "Categoria criada", tone: "success" });
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
      return;
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
        description="Arraste para ordenar. A ordem aparece na vitrine."
        actions={
          <PageAction onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova categoria
          </PageAction>
        }
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader
            title="Nova categoria"
            description="Aparece na navegação da vitrine."
          />
          <form onSubmit={create}>
            <DialogBody className="space-y-4">
              <div>
                <label className="label">Nome</label>
                <input
                  className="input"
                  placeholder="Ex.: Bolos personalizados"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Emoji (opcional)</label>
                <input
                  className="input"
                  placeholder="🎂"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  maxLength={4}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogCancel />
              <DialogPrimary disabled={saving}>
                {saving ? "Criando…" : "Criar categoria"}
              </DialogPrimary>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-white" />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria"
          description="Crie categorias para organizar os produtos na vitrine."
          action={{
            label: "Nova categoria",
            onClick: () => setOpen(true),
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
  onToggle,
  onRemove,
}: {
  category: Category;
  index: number;
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

      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#F0F2F5] text-lg">
          {category.emoji || "🏷️"}
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
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          className="rounded-md border border-[#CED0D4] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2D2926] hover:bg-[#F0F2F5]"
          onClick={onToggle}
        >
          {category.active ? "Desativar" : "Ativar"}
        </button>
        <button
          type="button"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8C8682] hover:bg-[#FDECEC] hover:text-[#C85A5A]"
          onClick={onRemove}
          aria-label={`Excluir ${category.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
