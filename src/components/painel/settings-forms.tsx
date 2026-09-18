"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CreditCard,
  MapPin,
  Package,
  Truck,
  UserRound,
} from "lucide-react";
import { SectionCard } from "@/components/painel/page-header";
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
    <div className="flex items-center justify-end gap-3 border-t border-[#E8E2DE] px-5 py-3.5">
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

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 text-xs leading-snug text-[#8C8682]">{children}</p>;
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
    <div className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5] text-[#5C5652]">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2D2926]">{title}</p>
          {description ? (
            <p className="mt-0.5 text-xs leading-snug text-[#8C8682]">
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

const PAYMENT_PRESETS = [
  "Pix",
  "Dinheiro",
  "Cartão na retirada",
  "Cartão na entrega",
  "Transferência",
] as const;

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

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await patchStore({
      name: String(fd.get("name")),
      whatsapp: String(fd.get("whatsapp")),
      description: String(fd.get("description") || ""),
      logoUrl: String(fd.get("logoUrl") || ""),
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
          <div>
            <label className="label" htmlFor="store-name">
              Nome
            </label>
            <input
              id="store-name"
              name="name"
              className="input"
              defaultValue={store.name}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="store-whatsapp">
              WhatsApp
            </label>
            <input
              id="store-whatsapp"
              name="whatsapp"
              className="input"
              defaultValue={store.whatsapp}
              required
              placeholder="5511999999999"
            />
            <FieldHint>Com DDI e DDD, só números. Usado nos pedidos.</FieldHint>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="store-description">
              Descrição
            </label>
            <textarea
              id="store-description"
              name="description"
              className="input min-h-24"
              defaultValue={store.description}
              placeholder="Conte um pouco sobre a confeitaria…"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="store-logo">
              Logo (URL)
            </label>
            <input
              id="store-logo"
              name="logoUrl"
              className="input"
              defaultValue={store.logoUrl}
              placeholder="https://…"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Endereço" className="mt-4">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="store-address">
              Endereço
            </label>
            <div className="relative">
              <MapPin
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8C8682]"
                aria-hidden
              />
              <input
                id="store-address"
                name="address"
                className="input pl-9"
                defaultValue={store.address}
                placeholder="Rua, número, bairro"
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="store-city">
              Cidade
            </label>
            <input
              id="store-city"
              name="city"
              className="input"
              defaultValue={store.city}
            />
          </div>
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
                  ? "bg-[#2D2926] text-white"
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
                  ? "bg-[#2D2926] text-white"
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
                  className="text-xs font-semibold text-[#2D2926] underline-offset-2 hover:underline"
                >
                  Copiar segunda para dias úteis
                </button>
              </div>
              {DAY_KEYS.map(({ key, label }) => {
                const day = week[key];
                return (
                  <div
                    key={key}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-[#E8E2DE] bg-[#FAFAF9] px-3 py-2.5"
                  >
                    <div className="w-24 shrink-0">
                      <p className="text-sm font-semibold text-[#2D2926]">
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
            <div>
              <label className="label" htmlFor="business-hours-text">
                Horário de funcionamento
              </label>
              <input
                id="business-hours-text"
                className="input"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Ex.: Seg–Sex 9h–18h · Sáb 9h–13h"
              />
              <FieldHint>
                Texto livre exibido na vitrine e no painel.
              </FieldHint>
            </div>
          )}

          {preview.trim() ? (
            <div className="mt-4 rounded-lg border border-dashed border-[#E8E2DE] bg-white px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8C8682]">
                Prévia na vitrine
              </p>
              <p className="mt-1 text-sm text-[#2D2926]">{preview}</p>
            </div>
          ) : null}
        </div>
        <FormFooter saving={saving} label="Salvar horários" />
      </SectionCard>
    </form>
  );
}

export function PaymentForm({
  store,
}: {
  store: {
    paymentMethods: string[];
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    minAdvanceDays: number;
    productionNote: string;
  };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [methods, setMethods] = useState<string[]>(store.paymentMethods);
  const [customMethod, setCustomMethod] = useState("");
  const [pickupEnabled, setPickupEnabled] = useState(store.pickupEnabled);
  const [deliveryEnabled, setDeliveryEnabled] = useState(store.deliveryEnabled);

  function toggleMethod(method: string) {
    setMethods((prev) =>
      prev.includes(method)
        ? prev.filter((m) => m !== method)
        : [...prev, method],
    );
  }

  function addCustom() {
    const value = customMethod.trim();
    if (!value) return;
    if (!methods.includes(value)) setMethods((prev) => [...prev, value]);
    setCustomMethod("");
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (methods.length === 0) {
      toast({
        title: "Selecione ao menos uma forma de pagamento",
        tone: "warning",
      });
      return;
    }
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const res = await patchStore({
      paymentMethods: methods,
      pickupEnabled,
      deliveryEnabled,
      minAdvanceDays: Number(fd.get("minAdvanceDays") || 0),
      productionNote: String(fd.get("productionNote") || ""),
    });
    setSaving(false);
    toast({
      title: res.ok ? "Pagamento salvo" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  const extras = methods.filter(
    (m) => !(PAYMENT_PRESETS as readonly string[]).includes(m),
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <SectionCard title="Formas de pagamento">
        <div className="p-5">
          <p className="mb-3 text-xs text-[#8C8682]">
            Selecione as opções exibidas no checkout da vitrine.
          </p>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_PRESETS.map((method) => {
              const active = methods.includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => toggleMethod(method)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-semibold transition",
                    active
                      ? "border-[#2D2926] bg-[#2D2926] text-white"
                      : "border-[#CED0D4] bg-white text-[#65676B] hover:bg-[#F0F2F5]",
                  )}
                >
                  {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
                  {method}
                </button>
              );
            })}
            {extras.map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => toggleMethod(method)}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#2D2926] bg-[#2D2926] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
                {method}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className="input max-w-xs flex-1 !py-2 text-sm"
              value={customMethod}
              onChange={(e) => setCustomMethod(e.target.value)}
              placeholder="Outra forma…"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustom();
                }
              }}
            />
            <button
              type="button"
              onClick={addCustom}
              className="btn-secondary !py-2 text-sm"
            >
              Adicionar
            </button>
          </div>
          {methods.length === 0 ? (
            <p className="mt-3 text-xs font-medium text-warning">
              Selecione ao menos uma forma de pagamento.
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="Retirada e entrega">
        <div className="divide-y divide-[#E8E2DE] px-5">
          <ToggleRow
            id="pickup"
            checked={pickupEnabled}
            onCheckedChange={setPickupEnabled}
            title="Retirada no local"
            description="Cliente busca o pedido no endereço da loja."
            icon={Package}
          />
          <ToggleRow
            id="delivery"
            checked={deliveryEnabled}
            onCheckedChange={setDeliveryEnabled}
            title="Entrega"
            description="Oferece entrega — configure zonas em Pedidos quando precisar."
            icon={Truck}
          />
        </div>
      </SectionCard>

      <SectionCard title="Prazo e produção">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="min-advance">
              Prazo mínimo (dias)
            </label>
            <input
              id="min-advance"
              name="minAdvanceDays"
              type="number"
              min={0}
              className="input"
              defaultValue={store.minAdvanceDays}
            />
            <FieldHint>
              Antecedência mínima para aceitar encomendas na agenda.
            </FieldHint>
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="production-note">
              Nota de produção / agenda
            </label>
            <textarea
              id="production-note"
              name="productionNote"
              className="input min-h-20"
              defaultValue={store.productionNote}
              placeholder="Ex.: Encomendas personalizadas com 3 dias de antecedência"
            />
          </div>
        </div>
        <FormFooter
          saving={saving}
          label="Salvar pagamento"
          disabled={methods.length === 0}
        />
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
          <div>
            <label className="label" htmlFor="account-name">
              Nome
            </label>
            <input
              id="account-name"
              name="name"
              className="input"
              defaultValue={user.name}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="account-email">
              E-mail
            </label>
            <input
              id="account-email"
              className="input bg-[#F0F2F5]/60"
              value={user.email}
              disabled
            />
            <FieldHint>O e-mail não pode ser alterado por aqui.</FieldHint>
          </div>
          <div>
            <label className="label" htmlFor="account-phone">
              Telefone
            </label>
            <input
              id="account-phone"
              name="phone"
              className="input"
              defaultValue={user.phone}
            />
          </div>
          <div>
            <label className="label" htmlFor="account-password">
              Nova senha
            </label>
            <input
              id="account-password"
              name="password"
              type="password"
              className="input"
              placeholder="Deixe em branco para manter"
              minLength={6}
            />
          </div>
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
  };
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [notifyNewOrders, setNotifyNewOrders] = useState(store.notifyNewOrders);
  const [notifyLowStock, setNotifyLowStock] = useState(store.notifyLowStock);
  const [notifyNewCustomers, setNotifyNewCustomers] = useState(
    store.notifyNewCustomers,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await patchStore({
      notifyNewOrders,
      notifyLowStock,
      notifyNewCustomers,
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
            Alertas do painel
          </span>
        }
      >
        <div className="divide-y divide-[#E8E2DE] px-5 pt-2">
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
            description="Quando um cliente for cadastrado automaticamente."
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
            <p className="text-2xl font-bold tracking-tight text-[#2D2926]">
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
        <div className="rounded-lg border border-dashed border-[#E8E2DE] px-4 py-3 text-sm text-[#8C8682]">
          Histórico de cobrança: nenhum lançamento ainda (conta demo).
        </div>
        <Link
          href="/painel/vitrine"
          className="inline-block text-sm font-medium text-[#2D2926] underline-offset-2 hover:underline"
        >
          Ir para Minha vitrine
        </Link>
      </div>
    </SectionCard>
  );
}
