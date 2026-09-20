"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogBody,
  DialogCancel,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPrimary,
} from "@/components/ui/dialog";
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="sm">
          <DialogHeader
            title="Bloquear data"
            description="Impede novas encomendas neste dia."
          />
          <form onSubmit={onSubmit}>
            <DialogBody className="space-y-4">
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
            </DialogBody>
            <DialogFooter>
              <DialogCancel />
              <DialogPrimary disabled={saving}>
                {saving ? "Bloqueando…" : "Bloquear"}
              </DialogPrimary>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
