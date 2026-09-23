"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Plus,
  Search,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";
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
import {
  CustomersTable,
  type CustomerRow,
} from "@/components/painel/customers-table";
import { useToast } from "@/components/ui/toast";
import { buttonClassName } from "@/components/ui/button-styles";
import { formatBRL } from "@/lib/utils";

export type CustomersAdminStats = {
  total: number;
  registered: number;
  vitrineOnly: number;
  repeat: number;
  orderCount: number;
  revenueCents: number;
};

type FilterId = "all" | "registered" | "vitrine" | "repeat";

const fieldLabel =
  "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";
const fieldTextarea =
  "min-h-24 w-full rounded-lg border border-[#CED0D4] bg-white px-3 py-2.5 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";

export function CustomersAdmin({
  rows,
  stats,
  storeSlug,
  origin,
}: {
  rows: CustomerRow[];
  stats: CustomersAdminStats;
  storeSlug: string;
  origin: string;
}) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const vitrineUrl = `${origin.replace(/\/$/, "")}/${storeSlug}`;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "registered" && r.source !== "registered") return false;
      if (filter === "vitrine" && r.source !== "vitrine") return false;
      if (filter === "repeat" && r.orders < 2) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        r.phone.includes(needle.replace(/\D/g, "")) ||
        (r.email?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [rows, q, filter]);

  const filters: { id: FilterId; label: string }[] = [
    { id: "all", label: `Todos (${stats.total})` },
    { id: "registered", label: `Cadastrados (${stats.registered})` },
    { id: "vitrine", label: `Só vitrine (${stats.vitrineOnly})` },
    { id: "repeat", label: `Recorrentes (${stats.repeat})` },
  ];

  async function createCustomer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        phone: String(fd.get("phone")),
        email: String(fd.get("email") || ""),
        notes: String(fd.get("notes") || ""),
        referenceNote: String(fd.get("referenceNote") || ""),
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast({
        title: data.error || "Não foi possível cadastrar",
        tone: "error",
      });
      return;
    }
    const customer = await res.json();
    toast({ title: "Cliente cadastrado", tone: "success" });
    setOpen(false);
    window.location.href = `/painel/clientes/${customer.id}`;
  }

  return (
    <PageShell>
      <PageHeader
        title="Clientes"
        description="Quem pediu na vitrine e quem você cadastrou — com os mesmos dados do checkout."
        actions={
          <>
            <Link
              href={vitrineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClassName({ variant: "secondary" })}
            >
              <Store className="h-4 w-4" />
              Ver vitrine
            </Link>
            <PageAction
              onClick={() => setOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Novo cliente
            </PageAction>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-cocoa/8 bg-gradient-to-br from-white via-white to-fog/40 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cocoa text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-cocoa">
              Dados iguais ao checkout da vitrine
            </p>
            <p className="mt-0.5 text-sm leading-snug text-cocoa-soft/70">
              Nome, WhatsApp, e-mail, observações e referência — como no passo
              &quot;Dados pessoais&quot; do pedido online.
            </p>
          </div>
        </div>
        <Link
          href={vitrineUrl}
          target="_blank"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-berry hover:underline"
        >
          Abrir cardápio
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Contatos"
          value={stats.total}
          hint={`${stats.registered} no CRM · ${stats.vitrineOnly} só pela vitrine`}
        />
        <StatTile
          label="Pedidos"
          value={stats.orderCount}
          hint="Todos os status, exceto cancelados"
        />
        <StatTile
          label="Valor total"
          value={formatBRL(stats.revenueCents)}
          hint="Pedidos com valor confirmado"
        />
        <StatTile
          label="Recorrentes"
          value={stats.repeat}
          hint="2 ou mais pedidos"
        />
      </div>

      {rows.length > 0 ? (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-[#E8E2DE] bg-white p-3 sm:flex-row sm:items-center sm:p-3.5">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0AAA6]" />
              <input
                className="input h-9 w-full max-w-md !py-0 pl-9 text-sm"
                placeholder="Buscar por nome, WhatsApp ou e-mail…"
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

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#E8E2DE] bg-white px-4 py-8 text-center text-sm text-[#8C8682]">
              Nenhum cliente encontrado com esse filtro.
            </p>
          ) : (
            <CustomersTable rows={filtered} />
          )}
        </>
      ) : (
        <EmptyState
          icon={Users}
          title="Nenhum cliente ainda"
          description="Compartilhe a vitrine ou cadastre um contato manualmente."
          action={{ label: "Novo cliente", href: "/painel/clientes/novo" }}
        />
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="md">
          <SheetHeader
            title="Novo cliente"
            description="Mesmos campos que o cliente preenche ao pedir na vitrine."
          />
          <SheetForm onSubmit={createCustomer}>
            <SheetBody className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={fieldLabel} htmlFor="cust-name">
                  Nome <span className="text-[#C85A5A]">*</span>
                </label>
                <input
                  id="cust-name"
                  name="name"
                  className={fieldInput}
                  required
                  placeholder="Como devemos chamar"
                  autoFocus
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="cust-phone">
                  WhatsApp <span className="text-[#C85A5A]">*</span>
                </label>
                <input
                  id="cust-phone"
                  name="phone"
                  className={fieldInput}
                  required
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className={fieldLabel} htmlFor="cust-email">
                  E-mail (opcional)
                </label>
                <input
                  id="cust-email"
                  name="email"
                  type="email"
                  className={fieldInput}
                  placeholder="ana@email.com"
                />
                <p className="mt-1.5 text-[11px] text-[#8C8682]">
                  Obrigatório na vitrine só para pagamento online.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className={fieldLabel} htmlFor="cust-notes">
                  Observações
                </label>
                <textarea
                  id="cust-notes"
                  name="notes"
                  className={fieldTextarea}
                  placeholder="Alergias, detalhes do tema, preferências…"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={fieldLabel} htmlFor="cust-ref">
                  Referência (opcional)
                </label>
                <input
                  id="cust-ref"
                  name="referenceNote"
                  className={fieldInput}
                  placeholder="Link ou descrição de referência"
                />
              </div>
            </SheetBody>
            <SheetFooter>
              <SheetCancel type="button" onClick={() => setOpen(false)}>
                Cancelar
              </SheetCancel>
              <SheetPrimary type="submit" disabled={saving}>
                {saving ? "Salvando…" : "Cadastrar cliente"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
