"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { History, LayoutGrid } from "lucide-react";
import { formatBRL, ORDER_STATUS_LABELS } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FilterChip,
  PageAction,
  PageHeader,
  PageShell,
} from "@/components/painel/page-header";

type OrderStatus = keyof typeof ORDER_STATUS_LABELS;

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  status: OrderStatus;
  kind: string;
  priceLabel: string;
  totalCents: number;
  eventDate: string | null;
  paymentMethod: string | null;
  createdAt: string;
  items: { productName: string; quantity: number }[];
};

const statuses = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export function OrdersHistory({
  initialOrders = [],
}: {
  initialOrders?: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loading, setLoading] = useState(initialOrders.length === 0);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function load() {
    const res = await fetch("/api/admin/orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (initialOrders.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <PageShell>
      <PageHeader
        title="Histórico de pedidos"
        description="Consulta em tabela — busque pedidos passados e filtrados por status."
        actions={
          <PageAction href="/painel/pedidos" variant="secondary">
            <LayoutGrid className="h-4 w-4" />
            Central
          </PageAction>
        }
      />

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="Todos"
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
        />
        {statuses.map((s) => (
          <FilterChip
            key={s}
            label={ORDER_STATUS_LABELS[s]}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
          />
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum pedido neste filtro"
          description="Ajuste o status ou volte à central para acompanhar os pedidos em andamento."
          action={{ label: "Ir para a central", href: "/painel/pedidos" }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#E8E2DE] bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#E8E2DE] bg-[#F7F5F3] text-xs font-semibold uppercase tracking-wide text-[#8C8682]">
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Itens</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E2DE]">
              {filtered.map((o) => (
                <tr key={o.id} className="transition hover:bg-[#F0F2F5]/70">
                  <td className="px-4 py-3">
                    <Link
                      href={`/painel/pedidos/${o.id}`}
                      className="font-medium text-[#2D2926] hover:underline"
                    >
                      {o.customerName}
                    </Link>
                    <p className="mt-0.5 text-xs text-[#B0AAA6]">
                      {o.customerPhone}
                      {o.paymentMethod ? ` · ${o.paymentMethod}` : ""}
                    </p>
                  </td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-xs text-[#8C8682]">
                    {o.items
                      .map((i) => `${i.quantity}× ${i.productName}`)
                      .join(" · ")}
                  </td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-[#8C8682]">
                    {format(new Date(o.createdAt), "dd/MM/yyyy HH:mm")}
                    {o.eventDate ? (
                      <span className="mt-0.5 block text-[#B0AAA6]">
                        Entrega {format(new Date(o.eventDate), "dd/MM")}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-[#2D2926]">
                    {o.priceLabel === "TO_CONFIRM"
                      ? "A confirmar"
                      : formatBRL(o.totalCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
