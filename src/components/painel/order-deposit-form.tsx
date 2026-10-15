"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
import { formatBRL } from "@/lib/utils";
import {
  Sheet,
  SheetBody,
  SheetCancel,
  SheetContent,
  SheetFooter,
  SheetForm,
  SheetHeader,
  SheetPrimary,
} from "@/components/ui/sheet";
import { Field } from "@/components/ui/input";

export function OrderDepositForm({
  orderId,
  totalCents,
  amountPaidCents,
}: {
  orderId: string;
  totalCents: number;
  amountPaidCents: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(
    (amountPaidCents / 100).toFixed(2).replace(".", ","),
  );
  const [message, setMessage] = useState("");
  const balance = Math.max(0, totalCents - amountPaidCents);

  function openSheet() {
    setValue((amountPaidCents / 100).toFixed(2).replace(".", ","));
    setMessage("");
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const amountPaid = Math.round(Number(value.replace(",", ".")) * 100);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountPaidCents: Number.isFinite(amountPaid) ? amountPaid : 0,
      }),
    });
    setMessage(res.ok ? "Salvo" : "Não foi possível salvar");
    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
  }

  return (
    <>
      <div className="space-y-2 px-5 py-4 text-sm">
        <div className="flex justify-between">
          <span className="text-cocoa-soft/70">Total</span>
          <span className="font-medium text-cocoa">{formatBRL(totalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cocoa-soft/70">Sinal / pago</span>
          <span className="font-medium text-cocoa">
            {formatBRL(amountPaidCents)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-cocoa-soft/70">Saldo</span>
          <span className="font-medium text-cocoa">{formatBRL(balance)}</span>
        </div>
        <button
          type="button"
          className="btn-secondary !py-2 text-sm w-full"
          onClick={openSheet}
        >
          <Wallet className="h-4 w-4" />
          Registrar sinal
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent size="sm" side="right">
          <SheetHeader title="Sinal / valor pago" />
          <SheetForm onSubmit={onSubmit}>
            <SheetBody className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-cocoa-soft/70">Total do pedido</span>
                <span className="font-medium text-cocoa">
                  {formatBRL(totalCents)}
                </span>
              </div>
              <Field
                label="Valor pago / sinal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <div className="flex justify-between">
                <span className="text-cocoa-soft/70">Saldo restante</span>
                <span className="font-medium text-cocoa">
                  {formatBRL(balance)}
                </span>
              </div>
              {message ? (
                <p className="text-xs text-cocoa-soft/60">{message}</p>
              ) : null}
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary>Salvar sinal</SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>
    </>
  );
}
