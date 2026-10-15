"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Ban, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import type { BlockedDateRow } from "@/lib/blocked-dates";

export type { BlockedDateRow };

export function BlockedDatesList({
  dates,
  compact = false,
}: {
  dates: BlockedDateRow[];
  compact?: boolean;
}) {
  const [rows, setRows] = useState(dates);
  const [removing, setRemoving] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function remove(dateIso: string, id: string) {
    const day = format(new Date(dateIso), "yyyy-MM-dd");
    setRemoving(id);
    const res = await fetch("/api/blocked-dates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: day }),
    });
    setRemoving(null);
    if (!res.ok) {
      toast({ title: "Não foi possível desbloquear", tone: "error" });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Data liberada na vitrine", tone: "success" });
    router.refresh();
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-[#8C8682]">
        Nenhuma data bloqueada neste período. Clientes podem escolher qualquer dia
        respeitando o prazo mínimo.
      </p>
    );
  }

  return (
    <ul className={cn(compact ? "space-y-2" : "divide-y divide-[#E8E2DE]")}>
      {rows.map((b) => {
        const d = new Date(b.date);
        const label = format(d, "dd/MM/yyyy (EEEE)", { locale: ptBR });
        return (
          <li
            key={b.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-2",
              compact ? "rounded-lg border border-[#E8E2DE] bg-[#FAFAFA] px-3 py-2.5" : "py-3",
            )}
          >
            <div className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#FFF0F0] text-[#C85A5A]">
                <Ban className="h-3.5 w-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold capitalize text-[#2D2926]">
                  {label}
                </p>
                {b.reason ? (
                  <p className="text-xs text-[#8C8682]">{b.reason}</p>
                ) : (
                  <p className="text-xs text-[#8C8682]">
                    A vitrine não aceita encomendas neste dia.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              disabled={removing === b.id}
              onClick={() => remove(b.date, b.id)}
              className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold text-[#C85A5A] transition hover:bg-[#FFF0F0] disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              {removing === b.id ? "Liberando…" : "Liberar"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
