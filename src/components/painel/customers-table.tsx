"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/cn";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  orders: number;
  spent: number;
  lastOrder: string;
  href: string;
};

type SortKey = "name" | "phone" | "email" | "orders" | "spent" | "lastOrder";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nome" },
  { key: "phone", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
  { key: "orders", label: "Pedidos" },
  { key: "spent", label: "Valor gasto" },
  { key: "lastOrder", label: "Último pedido" },
];

export function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("lastOrder");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "name" || key === "phone" || key === "email" ? "asc" : "desc");
  }

  const sorted = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (sortKey === "lastOrder") {
        return (new Date(String(av)).getTime() - new Date(String(bv)).getTime()) * dir;
      }
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return String(av ?? "").localeCompare(String(bv ?? ""), "pt-BR", {
        sensitivity: "base",
      }) * dir;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-[#E8E2DE] bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#E8E2DE] bg-[#F0F2F5] text-xs uppercase tracking-wide text-[#8C8682]">
            <tr>
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                return (
                  <th key={col.key} className="px-4 py-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 transition hover:text-[#2D2926]",
                        active && "text-[#2D2926]",
                      )}
                    >
                      {col.label}
                      {active ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5" aria-hidden />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E2DE]">
            {sorted.map((c) => (
              <tr key={c.id} className="hover:bg-[#F0F2F5]/70">
                <td className="px-4 py-3">
                  <Link
                    href={c.href}
                    className="font-medium text-[#2D2926] hover:underline"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#65676B]">{c.phone}</td>
                <td className="px-4 py-3 text-[#65676B]">{c.email || "—"}</td>
                <td className="px-4 py-3 tabular-nums text-[#2D2926]">{c.orders}</td>
                <td className="px-4 py-3 font-medium tabular-nums text-[#2D2926]">
                  {formatBRL(c.spent)}
                </td>
                <td className="px-4 py-3 text-xs text-[#8C8682]">
                  {format(new Date(c.lastOrder), "dd/MM/yyyy")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {sorted.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="block rounded-lg border border-[#E8E2DE] bg-white p-4"
          >
            <p className="font-medium text-[#2D2926]">{c.name}</p>
            <p className="text-xs text-[#8C8682]">{c.phone}</p>
            <p className="mt-2 text-sm text-[#2D2926]">
              {c.orders} pedidos · {formatBRL(c.spent)}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
