"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  differenceInCalendarDays,
  differenceInMinutes,
  isToday,
} from "date-fns";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  Clock,
  Globe,
  MessageCircle,
  Minus,
  Move,
  Package,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
} from "lucide-react";
import { allowedStatuses, canTransitionStatus } from "@/lib/order-status";
import {
  formatBRL,
  formatPhone,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader, PageShell } from "@/components/painel/page-header";
import {
  RowActionsMenu,
  type RowActionItem,
} from "@/components/painel/row-actions-menu";
import { OrderDetailSheet } from "@/components/painel/order-detail-sheet";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type OrderStatus = keyof typeof ORDER_STATUS_LABELS;
type PaymentStatus = keyof typeof PAYMENT_STATUS_LABELS;

type OrderItem = {
  id?: string;
  productId?: string | null;
  productName: string;
  quantity: number;
  lineTotalCents?: number;
  customizations?: Record<string, string> | null;
  referenceImage?: string | null;
};

type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  status: OrderStatus;
  kind: string;
  priceLabel: string;
  totalCents: number;
  eventDate: string | null;
  eventTime: string | null;
  paymentMethod: string | null;
  paymentStatus: PaymentStatus;
  mpPaymentId: string | null;
  fulfillment: "PICKUP" | "DELIVERY";
  deliveryZone: string | null;
  notes: string | null;
  referenceNote: string | null;
  whatsappMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

const POLL_MS = 3000;

/** Colunas do quadro operacional (entregues/cancelados ficam no histórico). */
const BOARD_COLUMNS = [
  "NEW",
  "REVIEWING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
] as const satisfies readonly OrderStatus[];

type BoardStatus = (typeof BOARD_COLUMNS)[number];
type StatusFilter = "ALL" | BoardStatus;
type ChannelFilter = "ALL" | "WHATSAPP" | "SITE" | "BALCAO";
type SortOrder = "newest" | "oldest";
type DateRangeDays = 7 | 30 | 90;

const STATUS_TAB_LABELS: Record<BoardStatus, string> = {
  NEW: "Aguardando confirmação",
  REVIEWING: "Em análise",
  CONFIRMED: "Confirmados",
  IN_PRODUCTION: "Em produção",
  READY: "Prontos",
};

const COLUMN_THEME: Record<
  BoardStatus,
  {
    columnBg: string;
    headerIcon: string;
    cardBg: string;
    cardBorder: string;
    badge: string;
    metricBg: string;
    metricIcon: string;
  }
> = {
  NEW: {
    columnBg: "bg-[#FDF3F4]",
    headerIcon: "bg-[#F8D4DC] text-[#C45A6A]",
    cardBg: "bg-[#FFFBFC]",
    cardBorder: "border-[#F3DDE3]",
    badge: "bg-[#F8D4DC] text-[#9E3D52]",
    metricBg: "bg-[#FDF3F4] border-[#F5DDE2]",
    metricIcon: "bg-[#F8D4DC] text-[#C45A6A]",
  },
  REVIEWING: {
    columnBg: "bg-[#FBF6EE]",
    headerIcon: "bg-[#F5E4C8] text-[#B8862E]",
    cardBg: "bg-[#FFFCF7]",
    cardBorder: "border-[#EDE4D4]",
    badge: "bg-[#F5E4C8] text-[#8A6420]",
    metricBg: "bg-[#FBF6EE] border-[#EDE4D4]",
    metricIcon: "bg-[#F5E4C8] text-[#B8862E]",
  },
  CONFIRMED: {
    columnBg: "bg-[#F2F7FC]",
    headerIcon: "bg-[#D6EAF8] text-[#3B7CB8]",
    cardBg: "bg-[#FAFCFE]",
    cardBorder: "border-[#DDE8F2]",
    badge: "bg-[#D6EAF8] text-[#2E6F9E]",
    metricBg: "bg-[#F2F7FC] border-[#DDE8F2]",
    metricIcon: "bg-[#D6EAF8] text-[#3B7CB8]",
  },
  IN_PRODUCTION: {
    columnBg: "bg-[#F5F2FA]",
    headerIcon: "bg-[#E4DCF5] text-[#6F5BA8]",
    cardBg: "bg-[#FAF8FD]",
    cardBorder: "border-[#E4DCF5]",
    badge: "bg-[#E4DCF5] text-[#5F5299]",
    metricBg: "bg-[#F5F2FA] border-[#E4DCF5]",
    metricIcon: "bg-[#E4DCF5] text-[#6F5BA8]",
  },
  READY: {
    columnBg: "bg-[#EFF8F2]",
    headerIcon: "bg-[#D4EDDC] text-[#3D8A5A]",
    cardBg: "bg-[#F8FCF9]",
    cardBorder: "border-[#D4EDDC]",
    badge: "bg-[#D4EDDC] text-[#2F7A4A]",
    metricBg: "bg-[#EFF8F2] border-[#D4EDDC]",
    metricIcon: "bg-[#D4EDDC] text-[#3D8A5A]",
  },
};

