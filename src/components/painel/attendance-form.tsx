"use client";

import { FormEvent, useState, type ComponentProps, type ReactNode } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Info,
  MapPin,
  Motorbike,
  Phone,
  Sparkles,
  Store,
} from "lucide-react";
import { Field, Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

const INSTRUCTION_MAX = 500;

async function patchStore(payload: Record<string, unknown>) {
  return fetch("/api/store", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function IconInput({
  icon: Icon,
  className,
  id,
  ...props
}: Omit<ComponentProps<typeof Input>, "className"> & {
  icon: typeof Phone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "input flex min-h-[2.75rem] items-center gap-2.5 focus-within:border-[color-mix(in_oklab,var(--painel-brand)_35%,var(--painel-border))] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--painel-brand)_14%,transparent)]",
        className,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-[#8C8682]" aria-hidden />
      <input
        id={id}
        className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base leading-normal text-cocoa outline-none placeholder:text-[#8C8682]/80 md:text-sm"
        {...props}
      />
    </div>
  );
}

function IconTextarea({
  icon: Icon,
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  className,
}: {
  icon: typeof Store;
  id: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <div
        className={cn(
          "input flex min-h-[6.5rem] items-start gap-2.5 p-3 focus-within:border-[color-mix(in_oklab,var(--painel-brand)_35%,var(--painel-border))] focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--painel-brand)_14%,transparent)] sm:min-h-[7.5rem]",
        )}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#8C8682]" aria-hidden />
        <textarea
          id={id}
          name={id}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
          maxLength={maxLength}
          placeholder={placeholder}
          className="min-h-[5.5rem] min-w-0 flex-1 resize-y border-0 bg-transparent p-0 text-base leading-relaxed text-cocoa outline-none placeholder:text-[#8C8682]/80 md:text-sm"
        />
      </div>
      <p className="text-right text-xs text-[#8C8682]">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}

function ModalityCard({
  title,
  description,
  icon: Icon,
  checked,
  onCheckedChange,
  active,
  onFocus,
}: {
  title: string;
  description: string;
  icon: typeof Store;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  active?: boolean;
  onFocus?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2.5 rounded-xl border bg-white p-3.5 shadow-sm transition sm:gap-4 sm:p-5",
        checked
          ? active
            ? "border-[var(--painel-accent,#1e6b5c)] ring-1 ring-[var(--painel-accent,#1e6b5c)]/20"
            : "border-[#A7D7C5]/70"
          : "border-[var(--painel-border)] opacity-90",
      )}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-2.5 text-left sm:gap-3"
        onClick={onFocus}
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F2F5] text-[#5C5652] sm:h-11 sm:w-11"
          aria-hidden
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 space-y-0.5 sm:space-y-1">
          <p className="text-[13px] font-semibold leading-snug text-cocoa sm:text-sm">
            {title}
          </p>
          <p className="line-clamp-2 text-[11px] leading-snug text-[#8C8682] sm:text-xs sm:leading-relaxed">
            {description}
          </p>
        </div>
      </button>
      <div className="shrink-0 pl-1">
        <Switch checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    </div>
  );
}

function AccordionPanel({
  title,
  icon: Icon,
  open,
  onToggle,
  children,
  disabled,
  className,
}: {
  title: string;
  icon: typeof Store;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white shadow-sm",
        disabled && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:min-h-0 sm:px-5"
        onClick={onToggle}
        disabled={disabled}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <Icon className="h-4 w-4 shrink-0 text-[#5C5652]" aria-hidden />
          <span className="text-sm font-semibold text-cocoa">{title}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-[#8C8682] transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && !disabled ? (
        <div className="border-t border-[var(--painel-border)] px-4 pb-5 pt-4 sm:px-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function AttendancePromoBanner() {
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
            Disponibilize opções de retirada e entrega na sua loja online para
            que seus clientes escolham a forma que preferem.
          </p>
        </div>
      </div>
    </aside>
  );
}

export type AttendanceStore = {
  name: string;
  whatsapp: string;
  address: string;
  city: string;
  businessHours: string;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  deliveryFeeCents: number | null;
  pickupInstructions: string;
  deliveryInstructions: string;
  autoDeductStock: boolean;
};

export function AttendanceForm({ store }: { store: AttendanceStore }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(store.pickupEnabled);
  const [deliveryEnabled, setDeliveryEnabled] = useState(store.deliveryEnabled);
  const [autoDeductStock, setAutoDeductStock] = useState(store.autoDeductStock);
  const [pickupOpen, setPickupOpen] = useState(true);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [activeModality, setActiveModality] = useState<"pickup" | "delivery">(
    "pickup",
  );
  const [pickupInstructions, setPickupInstructions] = useState(
    store.pickupInstructions,
  );
  const [deliveryInstructions, setDeliveryInstructions] = useState(
    store.deliveryInstructions,
  );

  const feeDefault =
    store.deliveryFeeCents != null
      ? (store.deliveryFeeCents / 100).toFixed(2).replace(".", ",")
      : "";

  const hoursLabel =
    store.businessHours?.trim() || "Nenhum horário configurado";

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
      name: String(fd.get("name") || "").trim(),
      whatsapp: String(fd.get("whatsapp") || "").trim(),
      address: String(fd.get("address") || "").trim(),
      city: String(fd.get("city") || "").trim(),
      pickupEnabled,
      deliveryEnabled,
      deliveryFeeCents: fee,
      pickupInstructions,
      deliveryInstructions,
      autoDeductStock,
    });
    setSaving(false);
    toast({
      title: res.ok ? "Atendimento salvo" : "Erro ao salvar",
      tone: res.ok ? "success" : "error",
    });
  }

  function openPickupPanel() {
    setActiveModality("pickup");
    setPickupOpen(true);
    setDeliveryOpen(false);
  }

  function openDeliveryPanel() {
    setActiveModality("delivery");
    setDeliveryOpen(true);
    setPickupOpen(false);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 sm:gap-5">
      <section className="space-y-2.5 sm:space-y-3">
        <h2 className="text-[13px] font-semibold text-cocoa sm:text-sm">
          Modalidades de atendimento
        </h2>
        <div className="grid grid-cols-1 gap-2.5 sm:gap-3 md:grid-cols-2 md:gap-4">
          <ModalityCard
            title="Retirada no local"
            description="Cliente busca o pedido no endereço informado na vitrine."
            icon={Store}
            checked={pickupEnabled}
            onCheckedChange={setPickupEnabled}
            active={activeModality === "pickup"}
            onFocus={openPickupPanel}
          />
          <ModalityCard
            title="Entrega"
            description="Cliente recebe o pedido no endereço informado pelo WhatsApp."
            icon={Motorbike}
            checked={deliveryEnabled}
            onCheckedChange={setDeliveryEnabled}
            active={activeModality === "delivery"}
            onFocus={openDeliveryPanel}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-start md:gap-5">
          <AccordionPanel
            title="Retirada no local"
            icon={Store}
            open={pickupOpen}
            onToggle={() => {
              setPickupOpen((o) => !o);
              if (!pickupOpen) openPickupPanel();
            }}
            disabled={!pickupEnabled}
            className="order-1 md:col-start-1"
          >
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
              <Field
                label="Nome do estabelecimento"
                id="attendance-name"
                name="name"
                className="min-w-0 sm:col-span-2"
                defaultValue={store.name}
                required
              />
              <div className="flex flex-col gap-1">
                <Label htmlFor="attendance-whatsapp">WhatsApp</Label>
                <IconInput
                  id="attendance-whatsapp"
                  name="whatsapp"
                  icon={Phone}
                  defaultValue={store.whatsapp}
                  placeholder="5511999999999"
                  required
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <Label htmlFor="attendance-address">Endereço completo</Label>
                <IconInput
                  id="attendance-address"
                  name="address"
                  icon={MapPin}
                  defaultValue={store.address}
                  placeholder="Rua, número, bairro"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="attendance-city">Cidade</Label>
                <IconInput
                  id="attendance-city"
                  name="city"
                  icon={MapPin}
                  defaultValue={store.city}
                  placeholder="Cidade"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <Label id="attendance-hours-label">Horário de atendimento</Label>
              <Link
                href="/painel/configuracoes/horarios"
                className="input flex min-h-[2.75rem] items-start gap-2.5 py-2.5 transition hover:border-[color-mix(in_oklab,var(--painel-brand)_25%,var(--painel-border))] sm:items-center sm:py-0"
                aria-labelledby="attendance-hours-label"
              >
                <Clock3
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#8C8682] sm:mt-0"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 text-sm leading-snug text-cocoa sm:truncate">
                  {hoursLabel}
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-[#8C8682]"
                  aria-hidden
                />
              </Link>
            </div>

            <p
              className="mt-4 flex items-start gap-2 rounded-lg border border-[#BFDBFE]/60 bg-[#EFF6FF] px-3 py-2.5 text-xs leading-relaxed text-[#1E40AF]"
            >
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              O horário de atendimento pode ser ajustado nas configurações de
              horários da sua vitrine.
            </p>
          </AccordionPanel>

        <section
          className="order-2 flex min-w-0 flex-col rounded-xl border border-[var(--painel-border)] bg-white shadow-sm md:col-start-2 md:row-span-2 md:row-start-1"
        >
          <div className="border-b border-[var(--painel-border)] px-4 py-3.5 sm:px-5">
            <h2 className="text-sm font-semibold text-cocoa">
              Instruções e observações
            </h2>
          </div>
          <div className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-5">
            <div className="space-y-1.5">
              <Label htmlFor="pickup-instructions">Instruções de retirada</Label>
              <IconTextarea
                id="pickup-instructions"
                icon={Store}
                value={pickupInstructions}
                onChange={setPickupInstructions}
                maxLength={INSTRUCTION_MAX}
                placeholder="Ex.: Retirar com 15 min de antecedência"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery-fee">Taxa fixa de entrega (R$)</Label>
              <IconInput
                id="delivery-fee"
                name="deliveryFee"
                icon={CircleDollarSign}
                inputMode="decimal"
                defaultValue={feeDefault}
                placeholder="Deixe vazio se não houver taxa fixa"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery-instructions">
                Regiões e orientações de entrega
              </Label>
              <IconTextarea
                id="delivery-instructions"
                icon={Motorbike}
                value={deliveryInstructions}
                onChange={setDeliveryInstructions}
                maxLength={INSTRUCTION_MAX}
                placeholder="Ex.: Atendemos bairros X e Y"
              />
            </div>
          </div>
        </section>

          <AccordionPanel
            title="Entrega"
            icon={Motorbike}
            open={deliveryOpen}
            onToggle={() => {
              setDeliveryOpen((o) => !o);
              if (!deliveryOpen) openDeliveryPanel();
            }}
            disabled={!deliveryEnabled}
            className="order-3 md:col-start-1"
          >
            <div className="divide-y divide-[var(--painel-border)]">
              <div className="flex flex-col gap-3 py-1 pb-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:pb-4">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-cocoa">
                    Baixa automática ao confirmar pedido
                  </p>
                  <p className="text-xs leading-relaxed text-[#8C8682]">
                    Baixa a quantidade dos produtos prontos na venda. Ingredientes
                    são controlados em Insumos.
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <Label
                    htmlFor="auto-deduct-stock"
                    className="text-xs text-[#8C8682] sm:sr-only"
                  >
                    Ativar baixa automática
                  </Label>
                  <Switch
                    id="auto-deduct-stock"
                    checked={autoDeductStock}
                    onCheckedChange={setAutoDeductStock}
                  />
                </div>
              </div>
            </div>
          </AccordionPanel>
      </div>

      <div
        className="flex w-full flex-col-reverse gap-2.5 rounded-lg border border-[var(--painel-border)] bg-white px-3.5 py-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-end sm:gap-3 sm:rounded-xl sm:px-5 sm:py-4"
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
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
