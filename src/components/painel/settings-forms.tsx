"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  Check,
  Clock3,
  CreditCard,
  Info,
  MapPin,
  UserRound,
} from "lucide-react";
import { SectionCard } from "@/components/painel/page-header";
import {
  RowActionsMenu,
  type RowActionItem,
} from "@/components/painel/row-actions-menu";
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
  { key: "seg", label: "Segunda-feira", short: "Seg" },
  { key: "ter", label: "Terça-feira", short: "Ter" },
  { key: "qua", label: "Quarta-feira", short: "Qua" },
  { key: "qui", label: "Quinta-feira", short: "Qui" },
  { key: "sex", label: "Sexta-feira", short: "Sex" },
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
    sab: { open: true, start: "09:00", end: "17:00" },
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

function parseDayShort(token: string): DayKey | null {
  const normalized = token.trim().toLowerCase();
  for (const { key, short } of DAY_KEYS) {
    if (short.toLowerCase() === normalized) return key;
  }
  return null;
}

function parseHourToken(hours: string, minutes?: string): string {
  return `${hours.padStart(2, "0")}:${(minutes || "00").padStart(2, "0")}`;
}

function applyDayRange(
  week: WeekSchedule,
  from: DayKey,
  to: DayKey,
  patch: Partial<DaySchedule>,
) {
  const order = DAY_KEYS.map((d) => d.key);
  const start = Math.min(order.indexOf(from), order.indexOf(to));
  const end = Math.max(order.indexOf(from), order.indexOf(to));
  for (let i = start; i <= end; i++) {
    const key = order[i];
    week[key] = { ...week[key], ...patch };
  }
}

function parseWeek(value: string): WeekSchedule | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const week = defaultWeek();
  let matched = 0;
  for (const { key, short } of DAY_KEYS) {
    const re = new RegExp(
      `${short}\\s+(fechado|(\\d{1,2}:\\d{2})\\s*[–-]\\s*(\\d{1,2}:\\d{2}))`,
      "i",
    );
    const m = trimmed.match(re);
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
  if (matched >= 3) return week;

  const compactWeek = defaultWeek();
  let compactSegments = 0;
  for (const segment of trimmed.split(/\s*·\s*/)) {
    const seg = segment.trim();
    if (!seg) continue;

    const closedMatch = seg.match(
      /^(Seg|Ter|Qua|Qui|Sex|Sáb|Dom)(?:\s*[–-]\s*(Seg|Ter|Qua|Qui|Sex|Sáb|Dom))?\s+fechado$/i,
    );
    if (closedMatch) {
      const from = parseDayShort(closedMatch[1]);
      const to = closedMatch[2] ? parseDayShort(closedMatch[2]) : from;
      if (from && to) {
        applyDayRange(compactWeek, from, to, { open: false });
        compactSegments += 1;
      }
      continue;
    }

    const timeMatch = seg.match(
      /^(Seg|Ter|Qua|Qui|Sex|Sáb|Dom)(?:\s*[–-]\s*(Seg|Ter|Qua|Qui|Sex|Sáb|Dom))?\s+(\d{1,2})h(?::(\d{2}))?(?:\s*[–-]\s*(\d{1,2})h(?::(\d{2}))?)?$/i,
    );
    if (!timeMatch) continue;

    const from = parseDayShort(timeMatch[1]);
    const to = timeMatch[2] ? parseDayShort(timeMatch[2]) : from;
    if (!from || !to) continue;

    const start = parseHourToken(timeMatch[3], timeMatch[4]);
    const end = timeMatch[5]
      ? parseHourToken(timeMatch[5], timeMatch[6])
      : compactWeek[from].end;
    applyDayRange(compactWeek, from, to, { open: true, start, end });
    compactSegments += 1;
  }

  if (compactSegments > 0) return compactWeek;
  return matched > 0 ? week : null;
}

