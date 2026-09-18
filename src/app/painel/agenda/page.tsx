import Link from "next/link";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import { PageHeader } from "@/components/painel/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaControls } from "@/components/painel/agenda-controls";
import { BlockDateForm } from "@/components/painel/block-date-form";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { cn } from "@/lib/cn";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string; day?: string }>;
}) {
  const session = await requireStoreSession();
  const storeId = session.storeId;
  const sp = await searchParams;
  const view = (sp.view || "month") as "day" | "week" | "month";

  const base = sp.day
    ? new Date(`${sp.day}T12:00:00`)
    : sp.month
      ? new Date(`${sp.month}-01T12:00:00`)
      : new Date();

  const monthStart = startOfMonth(base);
  const monthEnd = endOfMonth(base);
  const weekStart = startOfWeek(base, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(base, { weekStartsOn: 0 });
  const dayStart = startOfDay(base);

  const rangeStart =
    view === "day" ? dayStart : view === "week" ? weekStart : startOfWeek(monthStart, { weekStartsOn: 0 });
  const rangeEnd =
    view === "day"
      ? addDays(dayStart, 1)
      : view === "week"
        ? addDays(weekEnd, 1)
        : addDays(endOfWeek(monthEnd, { weekStartsOn: 0 }), 1);

  const gridDays =
    view === "day"
      ? [dayStart]
      : view === "week"
        ? eachDayOfInterval({ start: weekStart, end: weekEnd })
        : eachDayOfInterval({
            start: startOfWeek(monthStart, { weekStartsOn: 0 }),
            end: endOfWeek(monthEnd, { weekStartsOn: 0 }),
          });

  const [orders, blocked] = await Promise.all([
    prisma.order.findMany({
      where: {
        storeId,
        eventDate: { gte: rangeStart, lt: rangeEnd },
        status: { not: "CANCELLED" },
      },
      include: { items: true },
      orderBy: [{ eventDate: "asc" }, { eventTime: "asc" }],
    }),
    prisma.blockedDate.findMany({
      where: {
        storeId,
        date: { gte: rangeStart, lt: rangeEnd },
      },
    }),
  ]);

  const monthParam = format(monthStart, "yyyy-MM");
  const dayParam = format(base, "yyyy-MM-dd");
  const prev =
    view === "day"
      ? format(addDays(base, -1), "yyyy-MM-dd")
      : view === "week"
        ? format(addDays(weekStart, -7), "yyyy-MM-dd")
        : format(addDays(monthStart, -1), "yyyy-MM");
  const next =
    view === "day"
      ? format(addDays(base, 1), "yyyy-MM-dd")
      : view === "week"
        ? format(addDays(weekStart, 7), "yyyy-MM-dd")
        : format(addDays(monthEnd, 1), "yyyy-MM");

  const label =
    view === "day"
      ? format(base, "EEEE, d 'de' MMMM", { locale: ptBR })
      : view === "week"
        ? `${format(weekStart, "dd/MM")} – ${format(weekEnd, "dd/MM/yyyy")}`
        : format(monthStart, "MMMM yyyy", { locale: ptBR });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Agenda"
        description="Encomendas por dia, semana ou mês. Bloqueie datas que a vitrine não deve aceitar."
        actions={
          <AgendaControls
            label={label}
            prevHref={
              view === "month"
                ? `/painel/agenda?view=month&month=${prev}`
                : `/painel/agenda?view=${view}&day=${prev}`
            }
            nextHref={
              view === "month"
                ? `/painel/agenda?view=month&month=${next}`
                : `/painel/agenda?view=${view}&day=${next}`
            }
            view={view}
            monthParam={monthParam}
            dayParam={dayParam}
          />
        }
      />

      <div className="flex flex-wrap items-center justify-end gap-2">
        <BlockDateForm />
      </div>

      {view === "month" ? (
        <div className="overflow-hidden rounded-2xl border border-cocoa/8 bg-white p-3 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-cocoa-soft/55">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {gridDays.map((day) => {
              const dayOrders = orders.filter(
                (o) => o.eventDate && isSameDay(o.eventDate, day),
              );
              const isBlocked = blocked.some((b) => isSameDay(b.date, day));
              const inMonth = isSameMonth(day, monthStart);
              const isToday = isSameDay(day, new Date());
              return (
                <Link
                  key={day.toISOString()}
                  href={`/painel/agenda?view=day&day=${format(day, "yyyy-MM-dd")}`}
                  className={cn(
                    "min-h-[72px] rounded-xl border p-1.5 sm:min-h-[96px] sm:p-2",
                    inMonth ? "border-cocoa/8 bg-white" : "border-transparent bg-fog/40",
                    isToday && "ring-2 ring-cocoa/20",
                    isBlocked && "bg-red-50/80",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      inMonth ? "text-cocoa" : "text-cocoa-soft/40",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayOrders.slice(0, 2).map((o) => (
                      <p
                        key={o.id}
                        className="truncate rounded-md bg-fog px-1 py-0.5 text-[10px] font-medium text-cocoa"
                      >
                        {o.eventTime ? `${o.eventTime} · ` : ""}
                        {o.customerName}
                      </p>
                    ))}
                    {dayOrders.length > 2 && (
                      <p className="text-[10px] text-cocoa-soft/60">
                        +{dayOrders.length - 2}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {gridDays.map((day) => {
            const dayOrders = orders.filter(
              (o) => o.eventDate && isSameDay(o.eventDate, day),
            );
            const isBlocked = blocked.some((b) => isSameDay(b.date, day));
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "rounded-2xl border border-cocoa/8 bg-white p-4",
                  isBlocked && "border-red-200 bg-red-50/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold capitalize text-cocoa">
                    {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h2>
                  {isBlocked && (
                    <span className="text-xs font-semibold text-berry-deep">
                      Data bloqueada
                    </span>
                  )}
                </div>
                {dayOrders.length === 0 ? (
                  <p className="mt-3 text-sm text-cocoa-soft/55">Sem encomendas</p>
                ) : (
                  <ul className="mt-3 divide-y divide-cocoa/6">
                    {dayOrders.map((o) => (
                      <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div>
                          <p className="text-sm font-medium text-cocoa">
                            {o.eventTime || "Horário a combinar"} · {o.customerName}
                          </p>
                          <p className="text-xs text-cocoa-soft/60">
                            {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(" · ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <OrderStatusBadge status={o.status} />
                          <Link
                            href={`/painel/pedidos/${o.id}`}
                            className="text-xs font-semibold text-berry-deep"
                          >
                            Ver
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-cocoa/8 bg-white p-5">
        <h2 className="text-sm font-semibold text-cocoa">Lista do período</h2>
        {orders.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={CalendarDays}
              title="Nenhuma encomenda neste período"
              description="Pedidos com data de entrega aparecem na agenda."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-cocoa/6">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3"
              >
                <div>
                  <p className="font-medium text-cocoa">
                    {o.eventDate && format(o.eventDate, "dd/MM")}
                    {o.eventTime ? ` · ${o.eventTime}` : ""} — {o.customerName}
                  </p>
                  <p className="text-xs text-cocoa-soft/65">
                    {o.items.map((i) => i.productName).join(", ")} ·{" "}
                    {ORDER_STATUS_LABELS[o.status]}
                  </p>
                </div>
                <Link
                  href={`/painel/pedidos/${o.id}`}
                  className="text-xs font-semibold text-berry-deep"
                >
                  Detalhes
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
