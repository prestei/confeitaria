"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/utils";

type Zone = { name: string; feeCents: number };

export function CheckoutForm({
  store,
}: {
  store: {
    slug: string;
    name: string;
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    paymentMethods: string[];
    minAdvanceDays: number;
    deliveryZones: Zone[];
  };
}) {
  const { items, updateQty, removeItem, clear, subtotalCents, hasQuoteItems } =
    useCart();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    store.pickupEnabled ? "PICKUP" : "DELIVERY",
  );
  const [zone, setZone] = useState(store.deliveryZones[0]?.name || "");

  const fee = useMemo(() => {
    if (fulfillment !== "DELIVERY") return 0;
    return store.deliveryZones.find((z) => z.name === zone)?.feeCents ?? 0;
  }, [fulfillment, zone, store.deliveryZones]);

  const total = subtotalCents + fee;
  const priceHint = hasQuoteItems
    ? "Valor a confirmar"
    : items.some((i) => i.priceMode === "FROM")
      ? "Total estimado"
      : "Total";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!items.length) {
      setError("Adicione produtos ao pedido");
      return;
    }
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: store.slug,
        customerName: String(fd.get("customerName")),
        customerPhone: String(fd.get("customerPhone")),
        customerEmail: String(fd.get("customerEmail") || ""),
        companyName: String(fd.get("companyName") || "") || undefined,
        needsInvoice: fd.get("needsInvoice") === "on",
        fulfillment,
        deliveryZone: fulfillment === "DELIVERY" ? zone : undefined,
        eventDate: String(fd.get("eventDate") || "") || undefined,
        eventTime: String(fd.get("eventTime") || "") || undefined,
        guests: fd.get("guests") ? Number(fd.get("guests")) : undefined,
        notes: String(fd.get("notes") || "") || undefined,
        referenceNote: String(fd.get("referenceNote") || "") || undefined,
        paymentMethod: String(fd.get("paymentMethod") || "") || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
          customizations: i.customizations,
          priceMode: i.priceMode,
        })),
      }),
    });

    const json = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(json.error || "Não foi possível enviar o pedido");
      return;
    }

    clear();
    window.open(json.whatsappUrl, "_blank");
    window.location.href = `/${store.slug}/pedido-enviado?id=${json.orderId}`;
  }

  if (!items.length) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <h1 className="font-display text-3xl text-cocoa">Seu pedido está vazio</h1>
        <p className="mt-2 text-cocoa-soft/75">
          Escolha produtos no cardápio para continuar.
        </p>
        <Link href={`/${store.slug}`} className="btn-primary mt-6 inline-flex">
          Voltar ao cardápio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.95fr]">
      <section className="panel p-6">
        <h1 className="font-display text-3xl text-cocoa">Seu pedido</h1>
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li
              key={item.key}
              className="rounded-2xl border border-cocoa/8 bg-white/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-cocoa">{item.productName}</p>
                  {item.customizations && (
                    <ul className="mt-1 text-xs text-cocoa-soft/70">
                      {Object.entries(item.customizations).map(([k, v]) => (
                        <li key={k}>
                          {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  type="button"
                  className="text-xs text-berry"
                  onClick={() => removeItem(item.key)}
                >
                  Remover
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <input
                  type="number"
                  min={1}
                  className="input !w-20 !py-1.5"
                  value={item.quantity}
                  onChange={(e) =>
                    updateQty(item.key, Number(e.target.value) || 1)
                  }
                />
                <p className="font-medium text-cocoa">
                  {item.priceMode === "QUOTE"
                    ? "Orçamento"
                    : formatBRL(item.unitPriceCents * item.quantity)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-cocoa/8 pt-4 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{hasQuoteItems ? "—" : formatBRL(subtotalCents)}</span>
          </div>
          {fee > 0 && (
            <div className="mt-1 flex justify-between">
              <span>Entrega</span>
              <span>{formatBRL(fee)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-base font-semibold">
            <span>{priceHint}</span>
            <span>
              {hasQuoteItems ? "A confirmar" : formatBRL(total)}
            </span>
          </div>
        </div>
      </section>

      <section className="panel p-6">
        <h2 className="font-display text-2xl text-cocoa">Seus dados</h2>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="label">Nome</label>
            <input name="customerName" required className="input" />
          </div>
          <div>
            <label className="label">WhatsApp</label>
            <input name="customerPhone" required className="input" />
          </div>
          <div>
            <label className="label">E-mail (opcional)</label>
            <input name="customerEmail" type="email" className="input" />
          </div>

          <div>
            <p className="label">Retirada ou entrega</p>
            <div className="flex flex-wrap gap-2">
              {store.pickupEnabled && (
                <button
                  type="button"
                  onClick={() => setFulfillment("PICKUP")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    fulfillment === "PICKUP"
                      ? "bg-cocoa text-white"
                      : "bg-white/70 border border-cocoa/10"
                  }`}
                >
                  Retirada
                </button>
              )}
              {store.deliveryEnabled && (
                <button
                  type="button"
                  onClick={() => setFulfillment("DELIVERY")}
                  className={`rounded-full px-4 py-2 text-sm ${
                    fulfillment === "DELIVERY"
                      ? "bg-cocoa text-white"
                      : "bg-white/70 border border-cocoa/10"
                  }`}
                >
                  Entrega
                </button>
              )}
            </div>
          </div>

          {fulfillment === "DELIVERY" && store.deliveryZones.length > 0 && (
            <div>
              <label className="label">Região</label>
              <select
                className="input"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              >
                {store.deliveryZones.map((z) => (
                  <option key={z.name} value={z.name}>
                    {z.name} ({formatBRL(z.feeCents)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Data (se encomenda)</label>
              <input name="eventDate" type="date" className="input" />
              <p className="mt-1 text-xs text-cocoa-soft/60">
                Mínimo {store.minAdvanceDays} dias
              </p>
            </div>
            <div>
              <label className="label">Horário</label>
              <input name="eventTime" type="time" className="input" />
            </div>
          </div>

          <div>
            <label className="label">Convidados (kits/festas)</label>
            <input name="guests" type="number" min={1} className="input" />
          </div>
          <div>
            <label className="label">Empresa (corporativo)</label>
            <input name="companyName" className="input" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input name="needsInvoice" type="checkbox" />
            Preciso de nota fiscal
          </label>
          <div>
            <label className="label">Pagamento preferido</label>
            <select name="paymentMethod" className="input">
              {store.paymentMethods.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea name="notes" className="input min-h-24" />
          </div>

          {error && (
            <p className="rounded-xl bg-berry/10 px-3 py-2 text-sm text-berry-deep">
              ⚠️ {error}
            </p>
          )}

          <button type="submit" className="btn-berry w-full" disabled={loading}>
            {loading
              ? "Gerando pedido..."
              : hasQuoteItems
                ? "Enviar orçamento no WhatsApp"
                : "Enviar pedido no WhatsApp"}
          </button>
        </form>
      </section>
    </div>
  );
}
