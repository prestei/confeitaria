"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, MessageCircle, Pencil } from "lucide-react";
import { format } from "date-fns";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/cn";
import {
  ColumnsTable,
  type TableColumn,
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
  instagram?: string | null;
  notes?: string | null;
  editable?: boolean;
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

export function CustomersTable({
  rows,
  onEdit,
}: {
  rows: CustomerRow[];
  onEdit?: (row: CustomerRow) => void;
}) {
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

  const customerColumns: TableColumn<CustomerRow>[] = COLUMNS.map((col) => {
    const active = sortKey === col.key;
    const header = (
      <button
        type="button"
        onClick={() => toggleSort(col.key)}
        className={cn(
          "inline-flex items-center gap-1.5 transition hover:text-cocoa",
          active && "text-cocoa",
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
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden />
        )}
      </button>
    );

    if (col.key === "name") {
      return {
        id: col.key,
        header,
        render: (customer) => (
          <Link href={customer.href} className="flex min-w-0 items-center gap-3">
            <TableAvatar name={customer.name} />
            <span className="truncate font-semibold text-cocoa hover:underline">
              {customer.name}
            </span>
          </Link>
        ),
      };
    }
    if (col.key === "phone") {
      return {
        id: col.key,
        header,
        render: (customer) => (
          <span className="inline-flex items-center gap-1.5 text-[#65676B]">
            <MessageCircle
              className="h-3 w-3 shrink-0 text-[#25D366]"
              strokeWidth={2}
            />
            {customer.phone}
          </span>
        ),
      };
    }
    if (col.key === "email") {
      return {
        id: col.key,
        header,
        tone: "soft" as const,
        render: (customer) => customer.email || "—",
      };
    }
    if (col.key === "orders") {
      return {
        id: col.key,
        header,
        align: "right" as const,
        tone: "body" as const,
        numeric: true,
        render: (customer) => customer.orders,
      };
    }
    if (col.key === "spent") {
      return {
        id: col.key,
        header,
        align: "right" as const,
        tone: "strong" as const,
        numeric: true,
        render: (customer) => formatBRL(customer.spent),
      };
    }
    return {
      id: col.key,
      header,
      tone: "muted" as const,
      className: "text-xs",
      render: (customer: CustomerRow) => (
        <span className="inline-flex items-center gap-2">
          {format(new Date(customer.lastOrder), "dd/MM/yyyy")}
          {customer.editable && onEdit && (
            <button
              type="button"
              className="rounded-md p-1 text-[#8C8682] hover:bg-[var(--painel-subtle,#eff3f6)] hover:text-cocoa"
              aria-label={`Editar ${customer.name}`}
              onClick={() => onEdit(customer)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      ),
    };
  });

  return (
    <>
      <div className="hidden md:block">
        <ColumnsTable
          minWidth="760px"
          rows={sorted}
          rowKey={(customer) => customer.id}
          columns={customerColumns}
        />
      </div>

      <div className="space-y-3 md:hidden">
        {sorted.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-[var(--painel-border)] bg-white p-4"
          >
            <Link href={c.href} className="flex min-w-0 flex-1 items-center gap-3">
              <TableAvatar name={c.name} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-cocoa">{c.name}</p>
                <p className="text-xs text-[#8C8682]">{c.phone}</p>
                <p className="mt-1 text-sm text-cocoa">
                  {c.orders} pedidos · {formatBRL(c.spent)}
                </p>
              </div>
            </Link>
            {c.editable && onEdit && (
              <button
                type="button"
                className="rounded-md p-2 text-[#8C8682] hover:bg-[var(--painel-subtle,#eff3f6)] hover:text-cocoa"
                aria-label={`Editar ${c.name}`}
                onClick={() => onEdit(c)}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
