"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Calendar,
  ChevronDown,
  Percent,
  Plus,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
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
  StatusDot,
} from "@/components/painel/page-header";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type Promotion = {
  id: string;
  name: string;
  code: string | null;
  type: "PERCENT" | "FIXED" | "PRODUCT";
  percentOff: number | null;
  amountOffCents: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
};

type DiscountType = "PERCENT" | "FIXED";

const fieldLabel =
  "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";

function generateCouponCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `KIT${suffix}`;
}

export function PromocoesAdmin({
  initialItems = [],
}: {
  initialItems?: Promotion[];
}) {
  const [items, setItems] = useState<Promotion[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [code, setCode] = useState("");
  const [rulesOpen, setRulesOpen] = useState(false);
  const { toast } = useToast();

  async function load() {
    const res = await fetch("/api/promotions");
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (initialItems.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setDiscountType("PERCENT");
    setCode("");
    setRulesOpen(false);
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        code: code.trim() || null,
        type: discountType,
        percentOff: discountType === "PERCENT" ? Number(fd.get("value")) : null,
        amountOffCents:
          discountType === "FIXED"
            ? Math.round(Number(String(fd.get("value")).replace(",", ".")) * 100)
            : null,
        startsAt: String(fd.get("startsAt") || "") || null,
        endsAt: String(fd.get("endsAt") || "") || null,
        usageLimit: Number(fd.get("usageLimit") || 0) || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Não foi possível criar", tone: "error" });
      return;
    }
    toast({ title: "Promoção criada", tone: "success" });
    setOpen(false);
    resetForm();
    load();
  }

  async function toggle(id: string, active: boolean) {
    await fetch("/api/promotions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    load();
  }

  function label(p: Promotion) {
    if (p.type === "PERCENT") return `${p.percentOff}% OFF`;
    if (p.type === "FIXED")
      return `R$ ${((p.amountOffCents || 0) / 100).toFixed(2)} OFF`;
    return "Produto promocional";
  }

  return (
    <PageShell>
      <PageHeader
        title="Promoções"
        description="Cupons, descontos e campanhas para a vitrine."
        actions={
          <PageAction
            onClick={() => {
              resetForm();
              setOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Nova promoção
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
            title="Nova promoção"
            description="Crie um cupom ou desconto para sua loja."
          />
          <form onSubmit={create}>
            <DialogBody className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={fieldLabel} htmlFor="promo-name">
                  Nome da promoção <span className="text-[#C85A5A]">*</span>
                </label>
                <input
                  id="promo-name"
                  name="name"
                  className={fieldInput}
                  required
                  placeholder="10% OFF em kits de aniversário"
                  autoFocus
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label className="text-[13px] font-semibold text-[#5C5652]" htmlFor="promo-code">
                    Código do cupom
                  </label>
                  <button
                    type="button"
                    onClick={() => setCode(generateCouponCode())}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#C85A5A] transition hover:text-[#B44E4E]"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Gerar
                  </button>
                </div>
                <input
                  id="promo-code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className={fieldInput}
                  placeholder="KIT10"
                />
              </div>

              <div>
                <span className={fieldLabel}>Tipo de desconto</span>
                <div
                  role="group"
                  aria-label="Tipo de desconto"
                  className="flex h-10 overflow-hidden rounded-lg border border-[#CED0D4] bg-white p-0.5"
                >
                  {(
                    [
                      { value: "PERCENT", label: "Porcentagem (%)" },
                      { value: "FIXED", label: "Valor Fixo (R$)" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDiscountType(opt.value)}
                      className={cn(
                        "flex-1 rounded-md px-2 text-[12px] font-semibold transition sm:text-[13px]",
                        discountType === opt.value
                          ? "bg-[#EEF2F7] text-[#2D2926]"
                          : "text-[#8C8682] hover:text-[#2D2926]",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="promo-value">
                  Valor do desconto
                </label>
                <div className="relative">
                  <input
                    id="promo-value"
                    name="value"
                    className={cn(fieldInput, "pr-9")}
                    defaultValue="10"
                    required
                    inputMode="decimal"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-[#8C8682]">
                    {discountType === "PERCENT" ? "%" : "R$"}
                  </span>
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="promo-limit">
                  Limite de usos
                </label>
                <input
                  id="promo-limit"
                  name="usageLimit"
                  className={fieldInput}
                  placeholder="Ilimitado"
                  inputMode="numeric"
                />
              </div>

              <div>
                <label className={fieldLabel} htmlFor="promo-starts">
                  Data de início
                </label>
                <div className="relative">
                  <input
                    id="promo-starts"
                    name="startsAt"
                    type="date"
                    className={cn(
                      fieldInput,
                      "pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                    )}
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C8682]" />
                </div>
              </div>

              <div>
                <label className={fieldLabel} htmlFor="promo-ends">
                  Data de término
                </label>
                <div className="relative">
                  <input
                    id="promo-ends"
                    name="endsAt"
                    type="date"
                    className={cn(
                      fieldInput,
                      "pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                    )}
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C8682]" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setRulesOpen((v) => !v)}
                  className="flex w-full items-center gap-2.5 rounded-lg border border-[#E8E2DE] bg-[#FAFAF9] px-3.5 py-3 text-left transition hover:bg-[#F5F4F2]"
                  aria-expanded={rulesOpen}
                >
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#8C8682]" />
                  <span className="flex-1 text-[13px] font-medium text-[#5C5652]">
                    Regras adicionais (pedido mínimo e canais)
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-[#8C8682] transition",
                      rulesOpen && "rotate-180",
                    )}
                  />
                </button>
                {rulesOpen && (
                  <div className="mt-3 grid gap-4 rounded-lg border border-[#E8E2DE] bg-white p-4 sm:grid-cols-2">
                    <div>
                      <label className={fieldLabel} htmlFor="promo-min">
                        Pedido mínimo (R$)
                      </label>
                      <input
                        id="promo-min"
                        name="minOrder"
                        className={fieldInput}
                        placeholder="0,00"
                        inputMode="decimal"
                        disabled
                        title="Em breve"
                      />
                    </div>
                    <div>
                      <span className={fieldLabel}>Canais</span>
                      <p className="text-[13px] leading-snug text-[#8C8682]">
                        Disponível em breve — aplica a todos os canais por enquanto.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogCancel />
              <DialogPrimary disabled={saving}>
                {saving ? "Salvando…" : "Criar promoção"}
              </DialogPrimary>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="h-32 animate-pulse rounded-2xl bg-white" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nenhuma promoção"
          description="Crie cupons e campanhas para impulsionar pedidos na vitrine."
          action={{ label: "Nova promoção", onClick: () => setOpen(true) }}
        />
      ) : (
        <ul className="divide-y divide-[#E8E2DE] overflow-hidden rounded-lg border border-[#E8E2DE] bg-white">
          {items.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <p className="font-medium text-[#2D2926]">{p.name}</p>
                <p className="mt-1 text-xs text-[#8C8682]">
                  {label(p)}
                  {p.code ? ` · Código ${p.code}` : ""}
                  {p.startsAt || p.endsAt
                    ? ` · ${p.startsAt ? format(new Date(p.startsAt), "dd/MM") : "…"} – ${p.endsAt ? format(new Date(p.endsAt), "dd/MM") : "…"}`
                    : ""}
                  {p.usageLimit != null
                    ? ` · ${p.usageCount}/${p.usageLimit} usos`
                    : ""}
                </p>
                <div className="mt-2">
                  <StatusDot
                    tone={p.active ? "success" : "neutral"}
                    label={p.active ? "Ativa" : "Pausada"}
                  />
                </div>
              </div>
              <PageAction
                variant="secondary"
                onClick={() => toggle(p.id, !p.active)}
              >
                {p.active ? "Pausar" : "Ativar"}
              </PageAction>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
