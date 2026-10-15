"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, Wheat } from "lucide-react";
import { PageAction, PageHeader, PageShell } from "@/components/painel/page-header";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { ColumnsTable } from "@/components/painel/data-table";
import { EmptyState } from "@/components/ui/empty-state";
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
import { useToast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/utils";

type Item = {
  id: string;
  name: string;
  unit: string;
  unitCostCents: number | null;
};

type Draft = {
  id?: string;
  name: string;
  unit: string;
  cost: string;
};

const emptyDraft = (): Draft => ({
  name: "",
  unit: "un",
  cost: "",
});

function reaisToCents(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function centsToReais(cents: number | null) {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function InsumosCadastro({ initialItems }: { initialItems: Item[] }) {
  const { toast } = useToast();
  const [items, setItems] = useState(
    initialItems.map(({ id, name, unit, unitCostCents }) => ({
      id,
      name,
      unit,
      unitCostCents,
    })),
  );
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = Boolean(draft.id);

  useEffect(() => {
    if (!open) setError("");
  }, [open]);

  function openCreate() {
    setDraft(emptyDraft());
    setError("");
    setOpen(true);
  }

  function openEdit(item: Item) {
    setDraft({
      id: item.id,
      name: item.name,
      unit: item.unit,
      cost: centsToReais(item.unitCostCents),
    });
    setError("");
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: draft.name.trim(),
      unit: draft.unit.trim() || "un",
      unitCostCents: reaisToCents(draft.cost),
    };
    const res = await fetch(
      editing ? `/api/stock-items/${draft.id}` : "/api/stock-items",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error || "Não foi possível salvar o insumo");
      return;
    }
    const saved = data as Item & { quantity?: number; minQuantity?: number };
    const row: Item = {
      id: saved.id,
      name: saved.name,
      unit: saved.unit,
      unitCostCents: saved.unitCostCents,
    };
    setItems((prev) =>
      (editing ? prev.map((item) => (item.id === row.id ? row : item)) : [...prev, row]).sort(
        (a, b) => a.name.localeCompare(b.name, "pt-BR"),
      ),
    );
    setOpen(false);
    toast({
      title: editing ? "Insumo atualizado" : "Insumo cadastrado",
      tone: "success",
    });
  }

  async function remove(item: Item) {
    if (!window.confirm(`Excluir ${item.name}?`)) return;
    const res = await fetch(`/api/stock-items/${item.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: data.error || "Não foi possível excluir o insumo",
        tone: "error",
      });
      return;
    }
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    toast({ title: "Insumo excluído", tone: "success" });
  }

  return (
    <PageShell>
      <PageHeader
        title="Insumos"
        description="Cadastre ingredientes e o preço de compra para calcular o custo dos produtos. Insumos não têm controle de estoque — use Estoque nos produtos prontos."
        actions={
          <PageAction onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Novo insumo
          </PageAction>
        }
      />

      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!saving) setOpen(next);
        }}
      >
        <SheetContent size="md">
          <SheetHeader title={editing ? "Editar insumo" : "Novo insumo"} />
          <SheetForm onSubmit={(e) => void onSubmit(e)}>
            <SheetBody className="space-y-4">
              <div>
                <label className="label" htmlFor="insumo-name">
                  Nome
                </label>
                <input
                  id="insumo-name"
                  className="input"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Farinha, ovos, chocolate…"
                  required
                  autoFocus
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="label" htmlFor="insumo-unit">
                    Unidade
                  </label>
                  <input
                    id="insumo-unit"
                    className="input"
                    value={draft.unit}
                    onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                    placeholder="kg, g, un, L"
                  />
                </div>
                <div>
                  <label className="label" htmlFor="insumo-cost">
                    Preço de compra (R$)
                  </label>
                  <input
                    id="insumo-cost"
                    className="input"
                    inputMode="decimal"
                    value={draft.cost}
                    onChange={(e) => setDraft((d) => ({ ...d, cost: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-berry-deep">{error}</p>}
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary disabled={saving || draft.name.trim().length < 2}>
                {saving ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar insumo"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

      {items.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="Nenhum insumo"
          description="Cadastre farinha, ovos, chocolate e o preço de compra de cada um para montar a receita do produto."
          action={{ label: "Novo insumo", onClick: openCreate }}
        />
      ) : (
        <ColumnsTable
          minWidth="520px"
          rows={items}
          rowKey={(item) => item.id}
          columns={[
            {
              id: "name",
              header: "Insumo",
              tone: "strong",
              render: (item) => item.name,
            },
            {
              id: "unit",
              header: "Unidade",
              tone: "soft",
              render: (item) => item.unit,
            },
            {
              id: "cost",
              header: "Preço de compra",
              align: "right",
              tone: "body",
              numeric: true,
              render: (item) =>
                item.unitCostCents != null ? formatBRL(item.unitCostCents) : "—",
            },
            {
              id: "actions",
              header: "Ações",
              align: "center",
              headerClassName: "w-14",
              render: (item) => (
                <RowActionsMenu
                  label={`Ações de ${item.name}`}
                  items={[
                    { label: "Editar", icon: Pencil, onClick: () => openEdit(item) },
                    {
                      label: "Excluir",
                      icon: Trash2,
                      tone: "danger",
                      separator: true,
                      onClick: () => void remove(item),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}
    </PageShell>
  );
}