const METRIC_ICONS: Record<BoardStatus, typeof Clock> = {
  NEW: Clock,
  REVIEWING: ChefHat,
  CONFIRMED: Package,
  IN_PRODUCTION: Truck,
  READY: Check,
};

function isColumnId(id: string | number): id is BoardStatus {
  return BOARD_COLUMNS.includes(String(id) as BoardStatus);
}

function orderCode(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  const num = 1000 + (n % 9000);
  return String(num).padStart(4, "0");
}

function orderChannel(order: Order): ChannelFilter {
  if (order.kind === "QUOTE") return "WHATSAPP";
  if (order.fulfillment === "PICKUP") {
    const when = order.eventDate ? new Date(order.eventDate) : null;
    if (when && isToday(when)) return "BALCAO";
  }
  return "SITE";
}

function channelDisplay(order: Order) {
  const ch = orderChannel(order);
  if (ch === "WHATSAPP") {
    return {
      label: "WhatsApp",
      icon: MessageCircle,
      className: "text-[#25A866]",
    };
  }
  if (ch === "BALCAO") {
    return { label: "Balcão", icon: ShoppingBag, className: "text-[#6B6560]" };
  }
  return { label: "Site", icon: Globe, className: "text-[#5B8FB8]" };
}

function weeklyTrend(orders: Order[], status: BoardStatus) {
  const now = new Date();
  const thisWeek = orders.filter((o) => {
    if (o.status !== status) return false;
    const days = differenceInCalendarDays(now, new Date(o.createdAt));
    return days <= 7;
  }).length;
  const lastWeek = orders.filter((o) => {
    if (o.status !== status) return false;
    const days = differenceInCalendarDays(now, new Date(o.createdAt));
    return days > 7 && days <= 14;
  }).length;
  const delta = thisWeek - lastWeek;
  if (delta > 0) {
    return {
      text: `+${delta} esta semana`,
      Icon: ArrowUp,
      className: "text-[#3D8A5A]",
    };
  }
  if (delta < 0) {
    return {
      text: `${delta} esta semana`,
      Icon: ArrowDown,
      className: "text-[#C45A5A]",
    };
  }
  return {
    text: "0 esta semana",
    Icon: Minus,
    className: "text-[#8C8682]",
  };
}

function firstItemImage(order: Order) {
  const item = order.items[0];
  if (!item?.referenceImage) return null;
  return item.referenceImage;
}

