import { redirect } from "next/navigation";
import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import { AgendaControls } from "@/components/painel/agenda-controls";
import { cn } from "@/lib/cn";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/entrar");
  const storeId = session.user.storeId;

  const sp = await searchParams;
  const base = sp.month ? new Date(`${sp.month}-01T12:00:00`) : new Date();
  const monthStart = startOfMonth(base);
  const monthEnd = endOfMonth(base);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const [orders, blocked] = await Promise.all([
    prisma.order.findMany({
      where: {
        storeId,
        eventDate: { gte: gridStart, lte: addDays(gridEnd, 1) },
        status: { not: "CANCELLED" },
      },
      include: { items: true },
      orderBy: { eventDate: "asc" },
    }),
    prisma.blockedDate.findMany({
      where: {
        storeId,
        date: { gte: gridStart, lte: gridEnd },
      },
    }),
  ]);

  const monthParam = format(monthStart, "yyyy-MM");
  const prev = format(addDays(monthStart, -1), "yyyy-MM");
  const next = format(addDays(monthEnd, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-cocoa sm:text-4xl">Agenda</h1>
          <p className="mt-1 text-cocoa-soft/75">
            Encomendas e datas bloqueadas do mês.
          </p>
        </div>
        <AgendaControls
          monthLabel={format(monthStart, "MMMM yyyy", { locale: ptBR })}
          prevMonth={prev}
          nextMonth={next}
          currentMonth={monthParam}
        />
      </div>

      <Card className="overflow-hidden p-3 sm:p-4">
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-cocoa-soft/55">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dayOrders = orders.filter(
              (o) => o.eventDate && isSameDay(o.eventDate, day),
            );
            const isBlocked = blocked.some((b) => isSameDay(b.date, day));
            const inMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[72px] rounded-xl border p-1.5 sm:min-h-[96px] sm:p-2",
                  inMonth ? "border-cocoa/8 bg-white" : "border-transparent bg-fog/40",
                  isToday && "ring-2 ring-berry/30",
                  isBlocked && "bg-red-50/80",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      inMonth ? "text-cocoa" : "text-cocoa-soft/40",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {isBlocked && (
                    <Badge tone="danger" className="!px-1.5 !text-[9px]">
                      Bloq.
                    </Badge>
                  )}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayOrders.slice(0, 2).map((o) => (
                    <p
                      key={o.id}
                      className="truncate rounded-md bg-blush/70 px-1 py-0.5 text-[10px] font-medium text-berry-deep"
                      title={o.customerName}
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
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-xl text-cocoa">Encomendas do mês</h2>
        {orders.filter((o) => o.eventDate && isSameMonth(o.eventDate, monthStart))
          .length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={CalendarDays}
              title="Nenhuma encomenda neste mês"
              description="Pedidos com data de evento aparecerão na grade e nesta lista."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-cocoa/6">
            {orders
              .filter((o) => o.eventDate && isSameMonth(o.eventDate, monthStart))
              .map((o) => (
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
                      {o.items.map((i) => i.productName).join(", ")}
                    </p>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
