"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
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

export type CustomerSheetValue = {
  id?: string;
  name: string;
  phone: string;
  email?: string | null;
  instagram?: string | null;
  notes?: string | null;
};

const emptyCustomer = (): CustomerSheetValue => ({
  name: "",
  phone: "",
  email: "",
  instagram: "",
  notes: "",
});

export function CustomerSheet({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerSheetValue | null;
}) {
  const router = useRouter();
  const editing = Boolean(customer?.id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const source = customer ?? emptyCustomer();
    setName(source.name || "");
    setPhone(source.phone || "");
    setEmail(source.email || "");
    setInstagram(source.instagram || "");
    setNotes(source.notes || "");
    setError("");
  }, [customer, open]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = { name, phone, email, instagram, notes };
    const res = await fetch(
      editing ? `/api/customers/${customer?.id}` : "/api/customers",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.status === 401) {
      window.location.href = "/entrar";
      return;
    }
    if (!res.ok) {
      setError(data.error || "Não foi possível salvar");
      return;
    }
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <SheetContent size="md">
        <SheetHeader title={editing ? "Editar cliente" : "Novo cliente"} />
        <SheetForm onSubmit={onSubmit}>
          <SheetBody className="space-y-4">
            <Field
              label="Nome"
              id="customer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Ana Paula"
              required
              autoFocus
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="WhatsApp"
                id="customer-phone"
                control={
                  <MaskedInput
                    kind="phone"
                    id="customer-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                }
              />
              <Field
                label="E-mail"
                id="customer-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ana@email.com"
              />
            </div>
            <Field
              label="Instagram"
              id="customer-instagram"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@cliente"
            />
            <Field
              as="textarea"
              label="Observações"
              id="customer-notes"
              controlClassName="min-h-28"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferências, restrições, datas especiais…"
            />
            {error && <p className="text-sm text-[#C85A5A]">{error}</p>}
          </SheetBody>
          <SheetFooter>
            <SheetCancel />
            <SheetPrimary disabled={saving}>
              {saving ? "Salvando…" : editing ? "Salvar" : "Cadastrar cliente"}
            </SheetPrimary>
          </SheetFooter>
        </SheetForm>
      </SheetContent>
    </Sheet>
  );
}
