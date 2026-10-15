"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Eye,
  History,
  LayoutGrid,
  MessageCircle,
  Truck,
} from "lucide-react";
import { formatBRL, ORDER_STATUS_LABELS, whatsappLink } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { EmptyState } from "@/components/ui/empty-state";
import { ListFilterBar } from "@/components/ui/list-filter-bar";
import {
  PageAction,
  PageHeader,
  PageShell,
} from "@/components/painel/page-header";
import {
  ColumnsTable,
  DataTablePagination,
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

      <ListFilterBar
        search={{
          value: query,
          onChange: setQuery,
          placeholder: "Buscar por cliente, produto ou nº...",
          "aria-label": "Buscar pedidos",
        }}
        filters={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: "all", label: "Todos" },
            ...statuses.map((s) => ({
              value: s,
              label: ORDER_STATUS_LABELS[s],
            })),
          ],
        }}
      />

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
          <ColumnsTable
            minWidth="860px"
            rows={pageRows}
            rowKey={(order) => order.id}
            onRowClick={(order) => setSelectedId(order.id)}
            footer={
              <DataTablePagination
                page={safePage}
                pageCount={pageCount}
                onPageChange={setPage}
                summary={`Mostrando ${pageRows.length} de ${filtered.length} pedido${filtered.length === 1 ? "" : "s"}`}
              />
            }
            columns={[
              {
                id: "customer",
                header: "Cliente",
                render: (order) => (
                  <div className="flex min-w-0 items-center gap-3">
                    <TableAvatar name={order.customerName} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-cocoa">
                        {order.customerName}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#8C8682]">
                        <MessageCircle
                          className="h-3 w-3 shrink-0 text-[#25D366]"
                          strokeWidth={2}
                        />
                        {order.customerPhone}
                      </p>
                    </div>
                  </div>
                ),
              },
              {
                id: "items",
                header: "Itens",
                render: (order) => {
                  const items = itemsSummary(order.items);
                  return (
                    <>
                      <p className="max-w-[220px] truncate font-medium text-cocoa">
                        {items.title}
                      </p>
                      {items.detail ? (
                        <p className="mt-0.5 text-xs text-[#8C8682]">
                          {items.detail}
                        </p>
                      ) : null}
                    </>
                  );
                },
              },
              {
                id: "status",
                header: "Status",
                render: (order) => <OrderStatusBadge status={order.status} />,
              },
              {
                id: "date",
                header: "Data",
                render: (order) => (
                  <>
                    <p className="flex items-center gap-1.5 whitespace-nowrap text-xs text-[#5C656F]">
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#B0AAA6]" />
                      {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
                    </p>
                    {order.eventDate ? (
                      <p className="mt-1 flex items-center gap-1.5 whitespace-nowrap text-xs text-[#8C8682]">
                        <Truck className="h-3.5 w-3.5 shrink-0 text-[#B0AAA6]" />
                        {order.fulfillment === "DELIVERY" ? "Entrega" : "Retirada"}{" "}
                        {format(new Date(order.eventDate), "dd/MM")}
                        {order.eventTime ? ` · ${order.eventTime}` : ""}
                      </p>
                    ) : null}
                  </>
                ),
              },
              {
                id: "total",
                header: "Total",
                align: "right",
                tone: "strong",
                numeric: true,
                render: (order) =>
                  order.priceLabel === "TO_CONFIRM"
                    ? "A confirmar"
                    : formatBRL(order.totalCents),
              },
              {
                id: "actions",
                header: "Ações",
                align: "center",
                headerClassName: "w-14",
                className: "relative z-[1]",
                render: (order) => {
                  const wa = whatsappLink(
                    order.customerPhone,
                    order.whatsappMessage ||
                      `Olá ${order.customerName}! Sobre o seu pedido…`,
                  );
                  return (
                    <div
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <RowActionsMenu
                        label={`Ações do pedido de ${order.customerName}`}
                        items={[
                          {
                            label: "Ver detalhes",
                            icon: Eye,
                            onClick: () => setSelectedId(order.id),
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
                  );
                },
              },
            ]}
          />
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
