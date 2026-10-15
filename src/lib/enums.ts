export const ProductType = {
  READY: "READY",
  CUSTOM: "CUSTOM",
  CAKE: "CAKE",
  PARTY_KIT: "PARTY_KIT",
  CORPORATE: "CORPORATE",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const PriceMode = {
  FIXED: "FIXED",
  FROM: "FROM",
  QUOTE: "QUOTE",
} as const;
export type PriceMode = (typeof PriceMode)[keyof typeof PriceMode];

export const Availability = {
  AVAILABLE: "AVAILABLE",
  SOLD_OUT: "SOLD_OUT",
  MADE_TO_ORDER: "MADE_TO_ORDER",
  LAST_UNITS: "LAST_UNITS",
  SCHEDULED_DAYS: "SCHEDULED_DAYS",
} as const;
export type Availability = (typeof Availability)[keyof typeof Availability];

export const OrderKind = {
  CART: "CART",
  QUOTE: "QUOTE",
} as const;
export type OrderKind = (typeof OrderKind)[keyof typeof OrderKind];

export const OrderStatus = {
  NEW: "NEW",
  REVIEWING: "REVIEWING",
  CONFIRMED: "CONFIRMED",
  IN_PRODUCTION: "IN_PRODUCTION",
  READY: "READY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const FulfillmentType = {
  PICKUP: "PICKUP",
  DELIVERY: "DELIVERY",
} as const;
export type FulfillmentType =
  (typeof FulfillmentType)[keyof typeof FulfillmentType];

export const PaymentStatus = {
  NONE: "NONE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const StockMovementType = {
  IN: "IN",
  OUT: "OUT",
  ADJUST: "ADJUST",
} as const;
export type StockMovementType =
  (typeof StockMovementType)[keyof typeof StockMovementType];

export const PromotionType = {
  PERCENT: "PERCENT",
  FIXED: "FIXED",
  PRODUCT: "PRODUCT",
} as const;
export type PromotionType = (typeof PromotionType)[keyof typeof PromotionType];

export const AnalyticsEventType = {
  STORE_VIEW: "STORE_VIEW",
  PRODUCT_VIEW: "PRODUCT_VIEW",
  WHATSAPP_CLICK: "WHATSAPP_CLICK",
  PRODUCT_CLICK: "PRODUCT_CLICK",
  ORDER_STARTED: "ORDER_STARTED",
  ORDER_COMPLETED: "ORDER_COMPLETED",
} as const;
export type AnalyticsEventType =
  (typeof AnalyticsEventType)[keyof typeof AnalyticsEventType];

export const IntegrationProvider = {
  WHATSAPP: "WHATSAPP",
  INSTAGRAM: "INSTAGRAM",
} as const;
export type IntegrationProvider =
  (typeof IntegrationProvider)[keyof typeof IntegrationProvider];

export const IntegrationStatus = {
  CONNECTED: "CONNECTED",
  DISCONNECTED: "DISCONNECTED",
  COMING_SOON: "COMING_SOON",
} as const;
export type IntegrationStatus =
  (typeof IntegrationStatus)[keyof typeof IntegrationStatus];

/** How the customer picks a catalog extra on the storefront. */
export const AddonSelectionType = {
  TOGGLE: "TOGGLE",
  QTY: "QTY",
  TEXT: "TEXT",
} as const;
export type AddonSelectionType =
  (typeof AddonSelectionType)[keyof typeof AddonSelectionType];
