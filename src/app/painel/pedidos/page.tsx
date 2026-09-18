"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { formatBRL, ORDER_STATUS_LABELS } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/input";

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  status: keyof typeof ORDER_STATUS_LABELS;
  kind: string;
  priceLabel: string;
  totalCents: number;
  eventDate: string | null;
  createdAt: string;
  items: { productName: string; quantity: number }[];
};

const statuses = Object.keys(ORDER_STATUS_LABELS) as (keyof typeof ORDER_STATUS_LABELS)[];

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function load() {
    const res = await fetch("/api/admin/orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const prev = orders;
    setOrders((list) =>
      list.map((o) =>
        o.id === id ? { ...o, status: status as Order["status"] } : o,
      ),
    );
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setOrders(prev);
      toast({
        title: "Não foi possível atualizar",
        tone: "error",
      });
      return;
    }
    toast({
      title: "Status atualizado",
      description: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS],
      tone: "success",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-cocoa sm:text-4xl">Pedidos</h1>
        <p className="mt-1 text-cocoa-soft/75">
          Acompanhe do novo até entregue/retirado.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-cocoa/5" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nenhum pedido ainda"
          description="Compartilhe seu cardápio para começar a receber pedidos."
        />
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {orders.map((o) => (
              <motion.article
                key={o.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-cocoa">{o.customerName}</p>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <p className="text-sm text-cocoa-soft/70">{o.customerPhone}</p>
                    <p className="mt-2 text-sm text-cocoa-soft/80">
                      {o.items
                        .map((i) => `${i.quantity}x ${i.productName}`)
                        .join(" · ")}
                    </p>
                    {o.eventDate && (
                      <p className="mt-1 text-xs text-berry-deep">
                        Evento: {new Date(o.eventDate).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-cocoa-soft/55">
                      {o.kind === "QUOTE" ? "Orçamento" : "Pedido"}
                    </p>
                    <p className="font-semibold text-cocoa">
                      {o.priceLabel === "TO_CONFIRM"
                        ? "A confirmar"
                        : o.priceLabel === "ESTIMATE"
                          ? `Est. ${formatBRL(o.totalCents)}`
                          : formatBRL(o.totalCents)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Select
                    className="!w-auto"
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    aria-label={`Status do pedido de ${o.customerName}`}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </Select>
                  <span className="text-xs text-cocoa-soft/55">
                    {new Date(o.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
