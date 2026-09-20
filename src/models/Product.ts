import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";
import { newId } from "@/lib/serialize";
import {
  Availability,
  PriceMode,
  ProductType,
  type Availability as AvailabilityT,
  type PriceMode as PriceModeT,
  type ProductType as ProductTypeT,
} from "@/lib/enums";

const productOptionSchema = new mongoose.Schema(
  {
    _id: { type: String, default: newId },
    name: { type: String, required: true },
    priceDeltaCents: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
);

const optionGroupSchema = new mongoose.Schema(
  {
    _id: { type: String, default: newId },
    name: { type: String, required: true },
    required: { type: Boolean, default: true },
    minSelect: { type: Number, default: 1 },
    maxSelect: { type: Number, default: 1 },
    sortOrder: { type: Number, default: 0 },
    options: { type: [productOptionSchema], default: [] },
  },
  { _id: true },
);

const addonSchema = new mongoose.Schema(
  {
    _id: { type: String, default: newId },
    name: { type: String, required: true },
    priceCents: { type: Number, required: true },
    maxQty: { type: Number, default: 5 },
  },
  { _id: true },
);

const productSchema = baseSchema(
  {
    categoryId: { type: String, default: null, index: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String, default: null },
    imageUrl: { type: String, default: null },
    gallery: { type: [String], default: [] },
    productType: {
      type: String,
      enum: Object.values(ProductType),
      default: ProductType.READY,
    },
    priceMode: {
      type: String,
      enum: Object.values(PriceMode),
      default: PriceMode.FIXED,
    },
    priceCents: { type: Number, default: null },
    promoPriceCents: { type: Number, default: null },
    availability: {
      type: String,
      enum: Object.values(Availability),
      default: Availability.AVAILABLE,
    },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    trackStock: { type: Boolean, default: false },
    stockQty: { type: Number, default: 0 },
    stockMin: { type: Number, default: 5 },
    unit: { type: String, default: "un" },
    minAdvanceDays: { type: Number, default: null },
    kitContents: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
    optionGroups: { type: [optionGroupSchema], default: [] },
    addons: { type: [addonSchema], default: [] },
  },
  { timestamps: true, tenant: true },
);

productSchema.index({ storeId: 1, slug: 1 }, { unique: true });

export type ProductOptionDoc = {
  _id: string;
  id?: string;
  name: string;
  priceDeltaCents: number;
  sortOrder: number;
};

export type OptionGroupDoc = {
  _id: string;
  id?: string;
  name: string;
  required: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: ProductOptionDoc[];
};

export type AddonDoc = {
  _id: string;
  id?: string;
  name: string;
  priceCents: number;
  maxQty: number;
};

export type ProductDoc = {
  _id: string;
  id: string;
  storeId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  gallery: string[];
  productType: ProductTypeT;
  priceMode: PriceModeT;
  priceCents: number | null;
  promoPriceCents: number | null;
  availability: AvailabilityT;
  featured: boolean;
  active: boolean;
  trackStock: boolean;
  stockQty: number;
  stockMin: number;
  unit: string;
  minAdvanceDays: number | null;
  kitContents: string | null;
  sortOrder: number;
  optionGroups: OptionGroupDoc[];
  addons: AddonDoc[];
  createdAt: Date;
  updatedAt: Date;
};

export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc> | undefined) ??
  mongoose.model<ProductDoc>("Product", productSchema);
