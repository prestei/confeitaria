"use client";

import { FormEvent, useState } from "react";

export function WhatsAppIntegrationForm({
  whatsapp,
  message,
  status,
}: {
  whatsapp: string;
  message: string;
  status: string;
}) {
  const [phone, setPhone] = useState(whatsapp);
  const [msg, setMsg] = useState(message);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

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
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="label">Número conectado</label>
        <input
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <p className="mt-1 text-[11px] text-cocoa-soft/50">Status: {status}</p>
      </div>
      <div className="sm:col-span-2">
        <label className="label">Mensagem automática</label>
        <textarea
          className="input min-h-20"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Olá! Vi sua vitrine e quero fazer um pedido."
        />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn-primary !py-2 text-sm" disabled={loading}>
          {loading ? "Salvando…" : "Salvar WhatsApp"}
        </button>
        {feedback && <span className="text-sm text-cocoa-soft/60">{feedback}</span>}
      </div>
    </form>
  );
}
