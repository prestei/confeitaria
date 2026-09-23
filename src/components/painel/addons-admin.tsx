"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Gift, Plus, Trash2 } from "lucide-react";
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
import { ImageField } from "@/components/painel/image-field";
import {
  PageAction,
  PageHeader,
  PageShell,
} from "@/components/painel/page-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";
import { AddonSelectionType } from "@/lib/enums";

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
};

const fieldLabel = "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";

const TYPE_LABEL: Record<SelectionType, string> = {
  TOGGLE: "Sim / não",
  QTY: "Quantidade",
  TEXT: "Com detalhe",
};

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
};

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
  const { toast } = useToast();

  const categoryName = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories],
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

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(addon: Addon) {
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
    });
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

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const priceCents = Math.round(
      Number(form.price.replace(",", ".").replace(/[^\d.]/g, "")) * 100,
    );
    if (!Number.isFinite(priceCents) || priceCents < 0) {
      setSaving(false);
      toast({ title: "Informe um preço válido", tone: "error" });
      return;
    }
    const body = {
      id: editingId ?? undefined,
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
        description="Velas, topos, bexigas e outros extras. Cadastre uma vez e vincule às categorias."
        actions={
          <PageAction onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo adicional
          </PageAction>
        }
      />

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetForm();
        }}
      >
        <DialogContent size="lg">
          <DialogHeader
            title={editingId ? "Editar adicional" : "Novo adicional"}
            description="Aparece na montagem do produto, com o preço somado na hora."
          />
          <form onSubmit={save}>
            <DialogBody className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={fieldLabel} htmlFor="addon-name">
                  Nome <span className="text-[#C85A5A]">*</span>
                </label>
                <input
                  id="addon-name"
                  className={fieldInput}
                  required
                  minLength={2}
                  placeholder="Ex.: Vela numérica, Balão bubble, Pétalas de rosa"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              <div>
                <label className={fieldLabel} htmlFor="addon-price">
                  Preço (R$)
                </label>
                <input
                  id="addon-price"
                  className={fieldInput}
                  required
                  inputMode="decimal"
                  placeholder="15,00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>

              <div>
                <span className={fieldLabel}>Como o cliente escolhe</span>
                <div
                  role="group"
                  className="flex h-10 overflow-hidden rounded-lg border border-[#CED0D4] bg-white p-0.5"
                >
                  {(
                    [
                      { value: "TOGGLE", label: "Sim/não" },
                      { value: "QTY", label: "Qtde" },
                      { value: "TEXT", label: "Detalhe" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, selectionType: opt.value }))
                      }
                      className={cn(
                        "flex-1 rounded-md px-1 text-[12px] font-semibold transition sm:text-[13px]",
                        form.selectionType === opt.value
                          ? "bg-[#EEF2F7] text-[#2D2926]"
                          : "text-[#8C8682] hover:text-[#2D2926]",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.selectionType === "QTY" && (
                <div>
                  <label className={fieldLabel} htmlFor="addon-max">
                    Quantidade máxima
                  </label>
                  <input
                    id="addon-max"
                    className={fieldInput}
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

              {form.selectionType === "TEXT" && (
                <>
                  <div>
                    <label className={fieldLabel} htmlFor="addon-note">
                      Rótulo do detalhe
                    </label>
                    <input
                      id="addon-note"
                      className={fieldInput}
                      placeholder="Número da vela, tema do topo…"
                      value={form.noteLabel}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, noteLabel: e.target.value }))
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 self-end pb-2 text-sm text-[#5C5652]">
                    <input
                      type="checkbox"
                      checked={form.noteRequired}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, noteRequired: e.target.checked }))
                      }
                    />
                    Detalhe obrigatório
                  </label>
                </>
              )}

              <div className="sm:col-span-2">
                <label className={fieldLabel} htmlFor="addon-desc">
                  Descrição (opcional)
                </label>
                <input
                  id="addon-desc"
                  className={fieldInput}
                  placeholder="Uma linha para despertar o desejo de compra"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <ImageField
                  label="Foto (opcional)"
                  value={form.imageUrl}
                  onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
                  hint="Miniatura na vitrine. JPEG, PNG ou WebP · até 5 MB"
                />
              </div>

              <div className="sm:col-span-2">
                <span className={fieldLabel}>Disponível em</span>
                <p className="mb-2 text-xs text-[#8C8682]">
                  Sem seleção = todos os produtos. Marque categorias para limitar
                  (ex.: velas só em Bolos).
                </p>
                {categories.length === 0 ? (
                  <p className="text-sm text-[#8C8682]">
                    Cadastre categorias para restringir os adicionais.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {categories.map((c) => {
                      const on = form.categoryIds.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCategory(c.id)}
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-semibold transition",
                            on
                              ? "border-[#2D2926] bg-[#2D2926] text-white"
                              : "border-[#CED0D4] bg-white text-[#5C5652] hover:border-[#2D2926]/40",
                          )}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-[#2D2926] sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.suggestInCart}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, suggestInCart: e.target.checked }))
                  }
                />
                Sugerir na sacola no fechamento do pedido
              </label>
            </DialogBody>
            <DialogFooter>
              <DialogCancel />
              <DialogPrimary disabled={saving}>
                {saving ? "Salvando…" : editingId ? "Salvar" : "Criar adicional"}
              </DialogPrimary>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="h-40 animate-pulse rounded-lg bg-white" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nenhum adicional"
          description="Cadastre velas, topos, bexigas e outros extras para aumentar o ticket na mesma encomenda."
          action={{ label: "Novo adicional", onClick: openCreate }}
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#E8E2DE] bg-white">
          <ul className="divide-y divide-[#F0EBE6]">
            {items.map((addon) => (
              <li
                key={addon.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E8E2DE] bg-[#F7F5F3]">
                  {addon.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={addon.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Gift className="h-5 w-5 text-[#B0AAA6]" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#2D2926]">
                    {addon.name}
                    <span className="ml-2 font-medium text-[#8C8682]">
                      {formatBRL(addon.priceCents)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#8C8682]">
                    {TYPE_LABEL[addon.selectionType]}
                    {addon.selectionType === "QTY" ? ` · até ${addon.maxQty}` : ""}
                    {" · "}
                    {scopeLabel(addon)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(addon.id, !addon.active)}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                      addon.active
                        ? "bg-emerald-50 text-success"
                        : "bg-[#F0F2F5] text-[#8C8682]",
                    )}
                  >
                    {addon.active ? "Ativo" : "Oculto"}
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-[#CED0D4] bg-white px-3 py-1.5 text-xs font-semibold text-[#2D2926] hover:bg-[#F0F2F5]"
                    onClick={() => openEdit(addon)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-[#8C8682] hover:bg-[#F0F2F5] hover:text-[#C85A5A]"
                    aria-label={`Excluir ${addon.name}`}
                    onClick={() => remove(addon.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </PageShell>
  );
}
