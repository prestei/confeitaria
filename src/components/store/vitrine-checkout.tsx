"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { Field, Label } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";

export function VitrineCheckout({
  store,
}: {
  store: {
    slug: string;
    collectAddress: boolean;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    deliveryFeeCents: number;
    schedulingEnabled: boolean;
    minAdvanceDays: number;
    productionNote: string | null;
  };
}) {
  const { items, updateQty, removeItem, subtotalCents, clear } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    store.deliveryEnabled && !store.pickupEnabled ? "DELIVERY" : "PICKUP",
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const deliveryFee =
    fulfillment === "DELIVERY" ? store.deliveryFeeCents : 0;
  const totalCents = subtotalCents + deliveryFee;

  const showFulfillmentChoice =
    store.pickupEnabled && store.deliveryEnabled;

  const needsAddress =
    fulfillment === "DELIVERY" &&
    (store.collectAddress || store.deliveryEnabled);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (items.length === 0 || submitting.current) return;
    if (fulfillment === "DELIVERY" && !store.deliveryEnabled) {
      setError("Esta loja não oferece entrega.");
      return;
    }
    if (fulfillment === "PICKUP" && !store.pickupEnabled) {
      setError("Esta loja não oferece retirada.");
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: store.slug,
        checkoutMode: "whatsapp",
        customerName: name,
        customerPhone: phone,
        fulfillment,
        eventDate: store.schedulingEnabled && date ? date : undefined,
        eventTime: store.schedulingEnabled && time ? time : undefined,
        notes: notes || undefined,
        deliveryAddress:
          fulfillment === "DELIVERY" ? address || undefined : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          priceMode: item.priceMode,
          customizations: item.customizations,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      submitting.current = false;
      setError(data.error || "Não foi possível preparar o pedido");
      return;
    }
    clear();
    if (data.whatsappUrl) {
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    }
    window.location.href = `/${store.slug}/pedido-enviado?id=${data.orderId}`;
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-cocoa-soft/80">Sua sacola está vazia.</p>
        <Link href={`/${store.slug}`} className="btn-primary mt-4 inline-flex">
          Ver vitrine
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto grid max-w-lg gap-4 px-4 py-6">
      <div className="rounded-2xl border border-cocoa/8 bg-white">
        <ul className="divide-y divide-cocoa/8">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-cocoa">{item.productName}</p>
                <p className="text-sm text-cocoa-soft/70">
                  {formatBRL(item.unitPriceCents * item.quantity)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="rounded-full border border-cocoa/15 p-1"
                  onClick={() => updateQty(item.key, item.quantity - 1)}
                  aria-label="Diminuir"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm">{item.quantity}</span>
                <button
                  type="button"
                  className="rounded-full border border-cocoa/15 p-1"
                  onClick={() => updateQty(item.key, item.quantity + 1)}
                  aria-label="Aumentar"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="p-1 text-cocoa-soft/50"
                  onClick={() => removeItem(item.key)}
                  aria-label="Remover"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-cocoa/8 px-4 py-3 text-sm">
          <span>Subtotal</span>
          <span>{formatBRL(subtotalCents)}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between px-4 py-1 text-sm text-cocoa-soft/80">
            <span>Taxa de entrega</span>
            <span>{formatBRL(deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between px-4 pb-4 pt-2 text-base font-semibold text-cocoa">
          <span>Total estimado</span>
          <span>{formatBRL(totalCents)}</span>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-cocoa/8 bg-white p-4">
        {showFulfillmentChoice ? (
          <div>
            <Label>Como deseja receber?</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-medium",
                  fulfillment === "PICKUP"
                    ? "border-cocoa bg-cocoa text-white"
                    : "border-cocoa/15 text-cocoa",
                )}
                onClick={() => setFulfillment("PICKUP")}
              >
                Retirada
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-medium",
                  fulfillment === "DELIVERY"
                    ? "border-cocoa bg-cocoa text-white"
                    : "border-cocoa/15 text-cocoa",
                )}
                onClick={() => setFulfillment("DELIVERY")}
              >
                Entrega
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-cocoa-soft/80">
            {fulfillment === "DELIVERY"
              ? "Pedido para entrega"
              : "Pedido para retirada"}
          </p>
        )}

        <Field
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Field
          label="WhatsApp"
          control={
            <MaskedInput
              kind="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          }
        />

        {store.schedulingEnabled ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Data desejada"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Field
                label="Horário desejado"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <p className="text-xs text-cocoa-soft/60">
              Data e horário dependem da confirmação da confeitaria no WhatsApp.
            </p>
          </>
        ) : null}

        {needsAddress ? (
          <Field
            label="Endereço para entrega"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        ) : null}

        <Field
          as="textarea"
          label="Observações"
          controlClassName="min-h-20"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {store.minAdvanceDays > 0 && store.schedulingEnabled ? (
          <p className="text-xs text-cocoa-soft/60">
            Prazo mínimo de encomenda: {store.minAdvanceDays} dia(s).
          </p>
        ) : null}
        {store.productionNote ? (
          <p className="text-xs text-cocoa-soft/60">{store.productionNote}</p>
        ) : null}

        {error && <p className="text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Preparando mensagem…" : "Enviar pedido pelo WhatsApp"}
        </button>
      </div>
    </form>
  );
}
