"use client";

import { FormEvent, useState } from "react";
import { Pencil } from "lucide-react";
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

export function WhatsAppIntegrationForm({
  whatsapp,
  message,
  status,
}: {
  whatsapp: string;
  message: string;
  status: string;
}) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(whatsapp);
  const [msg, setMsg] = useState(message);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  function openSheet() {
    setPhone(whatsapp);
    setMsg(message);
    setFeedback("");
    setOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        whatsapp: phone,
        whatsappMessage: msg,
      }),
    });
    await fetch("/api/integrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "WHATSAPP",
        status: phone.length >= 10 ? "CONNECTED" : "DISCONNECTED",
      }),
    });
    setLoading(false);
    setFeedback(res.ok ? "WhatsApp atualizado" : "Erro ao salvar");
    if (res.ok) setOpen(false);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-cocoa-soft/70">
          {whatsapp ? `Número: ${whatsapp}` : "Nenhum número configurado"}
        </p>
        <button
          type="button"
          className="btn-secondary !py-2 text-sm"
          onClick={openSheet}
        >
          <Pencil className="h-4 w-4" />
          Configurar
        </button>
      </div>

      <Sheet open={open} onOpenChange={(next) => !loading && setOpen(next)}>
        <SheetContent size="md" side="right">
          <SheetHeader title="WhatsApp" />
          <SheetForm onSubmit={onSubmit}>
            <SheetBody className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Número conectado"
                className="sm:col-span-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                hint={`Status: ${status}`}
              />
              <Field
                as="textarea"
                label="Mensagem automática"
                className="sm:col-span-2"
                controlClassName="min-h-20"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                placeholder="Olá! Vi sua vitrine e quero fazer um pedido."
              />
              {feedback ? (
                <p className="text-sm text-cocoa-soft/60 sm:col-span-2">
                  {feedback}
                </p>
              ) : null}
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary disabled={loading}>
                {loading ? "Salvando…" : "Salvar WhatsApp"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>
    </>
  );
}
