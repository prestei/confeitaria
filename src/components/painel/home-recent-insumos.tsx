"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";

export type HomeInsumoRow = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  unitCostCents: number | null;
};

function insumoEmoji(name: string) {
  const n = name.toLowerCase();
  if (n.includes("leite")) return "🥛";
  if (n.includes("farinha")) return "🌾";
  if (n.includes("açúcar") || n.includes("acucar")) return "🍬";
  if (n.includes("ovo")) return "🥚";
  if (n.includes("manteiga")) return "🧈";
  if (n.includes("chocolate")) return "🍫";
  return "📦";
}

function stockStatus(item: HomeInsumoRow) {
  if (item.quantity <= 0) {
    return { tone: "danger" as const, label: "Estoque zerado" };
  }
  if (item.minQuantity > 0 && item.quantity <= item.minQuantity) {
    return { tone: "warning" as const, label: "Abaixo do mínimo" };
  }
  return { tone: "success" as const, label: "Disponível" };
}

function StockStatusBadge({ item }: { item: HomeInsumoRow }) {
  const status = stockStatus(item);
  const pill = {
    danger: "bg-[#FCE8E8] text-[#C44B4B]",
    warning: "bg-[#FDF0E0] text-[#B87A2A]",
    success: "bg-[#E4F0E8] text-[#3D8A5A]",
  };
  const dot = {
    danger: "bg-[#E05A5A]",
    warning: "bg-[#C47A2A]",
    success: "bg-[#3D8A5A]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        pill[status.tone],
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dot[status.tone])} />
      {status.label}
    </span>
  );
}

export function HomeRecentInsumos({ items }: { items: HomeInsumoRow[] }) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-[#9A8F88]">
        Cadastre insumos para acompanhar custo e estoque aqui.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--painel-border)] text-[11px] font-semibold uppercase tracking-wide text-[#9A8F88]">
            <th className="px-4 py-3 font-semibold">Insumo</th>
            <th className="px-4 py-3 font-semibold">Custo</th>
            <th className="px-4 py-3 font-semibold">Estoque em unidade</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="w-12 px-2 py-3" aria-hidden />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0E6E0]">
          {items.map((item) => (
            <tr key={item.id} className="bg-white">
              <td className="px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F3F4F6] text-lg"
                    aria-hidden
                  >
                    {insumoEmoji(item.name)}
                  </span>
                  <span className="truncate font-medium text-[var(--painel-brand,#0f352e)]">
                    {item.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-[#5C5652]">
                {item.unitCostCents != null
                  ? `${formatBRL(item.unitCostCents)} / ${item.unit}`
                  : "—"}
              </td>
              <td className="px-4 py-3 tabular-nums text-[#5C5652]">
                {item.quantity} {item.unit}
              </td>
              <td className="px-4 py-3">
                <StockStatusBadge item={item} />
              </td>
              <td className="px-2 py-3 text-right">
                <RowActionsMenu
                  label={`Ações para ${item.name}`}
                  items={[
                    {
                      label: "Editar insumo",
                      icon: Pencil,
                      href: "/painel/insumos",
                    },
                  ]}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
