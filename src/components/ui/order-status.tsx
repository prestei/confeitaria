import { Badge } from "./badge";
import { ORDER_STATUS_LABELS } from "@/lib/utils";
import type { OrderStatus as OrderStatusType } from "@/lib/enums";

const toneMap: Record<
  OrderStatusType,
  "neutral" | "berry" | "success" | "warning" | "danger" | "outline"
> = {
  NEW: "berry",
  REVIEWING: "warning",
  CONFIRMED: "outline",
  IN_PRODUCTION: "berry",
  READY: "success",
  DELIVERED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatusType }) {
  return <Badge tone={toneMap[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