function relativeAge(date: string) {
  const mins = Math.max(0, differenceInMinutes(new Date(), new Date(date)));
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function stopDrag(e: MouseEvent) {
  e.stopPropagation();
}

function nextStatusAction(order: Order): OrderStatus | null {
  const allowed = allowedStatuses(order.status);
  const preferred: OrderStatus[] = [
    "REVIEWING",
    "CONFIRMED",
    "IN_PRODUCTION",
    "READY",
    "DELIVERED",
  ];
  for (const s of preferred) {
    if (allowed.includes(s) && s !== order.status) return s;
  }
  return null;
}

function OrderCardContent({
  order,
  dragging,
  onAdvance,
  onCancel,
  onOpenDetail,
}: {
  order: Order;
  dragging?: boolean;
  onAdvance?: (status: OrderStatus) => void;
  onCancel?: () => void;
  onOpenDetail?: () => void;
}) {
  const boardStatus = BOARD_COLUMNS.includes(order.status as BoardStatus)
    ? (order.status as BoardStatus)
    : "NEW";
  const theme = COLUMN_THEME[boardStatus];
  const channel = channelDisplay(order);
  const ChannelIcon = channel.icon;
  const primaryItem = order.items[0];
  const imageSrc = firstItemImage(order);
  const next = nextStatusAction(order);
  const statusLabel =
    boardStatus in STATUS_TAB_LABELS
      ? STATUS_TAB_LABELS[boardStatus]
      : ORDER_STATUS_LABELS[order.status];

  const menuItems: RowActionItem[] = [
      {
        label: "Ver detalhes",
        onClick: () => onOpenDetail?.(),
      },
    ];
  if (next && onAdvance) {
    menuItems.push({
      label: `Avançar para ${ORDER_STATUS_LABELS[next]}`,
      onClick: () => onAdvance(next),
    });
  }
  if (onCancel && order.status !== "CANCELLED") {
    menuItems.push({
      label: "Cancelar pedido",
      tone: "danger",
      separator: true,
      onClick: () => onCancel(),
    });
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border p-3 shadow-[0_1px_2px_rgba(45,41,38,0.04)]",
        theme.cardBg,
        theme.cardBorder,
        dragging && "shadow-lg ring-2 ring-[var(--painel-brand)]/10",
      )}
    >
      {onOpenDetail && (
        <button
          type="button"
          className="absolute inset-0 z-0 rounded-xl"
          aria-label={`Abrir pedido de ${order.customerName}`}
          onClick={(e) => {
            stopDrag(e);
            onOpenDetail();
          }}
        />
      )}

      <div className="relative z-[1] pointer-events-none">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[12px] font-bold tabular-nums text-[#5C656F]">
            #{orderCode(order.id)}
          </p>
          <div className="text-right">
            <p className="text-[13px] font-bold tabular-nums text-cocoa">
              {order.priceLabel === "TO_CONFIRM"
                ? "A confirmar"
                : formatBRL(order.totalCents)}
            </p>
            <p className="text-[11px] text-[#8C8682]">
              {relativeAge(order.createdAt)}
            </p>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-1.5">
          <ChannelIcon
            className={cn("h-3.5 w-3.5 shrink-0", channel.className)}
            strokeWidth={2}
          />
          <span className="text-[11px] font-medium text-[#5C656F]">
            {channel.label}
          </span>
        </div>

        <div className="mt-2">
          <p className="truncate text-[13px] font-bold text-cocoa">
            {order.customerName}
          </p>
          <p className="text-[12px] text-[#8C8682]">
            {formatPhone(order.customerPhone)}
          </p>
        </div>

        {primaryItem ? (
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#F0F2F5]">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="40px"
                  unoptimized={imageSrc.startsWith("/uploads/")}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#B0AAA6]">
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold leading-snug text-cocoa">
                {primaryItem.productName}
              </p>
              <p className="text-[11px] text-[#8C8682]">
                {primaryItem.quantity} un
                {order.items.length > 1
                  ? ` · +${order.items.length - 1} itens`
                  : ""}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              "inline-flex max-w-[70%] truncate rounded-full px-2.5 py-1 text-[10px] font-semibold",
              theme.badge,
            )}
          >
            {statusLabel}
          </span>
          <div
            className="pointer-events-auto shrink-0"
            onPointerDown={stopDrag}
          >
            <RowActionsMenu items={menuItems} icon="vertical" label="Ações do pedido" />
          </div>
        </div>
      </div>
    </div>
  );
}

function KanbanCard({
  order,
  onAdvance,
  onCancel,
  onOpenDetail,
}: {
  order: Order;
  onAdvance: (status: OrderStatus) => void;
  onCancel: () => void;
  onOpenDetail: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: order.id,
      data: { type: "order", order },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...listeners}
      {...attributes}
    >
      <OrderCardContent
        order={order}
        onOpenDetail={onOpenDetail}
        onAdvance={onAdvance}
        onCancel={onCancel}
      />
    </div>
  );
}

function DropHint() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#D5D8DC] bg-white/60 px-3 py-8 text-center">
      <Move className="h-4 w-4 text-[#B0AAA6]" />
      <p className="text-xs text-[#B0AAA6]">Arraste pedidos aqui</p>
    </div>
  );
}