function normalizeTime(t: string): string {
  const [h, m] = t.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

function hoursOpenDayCount(week: WeekSchedule): number {
  return DAY_KEYS.reduce((n, { key }) => n + (week[key].open ? 1 : 0), 0);
}

function HoursTipsPanel() {
  const tips = [
    "Mais confiança para seus clientes",
    "Menos dúvidas no WhatsApp",
    "Mais agendamentos e vendas",
  ];

  return (
    <aside
      className="flex h-full min-h-0 flex-col rounded-xl border border-[#A7D7C5]/40 bg-[#ECFDF5] p-4 sm:p-5 lg:min-h-[22rem]"
    >
      <div className="flex items-center gap-2">
        <Clock3
          className="h-4 w-4 text-[var(--painel-accent,#1e6b5c)]"
          aria-hidden
        />
        <h3 className="text-sm font-semibold text-[var(--painel-brand,#0f352e)]">
          Dicas
        </h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[#5C5652]">
        Os horários informados pela sua loja serão exibidos na vitrine e no link
        de compartilhamento para seus clientes.
      </p>
      <ul className="mt-4 space-y-2.5">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-2 text-xs text-[#5C5652]">
            <Check
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--painel-accent,#1e6b5c)]"
              aria-hidden
            />
            {tip}
          </li>
        ))}
      </ul>
      <div className="mt-auto rounded-lg border border-dashed border-[#A7D7C5]/60 bg-white/60 px-3 py-3 pt-5 text-center">
        <CalendarDays
          className="mx-auto h-8 w-8 text-[var(--painel-accent,#1e6b5c)]/70"
          strokeWidth={1.25}
          aria-hidden
        />
        <p className="mt-2 text-xs leading-relaxed font-medium text-[#047857]">
          Mantenha seus horários atualizados e nunca perca um cliente!
        </p>
      </div>
    </aside>
  );
}

function HoursStatusBadge({ open }: { open: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        open
          ? "bg-emerald-50 text-emerald-800"
          : "bg-red-50 text-red-700",
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          open ? "bg-emerald-600" : "bg-red-500",
        )}
        aria-hidden
      />
      {open ? "Aberto" : "Fechado"}
    </span>
  );
}

