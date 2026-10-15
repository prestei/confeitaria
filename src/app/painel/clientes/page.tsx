import { headers } from "next/headers";
import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { digitsOnly } from "@/lib/utils";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { OrderStatus } from "@/lib/enums";
import {
  CustomersAdmin,
  type CustomersAdminStats,
} from "@/components/painel/customers-admin";
import { type CustomerRow } from "@/components/painel/customers-table";

type PhoneAgg = {
  name: string;
  phone: string;
  email: string | null;
  orders: number;
  spent: number;
  lastOrder: string;
};

function aggregateOrders(
  orders: {
    customerName: string;
    customerPhone: string;
    customerEmail: string | null;
    status: string;
    priceLabel: string;
    totalCents: number;
    createdAt: Date;
  }[],
) {
  const map = new Map<string, PhoneAgg>();
  for (const o of orders) {
    const phone = digitsOnly(o.customerPhone);
    if (!phone) continue;
    const add =
      o.status !== OrderStatus.CANCELLED && o.priceLabel !== "TO_CONFIRM"
        ? o.totalCents
        : 0;
    const iso = o.createdAt.toISOString();
    const existing = map.get(phone);
    if (!existing) {
      map.set(phone, {
        name: o.customerName,
        phone,
        email: o.customerEmail,
        orders: 1,
        spent: add,
        lastOrder: iso,
      });
    } else {
      existing.orders += 1;
      existing.spent += add;
      if (iso > existing.lastOrder) {
        existing.lastOrder = iso;
        existing.name = o.customerName;
        existing.email = o.customerEmail || existing.email;
      }
    }
  }
  return map;
}

export default async function ClientesPage() {
  const session = await requireStoreSession();
  const storeId = session.storeId;
  await connectDB();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const customers = leanList(
    await Customer.find({ storeId }).sort({ updatedAt: -1 }).lean(),
  );

  const allOrders = leanList(
    await Order.find({ storeId }).sort({ createdAt: -1 }).lean(),
  );

  const byPhone = aggregateOrders(allOrders);
  const registeredPhones = new Set(customers.map((c) => c.phone));

  const rows: CustomerRow[] = [];

  for (const c of customers) {
    const agg = byPhone.get(c.phone);
    rows.push({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      orders: agg?.orders ?? 0,
      spent: agg?.spent ?? 0,
      lastOrder: agg?.lastOrder ?? c.createdAt.toISOString(),
      href: `/painel/clientes/${c.id}`,
      source: "registered",
    });
  }

  for (const [phone, agg] of byPhone) {
    if (registeredPhones.has(phone)) continue;
    rows.push({
      id: phone,
      name: agg.name,
      phone: agg.phone,
      email: agg.email,
      orders: agg.orders,
      spent: agg.spent,
      lastOrder: agg.lastOrder,
      href: `/painel/clientes/phone/${encodeURIComponent(phone)}`,
      source: "vitrine",
    });
  }

  rows.sort(
    (a, b) =>
      new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime(),
  );

  const stats: CustomersAdminStats = {
    total: rows.length,
    registered: rows.filter((r) => r.source === "registered").length,
    vitrineOnly: rows.filter((r) => r.source === "vitrine").length,
    repeat: rows.filter((r) => r.orders >= 2).length,
    orderCount: allOrders.filter((o) => o.status !== OrderStatus.CANCELLED)
      .length,
    revenueCents: allOrders
      .filter(
        (o) =>
          o.status !== OrderStatus.CANCELLED && o.priceLabel !== "TO_CONFIRM",
      )
      .reduce((s, o) => s + o.totalCents, 0),
  };

  return (
    <CustomersAdmin
      rows={rows}
      stats={stats}
      storeSlug={session.storeSlug}
      origin={origin}
    />
  );
}