/** Scroll horizontal sem setas nativas — barra custom colada na base. */
function KanbanScroller({ children }: { children: ReactNode }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const [metrics, setMetrics] = useState({
    left: 0,
    max: 0,
    view: 0,
  });

  function measure() {
    const el = scrollerRef.current;
    if (!el) return;
    setMetrics({
      left: el.scrollLeft,
      max: Math.max(0, el.scrollWidth - el.clientWidth),
      view: el.clientWidth,
    });
  }

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, []);

  const showBar = metrics.max > 2;
  const trackW = metrics.view;
  const thumbW = showBar
    ? Math.max(48, (metrics.view / (metrics.view + metrics.max)) * trackW)
    : 0;
  const thumbLeft =
    showBar && metrics.max > 0
      ? (metrics.left / metrics.max) * (trackW - thumbW)
      : 0;

  function onThumbPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    const el = scrollerRef.current;
    if (!el || !showBar) return;
    dragging.current = true;
    const startX = e.clientX;
    const startLeft = el.scrollLeft;
    const range = trackW - thumbW;

    function onMove(ev: PointerEvent) {
      if (!dragging.current || !scrollerRef.current || range <= 0) return;
      const delta = ev.clientX - startX;
      scrollerRef.current.scrollLeft =
        startLeft + (delta / range) * metrics.max;
    }
    function onUp() {
      dragging.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  return (
    <div className="-mx-1 -mb-4 flex min-h-0 flex-1 flex-col sm:-mb-5">
      <div
        ref={scrollerRef}
        className="flex min-h-0 flex-1 items-start gap-3 overflow-x-auto overflow-y-hidden px-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      {showBar ? (
        <div
          className="relative mx-1 h-1.5 shrink-0"
          aria-hidden
        >
          <div
            className="absolute top-0 h-1.5 cursor-grab rounded-full bg-[#C4C9D0] active:cursor-grabbing"
            style={{ width: thumbW, transform: `translateX(${thumbLeft}px)` }}
            onPointerDown={onThumbPointerDown}
          />
        </div>
      ) : (
        <div className="h-1.5 shrink-0" aria-hidden />
      )}
    </div>
  );
}

function KanbanColumn({
  status,
  orders,
  isOver,
  onAdvance,
  onCancel,
  onOpenDetail,
}: {
  status: BoardStatus;
  orders: Order[];
  isOver: boolean;
  onAdvance: (orderId: string, status: OrderStatus) => void;
  onCancel: (orderId: string) => void;
  onOpenDetail: (orderId: string) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { type: "column", status },
  });
  const theme = COLUMN_THEME[status];
  const HeaderIcon = METRIC_ICONS[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-fit w-[min(100%,280px)] shrink-0 flex-col rounded-2xl p-2.5 sm:w-[280px]",
        theme.columnBg,
        isOver && "ring-2 ring-[var(--painel-brand)]/15",
      )}
    >
      <div className="mb-2.5 flex shrink-0 items-center gap-2 px-0.5 py-1">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
            theme.headerIcon,
          )}
        >
          <HeaderIcon className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <h2 className="min-w-0 flex-1 truncate text-[12px] font-bold text-cocoa">
          {STATUS_TAB_LABELS[status]}
        </h2>
        <span
          className={cn(
            "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums",
            theme.badge,
          )}
        >
          {orders.length}
        </span>
      </div>

      <div className="scrollbar-kanban flex max-h-[min(640px,calc(100vh-18rem))] flex-col gap-2.5 overflow-y-auto">
        {orders.length === 0 ? (
          <DropHint />
        ) : (
          <>
            {orders.map((order) => (
              <KanbanCard
                key={order.id}
                order={order}
                onAdvance={(next) => onAdvance(order.id, next)}
                onCancel={() => onCancel(order.id)}
                onOpenDetail={() => onOpenDetail(order.id)}
              />
            ))}
            {isOver && <DropHint />}
          </>
        )}
      </div>
    </div>
  );
}

function normalizeOrder(raw: Order): Order {
  return {
    ...raw,
    customerEmail: raw.customerEmail ?? null,
    whatsappMessage: raw.whatsappMessage ?? null,
    paymentStatus: raw.paymentStatus || "NONE",
    mpPaymentId: raw.mpPaymentId ?? null,
    items: (raw.items || []).map((item) => ({
      ...item,
      customizations:
        item.customizations && typeof item.customizations === "object"
          ? (item.customizations as Record<string, string>)
          : null,
    })),
  };
}

