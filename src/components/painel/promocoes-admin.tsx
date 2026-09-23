"use client";

import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Calendar,
  Percent,
  Pause,
  Play,
  Plus,
  Sparkles,
  Store,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";
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
  StatTile,
  StatusDot,
} from "@/components/painel/page-header";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
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

function generateCouponCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `KIT${suffix}`;
}

function discountLabel(p: Promotion) {
  if (p.type === "PERCENT") return `${p.percentOff}% OFF`;
  if (p.type === "FIXED")
    return `R$ ${((p.amountOffCents || 0) / 100).toFixed(2).replace(".", ",")} OFF`;
  return "Desconto em produtos";
}

function formatDateRange(p: Promotion) {
  if (!p.startsAt && !p.endsAt) return null;
  const start = p.startsAt ? format(new Date(p.startsAt), "dd/MM") : "…";
  const end = p.endsAt ? format(new Date(p.endsAt), "dd/MM") : "…";
  return `${start} - ${end}`;
}

function formatUsage(p: Promotion) {
  if (p.usageLimit != null && p.usageLimit > 0) {
    return `${p.usageCount}/${p.usageLimit} usos`;
  }
  if (p.usageCount > 0) return `${p.usageCount} usos`;
  return null;
}

function promoMetaLine(p: Promotion) {
  return [
    discountLabel(p),
    p.code ? `Código ${p.code}` : null,
    formatDateRange(p),
    formatUsage(p),
  ]
    .filter(Boolean)
    .join(" · ");
}

