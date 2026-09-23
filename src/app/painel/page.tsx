import { redirect } from "next/navigation";
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { connectDB } from "@/lib/db";
import { leanDoc, leanList } from "@/lib/serialize";
import { formatBRL, isAbandonedOnlineCheckout } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { SetupChecklist } from "@/components/painel/setup-checklist";
import {
  HomeDashboard,
  type DashStatus,
  type ProductionRow,
  type KanbanCard,
} from "@/components/painel/home-dashboard";

const ACTIVE_STATUSES = [
  "NEW",
  "REVIEWING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
] as const;

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function mapStatus(status: string, fulfillment?: string): DashStatus {
  if (status === "IN_PRODUCTION") return "IN_PRODUCTION";
  if (status === "READY") {
    return fulfillment === "DELIVERY" ? "DELIVERY" : "READY";
  }
  if (status === "NEW" || status === "REVIEWING") return "WAITING";
  return "TO_PREPARE";
}

function orderTime(o: {
  eventTime?: string | null;
  eventDate?: Date | null;
  createdAt: Date;
}) {
  if (o.eventTime) return o.eventTime.slice(0, 5);
  if (o.eventDate) return format(o.eventDate, "HH:mm");
  return format(o.createdAt, "HH:mm");
}

function firstItem(o: {
  items: {
    productName: string;
    productId?: string | null;
    referenceImage?: string | null;
  }[];
  kind?: string;
}) {
  const item = o.items[0];
  return {
    name:
      item?.productName ||
      (o.kind === "QUOTE" ? "Orçamento" : "Pedido"),
    productId: item?.productId || null,
    image: item?.referenceImage || null,
  };
}

