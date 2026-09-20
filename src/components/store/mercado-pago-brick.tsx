"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { formatBRL } from "@/lib/utils";

type Props = {
  publicKey: string;
  orderId: string;
  amountCents: number;
  storeSlug: string;
  payerEmail?: string;
};

export function MercadoPagoBrick({
  publicKey,
  orderId,
  amountCents,
  storeSlug,
  payerEmail,
}: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const amount = Number((amountCents / 100).toFixed(2));

  useEffect(() => {
    initMercadoPago(publicKey, { locale: "pt-BR" });
    setReady(true);
  }, [publicKey]);

  if (!ready) {
    return (
      <div className="rounded-2xl border border-cocoa/10 bg-sand/40 p-6 text-center text-sm text-cocoa-soft">
        Carregando pagamento…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cocoa/8 bg-sand/40 px-4 py-3 text-center">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-cocoa-soft/55">
          Total a pagar
        </p>
        <p className="mt-1 font-display text-3xl text-cocoa">
          {formatBRL(amountCents)}
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-berry/20 bg-berry/5 px-4 py-3 text-sm text-berry-deep">
          {error}
        </p>
      )}

      <Payment
        initialization={{
          amount,
          payer: payerEmail ? { email: payerEmail } : undefined,
        }}
        customization={{
          paymentMethods: {
            maxInstallments: 12,
            creditCard: "all",
            debitCard: "all",
            ticket: "all",
            bankTransfer: "all",
          },
        }}
        onSubmit={async ({ formData }) => {
          setError("");
          const res = await fetch("/api/payments/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, formData }),
          });
          const json = await res.json();
          if (!res.ok) {
            setError(json.error || "Não foi possível processar o pagamento");
            throw new Error(json.error || "payment_failed");
          }

          const status =
            json.paymentStatus === "APPROVED"
              ? "approved"
              : json.paymentStatus === "PENDING"
                ? "pending"
                : json.paymentStatus === "REJECTED"
                  ? "rejected"
                  : "pending";

          window.location.href = `/${storeSlug}/pedido-pago?id=${orderId}&status=${status}`;
        }}
        onReady={() => {}}
        onError={(err) => {
          console.error("[MercadoPagoBrick]", err);
          setError("Erro ao carregar o formulário de pagamento.");
        }}
      />
    </div>
  );
}
