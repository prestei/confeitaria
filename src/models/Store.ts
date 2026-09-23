import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import { newId } from "@/lib/serialize";

const deliveryZoneSchema = new mongoose.Schema(
  {
    _id: { type: String, default: newId },
    name: { type: String, required: true },
    feeCents: { type: Number, required: true },
  },
  { _id: true },
);

const themeColorsSchema = new mongoose.Schema(
  {
    background: { type: String, default: "#f8f5f0" },
    surface: { type: String, default: "#fffdfc" },
    muted: { type: String, default: "#efe7de" },
    accent: { type: String, default: "#C45B7A" },
    accentDeep: { type: String, default: "#9a5966" },
    text: { type: String, default: "#332522" },
    textMuted: { type: String, default: "#756761" },
    secondary: { type: String, default: "#4A2F26" },
    chrome: { type: String, default: "#2a1f1c" },
    complement: { type: String, default: "#c98f86" },
  },
  { _id: false },
);

const storeSchema = baseSchema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    tagline: { type: String, default: null },
    description: { type: String, default: null },
    whatsapp: { type: String, required: true },
    whatsappMessage: { type: String, default: null },
    instagram: { type: String, default: null },
    logoUrl: { type: String, default: null },
    coverUrl: { type: String, default: null },
    accentColor: { type: String, default: "#C45B7A" },
    secondaryColor: { type: String, default: "#4A2F26" },
    themeColors: { type: themeColorsSchema, default: () => ({}) },
    typography: { type: String, default: "elegant" },
    cardStyle: { type: String, default: "soft" },
    pageLayout: { type: String, default: "classic" },
    businessHours: { type: String, default: null },
    address: { type: String, default: null },
    city: { type: String, default: null },
    pickupEnabled: { type: Boolean, default: true },
    deliveryEnabled: { type: Boolean, default: true },
    minAdvanceDays: { type: Number, default: 2 },
    productionNote: { type: String, default: null },
    paymentMethods: {
      type: [String],
      default: ["Pix", "Sinal para encomenda"],
    },
    mpPublicKey: { type: String, default: null },
    mpAccessToken: { type: String, default: null },
    mpWebhookSecret: { type: String, default: null },
    mpEnabled: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    plan: { type: String, default: "starter" },
    notifyNewOrders: { type: Boolean, default: true },
    notifyLowStock: { type: Boolean, default: true },
    notifyNewCustomers: { type: Boolean, default: true },
    notifyViaEmail: { type: Boolean, default: true },
    notifyViaWhatsApp: { type: Boolean, default: true },
    autoDeductStock: { type: Boolean, default: true },
    deliveryZones: { type: [deliveryZoneSchema], default: [] },
  },
  { timestamps: true },
);

export type DeliveryZoneDoc = {
  _id: string;
  id?: string;
  name: string;
  feeCents: number;
};

export type StoreDoc = {
  _id: string;
  id: string;
  userId: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  whatsapp: string;
  whatsappMessage: string | null;
  instagram: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  accentColor: string;
  secondaryColor: string;
  themeColors: {
    background: string;
    surface: string;
    muted: string;
    accent: string;
    accentDeep: string;
    text: string;
    textMuted: string;
    secondary: string;
    chrome: string;
    complement: string;
  };
  typography: string;
  cardStyle: string;
  pageLayout: string;
  businessHours: string | null;
  address: string | null;
  city: string | null;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  minAdvanceDays: number;
  productionNote: string | null;
  paymentMethods: string[];
  mpPublicKey: string | null;
  mpAccessToken: string | null;
  mpWebhookSecret: string | null;
  mpEnabled: boolean;
  isPublished: boolean;
  plan: string;
  notifyNewOrders: boolean;
  notifyLowStock: boolean;
  notifyNewCustomers: boolean;
  notifyViaEmail: boolean;
  notifyViaWhatsApp: boolean;
  autoDeductStock: boolean;
  deliveryZones: DeliveryZoneDoc[];
  createdAt: Date;
  updatedAt: Date;
};

export const Store: Model<StoreDoc> =
  (mongoose.models.Store as Model<StoreDoc> | undefined) ??
  mongoose.model<StoreDoc>("Store", storeSchema);
