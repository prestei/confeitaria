"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  Truck,
  UserRound,
} from "lucide-react";
import { SectionCard } from "@/components/painel/page-header";
import { Field, Input, Label } from "@/components/ui/input";
import { ImageField } from "@/components/painel/image-field";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

async function patchStore(payload: Record<string, unknown>) {
  return fetch("/api/store", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function FormFooter({
  saving,
  label,
  disabled,
}: {
  saving: boolean;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-[var(--painel-border)] px-5 py-3.5">
      <button
        type="submit"
        className="btn-primary !py-2 text-sm"
        disabled={saving || disabled}
      >
        {saving ? "Salvando..." : label}
      </button>
    </div>
  );
}

function ToggleRow({
  id,
  checked,
  onCheckedChange,
  title,
  description,
  icon: Icon,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5] text-[#5C5652]">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-cocoa">{title}</p>
          {description ? (
            <p className="text-xs leading-relaxed text-[#8C8682]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

const DAY_KEYS = [
  { key: "seg", label: "Segunda", short: "Seg" },
  { key: "ter", label: "Terça", short: "Ter" },
  { key: "qua", label: "Quarta", short: "Qua" },
  { key: "qui", label: "Quinta", short: "Qui" },
  { key: "sex", label: "Sexta", short: "Sex" },
  { key: "sab", label: "Sábado", short: "Sáb" },
  { key: "dom", label: "Domingo", short: "Dom" },
] as const;

type DayKey = (typeof DAY_KEYS)[number]["key"];

type DaySchedule = {
  open: boolean;
  start: string;
  end: string;
};

type WeekSchedule = Record<DayKey, DaySchedule>;

const DEFAULT_DAY: DaySchedule = { open: true, start: "09:00", end: "18:00" };

function defaultWeek(): WeekSchedule {
  return {
    seg: { ...DEFAULT_DAY },
    ter: { ...DEFAULT_DAY },
    qua: { ...DEFAULT_DAY },
    qui: { ...DEFAULT_DAY },
    sex: { ...DEFAULT_DAY },
    sab: { open: true, start: "09:00", end: "13:00" },
    dom: { open: false, start: "09:00", end: "18:00" },
  };
}

function formatWeek(week: WeekSchedule): string {
  return DAY_KEYS.map(({ key, short }) => {
    const d = week[key];
    if (!d.open) return `${short} fechado`;
    return `${short} ${d.start}–${d.end}`;
  }).join(" · ");
}

function parseWeek(value: string): WeekSchedule | null {
  if (!value.trim()) return null;
  const week = defaultWeek();
  let matched = 0;
  for (const { key, short } of DAY_KEYS) {
    const re = new RegExp(
      `${short}\\s+(fechado|(\\d{1,2}:\\d{2})\\s*[–-]\\s*(\\d{1,2}:\\d{2}))`,
      "i",
    );
    const m = value.match(re);
    if (!m) continue;
    matched += 1;
    if (m[1].toLowerCase() === "fechado") {
      week[key] = { ...week[key], open: false };
    } else {
      week[key] = {
        open: true,
        start: normalizeTime(m[2]),
        end: normalizeTime(m[3]),
      };
    }
  }
  return matched >= 3 ? week : null;
}

function normalizeTime(t: string): string {
  const [h, m] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

export function EstablishmentForm({
  store,
}: {
  store: {
    name: string;
    description: string;
    logoUrl: string;
    whatsapp: string;
    address: string;
    city: string;
  };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState(store.logoUrl);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await patchStore({
      name: String(fd.get("name")),
      whatsapp: String(fd.get("whatsapp")),
      description: String(fd.get("description") || ""),
      logoUrl,
      address: String(fd.get("address") || ""),
      city: String(fd.get("city") || ""),
    });
    setSaving(false);
    toast({
      title: res.ok ? "Estabelecimento salvo" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <SectionCard title="Dados da loja">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field
            label="Nome"
            id="store-name"
            name="name"
            defaultValue={store.name}
            required
          />
          <Field
            label="WhatsApp"
            id="store-whatsapp"
            name="whatsapp"
            defaultValue={store.whatsapp}
            required
            placeholder="5511999999999"
            hint="Com DDI e DDD, só números. Usado nos pedidos."
          />
          <Field
            as="textarea"
            label="Descrição"
            id="store-description"
            name="description"
            className="sm:col-span-2"
            controlClassName="min-h-24"
            defaultValue={store.description}
            placeholder="Conte um pouco sobre a confeitaria…"
          />
          <div className="sm:col-span-2">
            <ImageField
              label="Logo"
              value={logoUrl}
              onChange={setLogoUrl}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Endereço" className="mt-4">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="store-address">Endereço</Label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8C8682]"
                aria-hidden
              />
              <Input
                id="store-address"
                name="address"
                className="pl-9"
                defaultValue={store.address}
                placeholder="Rua, número, bairro"
              />
            </div>
          </div>
          <Field
            label="Cidade"
            id="store-city"
            name="city"
            defaultValue={store.city}
          />
        </div>
        <FormFooter saving={saving} label="Salvar estabelecimento" />
      </SectionCard>
    </form>
  );
}

export function HoursForm({ businessHours }: { businessHours: string }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const parsed = useMemo(() => parseWeek(businessHours), [businessHours]);
  const [mode, setMode] = useState<"week" | "text">(
    parsed || !businessHours.trim() ? "week" : "text",
  );
  const [week, setWeek] = useState<WeekSchedule>(parsed || defaultWeek());
  const [freeText, setFreeText] = useState(businessHours);

  const preview = mode === "week" ? formatWeek(week) : freeText;

  function updateDay(key: DayKey, patch: Partial<DaySchedule>) {
    setWeek((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function applyWeekdays() {
    const base = week.seg;
    setWeek((prev) => ({
      ...prev,
      ter: { ...base },
      qua: { ...base },
      qui: { ...base },
      sex: { ...base },
    }));
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const value = mode === "week" ? formatWeek(week) : freeText.trim();
    const res = await patchStore({ businessHours: value });
    setSaving(false);
    toast({
      title: res.ok ? "Horários salvos" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <SectionCard
        title="Funcionamento"
        action={
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode("week")}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                mode === "week"
                  ? "bg-[var(--painel-brand)] text-white"
                  : "text-[#65676B] hover:bg-[#F0F2F5]",
              )}
            >
              Por dia
            </button>
            <button
              type="button"
              onClick={() => {
                setFreeText(mode === "week" ? formatWeek(week) : freeText);
                setMode("text");
              }}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-semibold transition",
                mode === "text"
                  ? "bg-[var(--painel-brand)] text-white"
                  : "text-[#65676B] hover:bg-[#F0F2F5]",
              )}
            >
              Texto livre
            </button>
          </div>
        }
      >
        <div className="p-5">
          {mode === "week" ? (
            <div className="space-y-2">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-[#8C8682]">
                  Defina abertura e fechamento de cada dia.
                </p>
                <button
                  type="button"
                  onClick={applyWeekdays}
                  className="text-xs font-semibold text-cocoa underline-offset-2 hover:underline"
                >
                  Copiar segunda para dias úteis
                </button>
              </div>
              {DAY_KEYS.map(({ key, label }) => {
                const day = week[key];
                return (
                  <div
                    key={key}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--painel-border)] bg-[#FAFAF9] px-3 py-2.5"
                  >
                    <div className="w-24 shrink-0">
                      <p className="text-sm font-semibold text-cocoa">
                        {label}
                      </p>
                    </div>
                    <Switch
                      id={`day-${key}`}
                      checked={day.open}
                      onCheckedChange={(open) => updateDay(key, { open })}
                      label={day.open ? "Aberto" : "Fechado"}
                    />
                    {day.open ? (
                      <div className="ml-auto flex items-center gap-2">
                        <input
                          type="time"
                          className="input !w-auto !py-1.5 text-sm"
                          value={day.start}
                          onChange={(e) =>
                            updateDay(key, { start: e.target.value })
                          }
                          required
                        />
                        <span className="text-xs text-[#8C8682]">até</span>
                        <input
                          type="time"
                          className="input !w-auto !py-1.5 text-sm"
                          value={day.end}
                          onChange={(e) =>
                            updateDay(key, { end: e.target.value })
                          }
                          required
                        />
                      </div>
                    ) : (
                      <span className="ml-auto text-xs font-medium text-[#8C8682]">
                        Fechado
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Field
              label="Horário de funcionamento"
              id="business-hours-text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Ex.: Seg–Sex 9h–18h · Sáb 9h–13h"
              hint="Texto livre exibido na vitrine e no painel."
            />
          )}

          {preview.trim() ? (
            <div className="mt-4 rounded-lg border border-dashed border-[var(--painel-border)] bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8C8682]">
                Prévia na vitrine
              </p>
              <p className="mt-1 text-sm text-cocoa">{preview}</p>
            </div>
          ) : null}
        </div>
        <FormFooter saving={saving} label="Salvar horários" />
      </SectionCard>
    </form>
  );
}

export function AttendanceForm({
  store,
}: {
  store: {
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryFeeCents: number | null;
    pickupInstructions: string;
    deliveryInstructions: string;
    autoDeductStock: boolean;
  };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(store.pickupEnabled);
  const [deliveryEnabled, setDeliveryEnabled] = useState(store.deliveryEnabled);
  const [autoDeductStock, setAutoDeductStock] = useState(store.autoDeductStock);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pickupEnabled && !deliveryEnabled) {
      toast({
        title: "Ative retirada ou entrega",
        tone: "warning",
      });
      return;
    }
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const feeRaw = String(fd.get("deliveryFee") || "").replace(",", ".");
    const fee = feeRaw ? Math.round(Number(feeRaw) * 100) : null;
    const res = await patchStore({
      pickupEnabled,
      deliveryEnabled,
      deliveryFeeCents: fee,
      pickupInstructions: String(fd.get("pickupInstructions") || ""),
      deliveryInstructions: String(fd.get("deliveryInstructions") || ""),
      autoDeductStock,
    });
    setSaving(false);
    toast({
      title: res.ok ? "Atendimento salvo" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  const feeDefault =
    store.deliveryFeeCents != null
      ? (store.deliveryFeeCents / 100).toFixed(2).replace(".", ",")
      : "";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <SectionCard title="Modalidades">
        <div className="divide-y divide-[var(--painel-border)] px-5 sm:px-6">
          <ToggleRow
            id="pickup"
            checked={pickupEnabled}
            onCheckedChange={setPickupEnabled}
            title="Retirada no local"
            description="Cliente busca o pedido no endereço informado na vitrine."
            icon={Package}
          />
          <ToggleRow
            id="delivery"
            checked={deliveryEnabled}
            onCheckedChange={setDeliveryEnabled}
            title="Entrega"
            description="Cliente informa endereço no pedido pelo WhatsApp."
            icon={Truck}
          />
        </div>
      </SectionCard>

      <SectionCard title="Detalhes">
        <div className="grid gap-4 p-5">
          <Field
            as="textarea"
            label="Instruções de retirada"
            id="pickup-instructions"
            name="pickupInstructions"
            controlClassName="min-h-20"
            defaultValue={store.pickupInstructions}
            placeholder="Ex.: Retirar com 15 min de antecedência"
          />
          <Field
            label="Taxa fixa de entrega (R$)"
            id="delivery-fee"
            name="deliveryFee"
            inputMode="decimal"
            defaultValue={feeDefault}
            placeholder="Deixe vazio se não houver taxa fixa"
          />
          <Field
            as="textarea"
            label="Regiões e orientações de entrega"
            id="delivery-instructions"
            name="deliveryInstructions"
            controlClassName="min-h-20"
            defaultValue={store.deliveryInstructions}
            placeholder="Ex.: Atendemos bairros X e Y"
          />
        </div>
        <FormFooter saving={saving} label="Salvar atendimento" />
      </SectionCard>

      <SectionCard title="Estoque">
        <div className="divide-y divide-[var(--painel-border)] px-5 sm:px-6">
          <ToggleRow
            id="auto-deduct-stock"
            checked={autoDeductStock}
            onCheckedChange={setAutoDeductStock}
            title="Baixa automática ao confirmar pedido no painel"
            description="Baixa a quantidade dos produtos prontos na venda. O estoque dos ingredientes é controlado em Insumos."
            icon={Package}
          />
        </div>
        <FormFooter saving={saving} label="Salvar estoque" />
      </SectionCard>
    </form>
  );
}

export function SchedulingForm({
  store,
}: {
  store: {
    schedulingEnabled: boolean;
    minAdvanceDays: number;
    minAdvanceHours: number;
    productionNote: string;
  };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [schedulingEnabled, setSchedulingEnabled] = useState(
    store.schedulingEnabled,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await patchStore({
      schedulingEnabled,
      minAdvanceDays: Number(fd.get("minAdvanceDays") || 0),
      minAdvanceHours: Number(fd.get("minAdvanceHours") || 0),
      productionNote: String(fd.get("productionNote") || ""),
    });
    setSaving(false);
    toast({
      title: res.ok ? "Agendamento salvo" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <SectionCard title="Pedidos agendados">
        <div className="divide-y divide-[var(--painel-border)] px-5 sm:px-6">
          <ToggleRow
            id="scheduling-enabled"
            checked={schedulingEnabled}
            onCheckedChange={setSchedulingEnabled}
            title="Permitir data e horário desejados"
            description="Exibe campos de agendamento no carrinho. A confirmação final ocorre no WhatsApp."
            icon={Clock3}
          />
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <Field
            label="Antecedência mínima (dias)"
            id="min-advance-days"
            name="minAdvanceDays"
            type="number"
            min={0}
            defaultValue={store.minAdvanceDays}
            disabled={!schedulingEnabled}
          />
          <Field
            label="Antecedência mínima (horas)"
            id="min-advance-hours"
            name="minAdvanceHours"
            type="number"
            min={0}
            defaultValue={store.minAdvanceHours}
            disabled={!schedulingEnabled}
          />
          <Field
            as="textarea"
            label="Orientações de prazo"
            id="production-note"
            name="productionNote"
            className="sm:col-span-2"
            controlClassName="min-h-20"
            defaultValue={store.productionNote}
            placeholder="Ex.: Bolos decorados precisam de 3 dias de antecedência"
            disabled={!schedulingEnabled}
          />
        </div>
        <FormFooter saving={saving} label="Salvar agendamento" />
      </SectionCard>
    </form>
  );
}

export function AccountForm({
  user,
}: {
  user: { name: string; email: string; phone: string };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name")),
        phone: String(fd.get("phone") || ""),
        password: String(fd.get("password") || "") || undefined,
      }),
    });
    setSaving(false);
    toast({
      title: res.ok ? "Conta atualizada" : "Erro ao atualizar conta",
      tone: res.ok ? "success" : "error",
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <SectionCard
        title="Conta"
        action={
          <span className="inline-flex items-center gap-1.5 text-xs text-[#8C8682]">
            <UserRound className="h-3.5 w-3.5" aria-hidden />
            Acesso ao painel
          </span>
        }
      >
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field
            label="Nome"
            id="account-name"
            name="name"
            defaultValue={user.name}
            required
          />
          <Field
            label="E-mail"
            id="account-email"
            controlClassName="bg-[#F0F2F5]/60"
            value={user.email}
            disabled
            hint="O e-mail não pode ser alterado por aqui."
          />
          <Field
            label="Telefone"
            id="account-phone"
            name="phone"
            defaultValue={user.phone}
          />
          <Field
            label="Nova senha"
            id="account-password"
            name="password"
            type="password"
            placeholder="Deixe em branco para manter"
            minLength={6}
          />
        </div>
        <FormFooter saving={saving} label="Salvar conta" />
      </SectionCard>
    </form>
  );
}

export function NotificationsForm({
  store,
}: {
  store: {
    notifyNewOrders: boolean;
    notifyLowStock: boolean;
    notifyNewCustomers: boolean;
    notifyViaEmail: boolean;
    notifyViaWhatsApp: boolean;
  };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [notifyNewOrders, setNotifyNewOrders] = useState(store.notifyNewOrders);
  const [notifyLowStock, setNotifyLowStock] = useState(store.notifyLowStock);
  const [notifyNewCustomers, setNotifyNewCustomers] = useState(
    store.notifyNewCustomers,
  );
  const [notifyViaEmail, setNotifyViaEmail] = useState(store.notifyViaEmail);
  const [notifyViaWhatsApp, setNotifyViaWhatsApp] = useState(
    store.notifyViaWhatsApp,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!notifyViaEmail && !notifyViaWhatsApp) {
      toast({
        title: "Escolha ao menos um canal (e-mail ou WhatsApp)",
        tone: "warning",
      });
      return;
    }
    setSaving(true);
    const res = await patchStore({
      notifyNewOrders,
      notifyLowStock,
      notifyNewCustomers,
      notifyViaEmail,
      notifyViaWhatsApp,
    });
    setSaving(false);
    toast({
      title: res.ok ? "Notificações salvas" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <SectionCard
        title="Notificações"
        action={
          <span className="inline-flex items-center gap-1.5 text-xs text-[#8C8682]">
            <Bell className="h-3.5 w-3.5" aria-hidden />
            E-mail e WhatsApp
          </span>
        }
      >
        <div className="divide-y divide-[var(--painel-border)] px-5 pt-2">
          <ToggleRow
            id="notify-via-email"
            checked={notifyViaEmail}
            onCheckedChange={setNotifyViaEmail}
            title="Canal: e-mail"
            description="Envia para o e-mail da conta do painel (SMTP)."
          />
          <ToggleRow
            id="notify-via-whatsapp"
            checked={notifyViaWhatsApp}
            onCheckedChange={setNotifyViaWhatsApp}
            title="Canal: WhatsApp"
            description="Envia para o WhatsApp da loja (Meta, Evolution ou webhook)."
          />
          <ToggleRow
            id="notify-orders"
            checked={notifyNewOrders}
            onCheckedChange={setNotifyNewOrders}
            title="Novos pedidos"
            description="Aviso quando um pedido chegar pela vitrine."
          />
          <ToggleRow
            id="notify-stock"
            checked={notifyLowStock}
            onCheckedChange={setNotifyLowStock}
            title="Estoque baixo"
            description="Quando um produto atingir o mínimo cadastrado."
          />
          <ToggleRow
            id="notify-customers"
            checked={notifyNewCustomers}
            onCheckedChange={setNotifyNewCustomers}
            title="Novos clientes"
            description="Quando um cliente for cadastrado pela primeira vez."
          />
        </div>
        <FormFooter saving={saving} label="Salvar notificações" />
      </SectionCard>
    </form>
  );
}

export function PlanCard({ plan }: { plan: string }) {
  const planLabel =
    plan === "pro" ? "Pro" : plan === "business" ? "Business" : "Starter";

  return (
    <SectionCard
      title="Plano atual"
      action={
        <span className="inline-flex items-center gap-1.5 text-xs text-[#8C8682]">
          <CreditCard className="h-3.5 w-3.5" aria-hidden />
          Assinatura
        </span>
      }
    >
      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold tracking-tight text-cocoa">
              {planLabel}
            </p>
            <p className="mt-1 text-sm text-[#8C8682]">
              Vitrine digital, pedidos, agenda e estoque inclusos.
            </p>
          </div>
          <button type="button" className="btn-secondary !py-2 text-sm" disabled>
            Upgrade em breve
          </button>
        </div>
        <ul className="grid gap-2 text-sm text-[#5C5652] sm:grid-cols-2">
          {[
            "Vitrine personalizada",
            "Produtos e categorias ilimitados",
            "Pedidos e WhatsApp",
            "Analytics básico",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-success" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
        <div className="rounded-lg border border-dashed border-[var(--painel-border)] px-4 py-3 text-sm text-[#8C8682]">
          Histórico de cobrança: nenhum lançamento ainda (conta demo).
        </div>
        <Link
          href="/painel/configuracoes/estabelecimento"
          className="inline-block text-sm font-medium text-cocoa underline-offset-2 hover:underline"
        >
          Configurar estabelecimento
        </Link>
      </div>
    </SectionCard>
  );
}
