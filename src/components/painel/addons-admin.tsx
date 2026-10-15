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
import {
  Gift,
  GripVertical,
  ImageIcon,
  Layers,
  Package,
  Pencil,
  Plus,
  Power,
  ShoppingBag,
  Tags,
  Trash2,
  Type,
  ToggleLeft,
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
import { Button } from "@/components/ui/button";
import { ImageField } from "@/components/painel/image-field";
import {
  PageAction,
  PageHeader,
  PageShell,
  StatTile,
} from "@/components/painel/page-header";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { StoreAddonsPicker } from "@/components/store/store-addons-picker";
import { useToast } from "@/components/ui/toast";
import { catalogAddonToResolved, type ResolvedAddon } from "@/lib/addons";
import { AddonSelectionType } from "@/lib/enums";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";

type Category = { id: string; name: string };
type SelectionType = (typeof AddonSelectionType)[keyof typeof AddonSelectionType];

type Addon = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  selectionType: SelectionType;
  maxQty: number;
  noteLabel: string | null;
  noteRequired: boolean;
  categoryIds: string[];
  suggestInCart: boolean;
  active: boolean;
  sortOrder?: number;
};

const TYPE_META: Record<
  SelectionType,
  { label: string; hint: string; icon: typeof ToggleLeft }
> = {
  TOGGLE: {
    label: "Sim / não",
    hint: "Caixa “Adicionar”",
    icon: ToggleLeft,
  },
  QTY: {
    label: "Quantidade",
    hint: "Botões + e −",
    icon: Layers,
  },
  TEXT: {
    label: "Com detalhe",
    hint: "Campo de texto",
    icon: Type,
  },
};

const WIZARD_STEPS = [
  {
    title: "Nome e preço",
    description: "Como aparece na vitrine.",
  },
  {
    title: "Forma de escolha",
    description: "Como o cliente inclui o extra.",
  },
  {
    title: "Publicação",
    description: "Onde entra e se fica ativo.",
  },
] as const;

const emptyForm = {
  name: "",
  description: "",
  imageUrl: "",
  price: "",
  selectionType: "QTY" as SelectionType,
  maxQty: "10",
  noteLabel: "",
  noteRequired: false,
  categoryIds: [] as string[],
  suggestInCart: false,
  active: true,
};

function parsePriceCents(raw: string) {
  return Math.round(
    Number(raw.replace(",", ".").replace(/[^\d.]/g, "")) * 100,
  );
}

function formToResolved(form: typeof emptyForm, id = "preview"): ResolvedAddon {
  const priceCents = parsePriceCents(form.price || "0");
  return catalogAddonToResolved({
    id,
    name: form.name.trim() || "Seu adicional",
    description: form.description.trim() || null,
    imageUrl: form.imageUrl || null,
    priceCents: Number.isFinite(priceCents) && priceCents >= 0 ? priceCents : 0,
    selectionType: form.selectionType,
    maxQty: Number(form.maxQty) || 10,
    noteLabel: form.noteLabel.trim() || null,
    noteRequired: form.noteRequired,
    active: form.active,
  });
}

