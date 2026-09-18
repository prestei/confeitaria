"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function CustomerNotesForm({
  customerId,
  notes,
}: {
  customerId: string;
  notes: string;
}) {
  const [value, setValue] = useState(notes);
  const [msg, setMsg] = useState("");
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    });
    setMsg(res.ok ? "Salvo" : "Erro ao salvar");
    if (res.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        className="input min-h-24"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Preferências, restrições, datas especiais…"
      />
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary !py-2 text-sm">
          Salvar observações
        </button>
        {msg && <span className="text-sm text-cocoa-soft/60">{msg}</span>}
      </div>
    </form>
  );
}