function HoursTimeInput({
  value,
  onChange,
  disabled,
  id,
  fullWidth,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id: string;
  fullWidth?: boolean;
}) {
  const widthClass = fullWidth ? "!w-full min-w-0" : "!w-[6.5rem]";

  if (disabled) {
    return (
      <div
        className={cn(
          "flex h-10 items-center justify-center rounded-lg border border-[var(--painel-border)] bg-[#F5F4F2] text-xs font-medium text-[#8C8682]",
          fullWidth ? "w-full" : "w-[6.5rem]",
        )}
        aria-hidden
      >
        Fechado
      </div>
    );
  }

  return (
    <div className={cn("relative", fullWidth && "min-w-0 flex-1")}>
      <input
        id={id}
        type="time"
        className={cn(
          "input !h-10 !rounded-lg !py-1.5 !pr-9 text-sm tabular-nums",
          widthClass,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
      <Clock3
        className="pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C8682]"
        aria-hidden
      />
    </div>
  );
}

function dayMobileLabel(label: string) {
  return label.replace("-feira", "");
}

function HoursDayMobileRow({
  dayKey,
  label,
  day,
  onUpdate,
  menuItems,
}: {
  dayKey: DayKey;
  label: string;
  day: DaySchedule;
  onUpdate: (patch: Partial<DaySchedule>) => void;
  menuItems: RowActionItem[];
}) {
  const mobileLabel = dayMobileLabel(label);

  return (
    <div className="px-4 py-4 sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Switch
            id={`day-mobile-${dayKey}`}
            checked={day.open}
            onCheckedChange={(open) => onUpdate({ open })}
            aria-label={`${label} ${day.open ? "aberto" : "fechado"}`}
          />
          <p className="truncate text-sm font-semibold text-cocoa">{mobileLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <HoursStatusBadge open={day.open} />
          <RowActionsMenu items={menuItems} label={`Ações de ${label}`} />
        </div>
      </div>
      <div className="mt-3">
        {day.open ? (
          <div className="flex w-full items-center gap-2">
            <HoursTimeInput
              id={`${dayKey}-start-mobile`}
              value={day.start}
              fullWidth
              onChange={(start) => onUpdate({ start })}
            />
            <span
              className="shrink-0 text-sm font-medium text-[#8C8682]"
              aria-hidden
            >
              -
            </span>
            <HoursTimeInput
              id={`${dayKey}-end-mobile`}
              value={day.end}
              fullWidth
              onChange={(end) => onUpdate({ end })}
            />
          </div>
        ) : (
          <p
            className="rounded-lg border border-[var(--painel-border)] bg-[#F5F4F2] py-2.5 text-center text-xs font-medium text-[#8C8682]"
          >
            Fechado neste dia
          </p>
        )}
      </div>
    </div>
  );
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
  const initialWeek = parsed || defaultWeek();
  const [mode, setMode] = useState<"week" | "text">(
    parsed || !businessHours.trim() ? "week" : "text",
  );
  const [week, setWeek] = useState<WeekSchedule>(initialWeek);
  const [freeText, setFreeText] = useState(businessHours);

  function updateDay(key: DayKey, patch: Partial<DaySchedule>) {
    setWeek((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  const openDays = hoursOpenDayCount(week);
  const closedDays = DAY_KEYS.length - openDays;

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

  function copyDayToAll(source: DayKey) {
    const base = week[source];
    setWeek((prev) => {
      const next = { ...prev };
      for (const { key } of DAY_KEYS) {
        next[key] = { ...base };
      }
      return next;
    });
  }

  function rowMenuItems(key: DayKey): RowActionItem[] {
    const items: RowActionItem[] = [];
    if (key === "seg") {
      items.push({
        label: "Copiar para dias úteis",
        onClick: applyWeekdays,
      });
    }
    items.push({
      label: "Copiar para todos os dias",
      onClick: () => copyDayToAll(key),
    });
    items.push({
      label: "Editar como texto livre",
      onClick: () => {
        setFreeText(mode === "week" ? formatWeek(week) : freeText);
        setMode("text");
      },
    });
    return items;
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-h-0 w-full flex-1 flex-col gap-5"
    >
      {mode === "text" ? (
        <SectionCard title="Texto na vitrine">
          <div className="space-y-3 p-5">
            <Field
              label="Horários exibidos para o cliente"
              id="business-hours-text"
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="Ex.: Seg–Sex 9h–18h · Sáb 9h–17h"
              hint="Use a edição por dia para ajustar com mais facilidade."
            />
            <button
              type="button"
              className="text-xs font-semibold text-[var(--painel-brand)] underline-offset-2 hover:underline"
              onClick={() => {
                const parsedText = parseWeek(freeText);
                if (parsedText) setWeek(parsedText);
                setMode("week");
              }}
            >
              Voltar para edição por dia
            </button>
          </div>
        </SectionCard>
      ) : (
        <div className="grid min-h-0 w-full flex-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] lg:items-stretch">
          <section
            className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white shadow-sm"
          >
            <div
              className="flex flex-col gap-3 border-b border-[var(--painel-border)] px-4 py-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:px-5 lg:px-6"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE] text-[var(--painel-brand,#0f352e)]"
                  aria-hidden
                >
                  <Clock3 className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 space-y-0.5">
                  <h2 className="text-sm font-semibold text-cocoa">
                    Horário de funcionamento
                  </h2>
                  <p className="text-xs leading-relaxed text-[#8C8682]">
                    Ative cada dia e defina o horário. Toque em ⋮ para copiar
                    entre dias.
                  </p>
                </div>
              </div>
              <span
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#F0F2F5] px-3 py-1.5 text-xs font-semibold text-[#5C5652] sm:w-auto sm:justify-start sm:py-1"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    openDays > 0 ? "bg-emerald-600" : "bg-[#B0AAA6]",
                  )}
                  aria-hidden
                />
                {openDays} {openDays === 1 ? "dia aberto" : "dias abertos"}
                {closedDays > 0
                  ? ` · ${closedDays} ${closedDays === 1 ? "fechado" : "fechados"}`
                  : ""}
              </span>
            </div>

            <div className="divide-y divide-[var(--painel-border)] md:hidden">
              {DAY_KEYS.map(({ key, label }) => (
                <HoursDayMobileRow
                  key={key}
                  dayKey={key}
                  label={label}
                  day={week[key]}
                  onUpdate={(patch) => updateDay(key, patch)}
                  menuItems={rowMenuItems(key)}
                />
              ))}
            </div>

            <div className="hidden min-h-0 flex-1 overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr
                    className="border-b border-[var(--painel-border)] text-[11px] font-semibold uppercase tracking-wide text-[#8C8682]"
                  >
                    <th className="w-[11.5rem] py-2.5 pl-4 pr-2 text-left font-semibold sm:pl-5 lg:pl-6">
                      Dia
                    </th>
                    <th className="w-14 py-2.5 pr-2 text-center font-semibold">
                      Ativo
                    </th>
                    <th className="py-2.5 text-center font-semibold">
                      Horário
                    </th>
                    <th className="w-[6.5rem] py-2.5 pr-2 text-left font-semibold">
                      Status
                    </th>
                    <th className="w-12 py-2.5 pr-4 sm:pr-5 lg:pr-6">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--painel-border)]">
                  {DAY_KEYS.map(({ key, label }) => {
                    const day = week[key];
                    return (
                      <tr key={key} className="align-middle">
                        <td className="w-[11.5rem] py-3.5 pl-4 pr-2 text-sm font-medium text-cocoa sm:pl-5 lg:pl-6">
                          {label}
                        </td>
                        <td className="w-14 py-3.5 pr-2">
                          <div className="flex justify-center [&>label]:!w-auto">
                            <Switch
                              id={`day-${key}`}
                              checked={day.open}
                              onCheckedChange={(open) => updateDay(key, { open })}
                              aria-label={`${label} ${day.open ? "aberto" : "fechado"}`}
                            />
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div
                            className="mx-auto flex w-fit items-center justify-center gap-2.5"
                          >
                            <HoursTimeInput
                              id={`${key}-start`}
                              value={day.start}
                              disabled={!day.open}
                              onChange={(start) => updateDay(key, { start })}
                            />
                            <span
                              className="text-sm font-medium text-[#8C8682]"
                              aria-hidden
                            >
                              -
                            </span>
                            <HoursTimeInput
                              id={`${key}-end`}
                              value={day.end}
                              disabled={!day.open}
                              onChange={(end) => updateDay(key, { end })}
                            />
                          </div>
                        </td>
                        <td className="w-[6.5rem] py-3.5 pr-2">
                          <HoursStatusBadge open={day.open} />
                        </td>
                        <td className="w-12 py-3.5 pr-4 sm:pr-5 lg:pr-6">
                          <RowActionsMenu
                            items={rowMenuItems(key)}
                            label={`Ações de ${label}`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <HoursTipsPanel />
        </div>
      )}

      {mode === "week" ? (
        <section
          className="flex w-full shrink-0 flex-col gap-4 rounded-xl border border-[var(--painel-border)] bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6 max-md:rounded-lg"
        >
          <div className="flex min-w-0 items-start gap-3">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5] text-[#5C5652]"
              aria-hidden
            >
              <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 space-y-0.5">
              <h2 className="text-sm font-semibold text-cocoa">
                Exceções e feriados
              </h2>
              <p className="text-xs leading-relaxed text-[#8C8682]">
                Configure horários especiais para feriados ou datas comemorativas.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 !px-3.5 text-sm sm:!h-10 sm:w-auto sm:text-xs"
            onClick={() =>
              toast({
                title: "Em breve",
                description:
                  "Você poderá cadastrar feriados e dias com horário especial.",
                tone: "info",
              })
            }
          >
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            Gerenciar exceções
          </button>
        </section>
      ) : null}

      <div
        className="mt-auto flex w-full shrink-0 flex-col gap-4 rounded-xl border border-[var(--painel-border)] bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 lg:px-6 max-md:rounded-lg"
      >
        <p className="flex min-w-0 flex-1 items-start gap-2 text-xs leading-relaxed text-[#5C5652]">
          <Info
            className="mt-0.5 h-4 w-4 shrink-0 text-[var(--painel-brand)]"
            aria-hidden
          />
          As informações de horário serão exibidas na sua vitrine e no link de
          compartilhamento.
        </p>
        <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Link
            href="/painel/configuracoes"
            className="btn-secondary inline-flex h-11 w-full items-center justify-center !py-2 text-sm sm:h-10 sm:w-auto"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn-primary inline-flex h-11 w-full items-center justify-center gap-2 !py-2 text-sm sm:h-10 sm:w-auto"
            disabled={saving}
          >
            <Check className="h-4 w-4" aria-hidden />
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
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
