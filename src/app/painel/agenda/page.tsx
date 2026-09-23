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
import { CalendarDays, Store } from "lucide-react";
import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Order } from "@/models/Order";
import { BlockedDate } from "@/models/BlockedDate";
import { Store as StoreModel } from "@/models/Store";
import { Category } from "@/models/Category";
import { OrderStatus } from "@/lib/enums";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import {
  PageHeader,
  PageShell,
  SectionCard,
  SoftLink,
  StatTile,
} from "@/components/painel/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { AgendaControls } from "@/components/painel/agenda-controls";
import { BlockDateForm } from "@/components/painel/block-date-form";
import { BlockedDatesList } from "@/components/painel/blocked-dates-list";
import { isDateBlocked, type BlockedDateRow } from "@/lib/blocked-dates";
import { OrderStatusBadge } from "@/components/ui/order-status";
import {
  ALL_CATEGORY_DAYS,
  CATEGORY_DAY_LABELS,
  formatDisplayDaysShort,
  normalizeDisplayDays,
  todayCategoryDayKey,
} from "@/lib/category";
import { cn } from "@/lib/cn";

function categoriesVisibleOnDay(
  categories: { active?: boolean; displayDays?: string[] | null; name: string }[],
  day: Date,
) {
  const key = todayCategoryDayKey(day);
  return categories.filter((c) => {
    if (c.active === false) return false;
    const days = normalizeDisplayDays(c.displayDays);
    if (days.length >= ALL_CATEGORY_DAYS.length) return true;
    return days.includes(key);
  });
}

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
    view === "day"
      ? dayStart
      : view === "week"
        ? weekStart
        : startOfWeek(monthStart, { weekStartsOn: 0 });
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

  await connectDB();
  const [orders, blockedRaw, store, categories] = await Promise.all([
    leanList(
      await Order.find({
        storeId,
        eventDate: { $gte: rangeStart, $lt: rangeEnd },
        status: { $ne: OrderStatus.CANCELLED },
      })
        .sort({ eventDate: 1, eventTime: 1 })
        .lean(),
    ),
    leanList(
      await BlockedDate.find({
        storeId,
        date: { $gte: rangeStart, $lt: rangeEnd },
      })
        .sort({ date: 1 })
        .lean(),
    ),
    StoreModel.findById(storeId)
      .select({ minAdvanceDays: 1, productionNote: 1 })
      .lean(),
    leanList(
      await Category.find({ storeId })
        .select({ name: 1, active: 1, displayDays: 1, sortOrder: 1 })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ),
  ]);

  const blocked: BlockedDateRow[] = blockedRaw.map((b) => ({
    id: b.id,
    date:
      b.date instanceof Date
        ? b.date.toISOString()
        : new Date(b.date).toISOString(),
    reason: b.reason,
  }));

  const restrictedCategories = categories.filter((c) => {
    if (c.active === false) return false;
    const days = normalizeDisplayDays(c.displayDays);
    return days.length < ALL_CATEGORY_DAYS.length;
  });

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

  const minAdvance = store?.minAdvanceDays ?? 2;

  return (
    <PageShell>
      <PageHeader
        title="Agenda"
        description="Encomendas por dia, semana ou mês. Bloqueie datas que a vitrine não deve aceitar."
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
            <BlockDateForm />
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Encomendas no período"
          value={orders.length}
          hint="Pedidos com data de entrega"
        />
        <StatTile
          label="Datas bloqueadas"
          value={blocked.length}
          hint="Impedem novos pedidos na vitrine"
        />
        <StatTile
          label="Antecedência na vitrine"
          value={`${minAdvance} ${minAdvance === 1 ? "dia" : "dias"}`}
          hint="Prazo mínimo no checkout"
          href="/painel/configuracoes/pagamento"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <div className="space-y-4">
          {view === "month" ? (
            <SectionCard title="Calendário">
              <div className="p-3 sm:p-4">
                <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase tracking-wide text-[#8C8682]">
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
                    const block = isDateBlocked(blocked, day);
                    const inMonth = isSameMonth(day, monthStart);
                    const isToday = isSameDay(day, new Date());
                    const menuCount = categoriesVisibleOnDay(categories, day)
                      .length;
                    const menuLimited =
                      restrictedCategories.length > 0 &&
                      menuCount < categories.filter((c) => c.active !== false).length;
                    return (
                      <Link
                        key={day.toISOString()}
                        href={`/painel/agenda?view=day&day=${format(day, "yyyy-MM-dd")}`}
                        className={cn(
                          "min-h-[72px] rounded-lg border p-1.5 transition hover:border-[#CED0D4] sm:min-h-[96px] sm:p-2",
                          inMonth
                            ? "border-[#E8E2DE] bg-white"
                            : "border-transparent bg-[#FAFAFA]",
                          isToday && "ring-2 ring-[#483129]/25",
                          block && "border-[#F0C4C4] bg-[#FFF8F8]",
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={cn(
                              "text-xs font-bold",
                              inMonth ? "text-[#2D2926]" : "text-[#B0AAA6]",
                            )}
                          >
                            {format(day, "d")}
                          </span>
                          {block && (
                            <span
                              className="rounded px-1 text-[9px] font-bold uppercase text-[#C85A5A]"
                              title={block.reason ?? "Bloqueada"}
                            >
                              Off
                            </span>
                          )}
                        </div>
                        <div className="mt-1 space-y-0.5">
                          {dayOrders.slice(0, 2).map((o) => (
                            <p
                              key={o.id}
                              className="truncate rounded-md bg-[#F0F2F5] px-1 py-0.5 text-[10px] font-semibold text-[#483129]"
                            >
                              {o.eventTime ? `${o.eventTime} · ` : ""}
                              {o.customerName}
                            </p>
                          ))}
                          {dayOrders.length > 2 && (
                            <p className="text-[10px] font-medium text-[#8C8682]">
                              +{dayOrders.length - 2}
                            </p>
                          )}
                          {menuLimited && dayOrders.length === 0 && !block && (
                            <p className="text-[9px] font-medium text-[#8C8682]">
                              Menu parcial
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          ) : (
            <div className="space-y-3">
              {gridDays.map((day) => {
                const dayOrders = orders.filter(
                  (o) => o.eventDate && isSameDay(o.eventDate, day),
                );
                const block = isDateBlocked(blocked, day);
                const visible = categoriesVisibleOnDay(categories, day);
                return (
                  <SectionCard key={day.toISOString()}>
                    <div
                      className={cn(
                        "p-4",
                        block && "bg-[#FFF8F8]",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold capitalize text-[#2D2926]">
                          {format(day, "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </h2>
                        {block && (
                          <span className="rounded-full bg-[#FFF0F0] px-2.5 py-0.5 text-xs font-semibold text-[#C85A5A]">
                            Bloqueada na vitrine
                          </span>
                        )}
                      </div>
                      {restrictedCategories.length > 0 && (
                        <p className="mt-2 text-xs text-[#8C8682]">
                          Categorias no cardápio:{" "}
                          <span className="font-semibold text-[#2D2926]">
                            {visible.length} de{" "}
                            {categories.filter((c) => c.active !== false).length}
                          </span>
                        </p>
                      )}
                      {dayOrders.length === 0 ? (
                        <p className="mt-3 text-sm text-[#8C8682]">
                          Sem encomendas
                        </p>
                      ) : (
                        <ul className="mt-3 divide-y divide-[#E8E2DE]">
                          {dayOrders.map((o) => (
                            <li
                              key={o.id}
                              className="flex flex-wrap items-center justify-between gap-2 py-3"
                            >
                              <div>
                                <p className="text-sm font-medium text-[#2D2926]">
                                  {o.eventTime || "Horário a combinar"} ·{" "}
                                  {o.customerName}
                                </p>
                                <p className="text-xs text-[#8C8682]">
                                  {o.items
                                    .map(
                                      (i: {
                                        quantity: number;
                                        productName: string;
                                      }) => `${i.quantity}× ${i.productName}`,
                                    )
                                    .join(" · ")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <OrderStatusBadge status={o.status} />
                                <SoftLink href={`/painel/pedidos/${o.id}`}>
                                  Ver
                                </SoftLink>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          )}

          <SectionCard title="Lista do período">
            {orders.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  icon={CalendarDays}
                  title="Nenhuma encomenda neste período"
                  description="Pedidos com data de entrega aparecem na agenda."
                />
              </div>
            ) : (
              <ul className="divide-y divide-[#E8E2DE] px-4 sm:px-5">
                {orders.map((o) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <p className="font-medium text-[#2D2926]">
                        {o.eventDate && format(o.eventDate, "dd/MM")}
                        {o.eventTime ? ` · ${o.eventTime}` : ""} —{" "}
                        {o.customerName}
                      </p>
                      <p className="text-xs text-[#8C8682]">
                        {o.items
                          .map((i: { productName: string }) => i.productName)
                          .join(", ")}{" "}
                        ·{" "}
                        {
                          ORDER_STATUS_LABELS[
                            o.status as keyof typeof ORDER_STATUS_LABELS
                          ]
                        }
                      </p>
                    </div>
                    <SoftLink href={`/painel/pedidos/${o.id}`}>
                      Detalhes
                    </SoftLink>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-4">
          <SectionCard title="Regras na vitrine">
            <div className="space-y-4 p-4 text-sm">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#8C8682]">
                  Prazo mínimo
                </p>
                <p className="mt-1 font-semibold text-[#2D2926]">
                  {minAdvance}{" "}
                  {minAdvance === 1 ? "dia de antecedência" : "dias de antecedência"}
                </p>
                <p className="mt-1 text-xs text-[#8C8682]">
                  Mesma regra aplicada no checkout e nos pedidos pela vitrine.
                </p>
                <Link
                  href="/painel/configuracoes/pagamento"
                  className="mt-2 inline-block text-xs font-medium text-[#C85A5A] hover:underline"
                >
                  Editar prazo
                </Link>
              </div>
              {store?.productionNote?.trim() ? (
                <div className="rounded-lg border border-[#E8E2DE] bg-[#FAFAFA] p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#8C8682]">
                    Nota no cardápio
                  </p>
                  <p className="mt-1 text-sm text-[#2D2926]">
                    {store.productionNote}
                  </p>
                </div>
              ) : null}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#8C8682]">
                  Datas bloqueadas
                </p>
                <div className="mt-2">
                  <BlockedDatesList dates={blocked} compact />
                </div>
              </div>
            </div>
          </SectionCard>

          {restrictedCategories.length > 0 ? (
            <SectionCard
              title="Dias por categoria"
              action={
                <Link
                  href="/painel/categorias"
                  className="text-xs font-semibold text-[#C85A5A] hover:underline"
                >
                  Categorias
                </Link>
              }
            >
              <ul className="divide-y divide-[#E8E2DE] px-4">
                {restrictedCategories.map((c) => (
                  <li key={c.id} className="py-3">
                    <p className="text-sm font-semibold text-[#2D2926]">
                      {c.name}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {CATEGORY_DAY_LABELS.map(({ key, short }) => {
                        const on = normalizeDisplayDays(c.displayDays).includes(
                          key,
                        );
                        return (
                          <span
                            key={key}
                            className={cn(
                              "rounded px-1.5 py-0.5 text-[10px] font-bold",
                              on
                                ? "bg-[#483129] text-white"
                                : "bg-[#F0F2F5] text-[#B0AAA6]",
                            )}
                          >
                            {short}
                          </span>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-xs text-[#8C8682]">
                      {formatDisplayDaysShort(c.displayDays)}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="border-t border-[#E8E2DE] px-4 py-3 text-xs text-[#8C8682]">
                <Store className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
                No cardápio, só aparecem categorias do dia — igual aos chips
                acima.
              </p>
            </SectionCard>
          ) : null}
        </aside>
      </div>
    </PageShell>
  );
}