export default async function PainelPage() {
  const session = await requireStoreSession();
  const storeId = session.storeId;
  await connectDB();

  const store = leanDoc(await Store.findOne({ _id: storeId }).lean());
  if (!store) {
    redirect("/painel/vitrine");
  }

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const monthStart = startOfMonth(now);
  const since90 = subDays(todayStart, 90);

  const [orders, products, allActiveOrders] = await Promise.all([
    leanList(
      await Order.find({ storeId, createdAt: { $gte: since90 } })
        .sort({ createdAt: -1 })
        .lean(),
    ),
    leanList(
      await Product.find({ storeId }).sort({ name: 1 }).lean(),
    ),
    leanList(
      await Order.find({
        storeId,
        status: { $in: [...ACTIVE_STATUSES] },
      })
        .sort({ eventDate: 1, eventTime: 1, createdAt: 1 })
        .lean(),
    ),
  ]);

  const productById = new Map(
    products.map((p) => [p.id, p] as const),
  );

  function resolveImage(
    productId: string | null,
    fallback: string | null,
  ): string | null {
    if (fallback) return fallback;
    if (!productId) return null;
    return productById.get(productId)?.imageUrl || null;
  }

  const todayProduction = allActiveOrders.filter((o) => {
    if (isAbandonedOnlineCheckout(o)) return false;
    if (o.eventDate) return isSameDay(o.eventDate, now);
    return o.createdAt >= todayStart && o.createdAt <= todayEnd;
  });

  const productionSource =
    todayProduction.length > 0
      ? todayProduction
      : allActiveOrders.filter((o) => !isAbandonedOnlineCheckout(o));

  const productionRows: ProductionRow[] = productionSource
    .slice(0, 6)
    .map((o) => {
      const item = firstItem(o);
      return {
        id: o.id,
        href: `/painel/pedidos/${o.id}`,
        time: orderTime(o),
        productName: item.name,
        productImage: resolveImage(item.productId, item.image),
        customerName: o.customerName,
        status: mapStatus(o.status, o.fulfillment),
      };
    });

  function toKanban(o: (typeof allActiveOrders)[number]): KanbanCard {
    const item = firstItem(o);
    return {
      id: o.id,
      href: `/painel/pedidos/${o.id}`,
      productName: item.name,
      productImage: resolveImage(item.productId, item.image),
      customerName: o.customerName,
      time: orderTime(o),
    };
  }

  const kanbanPool = productionSource;

  const kanban = {
    todo: kanbanPool
      .filter((o) =>
        ["NEW", "REVIEWING", "CONFIRMED"].includes(o.status),
      )
      .slice(0, 3)
      .map(toKanban),
    doing: kanbanPool
      .filter((o) => o.status === "IN_PRODUCTION")
      .slice(0, 3)
      .map(toKanban),
    done: kanbanPool
      .filter((o) => o.status === "READY")
      .slice(0, 3)
      .map(toKanban),
  };

  const deliveries = allActiveOrders
    .filter((o) => {
      if (isAbandonedOnlineCheckout(o)) return false;
      if (!o.eventDate || !o.eventTime) return false;
      if (o.eventDate < todayStart) return false;
      return true;
    })
    .slice(0, 5)
    .map((o) => ({
      id: o.id,
      href: `/painel/pedidos/${o.id}`,
      time: orderTime(o),
      customerName: o.customerName,
      productName: firstItem(o).name,
    }));

  const lowStock = products
    .filter((p) => p.trackStock && p.stockQty <= p.stockMin)
    .sort((a, b) => a.stockQty - b.stockQty)
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      href: `/painel/produtos/${p.id}`,
      name: p.name,
      qtyLabel: `${p.stockQty} ${p.unit || "un"}.`,
      critical: p.stockQty <= Math.max(1, Math.floor(p.stockMin / 2)),
    }));

  const todayOrders = orders.filter(
    (o) =>
      o.createdAt >= todayStart &&
      o.createdAt <= todayEnd &&
      o.status !== "CANCELLED",
  );
  const todaySales = todayOrders
    .filter((o) => o.priceLabel !== "TO_CONFIRM")
    .reduce((s, o) => s + o.totalCents, 0);

  const yesterdayStart = subDays(todayStart, 1);
  const yesterdayOrders = orders.filter(
    (o) =>
      o.createdAt >= yesterdayStart &&
      o.createdAt < todayStart &&
      o.status !== "CANCELLED" &&
      o.priceLabel !== "TO_CONFIRM",
  );
  const yesterdaySales = yesterdayOrders.reduce(
    (s, o) => s + o.totalCents,
    0,
  );

  const ticketBase = todayOrders.filter((o) => o.priceLabel !== "TO_CONFIRM");
  const ticketAvg =
    ticketBase.length > 0
      ? Math.round(
          ticketBase.reduce((s, o) => s + o.totalCents, 0) /
            ticketBase.length,
        )
      : 0;
  const yesterdayTicket =
    yesterdayOrders.length > 0
      ? Math.round(
          yesterdayOrders.reduce((s, o) => s + o.totalCents, 0) /
            yesterdayOrders.length,
        )
      : 0;

  const itemsSold = todayOrders.reduce(
    (s, o) =>
      s + o.items.reduce((n, it) => n + (it.quantity || 1), 0),
    0,
  );
  const yesterdayItems = yesterdayOrders.reduce(
    (s, o) =>
      s + o.items.reduce((n, it) => n + (it.quantity || 1), 0),
    0,
  );

  const salesMetrics = [
    {
      label: "Vendas do dia",
      value: formatBRL(todaySales),
      changePct:
        todaySales > 0 ? pctChange(todaySales, yesterdaySales) : null,
    },
    {
      label: "Pedidos realizados",
      value: String(todayOrders.length),
      changePct:
        todayOrders.length > 0
          ? pctChange(todayOrders.length, yesterdayOrders.length)
          : null,
    },
    {
      label: "Ticket médio",
      value: ticketAvg > 0 ? formatBRL(ticketAvg) : "—",
      changePct: ticketAvg > 0 ? pctChange(ticketAvg, yesterdayTicket) : null,
    },
    {
      label: "Itens vendidos",
      value: String(itemsSold),
      changePct:
        itemsSold > 0 ? pctChange(itemsSold, yesterdayItems) : null,
    },
  ];

  const monthOrders = orders.filter(
    (o) =>
      o.createdAt >= monthStart &&
      o.status !== "CANCELLED" &&
      o.priceLabel !== "TO_CONFIRM",
  );
  const soldMap = new Map<string, { name: string; qty: number; image: string | null; productId: string | null }>();
  for (const o of monthOrders) {
    for (const it of o.items) {
      const key = it.productId || it.productName;
      const prev = soldMap.get(key);
      const img = resolveImage(it.productId, it.referenceImage || null);
      if (prev) {
        prev.qty += it.quantity || 1;
      } else {
        soldMap.set(key, {
          name: it.productName,
          qty: it.quantity || 1,
          image: img,
          productId: it.productId || null,
        });
      }
    }
  }
  const topProducts = [...soldMap.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)
    .map((p, i) => ({
      id: p.productId || `top-${i}`,
      href: p.productId ? `/painel/produtos/${p.productId}` : "/painel/produtos",
      name: p.name,
      imageUrl: p.image,
      soldLabel: `${p.qty} vendido${p.qty === 1 ? "" : "s"}`,
    }));

  const productsCount = products.filter((p) => p.active).length;
  const setupSteps = [
    {
      id: "logo",
      label: "Logo adicionada",
      done: Boolean(store.logoUrl),
      href: "/painel/configuracoes/estabelecimento",
    },
    {
      id: "cover",
      label: "Banner adicionado",
      done: Boolean(store.coverUrl),
      href: "/painel/configuracoes/estabelecimento",
    },
    {
      id: "info",
      label: "Informações preenchidas",
      done: Boolean(store.description && store.whatsapp && store.address),
      href: "/painel/vitrine",
    },
    {
      id: "product",
      label: "Primeiro produto cadastrado",
      done: productsCount > 0,
      href: "/painel/produtos",
    },
    {
      id: "whatsapp",
      label: "WhatsApp conectado",
      done: Boolean(store.whatsapp && store.whatsapp.length >= 10),
      href: "/painel/integracoes",
    },
    {
      id: "published",
      label: "Vitrine publicada",
      done: store.isPublished,
      href: "/painel/vitrine",
    },
  ];
  const setupComplete = setupSteps.every((s) => s.done);

  return (
    <div className="space-y-4">
      {!setupComplete && (
        <SetupChecklist steps={setupSteps} complete={setupComplete} />
      )}
      <HomeDashboard
        productionCount={productionSource.length}
        productionRows={productionRows}
        kanban={kanban}
        deliveries={deliveries}
        lowStock={lowStock}
        salesMetrics={salesMetrics}
        topProducts={topProducts}
      />
    </div>
  );
}
