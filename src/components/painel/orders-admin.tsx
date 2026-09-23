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
  format,
  isToday,
  isTomorrow,
} from "date-fns";
import {
  Bike,
  CalendarDays,
  Check,
  ChefHat,
  History,
  MessageSquare,
  Move,
  ShoppingBag,
  Store,
  Truck,
  X,
} from "lucide-react";
import {
  formatBRL,
  isOnlinePaymentOutstanding,
  ONLINE_PAYMENT_METHOD,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PageAction,
  PageHeader,
  PageShell,
  StatTile,
} from "@/components/painel/page-header";
import { OrderDetailSheet } from "@/components/painel/order-detail-sheet";
import { OrderItemVitrineSpecs } from "@/components/painel/order-item-vitrine-specs";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";

type OrderStatus = keyof typeof ORDER_STATUS_LABELS;
type PaymentStatus = keyof typeof PAYMENT_STATUS_LABELS;

type OrderItem = {
  id?: string;
  productName: string;
  quantity: number;
  lineTotalCents?: number;
  customizations?: Record<string, string> | null;
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

const KANBAN_COLUMNS = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

/** Colunas visíveis no quadro (entregues/cancelados ficam no histórico). */
const KANBAN_BOARD: OrderStatus[] = [
  "NEW",
  "REVIEWING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "READY",
];

const COLUMN_THEME: Record<
  OrderStatus,
  { dot: string; badge: string; accent: string }
> = {
  NEW: {
    dot: "bg-[#F0A04B]",
    badge: "bg-[#FDE9C8] text-[#B8751A]",
    accent: "border-l-[#F0A04B]",
  },
  REVIEWING: {
    dot: "bg-[#E8A06A]",
    badge: "bg-[#F8E6D4] text-[#9A5C28]",
    accent: "border-l-[#E8A06A]",
  },
  CONFIRMED: {
    dot: "bg-[#5B9FD4]",
    badge: "bg-[#D6EAF8] text-[#2E6F9E]",
    accent: "border-l-[#5B9FD4]",
  },
  IN_PRODUCTION: {
    dot: "bg-[#8B7EC8]",
    badge: "bg-[#E8E4F5] text-[#5F5299]",
    accent: "border-l-[#8B7EC8]",
  },
  READY: {
    dot: "bg-emerald-500",
    badge: "bg-emerald-100 text-emerald-700",
    accent: "border-l-emerald-500",
  },
  DELIVERED: {
    dot: "bg-emerald-700",
    badge: "bg-emerald-50 text-emerald-800",
    accent: "border-l-emerald-700",
  },
  CANCELLED: {
    dot: "bg-[#B0AAA6]",
    badge: "bg-[#EFECEA] text-[#6B6560]",
    accent: "border-l-[#B0AAA6]",
  },
};

function isColumnId(id: string | number): id is OrderStatus {
  return KANBAN_COLUMNS.includes(String(id) as OrderStatus);
}

function orderCode(id: string) {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) >>> 0;
  return String(1000 + (n % 9000));
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

function formatEventWhen(eventDate: string | null, eventTime: string | null) {
  if (!eventDate) return null;
  const d = new Date(eventDate);
  const time = eventTime || format(d, "HH:mm");
  if (isToday(d)) return `Hoje, ${time}`;
  if (isTomorrow(d)) return `Amanhã, ${time}`;
  return `${format(d, "dd/MM")} às ${time}`;
}

function paymentBadge(order: Order) {
  const method = order.paymentMethod;
  const pay = order.paymentStatus || "NONE";

  if (method === ONLINE_PAYMENT_METHOD) {
    if (pay === "APPROVED") {
      return { label: "Pago · Mercado Pago", className: "bg-[#E5F6E8] text-[#2F8A3E]" };
    }
    if (pay === "PENDING") {
      return {
        label: "Aguardando pagamento",
        className: "bg-[#FBF0C8] text-[#9A7A1A]",
      };
    }
    if (pay === "REJECTED") {
      return {
        label: "Pagamento recusado",
        className: "bg-[#FDE8E8] text-[#B33A3A]",
      };
    }
    return {
      label: PAYMENT_STATUS_LABELS[pay] || "Mercado Pago",
      className: "bg-[#DCEAF8] text-[#2E6F9E]",
    };
  }

  const m = (method || "").toLowerCase();
  if (m.includes("pix")) {
    return { label: "PIX", className: "bg-[#E5F6E8] text-[#2F8A3E]" };
  }
  if (m.includes("cartão") || m.includes("cartao") || m.includes("card")) {
    return { label: "Cartão", className: "bg-[#DCEAF8] text-[#2E6F9E]" };
  }
  if (m.includes("sinal")) {
    return { label: "Sinal 50%", className: "bg-[#FBF0C8] text-[#9A7A1A]" };
  }
  if (method) {
    return { label: method, className: "bg-[#F0F2F5] text-[#5C656F]" };
  }
  return null;
}

function channelLabel(order: Order) {
  if (order.kind === "QUOTE") return "WhatsApp";
  if (order.fulfillment === "PICKUP") {
    const when = order.eventDate ? new Date(order.eventDate) : null;
    if (when && isToday(when)) return "via Balcão";
  }
  return "via Cardápio";
}

function statusHint(order: Order) {
  if (order.status === "NEW") {
    const age = relativeAge(order.createdAt);
    const mins = differenceInMinutes(new Date(), new Date(order.createdAt));
    if (mins <= 15) return { label: `Novo (${age})`, tone: "new" as const };
    return { label: age, tone: "muted" as const };
  }
  if (order.status === "CONFIRMED") {
    const days = order.eventDate
      ? differenceInCalendarDays(new Date(order.eventDate), new Date())
      : 0;
    if (days >= 1) return { label: "Agendado", tone: "muted" as const };
    return { label: relativeAge(order.updatedAt), tone: "muted" as const };
  }
  if (order.status === "IN_PRODUCTION") {
    const mins = Math.max(
      1,
      differenceInMinutes(new Date(), new Date(order.updatedAt)),
    );
    return { label: `${mins}m no forno`, tone: "prod" as const };
  }
  return { label: relativeAge(order.updatedAt), tone: "muted" as const };
}

function customerInitial(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

function stopDrag(e: MouseEvent) {
  e.stopPropagation();
}

function OrderCardContent({
  order,
  dragging,
  onAdvance,
  onCancel,
  busy,
  onOpenDetail,
}: {
  order: Order;
  dragging?: boolean;
  onAdvance?: (status: OrderStatus) => void;
  onCancel?: () => void;
  busy?: boolean;
  onOpenDetail?: () => void;
}) {
  const pay = paymentBadge(order);
  const channel = channelLabel(order);
  const hint = statusHint(order);
  const when = formatEventWhen(order.eventDate, order.eventTime);
  const note = order.referenceNote || order.notes;
  const theme = COLUMN_THEME[order.status];
  const isNew = order.status === "NEW";
  const awaitingOnlinePay = isOnlinePaymentOutstanding(order);
  const paidLooksReady =
    order.paymentStatus === "APPROVED" ||
    (order.paymentMethod !== ONLINE_PAYMENT_METHOD &&
      ((order.paymentMethod || "").toLowerCase().includes("pix") ||
        (order.paymentMethod || "").toLowerCase() === "pago"));
  const canAccept = !awaitingOnlinePay;
  const showActions = Boolean(onAdvance || onCancel);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#E8E2DE] bg-white p-3.5 shadow-[0_4px_16px_rgba(45,41,38,0.06)] transition hover:shadow-[0_8px_24px_rgba(45,41,38,0.09)]",
        `border-l-[4px] ${theme.accent}`,
        isNew && paidLooksReady && !awaitingOnlinePay && "ring-1 ring-[#F5D9A8]/60",
        awaitingOnlinePay && "ring-1 ring-[#F5D9A8]/50",
        dragging && "shadow-lg ring-2 ring-[#2D2926]/10",
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
        <div className="flex items-start gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F3EEE8] to-[#E8E2DE] text-xs font-bold text-[#483129] ring-1 ring-[#E8E2DE]">
            {customerInitial(order.customerName)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate text-[13px] font-bold text-[#2D2926]">
                {order.customerName}{" "}
                <span className="font-semibold text-[#8C8682]">
                  #{orderCode(order.id)}
                </span>
              </p>
              <p className="shrink-0 text-[13px] font-bold tabular-nums text-[#483129]">
                {order.priceLabel === "TO_CONFIRM"
                  ? "A confirmar"
                  : formatBRL(order.totalCents)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {pay && (
            <span
              className={cn(
                "inline-flex rounded px-2 py-0.5 text-[10px] font-semibold",
                pay.className,
              )}
            >
              {pay.label}
            </span>
          )}
          <span className="text-[11px] text-[#8C8682]">{channel}</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] text-[#8C8682]">
            {hint.tone === "new" && (
              <span className="h-1.5 w-1.5 rounded-full bg-[#F0A04B]" />
            )}
            <span
              className={cn(
                hint.tone === "prod" && "font-medium text-[#3B6EA5]",
                hint.tone === "new" && "text-[#B8751A]",
              )}
            >
              {hint.label}
            </span>
          </span>
        </div>

        <div className="mt-3 space-y-2.5 rounded-xl bg-[#FAFAFA] p-2.5">
          {order.items.slice(0, 3).map((item, idx) => (
            <div
              key={`${item.productName}-${idx}`}
              className={cn(idx > 0 && "border-t border-[#E8E2DE] pt-2.5")}
            >
              <p className="text-[13px] font-bold leading-snug text-[#C85A5A]">
                <span className="tabular-nums">{item.quantity}×</span>{" "}
                {item.productName}
              </p>
              <OrderItemVitrineSpecs
                customizations={item.customizations as Record<string, unknown>}
                className="mt-1.5"
              />
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-[11px] text-[#B0AAA6]">
              +{order.items.length - 3} itens
            </p>
          )}
        </div>

        {note && order.status !== "IN_PRODUCTION" && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-[#FBF0E4] px-2.5 py-2 text-[11px] leading-snug text-[#7A5A3A]">
            <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              {order.referenceNote ? (
                <>Frase: &ldquo;{order.referenceNote}&rdquo;</>
              ) : (
                note
              )}
            </span>
          </div>
        )}

        {order.status === "IN_PRODUCTION" && (
          <div className="mt-2.5 inline-flex rounded bg-[#EDE8F8] px-2.5 py-1 text-[11px] font-medium text-[#5F5299]">
            Fase: Produção
          </div>
        )}

        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#5C656F]">
          {order.fulfillment === "DELIVERY" ? (
            order.status === "IN_PRODUCTION" ? (
              <Truck className="h-3.5 w-3.5 shrink-0 text-[#C85A5A]" />
            ) : (
              <Bike className="h-3.5 w-3.5 shrink-0 text-[#C85A5A]" />
            )
          ) : order.status === "CONFIRMED" ? (
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#5B9FD4]" />
          ) : (
            <Store className="h-3.5 w-3.5 shrink-0 text-[#8C8682]" />
          )}
          <span className="min-w-0 flex-1 truncate">
            {order.fulfillment === "DELIVERY"
              ? `Entrega: ${when || "A combinar"}`
              : order.status === "CONFIRMED"
                ? `Para: ${when || "A combinar"}`
                : `Retirada no Balcão${when ? ` · ${when}` : ""}`}
          </span>
          {(order.deliveryZone || order.fulfillment === "PICKUP") && (
            <span className="shrink-0 rounded-md bg-[#F0F2F5] px-1.5 py-0.5 text-[10px] font-medium text-[#6B6560]">
              {order.deliveryZone || "Retirada"}
            </span>
          )}
        </div>

        {showActions && (
          <div className="pointer-events-auto mt-3 flex items-center gap-2">
            {isNew && awaitingOnlinePay && (
              <p className="w-full rounded-lg border border-[#F0D48A] bg-[#FFF8E8] px-3 py-2 text-center text-[12px] font-medium text-[#8A6A18]">
                Aguardando confirmação do Mercado Pago
              </p>
            )}

            {isNew && canAccept && paidLooksReady && onAdvance && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onPointerDown={stopDrag}
                  onClick={(e) => {
                    stopDrag(e);
                    onAdvance("CONFIRMED");
                  }}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#3FA65A] text-[13px] font-semibold text-white transition hover:bg-[#369650] disabled:opacity-60"
                >
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  Aceitar
                </button>
                {onCancel && (
                  <button
                    type="button"
                    disabled={busy}
                    onPointerDown={stopDrag}
                    onClick={(e) => {
                      stopDrag(e);
                      onCancel();
                    }}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E8E2DE] bg-white text-[#8C8682] transition hover:bg-[#FDF2F2] hover:text-[#C85A5A] disabled:opacity-60"
                    aria-label="Recusar"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </>
            )}

            {isNew && canAccept && !paidLooksReady && onAdvance && (
              <button
                type="button"
                disabled={busy}
                onPointerDown={stopDrag}
                onClick={(e) => {
                  stopDrag(e);
                  onAdvance("CONFIRMED");
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#1B2A4A] text-[13px] font-semibold text-white transition hover:bg-[#243656] disabled:opacity-60"
              >
                Confirmar pedido
              </button>
            )}

            {order.status === "CONFIRMED" && onAdvance && (
              <button
                type="button"
                disabled={busy}
                onPointerDown={stopDrag}
                onClick={(e) => {
                  stopDrag(e);
                  onAdvance("IN_PRODUCTION");
                }}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#5B9FD4] bg-white text-[13px] font-semibold text-[#3B6EA5] transition hover:bg-[#F0F7FC] disabled:opacity-60"
              >
                <ChefHat className="h-4 w-4" />
                Iniciar produção →
              </button>
            )}

            {order.status === "IN_PRODUCTION" && onAdvance && (
              <button
                type="button"
                disabled={busy}
                onPointerDown={stopDrag}
                onClick={(e) => {
                  stopDrag(e);
                  onAdvance("READY");
                }}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#7BC48A] bg-[#F3FAF4] text-[13px] font-semibold text-[#2F8A3E] transition hover:bg-[#E5F6E8] disabled:opacity-60"
              >
                Marcar como Pronto
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}

            {order.status === "READY" && onAdvance && (
              <button
                type="button"
                disabled={busy}
                onPointerDown={stopDrag}
                onClick={(e) => {
                  stopDrag(e);
                  onAdvance("DELIVERED");
                }}
                className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-600 bg-white text-[13px] font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
              >
                Marcar entregue
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  order,
  onAdvance,
  onCancel,
  onOpenDetail,
  busy,
}: {
  order: Order;
  onAdvance: (status: OrderStatus) => void;
  onCancel: () => void;
  onOpenDetail: () => void;
  busy: boolean;
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
        onCancel={order.status === "NEW" ? onCancel : undefined}
        busy={busy}
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
  busyId,
  onAdvance,
  onCancel,
  onOpenDetail,
}: {
  status: OrderStatus;
  orders: Order[];
  isOver: boolean;
  busyId: string | null;
  onAdvance: (orderId: string, status: OrderStatus) => void;
  onCancel: (orderId: string) => void;
  onOpenDetail: (orderId: string) => void;
}) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { type: "column", status },
  });
  const theme = COLUMN_THEME[status];
  const totalCents = orders.reduce((sum, o) => sum + (o.totalCents || 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-fit w-[320px] shrink-0 flex-col rounded-2xl border border-[#E8E2DE]/80 bg-[#F4F6F8] p-2 shadow-sm",
        isOver && "ring-2 ring-[#483129]/20",
      )}
    >
      <div
        className={cn(
          "mb-2.5 flex shrink-0 items-center gap-2 rounded-xl border border-white/80 bg-white px-2.5 py-2 shadow-sm",
          `border-l-[4px] ${theme.accent}`,
        )}
      >
        <span className={cn("h-2 w-2 shrink-0 rounded-full", theme.dot)} />
        <h2 className="min-w-0 flex-1 truncate text-[11px] font-bold uppercase tracking-[0.06em] text-[#2D2926]">
          {ORDER_STATUS_LABELS[status]}
        </h2>
        <span className="text-[11px] font-bold tabular-nums text-[#483129]">
          {formatBRL(totalCents)}
        </span>
        <span
          className={cn(
            "flex h-5 min-w-5 items-center justify-center rounded-md px-1.5 text-[10px] font-bold",
            theme.badge,
          )}
        >
          {orders.length}
        </span>
      </div>

      <div className="scrollbar-kanban flex max-h-[min(640px,calc(100vh-12rem))] flex-col gap-2.5 overflow-y-auto">
        {orders.length === 0 ? (
          <DropHint />
        ) : (
          <>
            {orders.map((order) => (
              <KanbanCard
                key={order.id}
                order={order}
                busy={busyId === order.id}
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
  const [overColumn, setOverColumn] = useState<OrderStatus | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const ordersByStatus = useMemo(() => {
    const map = Object.fromEntries(
      KANBAN_COLUMNS.map((s) => [s, [] as Order[]]),
    ) as Record<OrderStatus, Order[]>;
    for (const order of orders) {
      map[order.status]?.push(order);
    }
    return map;
  }, [orders]);

  const boardStats = useMemo(() => {
    const active = orders.filter((o) => KANBAN_BOARD.includes(o.status));
    const newCount = ordersByStatus.NEW.length;
    const production =
      ordersByStatus.IN_PRODUCTION.length + ordersByStatus.READY.length;
    const pipelineCents = active.reduce((n, o) => n + (o.totalCents || 0), 0);
    return { newCount, production, pipelineCents, active: active.length };
  }, [orders, ordersByStatus]);

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
  ): OrderStatus | null {
    if (isColumnId(id)) return id;
    return currentOrders.find((o) => o.id === id)?.status ?? null;
  }

  async function persistStatus(
    orderId: string,
    status: OrderStatus,
    previous: OrderStatus,
  ) {
    setBusyId(orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: previous } : o)),
      );
      toast({ title: "Não foi possível atualizar o status", tone: "error" });
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

  return (
    <PageShell className="flex min-h-0 flex-1 flex-col !space-y-3">
      <PageHeader
        title="Central de pedidos"
        description="Montagem da vitrine no card — opções, adicionais e pagamento."
        actions={
          <PageAction href="/painel/historico" variant="secondary">
            <History className="h-4 w-4" />
            Histórico
          </PageAction>
        }
      />

      {!loading && orders.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Novos"
            value={boardStats.newCount}
            hint="Aguardando aceite"
          />
          <StatTile
            label="Em andamento"
            value={boardStats.active}
            hint="No quadro operacional"
          />
          <StatTile
            label="Produção + prontos"
            value={boardStats.production}
            hint="Forno e retirada"
          />
          <StatTile
            label="Valor no quadro"
            value={formatBRL(boardStats.pipelineCents)}
            hint="Pedidos ativos"
          />
        </div>
      )}

      {loading ? (
        <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-full min-h-80 w-[320px] shrink-0 animate-pulse rounded-2xl bg-white"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Nenhum pedido"
          description="Quando a vitrine receber pedidos, eles aparecem aqui no quadro por status."
          action={{ label: "Ver vitrine", href: "/painel/vitrine" }}
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
            {KANBAN_BOARD.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                orders={ordersByStatus[status]}
                isOver={overColumn === status}
                busyId={busyId}
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
