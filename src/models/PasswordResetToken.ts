import mongoose, { type Model } from "mongoose";
import { baseSchema } from "./_base";

const passwordResetTokenSchema = baseSchema(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// TTL: Mongo removes the doc when expiresAt is in the past.
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PasswordResetTokenDoc = {
  _id: string;
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export const PasswordResetToken: Model<PasswordResetTokenDoc> =
  (mongoose.models.PasswordResetToken as
    | Model<PasswordResetTokenDoc>
    | undefined) ??
  mongoose.model<PasswordResetTokenDoc>(
    "PasswordResetToken",
    passwordResetTokenSchema,
  );
