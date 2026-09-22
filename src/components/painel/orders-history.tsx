"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Eye,
  History,
  LayoutGrid,
  MessageCircle,
  Search,
  Truck,
} from "lucide-react";
import { formatBRL, ORDER_STATUS_LABELS, whatsappLink } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";
import {
  PageAction,
  PageHeader,
  PageShell,
} from "@/components/painel/page-header";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTablePagination,
  DataTableRow,
  TableAvatar,
} from "@/components/painel/data-table";
import { RowActionsMenu } from "@/components/painel/row-actions-menu";
import {
  OrderDetailSheet,
  type OrderDetailData,
} from "@/components/painel/order-detail-sheet";

type OrderStatus = keyof typeof ORDER_STATUS_LABELS;

type Order = OrderDetailData & {
  kind: string;
  status: OrderStatus;
};

const PAGE_SIZE = 10;
const statuses = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

function normalizeOrder(raw: Order): Order {
  return {
    ...raw,
    customerEmail: raw.customerEmail ?? null,
    whatsappMessage: raw.whatsappMessage ?? null,
    fulfillment: raw.fulfillment || "PICKUP",
    deliveryZone: raw.deliveryZone ?? null,
    eventTime: raw.eventTime ?? null,
    notes: raw.notes ?? null,
    items: (raw.items || []).map((item) => ({
      ...item,
      customizations:
        item.customizations && typeof item.customizations === "object"
          ? (item.customizations as Record<string, string>)
          : typeof item.customizations === "string"
            ? item.customizations
            : null,
    })),
  };
}

function orderCode(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return String(1000 + (n % 9000));
}

function itemsSummary(items: Order["items"]) {
  if (!items.length) {
    return { title: "Sem itens", detail: null as string | null };
  }
  const first = items[0];
  const title = first.productName;
  const extras =
    first.customizations && typeof first.customizations === "object"
      ? Object.values(first.customizations).filter(Boolean)[0]
      : null;
  const qtyLine = extras
    ? `${first.quantity}× ${extras}`
    : `${first.quantity}×`;
  const more =
    items.length > 1 ? ` · +${items.length - 1} ${items.length === 2 ? "item" : "itens"}` : "";
  return { title, detail: `${qtyLine}${more}` };
}

export function OrdersHistory({
  initialOrders = [],
}: {
  initialOrders?: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(() =>
    initialOrders.map(normalizeOrder),
  );
  const [loading, setLoading] = useState(initialOrders.length === 0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/orders");
    if (res.ok) {
      const data = (await res.json()) as Order[];
      setOrders(data.map(normalizeOrder));
    }
    setLoading(false);
  }

  useEffect(() => {
    if (initialOrders.length === 0) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      const code = orderCode(o.id);
      const hay = [
        o.customerName,
        o.customerPhone,
        code,
        ...o.items.map((i) => i.productName),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [orders, statusFilter, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const selectedOrder = useMemo(
    () =>
      selectedId ? orders.find((o) => o.id === selectedId) ?? null : null,
    [selectedId, orders],
  );

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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChipGroup className="flex-nowrap overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-1">
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
        </FilterChipGroup>

        <label className="relative w-full shrink-0 lg:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#B0AAA6]"
            strokeWidth={1.75}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por cliente, produto ou nº…"
            className="h-9 w-full rounded border border-[#E8E2DE] bg-white py-2 pl-9 pr-3 text-sm text-[#2D2926] outline-none transition placeholder:text-[#B0AAA6] focus:border-[#D4C9C2] focus:ring-2 focus:ring-[#D6715A]/15"
          />
        </label>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum pedido neste filtro"
          description="Ajuste o status ou a busca, ou volte à central para acompanhar os pedidos em andamento."
          action={{ label: "Ir para a central", href: "/painel/pedidos" }}
        />
      ) : (
        <div>
          <DataTable
            minWidth="860px"
            footer={
              <DataTablePagination
                page={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
                summary={`Mostrando ${pageRows.length} de ${filtered.length} pedido${filtered.length === 1 ? "" : "s"}`}
              />
            }
          >
            <DataTableHeader>
              <tr>
                <DataTableHead>Cliente</DataTableHead>
                <DataTableHead>Itens</DataTableHead>
                <DataTableHead>Status</DataTableHead>
                <DataTableHead>Data</DataTableHead>
                <DataTableHead align="right">Total</DataTableHead>
                <DataTableHead align="center" className="w-14">
                  Ações
                </DataTableHead>
              </tr>
            </DataTableHeader>
            <DataTableBody>
              {pageRows.map((o) => {
                const items = itemsSummary(o.items);
                const wa = whatsappLink(
                  o.customerPhone,
                  o.whatsappMessage ||
                    `Olá ${o.customerName}! Sobre o seu pedido…`,
                );

                return (
                  <DataTableRow
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                  >
                    <DataTableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <TableAvatar name={o.customerName} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#2D2926]">
                            {o.customerName}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#8C8682]">
                            <MessageCircle
                              className="h-3 w-3 shrink-0 text-[#25D366]"
                              strokeWidth={2}
                            />
                            {o.customerPhone}
                          </p>
                        </div>
                      </div>
                    </DataTableCell>

                    <DataTableCell>
                      <p className="max-w-[220px] truncate font-medium text-[#2D2926]">
                        {items.title}
                      </p>
                      {items.detail ? (
                        <p className="mt-0.5 text-xs text-[#8C8682]">
                          {items.detail}
                        </p>
                      ) : null}
                    </DataTableCell>

                    <DataTableCell>
                      <OrderStatusBadge status={o.status} />
                    </DataTableCell>

                    <DataTableCell>
                      <p className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[#5C656F]">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#B0AAA6]" />
                        {format(new Date(o.createdAt), "dd/MM/yyyy HH:mm")}
                      </p>
                      {o.eventDate ? (
                        <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-[#8C8682]">
                          <Truck className="h-3.5 w-3.5 shrink-0 text-[#B0AAA6]" />
                          {o.fulfillment === "DELIVERY" ? "Entrega" : "Retirada"}{" "}
                          {format(new Date(o.eventDate), "dd/MM")}
                          {o.eventTime ? ` · ${o.eventTime}` : ""}
                        </p>
                      ) : null}
                    </DataTableCell>

                    <DataTableCell align="right">
                      <span className="font-semibold tabular-nums text-[#2D2926]">
                        {o.priceLabel === "TO_CONFIRM"
                          ? "A confirmar"
                          : formatBRL(o.totalCents)}
                      </span>
                    </DataTableCell>

                    <DataTableCell align="center" className="relative z-[1]">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <RowActionsMenu
                          label={`Ações do pedido de ${o.customerName}`}
                          items={[
                            {
                              label: "Ver detalhes",
                              icon: Eye,
                              onClick: () => setSelectedId(o.id),
                            },
                            {
                              label: "WhatsApp",
                              icon: MessageCircle,
                              onClick: () =>
                                window.open(wa, "_blank", "noopener,noreferrer"),
                            },
                          ]}
                        />
                      </div>
                    </DataTableCell>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </div>
      )}

      <OrderDetailSheet
        order={selectedOrder}
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
        onStatusChange={(orderId, status) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId ? { ...o, status: status as OrderStatus } : o,
            ),
          );
        }}
      />
    </PageShell>
  );
}
