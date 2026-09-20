import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CreditCard,
  ClipboardList,
  ShoppingBag,
  CalendarDays,
  Clock,
  Plus,
} from "lucide-react";
import {
  format,
  subDays,
  eachDayOfInterval,
  startOfDay,
  endOfDay,
  isSameDay,
  addHours,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { connectDB } from "@/lib/db";
import { leanDoc, leanList } from "@/lib/serialize";
import { formatBRL } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { BlockedDate } from "@/models/BlockedDate";
import { PageHeader, PageShell } from "@/components/painel/page-header";
import { PeriodChart } from "@/components/painel/period-chart";
import { SetupChecklist } from "@/components/painel/setup-checklist";
import { cn } from "@/lib/cn";

const ACTIVE_STATUSES = [
  "NEW",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
] as const;

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
}

function revenueSeries(
  orders: {
    createdAt: Date;
    totalCents: number;
    status: string;
    priceLabel: string;
  }[],
  days: number,
) {
  const end = startOfDay(new Date());
  const start = subDays(end, days - 1);
  const interval = eachDayOfInterval({ start, end });
  return interval.map((day) => {
    const next = subDays(day, -1);
    const cents = orders
      .filter(
        (o) =>
          o.createdAt >= day &&
          o.createdAt < next &&
          o.status !== "CANCELLED" &&
          o.priceLabel !== "TO_CONFIRM",
      )
      .reduce((s, o) => s + o.totalCents, 0);
    return {
      label: format(day, days <= 7 ? "EEE" : "dd MMM", { locale: ptBR }),
      value: cents,
    };
  });
}

function todayHourSeries(
  orders: {
    createdAt: Date;
    totalCents: number;
    status: string;
    priceLabel: string;
  }[],
) {
  const now = new Date();
  const start = startOfDay(now);
  const hours = Math.max(1, now.getHours() + 1);
  return Array.from({ length: hours }, (_, h) => {
    const from = addHours(start, h);
    const to = addHours(start, h + 1);
    const cents = orders
      .filter(
        (o) =>
          o.createdAt >= from &&
          o.createdAt < to &&
          o.status !== "CANCELLED" &&
          o.priceLabel !== "TO_CONFIRM",
      )
      .reduce((s, o) => s + o.totalCents, 0);
    return {
      label: `${String(h).padStart(2, "0")}h`,
      value: cents,
    };
  });
}

