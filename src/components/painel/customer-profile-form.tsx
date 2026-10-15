"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

const fieldLabel =
  "mb-1.5 block text-[13px] font-semibold text-[#5C5652]";
const fieldInput =
  "h-10 w-full rounded-lg border border-[#CED0D4] bg-white px-3 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";
const fieldTextarea =
  "min-h-24 w-full rounded-lg border border-[#CED0D4] bg-white px-3 py-2.5 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#2D2926]/40 focus:ring-2 focus:ring-[#2D2926]/10";

export function CustomerProfileForm({
  customerId,
  initial,
}: {
  customerId: string;
  initial: {
    name: string;
    phone: string;
    email: string | null;
    notes: string | null;
    referenceNote: string | null;
  };
}) {
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email || "");
  const [notes, setNotes] = useState(initial.notes || "");
  const [referenceNote, setReferenceNote] = useState(
    initial.referenceNote || "",
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, notes, referenceNote }),
    });
    setLoading(false);
    if (!res.ok) {
      toast({ title: "Não foi possível salvar", tone: "error" });
      return;
    }
    toast({ title: "Dados atualizados", tone: "success" });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={fieldLabel} htmlFor="profile-name">
          Nome
        </label>
        <input
          id="profile-name"
          className={fieldInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className={fieldLabel}>WhatsApp</label>
        <input
          className={fieldInput}
          value={initial.phone}
          readOnly
          aria-readonly
        />
        <p className="mt-1.5 text-[11px] text-[#8C8682]">
          Definido no cadastro ou na vitrine.
        </p>
      </div>
      <div>
        <label className={fieldLabel} htmlFor="profile-email">
          E-mail
        </label>
        <input
          id="profile-email"
          type="email"
          className={fieldInput}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Opcional"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={fieldLabel} htmlFor="profile-notes">
          Observações
        </label>
        <textarea
          id="profile-notes"
          className={fieldTextarea}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Alergias, detalhes do tema, preferências…"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={fieldLabel} htmlFor="profile-ref">
          Referência
        </label>
        <input
          id="profile-ref"
          className={fieldInput}
          value={referenceNote}
          onChange={(e) => setReferenceNote(e.target.value)}
          placeholder="Link ou descrição de referência"
        />
      </div>
      <div className="sm:col-span-2">
        <button
          type="submit"
          className="btn-primary !py-2.5 text-sm"
          disabled={loading}
        >
          {loading ? "Salvando…" : "Salvar dados do cliente"}
        </button>
      </div>
    </form>
  );
}
