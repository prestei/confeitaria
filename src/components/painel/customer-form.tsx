"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageAction,
  PageHeader,
  PageShell,
} from "@/components/painel/page-header";

export function CustomerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, notes }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Não foi possível cadastrar");
      return;
    }

    const customer = await res.json();
    router.push(`/painel/clientes/${customer.id}`);
    router.refresh();
  }

  return (
    <PageShell>
      <PageHeader
        title="Novo cliente"
        description="Cadastre um contato para o CRM da sua confeitaria."
        actions={
          <PageAction href="/painel/clientes" variant="secondary">
            Voltar
          </PageAction>
        }
      />

      <form
        onSubmit={onSubmit}
        className="max-w-2xl space-y-4 rounded-lg border border-[#E8E2DE] bg-white p-5"
      >
        <div>
          <label className="label">Nome</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Ana Paula"
            required
            autoFocus
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">WhatsApp</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="11999998888"
              required
              inputMode="tel"
            />
          </div>
          <div>
            <label className="label">E-mail (opcional)</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@email.com"
            />
          </div>
        </div>

        <div>
          <label className="label">Observações (opcional)</label>
          <textarea
            className="input min-h-28"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Preferências, restrições, datas especiais…"
          />
        </div>

        {error && <p className="text-sm text-[#C85A5A]">{error}</p>}

        <div className="flex flex-wrap gap-2 pt-1">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Salvando…" : "Cadastrar cliente"}
          </button>
          <PageAction href="/painel/clientes" variant="secondary">
            Cancelar
          </PageAction>
        </div>
      </form>
    </PageShell>
  );
}
