"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/cn";
import {
  CustomerSourceBadge,
  CustomerWhatsappButton,
} from "@/components/painel/customer-actions";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  TableAvatar,
} from "@/components/painel/data-table";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  orders: number;
  spent: number;
  lastOrder: string;
  href: string;
  source: "registered" | "vitrine";
};

type SortKey = "name" | "phone" | "email" | "orders" | "spent" | "lastOrder";

const COLUMNS: { key: SortKey; label: string; align?: "left" | "right" }[] = [
  { key: "name", label: "Cliente" },
  { key: "phone", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
  { key: "orders", label: "Pedidos", align: "right" },
  { key: "spent", label: "Valor gasto", align: "right" },
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
    setSortDir(
      key === "name" || key === "phone" || key === "email" ? "asc" : "desc",
    );
  }

  const sorted = useMemo(() => {
    const list = [...rows];
    const dir = sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (sortKey === "lastOrder") {
        return (
          (new Date(String(av)).getTime() - new Date(String(bv)).getTime()) *
          dir
        );
      }
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * dir;
      }
      return (
        String(av ?? "").localeCompare(String(bv ?? ""), "pt-BR", {
          sensitivity: "base",
        }) * dir
      );
    });
    return list;
  }, [rows, sortKey, sortDir]);

  return (
    <>
      <div className="hidden md:block">
        <DataTable minWidth="760px">
          <DataTableHeader>
            <tr>
              {COLUMNS.map((col) => {
                const active = sortKey === col.key;
                return (
                  <DataTableHead key={col.key} align={col.align}>
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
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                        )
                      ) : (
                        <ChevronsUpDown
                          className="h-3.5 w-3.5 opacity-40"
                          aria-hidden
                        />
                      )}
                    </button>
                  </DataTableHead>
                );
              })}
            </tr>
          </DataTableHeader>
          <DataTableBody>
            {sorted.map((c) => (
              <DataTableRow key={c.id}>
                <DataTableCell>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <Link
                      href={c.href}
                      className="flex min-w-0 items-center gap-3"
                    >
                      <TableAvatar name={c.name} />
                      <span className="truncate font-semibold text-[#2D2926] hover:underline">
                        {c.name}
                      </span>
                    </Link>
                    <CustomerSourceBadge source={c.source} />
                  </div>
                </DataTableCell>
                <DataTableCell>
                  <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[#65676B]">
                      <MessageCircle
                        className="h-3 w-3 shrink-0 text-[#25D366]"
                        strokeWidth={2}
                      />
                      {c.phone}
                    </span>
                    <CustomerWhatsappButton name={c.name} phone={c.phone} />
                  </div>
                </DataTableCell>
                <DataTableCell className="text-[#65676B]">
                  {c.email || "—"}
                </DataTableCell>
                <DataTableCell align="right" className="tabular-nums text-[#2D2926]">
                  {c.orders}
                </DataTableCell>
                <DataTableCell
                  align="right"
                  className="font-semibold tabular-nums text-[#2D2926]"
                >
                  {formatBRL(c.spent)}
                </DataTableCell>
                <DataTableCell className="text-xs text-[#8C8682]">
                  {format(new Date(c.lastOrder), "dd/MM/yyyy")}
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </div>

      <div className="space-y-3 md:hidden">
        {sorted.map((c) => (
          <Link
            key={c.id}
            href={c.href}
            className="flex items-center gap-3 rounded-2xl border border-[#E8E2DE] bg-white p-4"
          >
            <TableAvatar name={c.name} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-[#2D2926]">{c.name}</p>
                <CustomerSourceBadge source={c.source} />
              </div>
              <p className="text-xs text-[#8C8682]">{c.phone}</p>
              <p className="mt-1 text-sm text-[#2D2926]">
                {c.orders} pedidos · {formatBRL(c.spent)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