export function PromocoesAdmin({
  initialItems = [],
  storeSlug,
  origin,
}: {
  initialItems?: Promotion[];
  storeSlug?: string;
  origin?: string;
}) {
  const [items, setItems] = useState<Promotion[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>("PERCENT");
  const [code, setCode] = useState("");
  const [activeOnCreate, setActiveOnCreate] = useState(true);
  const { toast } = useToast();

  const vitrineUrl =
    storeSlug && origin
      ? `${origin.replace(/\/$/, "")}/${storeSlug}`
      : storeSlug
        ? `/${storeSlug}`
        : null;

  const stats = useMemo(() => {
    const active = items.filter((p) => p.active).length;
    const withCode = items.filter((p) => p.code?.trim()).length;
    const totalUses = items.reduce((n, p) => n + (p.usageCount ?? 0), 0);
    return { total: items.length, active, withCode, totalUses };
  }, [items]);

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
    setActiveOnCreate(true);
  }

  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      toast({
        title: "Informe o código do cupom",
        description: "Na vitrine, o cliente usa esse código no checkout.",
        tone: "error",
      });
      return;
    }
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        code: trimmedCode,
        type: discountType,
        percentOff: discountType === "PERCENT" ? Number(fd.get("value")) : null,
        amountOffCents:
          discountType === "FIXED"
            ? Math.round(Number(String(fd.get("value")).replace(",", ".")) * 100)
            : null,
        startsAt: String(fd.get("startsAt") || "") || null,
        endsAt: String(fd.get("endsAt") || "") || null,
        usageLimit: Number(fd.get("usageLimit") || 0) || null,
        active: activeOnCreate,
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

  function openCreate() {
    resetForm();
    setCode(generateCouponCode());
    setOpen(true);
  }

  return (
    <PageShell>
      <PageHeader
        title="Promoções"
        description="Cupons, descontos e campanhas para a vitrine."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {vitrineUrl ? (
              <PageAction href={vitrineUrl} variant="secondary">
                <Store className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Ver vitrine</span>
                <span className="sm:hidden">Vitrine</span>
              </PageAction>
            ) : null}
            <PageAction onClick={openCreate}>
              <Plus className="h-4 w-4 shrink-0" />
              Nova promoção
            </PageAction>
          </div>
        }
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Promoções"
          value={stats.total}
          hint={`${stats.active} ativas agora`}
        />
        <StatTile
          label="Com cupom"
          value={stats.withCode}
          hint="Usáveis no checkout da vitrine"
        />
        <StatTile
          label="Usos totais"
          value={stats.totalUses}
          hint="Pedidos que aplicaram cupom"
        />
        <StatTile
          label="Na vitrine"
          value={stats.active}
          hint="Cupons ativos para o cliente"
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
            title="Nova promoção"
            description="O cliente aplica o cupom ao finalizar o pedido no checkout da vitrine."
          />
          <SheetForm onSubmit={create}>
            <SheetBody className="space-y-6">
              <VitrineCheckoutPreview code={code.trim() || "KIT10"} />

              <FormSection
                icon={Sparkles}
                title="Campanha"
                hint="Nome interno e código que o cliente digita no checkout."
              >
                <div>
                  <label className="label" htmlFor="promo-name">
                    Nome da promoção
                  </label>
                  <input
                    id="promo-name"
                    name="name"
                    className="input"
                    required
                    placeholder="10% OFF em kits de aniversário"
                    autoFocus
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <label className="label mb-0" htmlFor="promo-code">
                      Código do cupom
                    </label>
                    <button
                      type="button"
                      onClick={() => setCode(generateCouponCode())}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#483129] transition hover:text-[#5E4335]"
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
                    className="input font-mono uppercase tracking-wide"
                    placeholder="KIT10"
                    required
                  />
                </div>
              </FormSection>

              <FormSection
                icon={Percent}
                title="Desconto"
                hint="Porcentagem ou valor fixo no subtotal elegível do pedido."
              >
                <div>
                  <span className="label">Tipo de desconto</span>
                  <div
                    role="group"
                    aria-label="Tipo de desconto"
                    className="flex h-10 overflow-hidden rounded-lg border border-[#CED0D4] bg-white p-0.5"
                  >
                    {(
                      [
                        { value: "PERCENT", label: "Porcentagem (%)" },
                        { value: "FIXED", label: "Valor fixo (R$)" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDiscountType(opt.value)}
                        className={cn(
                          "flex-1 rounded-md px-2 text-xs font-semibold transition sm:text-[13px]",
                          discountType === opt.value
                            ? "bg-[#483129] text-white shadow-sm"
                            : "text-[#8C8682] hover:bg-[#F0F2F5] hover:text-[#2D2926]",
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="promo-value">
                      Valor do desconto
                    </label>
                    <div className="relative">
                      <input
                        id="promo-value"
                        name="value"
                        className={cn("input pr-9")}
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
                    <label className="label" htmlFor="promo-limit">
                      Limite de usos
                    </label>
                    <input
                      id="promo-limit"
                      name="usageLimit"
                      className="input"
                      placeholder="Ilimitado"
                      inputMode="numeric"
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection
                icon={Calendar}
                title="Período"
                hint="Fora do intervalo, o cupom não aceita no checkout."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="promo-starts">
                      Data de início
                    </label>
                    <div className="relative">
                      <input
                        id="promo-starts"
                        name="startsAt"
                        type="date"
                        className={cn(
                          "input pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                        )}
                      />
                      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C8682]" />
                    </div>
                  </div>
                  <div>
                    <label className="label" htmlFor="promo-ends">
                      Data de término
                    </label>
                    <div className="relative">
                      <input
                        id="promo-ends"
                        name="endsAt"
                        type="date"
                        className={cn(
                          "input pr-10 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0",
                        )}
                      />
                      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C8682]" />
                    </div>
                  </div>
                </div>
              </FormSection>

              <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E8E2DE] bg-gradient-to-br from-[#FBF7F2] to-white px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2D2926]">
                    Cupom ativo
                  </p>
                  <p className="mt-0.5 text-xs text-[#8C8682]">
                    Pausado, o cliente não consegue aplicar na vitrine.
                  </p>
                </div>
                <Switch
                  id="promo-active"
                  checked={activeOnCreate}
                  onCheckedChange={setActiveOnCreate}
                />
              </div>
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary disabled={saving}>
                {saving ? "Salvando…" : "Criar promoção"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div className="h-40 animate-pulse rounded-2xl bg-white" />
          <div className="hidden h-40 animate-pulse rounded-2xl bg-white lg:block" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="Nenhuma promoção"
          description="Crie cupons e campanhas para impulsionar pedidos na vitrine."
          action={{ label: "Nova promoção", onClick: openCreate }}
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_280px] lg:items-start">
          <ul className="space-y-3">
            {items.map((p) => (
              <li
                key={p.id}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-2xl border border-[#E8E2DE] bg-white px-5 py-4 shadow-[0_4px_20px_rgba(51,37,34,0.04)] transition hover:border-[#CED0D4] hover:shadow-[0_8px_28px_rgba(51,37,34,0.08)]",
                  !p.active && "opacity-85",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-base font-bold text-[#2D2926]">
                    {p.name}
                  </p>
                  <p className="mt-1 text-sm text-[#8C8682]">{promoMetaLine(p)}</p>
                  <div className="mt-2.5">
                    <StatusDot
                      tone={p.active ? "success" : "neutral"}
                      label={p.active ? "Ativa" : "Pausada"}
                    />
                  </div>
                </div>
                <RowActionsMenu
                  label={`Ações de ${p.name}`}
                  items={[
                    {
                      label: p.active ? "Pausar" : "Ativar",
                      icon: p.active ? Pause : Play,
                      onClick: () => toggle(p.id, !p.active),
                    },
                  ]}
                />
              </li>
            ))}
          </ul>

          <aside className="hidden lg:block lg:sticky lg:top-24">
            <VitrinePromoSidebar items={items} />
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[#8C8682]">
              Cupons válidos aparecem no checkout da vitrine, no passo do carrinho.
            </p>
          </aside>
        </div>
      )}
    </PageShell>
  );
}

function FormSection({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: typeof Sparkles;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E8E2DE] bg-[#FAFAFA] p-4">
      <div className="mb-3 flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#483129] shadow-sm ring-1 ring-[#E8E2DE]">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-bold text-[#2D2926]">{title}</h3>
          <p className="text-xs text-[#8C8682]">{hint}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function VitrineCheckoutPreview({ code }: { code: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E2DE] bg-white shadow-[0_8px_28px_rgba(51,37,34,0.06)]">
      <div className="border-b border-[#E8E2DE] bg-[#FBF7F2] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#8C8682]">
          Prévia na vitrine
        </p>
        <p className="mt-0.5 text-sm font-semibold text-[#2D2926]">
          Checkout — cupom de desconto
        </p>
      </div>
      <div className="p-4">
        <div className="rounded-xl border border-cocoa/8 bg-sand/40 p-3">
          <p className="label">Cupom de desconto</p>
          <div className="mt-1.5 flex gap-2">
            <div className="input flex flex-1 items-center bg-white font-mono text-sm uppercase tracking-wide text-[#2D2926]">
              {code}
            </div>
            <span className="btn-secondary inline-flex shrink-0 cursor-default items-center px-3 text-sm">
              Aplicar
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitrinePromoSidebar({ items }: { items: Promotion[] }) {
  const activeCodes = items.filter((p) => p.active && p.code?.trim());

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E8E2DE] bg-white shadow-[0_12px_40px_rgba(51,37,34,0.06)]">
      <div className="flex items-center gap-2 border-b border-[#E8E2DE] bg-[#FBF7F2] px-4 py-3">
        <Ticket className="h-4 w-4 text-[#483129]" aria-hidden />
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#8C8682]">
            Checkout da vitrine
          </p>
          <p className="text-sm font-semibold text-[#2D2926]">
            {activeCodes.length} cupom{activeCodes.length === 1 ? "" : "s"} ativo
            {activeCodes.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <div className="space-y-2 p-4">
        {activeCodes.length === 0 ? (
          <p className="text-xs leading-relaxed text-[#8C8682]">
            Nenhum cupom ativo. Pausados ou sem código não aparecem para o cliente.
          </p>
        ) : (
          activeCodes.slice(0, 5).map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-[#FAFAFA] px-3 py-2 ring-1 ring-[#E8E2DE]"
            >
              <span className="truncate text-xs font-medium text-[#2D2926]">
                {p.name}
              </span>
              <span className="shrink-0 font-mono text-xs font-bold uppercase text-[#483129]">
                {p.code}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
