import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { connectDB } from "@/lib/db";
import { requireStoreSession } from "@/lib/tenant";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { StockItem } from "@/models/StockItem";
import { StockMovement } from "@/models/StockMovement";
import { Category } from "@/models/Category";
import { OrderStatus, StockMovementType } from "@/lib/enums";
import { leanList } from "@/lib/serialize";
import { isAbandonedOnlineCheckout } from "@/lib/utils";
import {
  buildLast7DaySales,
  categoryColor,
  formatPainelHomeDate,
  formatQtyWithUnit,
  insumoStockLevel,
  isSameCalendarDay,
  pctChange,
} from "@/lib/painel-home-metrics";
import { PainelHome } from "@/components/painel/painel-home";
import type { PainelHomeMovement } from "@/components/painel/painel-home";

function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

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

function userInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

type OrderLean = {
  id: string;
  createdAt: Date;
  totalCents: number;
  customerPhone: string;
  customerId: string | null;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  mpPaymentId: string | null;
  items: {
    productId: string | null;
    productName: string;
    quantity: number;
    lineTotalCents: number;
  }[];
};

export default async function PainelPage() {
  const session = await requireStoreSession();
  await connectDB();
  const storeId = session.storeId;
  const fullName = session.name || "Confeiteira";
  const firstName = fullName.split(" ").filter(Boolean)[0] || "Confeiteira";
  const hour = new Date().getHours();
  const today = startOfDay(new Date());
  const yesterday = subDays(today, 1);
  const salesSince = subDays(today, 29);

  const [
    ordersRaw,
    stockItems,
    products,
    categories,
    movementsRaw,
    freshOrders,
    featuredProduct,
  ] = await Promise.all([
    leanList(
      await Order.find({
        storeId,
        createdAt: { $gte: salesSince },
        status: { $ne: OrderStatus.CANCELLED },
      })
        .select({
          totalCents: 1,
          createdAt: 1,
          customerPhone: 1,
          customerId: 1,
          items: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          mpPaymentId: 1,
          status: 1,
        })
        .lean(),
    ),
    leanList(await StockItem.find({ storeId }).lean()),
    leanList(
      await Product.find({ storeId })
        .select({
          name: 1,
          categoryId: 1,
          imageUrl: 1,
          productType: 1,
        })
        .lean(),
    ),
    leanList(await Category.find({ storeId }).select({ name: 1 }).lean()),
    leanList(
      await StockMovement.find({ storeId })
        .sort({ createdAt: -1 })
        .limit(24)
        .lean(),
    ),
    Order.find({
      storeId,
      status: OrderStatus.NEW,
    })
      .select({ paymentMethod: 1, paymentStatus: 1, mpPaymentId: 1 })
      .lean(),
    Product.findOne({ storeId, active: true, imageUrl: { $ne: null } })
      .sort({ featured: -1, sortOrder: 1 })
      .select({ imageUrl: 1 })
      .lean(),
  ]);

  const orders = (ordersRaw as OrderLean[]).filter(
    (o) => !isAbandonedOnlineCheckout(o),
  );

  const ordersToday = orders.filter((o) =>
    isSameCalendarDay(today, new Date(o.createdAt)),
  );
  const ordersYesterday = orders.filter((o) =>
    isSameCalendarDay(yesterday, new Date(o.createdAt)),
  );

  const salesTodayCents = ordersToday.reduce(
    (s, o) => s + (o.totalCents || 0),
    0,
  );
  const salesYesterdayCents = ordersYesterday.reduce(
    (s, o) => s + (o.totalCents || 0),
    0,
  );

  const customersToday = new Set(
    ordersToday.map((o) => o.customerId || o.customerPhone),
  ).size;
  const customersYesterday = new Set(
    ordersYesterday.map((o) => o.customerId || o.customerPhone),
  ).size;

  const lowStockInsumos = stockItems
    .filter(
      (item) => item.minQuantity > 0 && item.quantity <= item.minQuantity,
    )
    .sort((a, b) => a.quantity / a.minQuantity - b.quantity / b.minQuantity)
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantityLabel: formatQtyWithUnit(item.quantity, item.unit),
      minLabel: `Min. ${formatQtyWithUnit(item.minQuantity, item.unit)}`,
      level: insumoStockLevel(item.quantity, item.minQuantity),
      emoji: insumoEmoji(item.name),
    }));

  const lowStockCount = stockItems.filter(
    (item) => item.minQuantity > 0 && item.quantity <= item.minQuantity,
  ).length;

  const productById = Object.fromEntries(products.map((p) => [p.id, p]));
  const categoryNameById = Object.fromEntries(
    categories.map((c) => [c.id, c.name]),
  );

  const categoryTotals = new Map<string, number>();
  const soldByProduct = new Map<string, number>();
  const periodStart = subDays(today, 29);

  for (const order of orders) {
    if (new Date(order.createdAt) < periodStart) continue;
    for (const line of order.items || []) {
      const cents = line.lineTotalCents || 0;
      const pid = line.productId;
      if (pid) {
        soldByProduct.set(pid, (soldByProduct.get(pid) || 0) + line.quantity);
        const catId = productById[pid]?.categoryId;
        const catKey = catId
          ? categoryNameById[catId] || "Outros"
          : "Outros";
        categoryTotals.set(catKey, (categoryTotals.get(catKey) || 0) + cents);
      } else {
        categoryTotals.set("Outros", (categoryTotals.get("Outros") || 0) + cents);
      }
    }
  }

  const categoryTotalCents = [...categoryTotals.values()].reduce(
    (s, v) => s + v,
    0,
  );
  const categorySlices = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, cents], index) => ({
      name,
      cents,
      pct:
        categoryTotalCents > 0
          ? Math.round((cents / categoryTotalCents) * 100)
          : 0,
      color: categoryColor(index),
    }));

  const topProducts = [...soldByProduct.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, qty]) => {
      const product = productById[id];
      const unit = product?.productType === "PARTY_KIT" ? "kits" : "un";
      return {
        id,
        href: `/painel/produtos/${id}`,
        name: product?.name || "Produto",
        imageUrl: product?.imageUrl || null,
        soldLabel: `${qty} ${unit}`,
      };
    });

  const movementProductIds = movementsRaw
    .map((m) => m.productId)
    .filter(Boolean) as string[];
  const movementStockIds = movementsRaw
    .map((m) => m.stockItemId)
    .filter(Boolean) as string[];

  const [movementProducts, movementStockItems] = await Promise.all([
    movementProductIds.length
      ? leanList(
          await Product.find({ _id: { $in: movementProductIds } })
            .select({ name: 1, unit: 1 })
            .lean(),
        )
      : [],
    movementStockIds.length
      ? leanList(
          await StockItem.find({ _id: { $in: movementStockIds } })
            .select({ name: 1, unit: 1 })
            .lean(),
        )
      : [],
  ]);

  const movementProductMap = Object.fromEntries(
    movementProducts.map((p) => [p.id, p]),
  );
  const movementStockMap = Object.fromEntries(
    movementStockItems.map((i) => [i.id, i]),
  );

  const movements: PainelHomeMovement[] = movementsRaw.slice(0, 8).map((m) => {
    const product = m.productId ? movementProductMap[m.productId] : null;
    const stock = m.stockItemId ? movementStockMap[m.stockItemId] : null;
    const labelName = product?.name || stock?.name || "Movimentação";
    const unit = product?.unit || stock?.unit || "un";
    const prefix =
      m.type === StockMovementType.IN
        ? "+"
        : m.type === StockMovementType.OUT
          ? "−"
          : "";
    const description =
      m.note?.trim() ||
      (m.type === StockMovementType.ADJUST
        ? `Ajuste de ${labelName}`
        : `${labelName}`);
    return {
      id: m.id,
      dateLabel: format(new Date(m.createdAt), "dd/MM/yyyy", { locale: ptBR }),
      type: m.type,
      description,
      quantityLabel: `${prefix}${formatQtyWithUnit(m.quantity, unit)}`,
      userName: firstName,
    };
  });

  const notificationCount = freshOrders.filter(
    (o) => !isAbandonedOnlineCheckout(o),
  ).length;

  const sales7d = buildLast7DaySales(
    orders.map((o) => ({
      createdAt: new Date(o.createdAt),
      totalCents: o.totalCents || 0,
    })),
  );

  return (
    <PainelHome
      greeting={greetingForHour(hour)}
      firstName={firstName}
      notificationCount={notificationCount}
      userName={fullName}
      userInitials={userInitials(fullName)}
      dateLabel={formatPainelHomeDate(new Date())}
      kpis={{
        salesTodayCents,
        salesChangePct:
          salesTodayCents === 0
            ? null
            : pctChange(salesTodayCents, salesYesterdayCents),
        ordersToday: ordersToday.length,
        ordersChangePct:
          ordersToday.length === 0
            ? null
            : pctChange(ordersToday.length, ordersYesterday.length),
        lowStockCount,
        customersToday,
        customersChangePct:
          customersToday === 0
            ? null
            : pctChange(customersToday, customersYesterday),
      }}
      sales7d={sales7d}
      lowStockInsumos={lowStockInsumos}
      categorySlices={categorySlices}
      categoryTotalCents={categoryTotalCents}
      topProducts={topProducts}
      movements={movements}
      productionImageUrl={featuredProduct?.imageUrl || null}
    />
  );
}