export function AddonsAdmin({
  initialItems = [],
  categories = [],
}: {
  initialItems?: Addon[];
  categories?: Category[];
}) {
  const [items, setItems] = useState<Addon[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [previewQty, setPreviewQty] = useState<Record<string, number>>({
    preview: 1,
  });
  const [previewNotes, setPreviewNotes] = useState<Record<string, string>>({});
  const [wizardStep, setWizardStep] = useState(0);
  const [showPhoto, setShowPhoto] = useState(false);
  const { toast } = useToast();

  const wizard = WIZARD_STEPS[wizardStep]!;
  const isLastWizardStep = wizardStep === WIZARD_STEPS.length - 1;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const ids = useMemo(() => items.map((a) => a.id), [items]);
  const isEditing = editingId != null;

  const stats = useMemo(() => {
    const active = items.filter((a) => a.active).length;
    const upsell = items.filter((a) => a.suggestInCart).length;
    const withPhoto = items.filter((a) => a.imageUrl).length;
    return { total: items.length, active, upsell, withPhoto };
  }, [items]);

  const previewAddon = useMemo(() => formToResolved(form), [form]);

  const sidebarAddons = useMemo(
    () =>
      items
        .filter((a) => a.active)
        .slice(0, 4)
        .map((a) => catalogAddonToResolved(a)),
    [items],
  );

  async function load() {
    const res = await fetch("/api/addons");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (initialItems.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (form.selectionType === AddonSelectionType.TEXT) {
      setPreviewQty({ preview: 1 });
    } else if (form.selectionType === AddonSelectionType.TOGGLE) {
      setPreviewQty({ preview: 1 });
    } else {
      setPreviewQty((q) => ({ preview: q.preview || 0 }));
    }
  }, [form.selectionType]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setPreviewQty({ preview: 1 });
    setPreviewNotes({});
    setWizardStep(0);
    setShowPhoto(false);
  }

  function validateWizardStep(step: number) {
    if (step === 0) {
      if (form.name.trim().length < 2) {
        toast({ title: "Informe o nome do adicional", tone: "error" });
        return false;
      }
      const priceCents = parsePriceCents(form.price);
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        toast({ title: "Informe um preço válido", tone: "error" });
        return false;
      }
    }
    return true;
  }

  function goNextWizardStep() {
    if (!validateWizardStep(wizardStep)) return;
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function goPrevWizardStep() {
    setWizardStep((s) => Math.max(s - 1, 0));
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(addon: Addon) {
    setWizardStep(0);
    setShowPhoto(Boolean(addon.imageUrl));
    setEditingId(addon.id);
    setForm({
      name: addon.name,
      description: addon.description || "",
      imageUrl: addon.imageUrl || "",
      price: (addon.priceCents / 100).toFixed(2).replace(".", ","),
      selectionType: addon.selectionType,
      maxQty: String(addon.maxQty || 10),
      noteLabel: addon.noteLabel || "",
      noteRequired: addon.noteRequired,
      categoryIds: addon.categoryIds || [],
      suggestInCart: Boolean(addon.suggestInCart),
      active: addon.active,
    });
    setPreviewQty({ preview: 1 });
    setPreviewNotes({});
    setOpen(true);
  }

  function toggleCategory(id: string) {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(id)
        ? f.categoryIds.filter((c) => c !== id)
        : [...f.categoryIds, id],
    }));
  }

  async function submitForm(e: FormEvent) {
    e.preventDefault();
    if (!isLastWizardStep) {
      goNextWizardStep();
      return;
    }
    if (!validateWizardStep(0)) {
      setWizardStep(0);
      return;
    }
    setSaving(true);
    const priceCents = parsePriceCents(form.price);
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setSaving(false);
      toast({ title: "Informe um preço válido", tone: "error" });
      setWizardStep(0);
      return;
    }
    const body = {
      ...(editingId ? { id: editingId } : {}),
      name: form.name.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl || null,
      priceCents,
      selectionType: form.selectionType,
      maxQty: Number(form.maxQty) || 10,
      noteLabel: form.noteLabel.trim() || null,
      noteRequired: form.noteRequired,
      categoryIds: form.categoryIds,
      suggestInCart: form.suggestInCart,
      active: form.active,
    };
    const res = await fetch("/api/addons", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Não foi possível salvar", tone: "error" });
      return;
    }
    toast({
      title: editingId ? "Adicional atualizado" : "Adicional criado",
      tone: "success",
    });
    setOpen(false);
    resetForm();
    load();
  }

  async function persistOrder(next: Addon[]) {
    const res = await fetch("/api/addons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: next[0]?.id, orderedIds: next.map((a) => a.id) }),
    });
    if (!res.ok) {
      toast({ title: "Não foi possível reordenar", tone: "error" });
      load();
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((a) => a.id === active.id);
    const newIndex = items.findIndex((a) => a.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(items, oldIndex, newIndex).map((a, i) => ({
      ...a,
      sortOrder: i,
    }));
    setItems(next);
    await persistOrder(next);
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/addons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Excluir este adicional?")) return;
    const res = await fetch("/api/addons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      toast({ title: "Não foi possível excluir", tone: "error" });
      return;
    }
    toast({ title: "Adicional excluído", tone: "success" });
    load();
  }

  function scopeLabel(addon: Addon) {
    if (!addon.categoryIds?.length) return "Todos os produtos";
    return addon.categoryIds
      .map((id) => categoryName[id] || "Categoria")
      .join(", ");
  }

  return (
    <PageShell>
      <PageHeader
        title="Adicionais"
        description="Extras na página do produto e na sacola — como o cliente vê na vitrine."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageAction href="/painel/produtos" variant="secondary">
              <Package className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Ver produtos</span>
              <span className="sm:hidden">Produtos</span>
            </PageAction>
            <PageAction onClick={openCreate}>
              <Plus className="h-4 w-4 shrink-0" />
              Novo adicional
            </PageAction>
          </div>
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Adicionais"
          value={stats.total}
          hint={`${stats.active} ativos na vitrine`}
        />
        <StatTile
          label="Com foto"
          value={stats.withPhoto}
          hint="Miniatura na página do produto"
        />
        <StatTile
          label="Sugestão na sacola"
          value={stats.upsell}
          hint="Aparecem ao fechar o pedido"
        />
        <StatTile
          label="Categorias"
          value={categories.length}
          hint="Para limitar onde o extra aparece"
          href="/painel/categorias"
        />
      </div>

      <Sheet
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <SheetContent size="md">
          <SheetHeader
            title={
              isEditing
                ? `Editar · ${wizard.title}`
                : `Novo adicional · ${wizard.title}`
            }
            description={`Etapa ${wizardStep + 1} de ${WIZARD_STEPS.length} — ${wizard.description}`}
          />
          <SheetForm onSubmit={submitForm}>
            <div className="shrink-0 border-b border-[#E8E2DE] px-5 py-3">
              <WizardProgress step={wizardStep} total={WIZARD_STEPS.length} />
            </div>
            <SheetBody className="space-y-4">
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="label" htmlFor="addon-name">
                      Nome
                    </label>
                    <input
                      id="addon-name"
                      className="input"
                      minLength={2}
                      placeholder="Ex.: Vela numérica"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="addon-price">
                      Preço (R$)
                    </label>
                    <input
                      id="addon-price"
                      className="input"
                      inputMode="decimal"
                      placeholder="8,00"
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, price: e.target.value }))
                      }
                    />
                  </div>
                </div>
              )}

              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(TYPE_META) as SelectionType[]).map(
                      (value) => {
                        const meta = TYPE_META[value];
                        const Icon = meta.icon;
                        const selected = form.selectionType === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({ ...f, selectionType: value }))
                            }
                            className={cn(
                              "flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition",
                              selected
                                ? "border-[#483129] bg-[#FBF7F2] ring-1 ring-[#483129]/15"
                                : "border-[#E8E2DE] bg-white hover:border-[#CED0D4]",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-4 w-4",
                                selected ? "text-[#483129]" : "text-[#8C8682]",
                              )}
                              aria-hidden
                            />
                            <span className="text-xs font-bold text-[#2D2926]">
                              {meta.label}
                            </span>
                            <span className="text-[10px] text-[#8C8682]">
                              {meta.hint}
                            </span>
                          </button>
                        );
                      },
                    )}
                  </div>

                  {form.selectionType === AddonSelectionType.QTY && (
                    <div>
                      <label className="label" htmlFor="addon-max">
                        Máximo por pedido
                      </label>
                      <input
                        id="addon-max"
                        className="input max-w-[8rem]"
                        type="number"
                        min={1}
                        max={99}
                        value={form.maxQty}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, maxQty: e.target.value }))
                        }
                      />
                    </div>
                  )}

                  {form.selectionType === AddonSelectionType.TEXT && (
                    <div className="space-y-3">
                      <div>
                        <label className="label" htmlFor="addon-note">
                          Texto do campo
                        </label>
                        <input
                          id="addon-note"
                          className="input"
                          placeholder="Ex.: Número da vela"
                          value={form.noteLabel}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              noteLabel: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Switch
                        id="addon-note-required"
                        label="Obrigatório"
                        checked={form.noteRequired}
                        onCheckedChange={(noteRequired) =>
                          setForm((f) => ({ ...f, noteRequired }))
                        }
                      />
                    </div>
                  )}

                  <div className="store-theme rounded-xl border border-[#E8E2DE] bg-sand/30 p-3">
                    <StoreAddonsPicker
                      addons={[previewAddon]}
                      qty={previewQty}
                      notes={previewNotes}
                      onQty={(_, next) => setPreviewQty({ preview: next })}
                      onNote={(_, value) =>
                        setPreviewNotes({ preview: value })
                      }
                    />
                  </div>
                </div>
              )}

              {wizardStep === 2 && (
                <div className="space-y-4">
                  {categories.length > 0 ? (
                    <div>
                      <p className="label mb-2">Categorias</p>
                      <p className="mb-2 text-xs text-[#8C8682]">
                        Nenhuma selecionada = todo o cardápio.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {categories.map((c) => {
                          const on = form.categoryIds.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCategory(c.id)}
                              className={cn(
                                "rounded-full px-3 py-1.5 text-xs font-bold transition",
                                on
                                  ? "bg-[#483129] text-white"
                                  : "bg-[#F0F2F5] text-[#65676B]",
                              )}
                            >
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#8C8682]">
                      Válido para{" "}
                      <span className="font-semibold text-[#2D2926]">
                        todos os produtos
                      </span>
                      .
                    </p>
                  )}

                  <div className="space-y-2 rounded-xl border border-[#E8E2DE] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#2D2926]">
                        Ativo na vitrine
                      </span>
                      <Switch
                        checked={form.active}
                        onCheckedChange={(active) =>
                          setForm((f) => ({ ...f, active }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-[#E8E2DE] pt-2">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#2D2926]">
                        <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                        Sugerir na sacola
                      </span>
                      <Switch
                        checked={form.suggestInCart}
                        onCheckedChange={(suggestInCart) =>
                          setForm((f) => ({ ...f, suggestInCart }))
                        }
                      />
                    </div>
                  </div>

                  {!showPhoto && !form.imageUrl ? (
                    <button
                      type="button"
                      className="text-sm font-semibold text-[#483129] hover:underline"
                      onClick={() => setShowPhoto(true)}
                    >
                      + Adicionar foto (opcional)
                    </button>
                  ) : (
                    <ImageField
                      label="Foto"
                      value={form.imageUrl}
                      onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                      hint="Opcional · miniatura na vitrine"
                    />
                  )}

                  <AddonWizardSummary form={form} categoryName={categoryName} />
                </div>
              )}
            </SheetBody>
            <SheetFooter className="justify-between">
              <div>
                {wizardStep === 0 ? (
                  <SheetCancel />
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={goPrevWizardStep}
                  >
                    Voltar
                  </Button>
                )}
              </div>
              <SheetPrimary disabled={saving}>
                {saving
                  ? "Salvando…"
                  : isLastWizardStep
                    ? isEditing
                      ? "Salvar"
                      : "Criar adicional"
                    : "Continuar"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="h-64 animate-pulse rounded-2xl bg-white" />
          <div className="hidden h-64 animate-pulse rounded-2xl bg-white lg:block" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nenhum adicional"
          description="Cadastre velas, topos e bexigas — o cliente escolhe na vitrine e o valor entra no total."
          action={{ label: "Novo adicional", onClick: openCreate }}
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
                {items.map((addon, index) => (
                  <SortableAddonCard
                    key={addon.id}
                    addon={addon}
                    index={index}
                    scope={scopeLabel(addon)}
                    categoryName={categoryName}
                    onEdit={() => openEdit(addon)}
                    onToggle={() => toggle(addon.id, !addon.active)}
                    onRemove={() => remove(addon.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>

          <aside className="lg:sticky lg:top-24">
            <VitrineAddonsPreview addons={sidebarAddons} />
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#8C8682]">
              Arraste os cards para definir a ordem na página do produto. A
              prévia mostra até 4 extras ativos.
            </p>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function VitrineAddonsPreview({ addons }: { addons: ResolvedAddon[] }) {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E2DE] bg-white shadow-[0_12px_40px_rgba(51,37,34,0.06)]">
      <div className="border-b border-[#E8E2DE] bg-[#FBF7F2] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#8C8682]">
          Bloco na vitrine
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#2D2926]">
          Acompanhamentos para a comemoração
        </p>
      </div>
      <div className="store-theme max-h-[420px] overflow-y-auto bg-ivory p-3">
        {addons.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-[#8C8682]">
            Nenhum adicional ativo para prévia
          </p>
        ) : (
          <StoreAddonsPicker
            addons={addons}
            qty={qty}
            notes={notes}
            onQty={(id, next) => setQty((s) => ({ ...s, [id]: next }))}
            onNote={(id, value) => setNotes((s) => ({ ...s, [id]: value }))}
          />
        )}
      </div>
    </div>
  );
}

function SortableAddonCard({
  addon,
  index,
  scope,
  categoryName,
  onEdit,
  onToggle,
  onRemove,
}: {
  addon: Addon;
  index: number;
  scope: string;
  categoryName: Record<string, string>;
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
  } = useSortable({ id: addon.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const meta = TYPE_META[addon.selectionType];
  const TypeIcon = meta.icon;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "overflow-hidden rounded-2xl border border-[#E8E2DE] bg-white shadow-[0_4px_20px_rgba(51,37,34,0.04)] transition hover:border-[#CED0D4] hover:shadow-[0_8px_28px_rgba(51,37,34,0.08)]",
        isDragging && "relative z-20 ring-2 ring-[#483129]/20",
        !addon.active && "opacity-80",
      )}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          className="flex w-10 shrink-0 touch-none items-center justify-center border-r border-[#E8E2DE] bg-[#FAFAFA] text-[#B0AAA6] hover:bg-[#F0F2F5] hover:text-[#483129]"
          aria-label={`Arrastar ${addon.name}`}
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
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#F3EEE8] to-[#E8E2DE] ring-1 ring-[#E8E2DE] transition hover:scale-[1.02]"
            >
              {addon.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={addon.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <Gift className="h-7 w-7 text-[#B0AAA6]" aria-hidden />
                </span>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onEdit}
                  className="truncate text-left text-lg font-bold text-[#2D2926] hover:text-[#483129]"
                >
                  {addon.name}
                </button>
                <span className="rounded-full bg-[#483129] px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">
                  {formatBRL(addon.priceCents)}
                </span>
                <span className="rounded-full bg-[#F0F2F5] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#8C8682]">
                  #{index + 1}
                </span>
              </div>
              {addon.description ? (
                <p className="mt-1 line-clamp-2 text-sm text-[#8C8682]">
                  {addon.description}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                <StatusChip
                  tone={addon.active ? "success" : "neutral"}
                  label={addon.active ? "Ativo" : "Oculto"}
                />
                {addon.suggestInCart && (
                  <StatusChip tone="info" label="Sacola" />
                )}
                {!addon.imageUrl && (
                  <StatusChip tone="warning" label="Sem foto" />
                )}
              </div>
            </div>

            <RowActionsMenu
              label={`Ações de ${addon.name}`}
              items={[
                { label: "Editar", icon: Pencil, onClick: onEdit },
                {
                  label: addon.active ? "Ocultar" : "Ativar",
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

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SpecBlock title="Escolha na vitrine" icon={TypeIcon}>
              <p className="text-sm font-semibold text-[#2D2926]">
                {meta.label}
              </p>
              {addon.selectionType === AddonSelectionType.QTY && (
                <p className="mt-0.5 text-xs text-[#8C8682]">
                  Até {addon.maxQty} unidades
                </p>
              )}
              {addon.selectionType === AddonSelectionType.TEXT &&
                addon.noteLabel && (
                  <p className="mt-0.5 text-xs text-[#8C8682]">
                    Campo: {addon.noteLabel}
                    {addon.noteRequired ? " · obrigatório" : ""}
                  </p>
                )}
            </SpecBlock>

            <SpecBlock title="Disponível em" icon={Tags}>
              <p className="text-sm font-medium text-[#2D2926]">{scope}</p>
              {addon.categoryIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {addon.categoryIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-[#F0F2F5] px-1.5 py-0.5 text-[10px] font-semibold text-[#65676B]"
                    >
                      {categoryName[id] || "…"}
                    </span>
                  ))}
                </div>
              )}
            </SpecBlock>

            <SpecBlock title="Vitrine" icon={ImageIcon}>
              <div className="rounded-xl border border-cocoa/10 bg-sand/40 px-2.5 py-2">
                <div className="flex items-center gap-2">
                  {addon.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={addon.imageUrl}
                      alt=""
                      className="h-9 w-9 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm">
                      🎁
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-cocoa">
                      {addon.name}
                    </p>
                    <p className="text-[10px] text-cocoa-soft">
                      + {formatBRL(addon.priceCents)}
                    </p>
                  </div>
                </div>
              </div>
            </SpecBlock>
          </div>
        </div>
      </div>
    </li>
  );
}

function WizardProgress({ step, total }: { step: number; total: number }) {
  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Etapa ${step + 1} de ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            i <= step ? "bg-[#483129]" : "bg-[#E8E2DE]",
          )}
        />
      ))}
    </div>
  );
}

function AddonWizardSummary({
  form,
  categoryName,
}: {
  form: typeof emptyForm;
  categoryName: Record<string, string>;
}) {
  const priceCents = parsePriceCents(form.price || "0");
  const scope =
    form.categoryIds.length === 0
      ? "Todo o cardápio"
      : form.categoryIds.map((id) => categoryName[id] || "…").join(", ");

  return (
    <div className="rounded-xl bg-[#FBF7F2] px-3.5 py-3 text-xs text-[#5C5652]">
      <p className="font-bold text-[#2D2926]">
        {form.name.trim() || "Adicional"} ·{" "}
        {Number.isFinite(priceCents) ? formatBRL(priceCents) : "—"}
      </p>
      <p className="mt-1">
        {TYPE_META[form.selectionType].label} · {scope}
      </p>
      <p className="mt-0.5">
        {form.active ? "Ativo" : "Oculto"}
        {form.suggestInCart ? " · Sacola" : ""}
      </p>
    </div>
  );
}

function SpecBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Gift;
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
