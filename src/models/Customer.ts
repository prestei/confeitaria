import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";

const customerSchema = baseSchema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: true, tenant: true },
);

customerSchema.index({ storeId: 1, phone: 1 }, { unique: true });

export type CustomerDoc = {
  _id: string;
  id: string;
  storeId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const Customer: Model<CustomerDoc> =
  (mongoose.models.Customer as Model<CustomerDoc> | undefined) ??
  mongoose.model<CustomerDoc>("Customer", customerSchema);
