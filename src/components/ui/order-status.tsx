import { Badge } from "./badge";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus as OrderStatusType } from "@/lib/enums";
import { cn } from "@/lib/cn";

const styleMap: Record<
  OrderStatusType,
  { badge: string; dot: string }
> = {
  NEW: {
    badge: "bg-[#FDE8E8] text-[#B33A3A]",
    dot: "bg-[#E05A5A]",
  },
  REVIEWING: {
    badge: "bg-[#EDE8F8] text-[#5F5299]",
    dot: "bg-[#8B7EC8]",
  },
  CONFIRMED: {
    badge: "bg-[#FDE9C8] text-[#B8751A]",
    dot: "bg-[#F0A04B]",
  },
  IN_PRODUCTION: {
    badge: "bg-[#DCEAF8] text-[#2E6F9E]",
    dot: "bg-[#5B9FD4]",
  },
  READY: {
    badge: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },
  DELIVERED: {
    badge: "bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-600",
  },
  CANCELLED: {
    badge: "bg-[#EFECEA] text-[#6B6560]",
    dot: "bg-[#B0AAA6]",
  },
};

export function OrderStatusBadge({ status }: { status: OrderStatusType }) {
  const style = styleMap[status];
  return (
    <Badge
      tone="neutral"
      className={cn(
        "gap-1.5 border-0 px-2.5 py-1 text-[11px] font-semibold normal-case tracking-normal",
        style.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
