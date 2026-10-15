"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { useToast } from "@/components/ui/toast";

export function BlockDateForm() {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date) return;
    setSaving(true);
    const res = await fetch("/api/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason }),
    });
    setSaving(false);
    if (!res.ok) {
      toast({ title: "Não foi possível bloquear", tone: "error" });
      return;
    }
    toast({ title: "Data bloqueada", tone: "success" });
    setDate("");
    setReason("");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary !py-2.5 text-sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Bloquear data
      </button>

      <Sheet open={open} onOpenChange={(next) => !saving && setOpen(next)}>
        <SheetContent size="sm" side="right">
          <SheetHeader title="Bloquear data" />
          <SheetForm onSubmit={onSubmit}>
            <SheetBody className="space-y-4">
              <div>
                <label className="label">Data</label>
                <input
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Motivo</label>
                <input
                  className="input"
                  placeholder="Ex.: Não aceitar encomendas"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </SheetBody>
            <SheetFooter>
              <SheetCancel />
              <SheetPrimary disabled={saving}>
                {saving ? "Bloqueando…" : "Bloquear"}
              </SheetPrimary>
            </SheetFooter>
          </SheetForm>
        </SheetContent>
      </Sheet>
    </>
  );
}
