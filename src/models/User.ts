import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";

const userSchema = baseSchema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, default: null },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

export type UserDoc = {
  _id: string;
  id: string;
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc> | undefined) ??
  mongoose.model<UserDoc>("User", userSchema);