function sumRevenue(
  orders: {
    totalCents: number;
    status: string;
    priceLabel: string;
    createdAt: Date;
  }[],
  from: Date,
  to: Date,
) {
  return orders
    .filter(
      (o) =>
        o.createdAt >= from &&
        o.createdAt < to &&
        o.status !== "CANCELLED" &&
        o.priceLabel !== "TO_CONFIRM",
    )
    .reduce((s, o) => s + o.totalCents, 0);
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
  const since90 = subDays(todayStart, 90);

  const [orders, productsCount, blockedDates, allRecentOrders] =
    await Promise.all([
      leanList(
        await Order.find({ storeId, createdAt: { $gte: since90 } })
          .sort({ createdAt: -1 })
          .lean(),
      ),
      Product.countDocuments({ storeId, active: true }),
      leanList(
        await BlockedDate.find({
          storeId,
          date: { $gte: todayStart, $lte: subDays(todayStart, -14) },
        })
          .sort({ date: 1 })
          .limit(3)
          .lean(),
      ),
      leanList(
        await Order.find({ storeId })
          .sort({ eventDate: 1, eventTime: 1 })
          .lean(),
      ),
    ]);

  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = (session.name || store.name).split(" ")[0];

  const todayOrders = orders.filter(
    (o) =>
      o.createdAt >= todayStart &&
      o.createdAt <= todayEnd &&
      o.status !== "CANCELLED",
  );
  const todaySales = todayOrders
    .filter((o) => o.priceLabel !== "TO_CONFIRM")
    .reduce((s, o) => s + o.totalCents, 0);

  const sameWeekdayLastWeek = subDays(todayStart, 7);
  const lastSameDayOrders = orders.filter(
    (o) =>
      isSameDay(o.createdAt, sameWeekdayLastWeek) &&
      o.status !== "CANCELLED" &&
      o.priceLabel !== "TO_CONFIRM",
  );
  const lastSameDaySales = lastSameDayOrders.reduce(
    (s, o) => s + o.totalCents,
    0,
  );
  const salesChange = pctChange(todaySales, lastSameDaySales);
  const weekdayName = format(now, "EEEE", { locale: ptBR });

  const inProgress = allRecentOrders.filter((o) =>
    (ACTIVE_STATUSES as readonly string[]).includes(o.status),
  );
  const waiting = inProgress.filter(
    (o) => o.status === "NEW",
  ).length;
  const nextHourDeliveries = inProgress.filter((o) => {
    if (!o.eventDate || !isSameDay(o.eventDate, now) || !o.eventTime)
      return false;
    const [hh, mm] = o.eventTime.split(":").map(Number);
    if (Number.isNaN(hh)) return false;
    const eventMinutes = hh * 60 + (mm || 0);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return eventMinutes >= nowMinutes && eventMinutes <= nowMinutes + 60;
  }).length;

  const confirmedToday = todayOrders.filter((o) =>
    ["CONFIRMED", "IN_PRODUCTION", "READY", "DELIVERED"].includes(o.status),
  );
  const ticketBase = todayOrders.filter((o) => o.priceLabel !== "TO_CONFIRM");
  const ticketAvg =
    ticketBase.length > 0
      ? Math.round(
          ticketBase.reduce((s, o) => s + o.totalCents, 0) / ticketBase.length,
        )
      : 0;

  const yesterdayStart = subDays(todayStart, 1);
  const yesterdayOrders = orders.filter(
    (o) =>
      o.createdAt >= yesterdayStart &&
      o.createdAt < todayStart &&
      o.status !== "CANCELLED" &&
      o.priceLabel !== "TO_CONFIRM",
  );
  const yesterdayTicket =
    yesterdayOrders.length > 0
      ? Math.round(
          yesterdayOrders.reduce((s, o) => s + o.totalCents, 0) /
            yesterdayOrders.length,
        )
      : 0;
  const ticketChange = pctChange(ticketAvg, yesterdayTicket);

  const series = {
    today: todayHourSeries(orders as any),
    "7": revenueSeries(orders as any, 7),
    "30": revenueSeries(orders as any, 30),
  };

  const rev7 = sumRevenue(orders as any, subDays(todayStart, 6), todayEnd);
  const rev7Prev = sumRevenue(orders as any,
    subDays(todayStart, 13),
    subDays(todayStart, 6),
  );
  const rev30 = sumRevenue(orders as any, subDays(todayStart, 29), todayEnd);
  const rev30Prev = sumRevenue(orders as any,
    subDays(todayStart, 59),
    subDays(todayStart, 29),
  );

  const totals = {
    today: { cents: todaySales, changePct: salesChange },
    "7": { cents: rev7, changePct: pctChange(rev7, rev7Prev) },
    "30": { cents: rev30, changePct: pctChange(rev30, rev30Prev) },
  };

  const upcomingOrders = allRecentOrders
    .filter(
      (o) =>
        o.eventDate &&
        o.eventDate >= todayStart &&
        o.status !== "CANCELLED" &&
        o.status !== "DELIVERED",
    )
    .slice(0, 6);

  const appointments = [
    ...upcomingOrders.map((o, i) => {
      const tone = (["rose", "blue", "green"] as const)[i % 3];
      const kind = o.fulfillment === "DELIVERY" ? "Entrega" : "Retirada";
      const time =
        o.eventTime ||
        (o.eventDate ? format(o.eventDate, "HH:mm") : "—");
      const product =
        o.items[0]?.productName ||
        (o.kind === "QUOTE" ? "Orçamento" : "Pedido");
      return {
        id: o.id,
        href: `/painel/pedidos/${o.id}`,
        time,
        title: `${kind} · ${o.customerName}`,
        detail: product,
        tone,
      };
    }),
    ...blockedDates
      .slice(0, Math.max(0, 6 - upcomingOrders.length))
      .map((b) => ({
        id: b.id,
        href: "/painel/agenda",
        time: format(b.date, "dd/MM"),
        title: "Data bloqueada",
        detail: b.reason || "Agenda indisponível",
        tone: "green" as const,
      })),
  ].slice(0, 6);

  const setupSteps = [
    {
      id: "logo",
      label: "Logo adicionada",
      done: Boolean(store.logoUrl),
      href: "/painel/vitrine",
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

  const toneBorder = {
    rose: "border-l-[#C85A5A] bg-[#FDECEC]",
    blue: "border-l-[#5B8FB8] bg-[#EBF4F8]",
    green: "border-l-[#5A9E6F] bg-[#F0F4EF]",
  } as const;

  return (
    <PageShell>
      <PageHeader
        title={`${greeting}, ${firstName}.`}
        description="A cozinha está em movimento. Aqui está o que merece sua atenção."
      />

      {!setupComplete && (
        <SetupChecklist steps={setupSteps} complete={setupComplete} />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border border-[#E8E2DE] bg-white p-4 shadow-[0_1px_2px_rgba(45,41,38,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-[#8C8682]">Vendas de hoje</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FDECEC] text-[#C85A5A]">
              <CreditCard className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </div>
          <p className="mt-2 text-[1.5rem] font-bold tracking-tight text-[#2D2926] tabular-nums">
            {formatBRL(todaySales)}
          </p>
          {salesChange != null && (
            <p
              className={cn(
                "mt-1.5 text-xs font-semibold",
                salesChange >= 0 ? "text-[#4A9E5F]" : "text-[#C85A5A]",
              )}
            >
              {salesChange >= 0 ? "↗" : "↘"}{" "}
              {Math.abs(salesChange).toFixed(1).replace(".", ",")}%
              <span className="font-normal text-[#8C8682]">
                {" "}
                vs. {formatBRL(lastSameDaySales)} na última {weekdayName}
              </span>
            </p>
          )}
        </article>

        <article className="rounded-xl border border-[#E8E2DE] bg-white p-4 shadow-[0_1px_2px_rgba(45,41,38,0.04)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-[#8C8682]">
              Pedidos em andamento
            </p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EBF4F8] text-[#5B8FB8]">
              <ClipboardList className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </div>
          <p className="mt-2 text-[1.5rem] font-bold tracking-tight text-[#2D2926] tabular-nums">
            {inProgress.length}
          </p>
          <p className="mt-1.5 text-xs text-[#8C8682]">
            <span className="inline-flex items-center gap-1 font-semibold text-[#C85A5A]">
              <Clock className="h-3.5 w-3.5" strokeWidth={2} />
              {waiting} aguardando
            </span>
            {" · "}
            {nextHourDeliveries === 0
              ? "nenhuma entrega na próxima hora"
              : nextHourDeliveries === 1
                ? "1 entrega na próxima hora"
                : `${nextHourDeliveries} entregas na próxima hora`}
          </p>
        </article>

        <article className="rounded-xl border border-[#E8E2DE] bg-white p-4 shadow-[0_1px_2px_rgba(45,41,38,0.04)] sm:col-span-2 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium text-[#8C8682]">Ticket médio</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F0F4EF] text-[#5A9E6F]">
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
            </span>
          </div>
          <p className="mt-2 text-[1.5rem] font-bold tracking-tight text-[#2D2926] tabular-nums">
            {ticketAvg > 0 ? formatBRL(ticketAvg) : "—"}
          </p>
          <p className="mt-1.5 text-xs text-[#8C8682]">
            {ticketChange != null && ticketAvg > 0 && (
              <span
                className={cn(
                  "font-semibold",
                  ticketChange >= 0 ? "text-[#4A9E5F]" : "text-[#C85A5A]",
                )}
              >
                {ticketChange >= 0 ? "↗" : "↘"}{" "}
                {Math.abs(ticketChange).toFixed(1).replace(".", ",")}%{" "}
              </span>
            )}
            {(() => {
              const n = confirmedToday.length || todayOrders.length;
              return n === 1
                ? "1 pedido confirmado hoje"
                : `${n} pedidos confirmados hoje`;
            })()}
          </p>
        </article>
      </div>

      <div className="grid gap-3 lg:grid-cols-5 lg:items-start">
        <section className="rounded-xl border border-[#E8E2DE] bg-white p-4 shadow-[0_1px_2px_rgba(45,41,38,0.04)] lg:col-span-3">
          <PeriodChart series={series} totals={totals} />
        </section>

        <section className="flex flex-col rounded-xl border border-[#E8E2DE] bg-white p-4 shadow-[0_1px_2px_rgba(45,41,38,0.04)] lg:col-span-2">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F5E8E8] text-[#C85A5A]">
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <h2 className="font-sans text-[15px] font-semibold text-[#2D2926]">
                Próximos compromissos
              </h2>
            </div>
            <Link
              href="/painel/agenda"
              className="text-xs font-semibold text-[#C85A5A] hover:underline"
            >
              Ver agenda
            </Link>
          </div>

          {appointments.length === 0 ? (
            <div className="py-3 text-center">
              <p className="text-sm font-medium text-[#2D2926]">Agenda livre</p>
              <p className="mt-0.5 text-xs text-[#8C8682]">
                Encomendas com data aparecerão aqui.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {appointments.map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className={cn(
                      "flex items-baseline justify-between gap-2 rounded-md border-l-[3px] px-2.5 py-1.5 transition hover:opacity-90",
                      toneBorder[a.tone],
                    )}
                  >
                    <p className="min-w-0 truncate text-[12px] font-semibold leading-snug text-[#2D2926]">
                      <span className="tabular-nums">{a.time}</span>
                      <span className="font-medium text-[#6B6560]">
                        {" "}
                        · {a.title}
                      </span>
                    </p>
                    <p className="shrink-0 text-[11px] leading-snug text-[#8C8682]">
                      {a.detail}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/painel/agenda"
            className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-[#8C8682] transition hover:text-[#C85A5A]"
          >
            <Plus className="h-3.5 w-3.5" />
            adicionar compromisso
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
