"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Warehouse } from "lucide-react";
import { format } from "date-fns";
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
import {
  PageAction,
  PageHeader,
  PageShell,
  StatusDot,
} from "@/components/painel/page-header";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
} from "@/components/painel/data-table";
import { useToast } from "@/components/ui/toast";

type Product = {
  id: string;
  name: string;
  stockQty: number;
  stockMin: number;
  unit: string;
  trackStock: boolean;
  availability: string;
};

type Movement = {
  id: string;
  type: "IN" | "OUT" | "ADJUST";
  quantity: number;
  note: string | null;
  createdAt: string;
  product: { name: string };
};

export function EstoqueAdmin({
  initialProducts = [],
  initialMovements = [],
}: {
  initialProducts?: Product[];
  initialMovements?: Movement[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [movements, setMovements] = useState<Movement[]>(initialMovements);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState(initialProducts[0]?.id || "");
  const [type, setType] = useState<"IN" | "OUT" | "ADJUST">("IN");
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  async function load() {
    const res = await fetch("/api/stock");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setMovements(data.movements);
      if (!productId && data.products[0]) setProductId(data.products[0].id);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (initialProducts.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onMove(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        type,
        quantity: Number(qty),
        note,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Não foi possível registrar", tone: "error" });
      return;
    }
    toast({ title: "Movimentação registrada", tone: "success" });
    setNote("");
    setQty("1");
    setOpen(false);
    load();
  }

  function statusOf(p: Product) {
    if (!p.trackStock) return { tone: "neutral" as const, label: "Sem controle" };
    if (p.stockQty <= 0) return { tone: "danger" as const, label: "Esgotado" };
    if (p.stockQty <= p.stockMin)
      return { tone: "warning" as const, label: "Estoque baixo" };
    return { tone: "success" as const, label: "Disponível" };
  }

  return (
    <PageShell>
      <PageHeader
        title="Estoque"
        description="Controle simples de entradas, saídas e ajustes. Zero estoque marca o produto como esgotado na vitrine."
        actions={
          products.length > 0 ? (
            <PageAction onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Nova movimentação
            </PageAction>
          ) : undefined
        }
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="md">
          <SheetHeader
            title="Nova movimentação"
            description="Registre entrada, saída ou ajuste manual."
          />
          <SheetForm onSubmit={onMove}>
            <SheetBody className="space-y-4">
              <div>
                <label className="label">Produto</label>
                <select
                  className="input"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    className="input"
                    value={type}
                    onChange={(e) => setType(e.target.value as typeof type)}
                  >
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saída</option>
                    <option value="ADJUST">Ajuste manual</option>
                  </select>
                </div>
                <div>
                  <label className="label">Quantidade</label>
                  <input
                    className="input"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="label">Observação</label>
                <input
                  className="input"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary disabled={saving}>
                {saving ? "Registrando…" : "Registrar"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white" />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Warehouse}
          title="Estoque vazio"
          description="Ative o controle de estoque nos produtos para começar."
          action={{ label: "Ver produtos", href: "/painel/produtos" }}
        />
      ) : (
        <>
          <DataTable>
            <DataTableHeader>
              <tr>
                <DataTableHead>Produto</DataTableHead>
                <DataTableHead>Qtd. atual</DataTableHead>
                <DataTableHead>Mínimo</DataTableHead>
                <DataTableHead>Status</DataTableHead>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {products.map((p) => {
                const s = statusOf(p);
                return (
                  <DataTableRow key={p.id}>
                    <DataTableCell className="font-semibold text-[#2D2926]">
                      {p.name}
                    </DataTableCell>
                    <DataTableCell className="tabular-nums text-[#2D2926]">
                      {p.stockQty} {p.unit}
                    </DataTableCell>
                    <DataTableCell className="tabular-nums text-[#8C8682]">
                      {p.stockMin}
                    </DataTableCell>
                    <DataTableCell>
                      <StatusDot tone={s.tone} label={s.label} />
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>

          <div className="overflow-hidden rounded-2xl border border-[#E8E2DE] bg-white shadow-[0_1px_2px_rgba(45,41,38,0.04)]">
            <div className="border-b border-[#E8E2DE] bg-[#FBF7F2] px-4 py-3.5">
              <h2 className="text-sm font-semibold text-[#2D2926]">
                Histórico de movimentações
              </h2>
            </div>
            {movements.length === 0 ? (
              <p className="px-4 py-6 text-sm text-[#8C8682]">
                Nenhuma movimentação ainda.
              </p>
            ) : (
              <ul className="divide-y divide-[#F0EBE7]">
                {movements.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3.5 text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[#2D2926]">
                        {m.product.name}
                      </p>
                      <p className="text-xs text-[#8C8682]">
                        {format(new Date(m.createdAt), "dd/MM/yyyy HH:mm")}
                        {m.note ? ` · ${m.note}` : ""}
                      </p>
                    </div>
                    <span className="font-semibold tabular-nums text-[#2D2926]">
                      {m.type === "IN" ? "+" : m.type === "OUT" ? "−" : "="}
                      {m.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
