"use client";

import { FormEvent, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Clock3,
  Info,
  MessagesSquare,
  Sparkles,
} from "lucide-react";
import { Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const PRODUCTION_NOTE_MAX = 500;

async function patchStore(payload: Record<string, unknown>) {
  return fetch("/api/store", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function SchedulingPromoBanner() {
  return (
    <aside
      className="w-full shrink-0 rounded-xl border border-[#A7D7C5]/50 bg-gradient-to-br from-[#ECFDF5] to-[#F0FDF9] p-3.5 sm:max-w-sm sm:p-5 lg:max-w-md"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[var(--painel-accent,#1e6b5c)] shadow-sm"
          aria-hidden
        >
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-semibold text-[var(--painel-brand,#0f352e)]">
            Mais praticidade para seus clientes
          </p>
          <p className="text-xs leading-relaxed text-[#5C5652]">
            Permita que seus clientes agendem pedidos de forma simples e rápida.
          </p>
        </div>
      </div>
    </aside>
  );
}

function SettingCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description: string;
  icon: typeof CalendarDays;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-xl border border-[var(--painel-border)] bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2F5] text-[#5C5652] sm:h-11 sm:w-11"
          aria-hidden
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
          <p className="text-[13px] font-semibold leading-snug text-cocoa sm:text-sm">
            {title}
          </p>
          <p className="text-[11px] leading-snug text-[#8C8682] sm:text-xs sm:leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  );
}

function SuffixNumberInput({
  id,
  name,
  suffix,
  value,
  onChange,
  disabled,
  min = 0,
}: {
  id: string;
  name: string;
  suffix: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
}) {
  return (
    <div
      className={cn(
        "input flex min-h-[2.75rem] items-center gap-2 pr-3",
        disabled && "opacity-60",
      )}
    >
      <input
        id={id}
        name={name}
        type="number"
        min={min}
        inputMode="numeric"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") {
            onChange(0);
            return;
          }
          const n = Math.max(min, Number.parseInt(raw, 10));
          onChange(Number.isFinite(n) ? n : min);
        }}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-normal text-cocoa outline-none [appearance:textfield] md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="shrink-0 text-sm text-[#8C8682]">{suffix}</span>
    </div>
  );
}

export type SchedulingStore = {
  schedulingEnabled: boolean;
  minAdvanceDays: number;
  minAdvanceHours: number;
  productionNote: string;
};

export function SchedulingForm({ store }: { store: SchedulingStore }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [schedulingEnabled, setSchedulingEnabled] = useState(
    store.schedulingEnabled,
  );
  const [minAdvanceDays, setMinAdvanceDays] = useState(store.minAdvanceDays);
  const [minAdvanceHours, setMinAdvanceHours] = useState(
    store.minAdvanceHours,
  );
  const [productionNote, setProductionNote] = useState(store.productionNote);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const res = await patchStore({
      schedulingEnabled,
      minAdvanceDays,
      minAdvanceHours,
      productionNote,
    });
    setSaving(false);
    toast({
      title: res.ok ? "Agendamento salvo" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  const fieldsDisabled = !schedulingEnabled;

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-5">
      <section className="space-y-2.5 sm:space-y-3">
        <h2 className="text-[13px] font-semibold text-cocoa sm:text-sm">
          Configurações gerais
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-3 lg:gap-4">
          <div
            className="flex items-center justify-between gap-2.5 rounded-xl border border-[var(--painel-border)] bg-white p-4 shadow-sm sm:gap-4 sm:p-5"
          >
            <div className="flex min-w-0 flex-1 items-start gap-2.5 sm:gap-3">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2F5] text-[#5C5652] sm:h-11 sm:w-11"
                aria-hidden
              >
                <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 space-y-0.5 sm:space-y-1">
                <p className="text-[13px] font-semibold leading-snug text-cocoa sm:text-sm">
                  Permitir agendamento
                </p>
                <p className="line-clamp-3 text-[11px] leading-snug text-[#8C8682] sm:text-xs sm:leading-relaxed">
                  Habilite para que seus clientes possam agendar pedidos no
                  WhatsApp.
                </p>
              </div>
            </div>
            <div className="shrink-0 pl-1">
              <Switch
                id="scheduling-enabled"
                checked={schedulingEnabled}
                onCheckedChange={setSchedulingEnabled}
                aria-label="Permitir agendamento"
              />
            </div>
          </div>

          <SettingCard
            title="Antecedência mínima (dias)"
            description="Informe quantos dias de antecedência são necessários para o agendamento."
            icon={Clock3}
          >
            <SuffixNumberInput
              id="min-advance-days"
              name="minAdvanceDays"
              suffix="dias"
              value={minAdvanceDays}
              onChange={setMinAdvanceDays}
              disabled={fieldsDisabled}
            />
          </SettingCard>

          <SettingCard
            title="Antecedência mínima (horas)"
            description="Informe quantas horas de antecedência são necessários para o agendamento."
            icon={Clock3}
          >
            <SuffixNumberInput
              id="min-advance-hours"
              name="minAdvanceHours"
              suffix="horas"
              value={minAdvanceHours}
              onChange={setMinAdvanceHours}
              disabled={fieldsDisabled}
            />
          </SettingCard>
        </div>
      </section>

      <section
        className="overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white shadow-sm"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--painel-border)] px-4 py-3.5 sm:px-5">
          <MessagesSquare
            className="h-4 w-4 shrink-0 text-[#5C5652]"
            aria-hidden
          />
          <h2 className="text-sm font-semibold text-cocoa">
            Orientações de prazo
          </h2>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="space-y-1.5">
            <Label htmlFor="production-note">Mensagem para o cliente</Label>
            <textarea
              id="production-note"
              name="productionNote"
              value={productionNote}
              disabled={fieldsDisabled}
              maxLength={PRODUCTION_NOTE_MAX}
              onChange={(e) =>
                setProductionNote(
                  e.target.value.slice(0, PRODUCTION_NOTE_MAX),
                )
              }
              placeholder="Ex.: Encomendas de bolos personalizados com mínimo de 3 dias úteis."
              className="input min-h-[7.5rem] w-full resize-y px-3 py-2.5 text-base leading-relaxed text-cocoa md:text-sm disabled:opacity-60"
            />
            <p className="text-right text-xs text-[#8C8682]">
              {productionNote.length}/{PRODUCTION_NOTE_MAX}
            </p>
          </div>
          <p
            className="flex items-start gap-2 rounded-lg border border-[#BFDBFE]/60 bg-[#EFF6FF] px-3 py-2.5 text-xs leading-relaxed text-[#1E40AF]"
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Essa mensagem será exibida no seu link de compartilhamento e nas
            informações do agendamento.
          </p>
        </div>
      </section>

      <div
        className="mt-auto flex w-full flex-col-reverse gap-2.5 rounded-lg border border-[var(--painel-border)] bg-white px-3.5 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:rounded-xl sm:px-5 sm:py-4"
      >
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
          {saving ? "Salvando…" : "Salvar agendamento"}
        </button>
      </div>
    </form>
  );
}
