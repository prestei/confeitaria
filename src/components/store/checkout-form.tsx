"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Store,
  UserRound,
  Wallet,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import {
  formatBRL,
  ONLINE_PAYMENT_METHOD,
  isDepositPaymentMethod,
  paymentMethodHint,
  paymentMethodSummary,
} from "@/lib/utils";
import { cn } from "@/lib/cn";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const MercadoPagoBrick = dynamic(
  () =>
    import("@/components/store/mercado-pago-brick").then(
      (m) => m.MercadoPagoBrick,
    ),
  { ssr: false },
);

type Zone = { name: string; feeCents: number };

const STEPS = [
  {
    id: 1,
    title: "Sacola",
    short: "Itens",
    hint: "Revise produtos e quantidades",
  },
  {
    id: 2,
    title: "Dados pessoais",
    short: "Dados",
    hint: "Para o WhatsApp da confeitaria",
  },
  {
    id: 3,
    title: "Entrega",
    short: "Entrega",
    hint: "Retirada ou delivery e data",
  },
  {
    id: 4,
    title: "Pagamento",
    short: "Pagar",
    hint: "Escolha como deseja pagar",
  },
  {
    id: 5,
    title: "Confirmar",
    short: "Enviar",
    hint: "Revise e finalize o pedido",
  },
] as const;

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
    mpOnlineEnabled: boolean;
  };
}) {
  const {
    items,
    updateQty,
    removeItem,
    clear,
    subtotalCents,
    hasQuoteItems,
    count,
  } = useCart();
  const reduced = useReducedMotion();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [mpOnlineEnabled, setMpOnlineEnabled] = useState(store.mpOnlineEnabled);
  const [mpPublicKey, setMpPublicKey] = useState<string | null>(null);
  const [payOrder, setPayOrder] = useState<{
    orderId: string;
    totalCents: number;
  } | null>(null);

  // Orçamento (QUOTE) não tem valor cobrável; FIXED e "a partir de" (FROM)
  // usam o valor listado no carrinho e podem pagar online.
  const onlineEligible = mpOnlineEnabled && !hasQuoteItems;

  const paymentOptions = useMemo(() => {
    const offline = store.paymentMethods;
    if (onlineEligible) return [ONLINE_PAYMENT_METHOD, ...offline];
    return offline;
  }, [onlineEligible, store.paymentMethods]);

  const [fulfillment, setFulfillment] = useState<"PICKUP" | "DELIVERY">(
    store.pickupEnabled ? "PICKUP" : "DELIVERY",
  );
  const [zone, setZone] = useState(store.deliveryZones[0]?.name || "");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [guests, setGuests] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(() =>
    store.mpOnlineEnabled
      ? ONLINE_PAYMENT_METHOD
      : store.paymentMethods[0] || "",
  );
  const [notes, setNotes] = useState("");
  const [referenceNote, setReferenceNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/payments/config?slug=${encodeURIComponent(store.slug)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        const enabled = Boolean(json.enabled && json.publicKey);
        setMpOnlineEnabled(enabled);
        setMpPublicKey(enabled ? json.publicKey : null);
        if (enabled) {
          setPaymentMethod(ONLINE_PAYMENT_METHOD);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMpOnlineEnabled(false);
          setMpPublicKey(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [store.slug]);

  useEffect(() => {
    if (!paymentOptions.length) return;
    if (!paymentOptions.includes(paymentMethod)) {
      setPaymentMethod(paymentOptions[0]);
    }
  }, [paymentOptions, paymentMethod]);

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
  const isOnlinePayment = paymentMethod === ONLINE_PAYMENT_METHOD;

  function validateStep() {
    if (step === 1 && !items.length) return "Adicione produtos à sacola";
    if (step === 2) {
      if (customerName.trim().length < 2) return "Informe seu nome";
      if (customerPhone.replace(/\D/g, "").length < 8) {
        return "Informe um WhatsApp válido";
      }
      if (isOnlinePayment && !customerEmail.trim()) {
        return "Informe um e-mail para o pagamento online";
      }
    }
    if (step === 3) {
      if (fulfillment === "DELIVERY" && store.deliveryZones.length && !zone) {
        return "Escolha a região de entrega";
      }
    }
    if (step === 4 || step === 5) {
      if (!paymentOptions.length) {
        return "Esta loja ainda não configurou formas de pagamento";
      }
      if (!paymentMethod || !paymentOptions.includes(paymentMethod)) {
        return "Escolha uma forma de pagamento";
      }
      if (isOnlinePayment && !customerEmail.trim()) {
        return "Volte em Dados e informe um e-mail para pagar online";
      }
      if (isOnlinePayment && !mpPublicKey) {
        return "Pagamento online ainda está carregando. Aguarde um instante.";
      }
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
    setStep((s) => Math.min(STEPS.length, s + 1));
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
    if (!items.length) {
      setError("Adicione produtos ao pedido");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeSlug: store.slug,
        customerName,
        customerPhone,
        customerEmail: customerEmail || "",
        fulfillment,
        deliveryZone: fulfillment === "DELIVERY" ? zone : undefined,
        eventDate: eventDate || undefined,
        eventTime: eventTime || undefined,
        guests: guests ? Number(guests) : undefined,
        notes: notes || undefined,
        referenceNote: referenceNote || undefined,
        paymentMethod: paymentMethod || undefined,
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

    if (json.requiresOnlinePayment) {
      if (!mpPublicKey) {
        setError(
          "Pedido criado, mas o pagamento online não carregou. Atualize a página ou fale com a loja.",
        );
        return;
      }
      setPayOrder({ orderId: json.orderId, totalCents: json.totalCents });
      clear();
      return;
    }

    clear();
    window.open(json.whatsappUrl, "_blank");
    window.location.href = `/${store.slug}/pedido-enviado?id=${json.orderId}`;
  }

  if (payOrder && mpPublicKey) {
    return (
      <div className="bg-ivory">
        <div className="shell py-10 md:py-16">
          <div className="mx-auto max-w-lg space-y-6">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cocoa-soft/55">
                Checkout
              </p>
              <h1 className="mt-2 font-display text-3xl text-cocoa md:text-4xl">
                Pagamento
              </h1>
              <p className="mt-2 text-sm text-cocoa-soft/80">
                Pedido criado. Finalize com Mercado Pago para confirmar.
              </p>
            </div>
            <MercadoPagoBrick
              publicKey={mpPublicKey}
              orderId={payOrder.orderId}
              amountCents={payOrder.totalCents}
              storeSlug={store.slug}
              payerEmail={customerEmail || undefined}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="bg-ivory">
        <div className="shell py-16 md:py-24">
          <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-cocoa/10 bg-surface text-center shadow-[0_12px_40px_rgba(51,37,34,0.06)]">
            <div className="border-b border-cocoa/8 bg-sand/50 px-6 py-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-sand text-cocoa-soft">
                <ShoppingBag className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h1 className="mt-5 font-display text-3xl text-cocoa">
                Sacola vazia
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-soft/75">
                Escolha produtos no cardápio para montar seu pedido.
              </p>
            </div>
            <div className="p-6">
              <Link href={`/${store.slug}`} className="btn-primary inline-flex w-full">
                Voltar ao cardápio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory pb-20">
      {/* Steps */}
      <nav
        className="sticky top-0 z-30 border-b border-cocoa/10 bg-ivory/95 backdrop-blur-md"
        aria-label="Etapas do pedido"
      >
        <div className="shell">
          <ol className="grid grid-cols-5 gap-1 sm:gap-3">
            {STEPS.map((s) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <li key={s.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.id < step) {
                        setError("");
                        setStep(s.id);
                      }
                    }}
                    disabled={s.id > step}
                    className={cn(
                      "group -mb-px flex w-full flex-col items-center gap-2 border-b-2 px-1 pb-3 pt-4 text-center transition sm:px-2 sm:pb-3.5 sm:pt-5",
                      active && "border-rosewood",
                      done && !active && "border-rosewood/35",
                      !active && !done && "border-transparent",
                      s.id < step && "cursor-pointer",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition sm:h-10 sm:w-10",
                        active && "bg-rosewood text-white",
                        done &&
                          !active &&
                          "bg-sand text-rosewood ring-1 ring-rosewood/20",
                        !active &&
                          !done &&
                          "bg-sand/60 text-cocoa-soft/45 ring-1 ring-cocoa/8",
                      )}
                    >
                      {done ? (
                        <Check className="h-4 w-4" strokeWidth={2.75} />
                      ) : (
                        s.id
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold leading-tight sm:text-xs",
                        active && "text-rosewood",
                        done && !active && "text-cocoa-soft",
                        !active && !done && "text-cocoa-soft/45",
                      )}
                    >
                      <span className="hidden sm:inline">{s.title}</span>
                      <span className="sm:hidden">{s.short}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>

      <div className="shell relative mt-6 pt-6 lg:mt-8 lg:pt-8">
        <div className="mx-auto min-w-0 max-w-5xl space-y-5">
          <AnimatePresence mode="wait">
            <motion.section
              key={step}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduced ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.24 }}
              className="overflow-hidden rounded-2xl border border-cocoa/10 bg-surface shadow-[0_16px_48px_rgba(51,37,34,0.07)]"
            >
              <div className="flex items-center justify-between gap-4 border-b border-cocoa/8 bg-sand/40 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rosewood text-ivory">
                    {step === 1 && <ShoppingBag className="h-5 w-5" />}
                    {step === 2 && <UserRound className="h-5 w-5" />}
                    {step === 3 && <Truck className="h-5 w-5" />}
                    {step === 4 && <Wallet className="h-5 w-5" />}
                    {step === 5 &&
                      (isOnlinePayment ? (
                        <CreditCard className="h-5 w-5" />
                      ) : (
                        <MessageCircle className="h-5 w-5" />
                      ))}
                  </span>
                  <div>
                    <h1 className="font-display text-2xl text-cocoa">
                      {STEPS[step - 1].title}
                    </h1>
                    <p className="text-xs text-cocoa-soft">
                      {STEPS[step - 1].hint}
                    </p>
                  </div>
                </div>
                <span className="hidden text-xs font-medium text-cocoa-soft/55 sm:inline">
                  Etapa {step} de {STEPS.length}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                {step === 1 && (
                  <ul className="space-y-4">
                    {items.map((item) => (
                      <li
                        key={item.key}
                        className="overflow-hidden rounded-2xl border border-cocoa/8 bg-gradient-to-br from-sand/50 to-surface"
                      >
                        <div className="flex gap-0 sm:gap-0">
                          <div className="relative hidden w-[7.5rem] shrink-0 overflow-hidden bg-sand sm:block md:w-36">
                            {item.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.imageUrl}
                                alt=""
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full min-h-[7.5rem] items-center justify-center text-cocoa-soft/35">
                                <ShoppingBag className="h-8 w-8" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 gap-3">
                                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-cocoa/8 sm:hidden">
                                  {item.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                      src={item.imageUrl}
                                      alt=""
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    <div className="flex h-full items-center justify-center text-cocoa-soft/35">
                                      <ShoppingBag className="h-5 w-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-display text-xl leading-tight text-cocoa md:text-2xl">
                                    {item.productName}
                                  </p>
                                  {item.customizations &&
                                    Object.keys(item.customizations).length >
                                      0 && (
                                      <ul className="mt-2 flex flex-wrap gap-1.5">
                                        {Object.entries(
                                          item.customizations,
                                        ).map(([k, v]) => (
                                          <li
                                            key={k}
                                            className="rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-medium text-cocoa-soft"
                                          >
                                            {k}:{" "}
                                            {Array.isArray(v)
                                              ? v.join(", ")
                                              : String(v)}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.key)}
                                className="rounded-lg p-2 text-cocoa-soft/40 transition hover:bg-sand hover:text-danger"
                                aria-label={`Remover ${item.productName}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cocoa/8 pt-4">
                              <div className="inline-flex items-center rounded-xl border border-cocoa/10 bg-surface shadow-sm">
                                <button
                                  type="button"
                                  className="flex h-10 w-10 items-center justify-center text-cocoa-soft transition hover:bg-sand"
                                  onClick={() =>
                                    updateQty(item.key, item.quantity - 1)
                                  }
                                  aria-label="Diminuir"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="min-w-9 text-center text-sm font-bold tabular-nums text-cocoa">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  className="flex h-10 w-10 items-center justify-center text-cocoa-soft transition hover:bg-sand"
                                  onClick={() =>
                                    updateQty(item.key, item.quantity + 1)
                                  }
                                  aria-label="Aumentar"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-cocoa-soft/55">
                                  {item.priceMode === "FROM"
                                    ? "A partir de"
                                    : item.priceMode === "QUOTE"
                                      ? "Orçamento"
                                      : "Subtotal"}
                                </p>
                                <p className="font-display text-2xl text-cocoa">
                                  {item.priceMode === "QUOTE"
                                    ? "A confirmar"
                                    : formatBRL(
                                        item.unitPriceCents * item.quantity,
                                      )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {step === 1 && (
                  <div className="mt-5 space-y-2 border-t border-cocoa/10 pt-5 text-sm">
                    <div className="flex justify-between text-cocoa-soft">
                      <span>Subtotal</span>
                      <span className="font-medium text-cocoa">
                        {hasQuoteItems ? "—" : formatBRL(subtotalCents)}
                      </span>
                    </div>
                    {fee > 0 && (
                      <div className="flex justify-between text-cocoa-soft">
                        <span>Entrega</span>
                        <span className="font-medium text-cocoa">
                          {formatBRL(fee)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-end justify-between gap-3 pt-2">
                      <span className="font-semibold text-cocoa">
                        {priceHint}
                      </span>
                      <span className="font-display text-3xl text-cocoa">
                        {hasQuoteItems ? "A confirmar" : formatBRL(total)}
                      </span>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="label">Nome</label>
                      <input
                        className="input"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Como devemos te chamar"
                      />
                    </div>
                    <div>
                      <label className="label">WhatsApp</label>
                      <input
                        className="input"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div>
                      <label className="label">
                        E-mail{isOnlinePayment ? "" : " (opcional)"}
                      </label>
                      <input
                        type="email"
                        className="input"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        required={isOnlinePayment}
                      />
                      {onlineEligible && (
                        <p className="mt-1.5 text-xs text-cocoa-soft/65">
                          Necessário se você pagar online com Mercado Pago.
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Observações</label>
                      <textarea
                        className="input min-h-28"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Alergias, detalhes do tema, preferências…"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label">Referência (opcional)</label>
                      <input
                        className="input"
                        value={referenceNote}
                        onChange={(e) => setReferenceNote(e.target.value)}
                        placeholder="Link ou descrição de referência"
                      />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div>
                      <p className="label">Modalidade</p>
                      <div className="mt-2 grid gap-3 sm:grid-cols-2">
                        {store.pickupEnabled && (
                          <button
                            type="button"
                            onClick={() => setFulfillment("PICKUP")}
                            className={cn(
                              "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                              fulfillment === "PICKUP"
                                ? "border-rosewood/30 bg-sand shadow-[0_8px_24px_rgba(185,111,125,0.1)]"
                                : "border-cocoa/10 bg-sand/40 hover:border-rosewood/25",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                                fulfillment === "PICKUP"
                                  ? "bg-rosewood text-white"
                                  : "bg-surface text-cocoa-soft ring-1 ring-cocoa/8",
                              )}
                            >
                              <Store className="h-5 w-5" />
                            </span>
                            <span>
                              <span className="block font-display text-xl text-cocoa">
                                Retirada
                              </span>
                              <span className="mt-0.5 block text-xs text-cocoa-soft">
                                Buscar na confeitaria
                              </span>
                            </span>
                          </button>
                        )}
                        {store.deliveryEnabled && (
                          <button
                            type="button"
                            onClick={() => setFulfillment("DELIVERY")}
                            className={cn(
                              "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                              fulfillment === "DELIVERY"
                                ? "border-rosewood/30 bg-sand shadow-[0_8px_24px_rgba(185,111,125,0.1)]"
                                : "border-cocoa/10 bg-sand/40 hover:border-rosewood/25",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                                fulfillment === "DELIVERY"
                                  ? "bg-rosewood text-white"
                                  : "bg-surface text-cocoa-soft ring-1 ring-cocoa/8",
                              )}
                            >
                              <Truck className="h-5 w-5" />
                            </span>
                            <span>
                              <span className="block font-display text-xl text-cocoa">
                                Entrega
                              </span>
                              <span className="mt-0.5 block text-xs text-cocoa-soft">
                                Receber no endereço
                              </span>
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {fulfillment === "DELIVERY" &&
                      store.deliveryZones.length > 0 && (
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
                        <label className="label">Data (encomenda)</label>
                        <input
                          type="date"
                          className="input"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                        />
                        <p className="mt-1.5 text-xs text-cocoa-soft/65">
                          Antecedência mínima: {store.minAdvanceDays}{" "}
                          {store.minAdvanceDays === 1 ? "dia" : "dias"}
                        </p>
                      </div>
                      <div>
                        <label className="label">Horário</label>
                        <input
                          type="time"
                          className="input"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Convidados (opcional)</label>
                      <input
                        type="number"
                        min={1}
                        className="input"
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        placeholder="Ex.: 20"
                      />
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    {!paymentOptions.length ? (
                      <p className="rounded-2xl border border-cocoa/10 bg-sand/40 px-4 py-5 text-sm text-cocoa-soft">
                        Esta loja ainda não configurou formas de pagamento.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {paymentOptions.map((m) => {
                          const online = m === ONLINE_PAYMENT_METHOD;
                          const selected = paymentMethod === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setPaymentMethod(m)}
                              className={cn(
                                "flex items-start gap-3 rounded-2xl border p-4 text-left transition",
                                selected
                                  ? "border-rosewood/30 bg-sand shadow-[0_8px_24px_rgba(185,111,125,0.1)]"
                                  : "border-cocoa/10 bg-sand/40 hover:border-rosewood/25",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                                  selected
                                    ? "bg-rosewood text-white"
                                    : "bg-surface text-cocoa-soft ring-1 ring-cocoa/8",
                                )}
                              >
                                {online ? (
                                  <CreditCard className="h-5 w-5" />
                                ) : (
                                  <Wallet className="h-5 w-5" />
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-display text-xl text-cocoa">
                                  {online ? "Mercado Pago" : m}
                                </span>
                                <span className="mt-0.5 block text-xs text-cocoa-soft">
                                  {paymentMethodHint(m, {
                                    mpReady: Boolean(mpPublicKey),
                                  })}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {mpOnlineEnabled && hasQuoteItems && (
                      <p className="rounded-xl border border-cocoa/10 bg-sand/50 px-4 py-3 text-sm text-cocoa-soft">
                        Pagamento online fica disponível quando o pedido tem
                        valor definido. Itens sob orçamento seguem pelo
                        WhatsApp.
                      </p>
                    )}

                    {isOnlinePayment && (
                      <div className="rounded-2xl border border-rosewood/15 bg-rosewood px-4 py-3.5 text-ivory">
                        <p className="text-sm leading-relaxed text-ivory/85">
                          Na próxima etapa você revisa o pedido e segue para o
                          checkout seguro do Mercado Pago.
                        </p>
                      </div>
                    )}

                    {!isOnlinePayment && paymentMethod && (
                      <div className="rounded-2xl border border-cocoa/8 bg-sand/40 px-4 py-3.5">
                        <p className="text-sm leading-relaxed text-cocoa-soft">
                          {isDepositPaymentMethod(paymentMethod) ? (
                            <>
                              Você escolheu{" "}
                              <span className="font-semibold text-cocoa">
                                sinal (50%)
                              </span>
                              . O pedido vai no WhatsApp para a loja combinar a
                              entrada
                              {total > 0 ? (
                                <>
                                  {" "}
                                  de{" "}
                                  <span className="font-semibold text-cocoa">
                                    {formatBRL(Math.round(total / 2))}
                                  </span>{" "}
                                  e o restante ao finalizar
                                </>
                              ) : (
                                " e o restante ao finalizar"
                              )}
                              .
                            </>
                          ) : (
                            <>
                              Você escolheu{" "}
                              <span className="font-semibold text-cocoa">
                                {paymentMethod}
                              </span>
                              . O pedido será enviado pelo WhatsApp para a loja
                              confirmar e combinar o pagamento.
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    <div className="flex items-end justify-between gap-3 border-t border-cocoa/10 pt-4">
                      <span className="font-semibold text-cocoa">
                        {priceHint}
                      </span>
                      <span className="font-display text-3xl text-cocoa">
                        {hasQuoteItems ? "A confirmar" : formatBRL(total)}
                      </span>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-cocoa/8 bg-sand/40 p-4 sm:p-5">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cocoa-soft/55">
                        Itens
                      </p>
                      <ul className="mt-4 space-y-3">
                        {items.map((item) => (
                          <li
                            key={item.key}
                            className="flex items-center gap-3"
                          >
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand ring-1 ring-cocoa/8">
                              {item.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageUrl}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-cocoa-soft/35">
                                  <ShoppingBag className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-cocoa">
                                {item.quantity}× {item.productName}
                              </p>
                              {item.customizations &&
                                Object.keys(item.customizations).length >
                                  0 && (
                                  <p className="mt-0.5 truncate text-xs text-cocoa-soft/70">
                                    {Object.entries(item.customizations)
                                      .map(
                                        ([k, v]) =>
                                          `${k}: ${Array.isArray(v) ? v.join(", ") : v}`,
                                      )
                                      .join(" · ")}
                                  </p>
                                )}
                            </div>
                            <p className="shrink-0 text-sm font-semibold text-cocoa">
                              {item.priceMode === "QUOTE"
                                ? "Orçamento"
                                : formatBRL(
                                    item.unitPriceCents * item.quantity,
                                  )}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-cocoa/8 bg-surface p-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cocoa-soft/55">
                          Entrega
                        </p>
                        <p className="mt-2 font-display text-xl text-cocoa">
                          {fulfillment === "PICKUP" ? "Retirada" : "Entrega"}
                        </p>
                        <p className="mt-1 text-xs text-cocoa-soft">
                          {[
                            fulfillment === "DELIVERY" ? zone : null,
                            eventDate,
                            eventTime,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Sem data definida"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-cocoa/8 bg-surface p-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cocoa-soft/55">
                          Contato
                        </p>
                        <p className="mt-2 font-display text-xl text-cocoa">
                          {customerName}
                        </p>
                        <p className="mt-1 text-xs text-cocoa-soft">
                          {customerPhone}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-cocoa/8 bg-surface p-4 sm:col-span-2">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cocoa-soft/55">
                          Pagamento
                        </p>
                        <p className="mt-2 font-display text-xl text-cocoa">
                          {paymentMethod === ONLINE_PAYMENT_METHOD
                            ? "Mercado Pago (online)"
                            : paymentMethod || "Não informado"}
                        </p>
                        <p className="mt-1 text-xs text-cocoa-soft">
                          {paymentMethodSummary(
                            paymentMethod || "",
                            hasQuoteItems ? undefined : total,
                          )}
                        </p>
                      </div>
                    </div>

                    {notes && (
                      <div className="rounded-2xl border border-cocoa/8 bg-sand/50 p-4">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cocoa-soft/55">
                          Observações
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-cocoa-soft">
                          {notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-start gap-3 rounded-2xl bg-rosewood px-4 py-3.5 text-ivory">
                      {isOnlinePayment ? (
                        <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-ivory/70" />
                      ) : (
                        <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-ivory/70" />
                      )}
                      <p className="text-sm leading-relaxed text-ivory/85">
                        {isOnlinePayment ? (
                          <>
                            Ao confirmar, você paga com{" "}
                            <span className="font-semibold text-white">
                              Mercado Pago
                            </span>{" "}
                            sem sair da loja.
                          </>
                        ) : (
                          <>
                            Ao confirmar, abrimos o WhatsApp da{" "}
                            <span className="font-semibold text-white">
                              {store.name}
                            </span>{" "}
                            com o pedido pronto para enviar.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          </AnimatePresence>

          {error && (
            <p className="rounded-xl border border-danger/20 bg-sand px-4 py-3 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {step > 1 ? (
              <button type="button" onClick={back} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            ) : (
              <Link href={`/${store.slug}`} className="btn-secondary">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao cardápio
              </Link>
            )}
            {step < 5 ? (
              <button
                type="button"
                onClick={next}
                className="btn-primary min-w-[12rem] sm:min-w-[14rem]"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={loading}
                className="btn-primary min-w-[12rem] disabled:opacity-60 sm:min-w-[18rem]"
              >
                {isOnlinePayment ? (
                  <CreditCard className="h-4 w-4" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                {loading
                  ? "Enviando…"
                  : isOnlinePayment
                    ? "Continuar para pagamento"
                    : hasQuoteItems
                      ? "Enviar orçamento no WhatsApp"
                      : "Enviar pedido no WhatsApp"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