export function OrdersAdmin({
  initialOrders = [],
}: {
  initialOrders?: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(() =>
    initialOrders.map(normalizeOrder),
  );
  const [loading, setLoading] = useState(initialOrders.length === 0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<BoardStatus | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("ALL");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [dateRangeDays, setDateRangeDays] = useState<DateRangeDays>(30);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  async function load(opts?: { silent?: boolean }) {
    const res = await fetch("/api/admin/orders", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as Order[];
      setOrders(data.map(normalizeOrder));
    }
    if (!opts?.silent) setLoading(false);
  }

  useEffect(() => {
    if (initialOrders.length === 0) void load();
    else setLoading(false);

    // Atualiza o kanban a cada poucos segundos para pedidos pagos aparecerem na hora.
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load({ silent: true });
    }, POLL_MS);

    function onFocus() {
      void load({ silent: true });
    }
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const operationalOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
      ),
    [orders],
  );

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    const now = new Date();
    let list = operationalOrders.filter((order) => {
      const ageDays = differenceInCalendarDays(now, new Date(order.createdAt));
      if (ageDays > dateRangeDays) return false;
      if (channelFilter !== "ALL" && orderChannel(order) !== channelFilter) {
        return false;
      }
      if (!q) return true;
      const code = orderCode(order.id);
      return (
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q) ||
        `#${code}`.includes(q) ||
        code.includes(q) ||
        order.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    });

    list = [...list].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });
    return list;
  }, [
    operationalOrders,
    search,
    dateRangeDays,
    channelFilter,
    sortOrder,
  ]);

  const ordersByStatus = useMemo(() => {
    const map = Object.fromEntries(
      BOARD_COLUMNS.map((s) => [s, [] as Order[]]),
    ) as Record<BoardStatus, Order[]>;
    for (const order of filteredOrders) {
      if (BOARD_COLUMNS.includes(order.status as BoardStatus)) {
        map[order.status as BoardStatus].push(order);
      }
    }
    return map;
  }, [filteredOrders]);

  const visibleColumns = useMemo(
    () =>
      statusFilter === "ALL"
        ? [...BOARD_COLUMNS]
        : [statusFilter],
    [statusFilter],
  );

  const activeOrder = useMemo(
    () => (activeId ? orders.find((o) => o.id === activeId) ?? null : null),
    [activeId, orders],
  );

  const selectedOrder = useMemo(
    () =>
      selectedId ? orders.find((o) => o.id === selectedId) ?? null : null,
    [selectedId, orders],
  );

  function resolveColumn(
    id: string | number,
    currentOrders: Order[],
  ): BoardStatus | null {
    if (isColumnId(id)) return id;
    const status = currentOrders.find((o) => o.id === id)?.status;
    if (status && isColumnId(status)) return status;
    return null;
  }

  async function persistStatus(
    orderId: string,
    status: OrderStatus,
    previous: OrderStatus,
  ) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: previous } : o)),
      );
      toast({
        title: data.error || "Não foi possível atualizar o status",
        tone: "error",
      });
      return;
    }
    toast({
      title: `Movido para ${ORDER_STATUS_LABELS[status]}`,
      tone: "success",
    });
  }

  function moveOrder(orderId: string, nextStatus: OrderStatus) {
    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === nextStatus) return;
    if (!canTransitionStatus(order.status, nextStatus)) {
      toast({
        title: "Essa mudança de status não é permitida.",
        tone: "error",
      });
      return;
    }
    const previous = order.status;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: nextStatus, updatedAt: new Date().toISOString() }
          : o,
      ),
    );
    void persistStatus(orderId, nextStatus, previous);
  }

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function onDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      setOverColumn(null);
      return;
    }
    setOverColumn(resolveColumn(over.id, orders));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;

    const orderId = String(active.id);
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const nextStatus = resolveColumn(over.id, orders);
    if (!nextStatus || nextStatus === order.status) return;
    moveOrder(orderId, nextStatus);
  }

  function onDragCancel() {
    setActiveId(null);
    setOverColumn(null);
  }

  const statusFilterOptions: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: "Todos" },
    ...BOARD_COLUMNS.map((s) => ({
      value: s,
      label: STATUS_TAB_LABELS[s],
    })),
  ];

  return (
    <PageShell className="flex min-h-0 flex-1 flex-col !space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <PageHeader
          className="min-w-0 flex-1"
          title="Pedidos"
          description="Acompanhe e gerencie todos os pedidos da sua loja."
        />
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-xl lg:shrink-0">
          <label className="relative block min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]"
              strokeWidth={1.75}
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente, produto ou número do pedido..."
              className="h-10 w-full rounded-full border border-[var(--painel-border)] bg-white py-0 pl-10 pr-4 text-sm text-cocoa outline-none transition placeholder:text-[#9CA3AF] focus:border-[var(--painel-brand)]/25 focus:ring-2 focus:ring-[var(--painel-brand)]/10"
            />
          </label>
          <div className="relative shrink-0">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6560]"
              strokeWidth={1.75}
              aria-hidden
            />
            <select
              value={dateRangeDays}
              onChange={(e) =>
                setDateRangeDays(Number(e.target.value) as DateRangeDays)
              }
              className="h-10 w-full min-w-[10.5rem] cursor-pointer appearance-none rounded-full border border-[var(--painel-border)] bg-white py-0 pl-10 pr-9 text-sm font-medium text-cocoa outline-none focus:border-[var(--painel-brand)]/25 focus:ring-2 focus:ring-[var(--painel-brand)]/10 sm:w-auto"
              aria-label="Período"
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B6560]"
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
        {BOARD_COLUMNS.map((status) => {
          const theme = COLUMN_THEME[status];
          const Icon = METRIC_ICONS[status];
          const count = operationalOrders.filter((o) => o.status === status)
            .length;
          const trend = weeklyTrend(operationalOrders, status);
          const TrendIcon = trend.Icon;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3 py-3 text-left transition hover:brightness-[0.98] sm:gap-3 sm:px-4 sm:py-3.5",
                theme.metricBg,
                statusFilter === status && "ring-2 ring-[var(--painel-brand)]/15",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
                  theme.metricIcon,
                )}
              >
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[10px] leading-tight text-[#6B6560] sm:text-[11px]">
                  {STATUS_TAB_LABELS[status]}
                </p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-cocoa sm:text-2xl">
                  {count}
                </p>
                <p
                  className={cn(
                    "mt-0.5 flex items-center gap-0.5 text-[10px] font-medium sm:text-[11px]",
                    trend.className,
                  )}
                >
                  <TrendIcon className="h-3 w-3 shrink-0" strokeWidth={2.5} />
                  {trend.text}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <FilterChipGroup className="min-w-0 flex-1 pb-0.5">
          {statusFilterOptions.map((opt) => (
            <FilterChip
              key={opt.value}
              label={opt.label}
              active={statusFilter === opt.value}
              onClick={() => setStatusFilter(opt.value)}
            />
          ))}
        </FilterChipGroup>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="relative">
            <SlidersHorizontal
              className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6560]"
              aria-hidden
            />
            <select
              value={channelFilter}
              onChange={(e) =>
                setChannelFilter(e.target.value as ChannelFilter)
              }
              className="h-9 cursor-pointer appearance-none rounded-full border border-[var(--painel-border)] bg-white py-0 pl-9 pr-8 text-[13px] font-medium text-cocoa outline-none"
              aria-label="Canal"
            >
              <option value="ALL">Todos os canais</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="SITE">Site</option>
              <option value="BALCAO">Balcão</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6560]"
              aria-hidden
            />
          </div>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="h-9 cursor-pointer appearance-none rounded-full border border-[var(--painel-border)] bg-white py-0 pl-3.5 pr-8 text-[13px] font-medium text-cocoa outline-none"
              aria-label="Ordenação"
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B6560]"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-full min-h-80 w-[320px] shrink-0 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      ) : operationalOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nenhum pedido"
          description="Quando a vitrine receber pedidos, eles aparecem aqui no quadro por status."
          action={{
            label: "Configurar loja",
            href: "/painel/configuracoes/estabelecimento",
          }}
        />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Search}
          title="Nenhum resultado"
          description="Tente outro termo de busca ou ajuste os filtros."
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <KanbanScroller>
            {visibleColumns.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={ordersByStatus[status]}
                isOver={overColumn === status}
                onAdvance={moveOrder}
                onCancel={(id) => moveOrder(id, "CANCELLED")}
                onOpenDetail={setSelectedId}
              />
            ))}
          </KanbanScroller>

          <DragOverlay dropAnimation={null}>
            {activeOrder ? (
              <div className="w-[300px] cursor-grabbing">
                <OrderCardContent order={activeOrder} dragging />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <OrderDetailSheet
        order={selectedOrder}
        open={selectedId != null}
        onClose={() => setSelectedId(null)}
        onStatusChange={(orderId, status) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? { ...o, status, updatedAt: new Date().toISOString() }
                : o,
            ),
          );
        }}
      />
    </PageShell>
  );
}
