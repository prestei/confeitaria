"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { getStoreOpenStatus } from "@/lib/hours";
import { trackStoreEvent } from "@/lib/analytics";

const STEPS = [
  { id: 1, title: "O que você deseja?" },
  { id: 2, title: "Personalização" },
  { id: 3, title: "Data e quantidade" },
  { id: 4, title: "Seus dados" },
  { id: 5, title: "Revisão" },
] as const;

const PRODUCT_TYPES = [
  { value: "CAKE", label: "Bolo personalizado" },
  { value: "PARTY_KIT", label: "Kit festa" },
  { value: "CUSTOM", label: "Doces sob encomenda" },
  { value: "CORPORATE", label: "Corporativo" },
] as const;

type FormState = {
  productType: string;
  size: string;
  batter: string;
  filling: string;
  frosting: string;
  theme: string;
  colors: string;
  message: string;
  eventDate: string;
  eventTime: string;
  guests: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryZone: string;
  notes: string;
  referenceNote: string;
};

const initial: FormState = {
  productType: "CAKE",
  size: "",
  batter: "",
  filling: "",
  frosting: "",
  theme: "",
  colors: "",
  message: "",
  eventDate: "",
  eventTime: "",
  guests: "",
  customerName: "",
  customerPhone: "",
  customerEmail: "",
  fulfillment: "PICKUP",
  deliveryZone: "",
  notes: "",
  referenceNote: "",
};

