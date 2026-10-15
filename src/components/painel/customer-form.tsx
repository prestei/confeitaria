"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageAction,
  PageHeader,
  PageShell,
  SectionCard,
} from "@/components/painel/page-header";

const fieldLabel =
  "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";
const fieldTextarea =
  "min-h-28 w-full rounded-lg border border-[#CED0D4] bg-white px-3 py-2.5 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";

export function CustomerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [referenceNote, setReferenceNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, email, notes, referenceNote }),
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
        description="Os mesmos campos que o cliente preenche no checkout da vitrine."
        actions={
          <PageAction href="/painel/clientes" variant="secondary">
            Voltar
          </PageAction>
        }
      />

      <SectionCard title="Dados pessoais">
        <form onSubmit={onSubmit} className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={fieldLabel} htmlFor="new-name">
              Nome <span className="text-[#C85A5A]">*</span>
            </label>
            <input
              id="new-name"
              className={fieldInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Como devemos chamar"
              required
              autoFocus
            />
          </div>

          <div>
            <label className={fieldLabel} htmlFor="new-phone">
              WhatsApp <span className="text-[#C85A5A]">*</span>
            </label>
            <input
              id="new-phone"
              className={fieldInput}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              required
              inputMode="tel"
            />
          </div>
          <div>
            <label className={fieldLabel} htmlFor="new-email">
              E-mail (opcional)
            </label>
            <input
              id="new-email"
              type="email"
              className={fieldInput}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@email.com"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={fieldLabel} htmlFor="new-notes">
              Observações
            </label>
            <textarea
              id="new-notes"
              className={fieldTextarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Alergias, detalhes do tema, preferências…"
            />
          </div>

          <div className="sm:col-span-2">
            <label className={fieldLabel} htmlFor="new-ref">
              Referência (opcional)
            </label>
            <input
              id="new-ref"
              className={fieldInput}
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="Link ou descrição de referência"
            />
          </div>

          {error && <p className="sm:col-span-2 text-sm text-[#C85A5A]">{error}</p>}

          <div className="flex flex-wrap gap-2 pt-1 sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Salvando…" : "Cadastrar cliente"}
            </button>
            <PageAction href="/painel/clientes" variant="secondary">
              Cancelar
            </PageAction>
          </div>
        </form>
      </SectionCard>
    </PageShell>
  );
}
