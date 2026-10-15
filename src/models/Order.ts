import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import { newId } from "@/lib/serialize";
import {
  FulfillmentType,
  OrderKind,
  OrderStatus,
  PaymentStatus,
  type FulfillmentType as FulfillmentTypeT,
  type OrderKind as OrderKindT,
  type OrderStatus as OrderStatusT,
  type PaymentStatus as PaymentStatusT,
} from "@/lib/enums";

const orderItemSchema = new mongoose.Schema(
  {
    _id: { type: String, default: newId },
    productId: { type: String, default: null },
    productName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPriceCents: { type: Number, default: 0 },
    lineTotalCents: { type: Number, default: 0 },
    customizations: { type: mongoose.Schema.Types.Mixed, default: null },
    referenceImage: { type: String, default: null },
  },
  { _id: true },
);

const orderSchema = baseSchema(
  {
    customerId: { type: String, default: null, index: true },
    kind: {
      type: String,
      enum: Object.values(OrderKind),
      default: OrderKind.CART,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.NEW,
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: null },
    companyName: { type: String, default: null },
    needsInvoice: { type: Boolean, default: false },
    fulfillment: {
      type: String,
      enum: Object.values(FulfillmentType),
      default: FulfillmentType.PICKUP,
    },
    deliveryZone: { type: String, default: null },
    deliveryFeeCents: { type: Number, default: 0 },
    eventDate: { type: Date, default: null },
    eventTime: { type: String, default: null },
    guests: { type: Number, default: null },
    notes: { type: String, default: null },
    referenceNote: { type: String, default: null },
    subtotalCents: { type: Number, default: 0 },
    discountCents: { type: Number, default: 0 },
    totalCents: { type: Number, default: 0 },
    priceLabel: { type: String, default: "TOTAL" },
    promoCode: { type: String, default: null },
    promotionId: { type: String, default: null },
    paymentMethod: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.NONE,
    },
    mpPaymentId: { type: String, default: null, index: true },
    paidAt: { type: Date, default: null },
    stockDeducted: { type: Boolean, default: false },
    whatsappMessage: { type: String, default: null },
    items: { type: [orderItemSchema], default: [] },
  },
  { timestamps: true, tenant: true },
);

orderSchema.index({ storeId: 1, status: 1 });

export type OrderItemDoc = {
  _id: string;
  id?: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  customizations: unknown;
  referenceImage: string | null;
};

export type OrderDoc = {
  _id: string;
  id: string;
  storeId: string;
  customerId: string | null;
  kind: OrderKindT;
  status: OrderStatusT;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  companyName: string | null;
  needsInvoice: boolean;
  fulfillment: FulfillmentTypeT;
  deliveryZone: string | null;
  deliveryFeeCents: number;
  eventDate: Date | null;
  eventTime: string | null;
  guests: number | null;
  notes: string | null;
  referenceNote: string | null;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  priceLabel: string;
  promoCode: string | null;
  promotionId: string | null;
  paymentMethod: string | null;
  paymentStatus: PaymentStatusT;
  mpPaymentId: string | null;
  paidAt: Date | null;
  stockDeducted: boolean;
  whatsappMessage: string | null;
  items: OrderItemDoc[];
  createdAt: Date;
  updatedAt: Date;
};

export const Order: Model<OrderDoc> =
  (mongoose.models.Order as Model<OrderDoc> | undefined) ??
  mongoose.model<OrderDoc>("Order", orderSchema);