export function CustomOrderWizard({
  store,
}: {
  store: {
    slug: string;
    name: string;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    minAdvanceDays: number;
    businessHours?: string | null;
    deliveryZones: { name: string; feeCents: number }[];
  };
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    ...initial,
    fulfillment: store.pickupEnabled ? "PICKUP" : "DELIVERY",
    deliveryZone: store.deliveryZones[0]?.name || "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const openStatus = useMemo(
    () => getStoreOpenStatus(store.businessHours),
    [store.businessHours],
  );
  const storeClosed = openStatus.scheduled && !openStatus.open;

  const typeLabel = useMemo(
    () => PRODUCT_TYPES.find((t) => t.value === form.productType)?.label ?? form.productType,
    [form.productType],
  );

  function patch(partial: Partial<FormState>) {
    setForm((f) => ({ ...f, ...partial }));
  }

  function validateStep() {
    if (storeClosed) {
      return openStatus.todayLabel
        ? `A loja está fechada agora (${openStatus.todayLabel})`
        : "A loja está fechada no momento";
    }
    if (step === 1 && !form.productType) return "Escolha o tipo de encomenda";
    if (step === 3) {
      if (!form.eventDate) return "Informe a data desejada";
      if (!form.guests) return "Informe a quantidade de pessoas";
    }
    if (step === 4) {
      if (form.customerName.trim().length < 2) return "Informe seu nome";
      if (form.customerPhone.replace(/\D/g, "").length < 8) return "Informe um WhatsApp válido";
    }
    return "";
  }

  function next() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setStep((s) => Math.min(5, s + 1));
  }

  function back() {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  }

  async function submit() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError("");

    const customizations: Record<string, string> = {};
    if (form.size) customizations.Tamanho = form.size;
    if (form.batter) customizations.Massa = form.batter;
    if (form.filling) customizations.Recheio = form.filling;
    if (form.frosting) customizations.Cobertura = form.frosting;
    if (form.theme) customizations.Tema = form.theme;
    if (form.colors) customizations.Cores = form.colors;
    if (form.message) customizations.Mensagem = form.message;

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: store.slug,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || "",
        fulfillment: form.fulfillment,
        deliveryZone:
          form.fulfillment === "DELIVERY" ? form.deliveryZone || undefined : undefined,
        eventDate: form.eventDate || undefined,
        eventTime: form.eventTime || undefined,
        guests: form.guests ? Number(form.guests) : undefined,
        notes: form.notes || undefined,
        referenceNote: form.referenceNote || undefined,
        items: [
          {
            productName: typeLabel,
            quantity: 1,
            unitPriceCents: 0,
            priceMode: "QUOTE",
            customizations,
          },
        ],
      }),
    });

    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Não foi possível enviar a encomenda");
      return;
    }

    trackStoreEvent({
      storeSlug: store.slug,
      type: "WHATSAPP_CLICK",
      source: "encomenda",
      meta: { orderId: json.orderId },
    });
    window.open(json.whatsappUrl, "_blank");
    window.location.href = `/${store.slug}/pedido-enviado?id=${json.orderId}`;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-8 flex gap-2 overflow-x-auto pb-1" aria-label="Etapas">
        {STEPS.map((s) => (
          <li
            key={s.id}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold",
              step === s.id
                ? "bg-cocoa text-white"
                : step > s.id
                  ? "bg-blush text-berry-deep"
                  : "bg-white text-cocoa-soft/60",
            )}
          >
            <span>{s.id}</span>
            <span className="hidden sm:inline">{s.title}</span>
          </li>
        ))}
      </ol>

      <div className="panel overflow-hidden p-6 sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.22 }}
          >
            <h2 className="font-display text-2xl text-cocoa sm:text-3xl">
              {STEPS[step - 1].title}
            </h2>

            {step === 1 && (
              <div className="mt-6 grid gap-3">
                {PRODUCT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => patch({ productType: t.value })}
                    className={cn(
                      "rounded-2xl border px-4 py-4 text-left transition",
                      form.productType === t.value
                        ? "border-berry bg-blush/60"
                        : "border-cocoa/10 bg-white hover:border-cocoa/20",
                    )}
                  >
                    <span className="font-semibold text-cocoa">{t.label}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="size">Tamanho</Label>
                  <Input
                    id="size"
                    value={form.size}
                    onChange={(e) => patch({ size: e.target.value })}
                    placeholder="Ex: 2 kg / 20 fatias"
                  />
                </div>
                <div>
                  <Label htmlFor="batter">Massa</Label>
                  <Input
                    id="batter"
                    value={form.batter}
                    onChange={(e) => patch({ batter: e.target.value })}
                    placeholder="Ex: chocolate"
                  />
                </div>
                <div>
                  <Label htmlFor="filling">Recheio</Label>
                  <Input
                    id="filling"
                    value={form.filling}
                    onChange={(e) => patch({ filling: e.target.value })}
                    placeholder="Ex: ninho"
                  />
                </div>
                <div>
                  <Label htmlFor="frosting">Cobertura</Label>
                  <Input
                    id="frosting"
                    value={form.frosting}
                    onChange={(e) => patch({ frosting: e.target.value })}
                    placeholder="Ex: chantilly"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="theme">Tema</Label>
                  <Input
                    id="theme"
                    value={form.theme}
                    onChange={(e) => patch({ theme: e.target.value })}
                    placeholder="Ex: jardim, infantil, floral"
                  />
                </div>
                <div>
                  <Label htmlFor="colors">Cores</Label>
                  <Input
                    id="colors"
                    value={form.colors}
                    onChange={(e) => patch({ colors: e.target.value })}
                    placeholder="Ex: rosa e dourado"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Mensagem no bolo</Label>
                  <Input
                    id="message"
                    value={form.message}
                    onChange={(e) => patch({ message: e.target.value })}
                    placeholder="Opcional"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="referenceNote">Referência visual</Label>
                  <Textarea
                    id="referenceNote"
                    value={form.referenceNote}
                    onChange={(e) => patch({ referenceNote: e.target.value })}
                    placeholder="Descreva uma referência ou link de imagem"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="eventDate">Data do evento</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    required
                    value={form.eventDate}
                    onChange={(e) => patch({ eventDate: e.target.value })}
                  />
                  <p className="mt-1.5 text-xs text-cocoa-soft/65">
                    Prazo mínimo: {store.minAdvanceDays} dia
                    {store.minAdvanceDays > 1 ? "s" : ""}
                  </p>
                </div>
                <div>
                  <Label htmlFor="eventTime">Horário</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    value={form.eventTime}
                    onChange={(e) => patch({ eventTime: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="guests">Quantidade de pessoas</Label>
                  <Input
                    id="guests"
                    type="number"
                    min={1}
                    value={form.guests}
                    onChange={(e) => patch({ guests: e.target.value })}
                    placeholder="Ex: 30"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="mt-6 grid gap-4">
                <div>
                  <Label htmlFor="customerName">Nome</Label>
                  <Input
                    id="customerName"
                    value={form.customerName}
                    onChange={(e) => patch({ customerName: e.target.value })}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">WhatsApp</Label>
                  <Input
                    id="customerPhone"
                    value={form.customerPhone}
                    onChange={(e) => patch({ customerPhone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">E-mail (opcional)</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => patch({ customerEmail: e.target.value })}
                    autoComplete="email"
                  />
                </div>
                <fieldset>
                  <legend className="label">Recebimento</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {store.pickupEnabled && (
                      <button
                        type="button"
                        onClick={() => patch({ fulfillment: "PICKUP" })}
                        className={cn(
                          "rounded-xl border px-4 py-2 text-sm font-semibold",
                          form.fulfillment === "PICKUP"
                            ? "border-berry bg-blush text-berry-deep"
                            : "border-cocoa/10",
                        )}
                      >
                        Retirada
                      </button>
                    )}
                    {store.deliveryEnabled && (
                      <button
                        type="button"
                        onClick={() => patch({ fulfillment: "DELIVERY" })}
                        className={cn(
                          "rounded-xl border px-4 py-2 text-sm font-semibold",
                          form.fulfillment === "DELIVERY"
                            ? "border-berry bg-blush text-berry-deep"
                            : "border-cocoa/10",
                        )}
                      >
                        Entrega
                      </button>
                    )}
                  </div>
                </fieldset>
                {form.fulfillment === "DELIVERY" && store.deliveryZones.length > 0 && (
                  <div>
                    <Label htmlFor="zone">Região</Label>
                    <Select
                      id="zone"
                      value={form.deliveryZone}
                      onChange={(e) => patch({ deliveryZone: e.target.value })}
                    >
                      {store.deliveryZones.map((z) => (
                        <option key={z.name} value={z.name}>
                          {z.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => patch({ notes: e.target.value })}
                    placeholder="Alergias, preferências, detalhes extras"
                  />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="mt-6 space-y-4 text-sm text-cocoa-soft/85">
                <ReviewRow label="Tipo" value={typeLabel} />
                <ReviewRow label="Data" value={form.eventDate || "—"} />
                <ReviewRow label="Horário" value={form.eventTime || "—"} />
                <ReviewRow label="Pessoas" value={form.guests || "—"} />
                <ReviewRow label="Cliente" value={form.customerName} />
                <ReviewRow label="WhatsApp" value={form.customerPhone} />
                <ReviewRow
                  label="Recebimento"
                  value={form.fulfillment === "DELIVERY" ? `Entrega · ${form.deliveryZone}` : "Retirada"}
                />
                {(form.theme || form.size || form.batter || form.filling) && (
                  <div className="rounded-2xl bg-fog/80 p-4">
                    <p className="font-semibold text-cocoa">Personalização</p>
                    <ul className="mt-2 space-y-1">
                      {form.size && <li>Tamanho: {form.size}</li>}
                      {form.batter && <li>Massa: {form.batter}</li>}
                      {form.filling && <li>Recheio: {form.filling}</li>}
                      {form.frosting && <li>Cobertura: {form.frosting}</li>}
                      {form.theme && <li>Tema: {form.theme}</li>}
                      {form.colors && <li>Cores: {form.colors}</li>}
                      {form.message && <li>Mensagem: {form.message}</li>}
                    </ul>
                  </div>
                )}
                <p className="rounded-2xl border border-berry/20 bg-blush/40 px-4 py-3 text-berry-deep">
                  O valor será confirmado no WhatsApp após análise da encomenda.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {storeClosed && (
          <p className="mt-4 rounded-xl border border-rosewood/25 bg-sand px-3 py-2 text-sm text-rosewood">
            A loja está fechada no momento
            {openStatus.todayLabel ? ` (${openStatus.todayLabel})` : ""}.
            Encomendas só são aceitas no horário de funcionamento.
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={back}
            disabled={step === 1 || loading}
          >
            Voltar
          </Button>
          {step < 5 ? (
            <Button type="button" variant="berry" onClick={next} disabled={storeClosed}>
              Continuar
            </Button>
          ) : (
            <Button
              type="button"
              variant="berry"
              loading={loading}
              onClick={submit}
              disabled={storeClosed}
            >
              Enviar no WhatsApp
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-cocoa/6 pb-3">
      <span className="text-cocoa-soft/60">{label}</span>
      <span className="text-right font-medium text-cocoa">{value}</span>
    </div>
  );
}
