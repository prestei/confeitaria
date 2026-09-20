import { randomUUID } from "crypto";
import type { Schema } from "mongoose";

/** String ids (UUID) to keep the same shape the app used with Prisma cuid. */
export function newId() {
  return randomUUID();
}

export function applyIdTransform(schema: Schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, unknown>) {
      if (ret._id != null) {
        ret.id = String(ret._id);
        delete ret._id;
      }
      return ret;
    },
  });
  schema.set("toObject", {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, unknown>) {
      if (ret._id != null) {
        ret.id = String(ret._id);
        delete ret._id;
      }
      return ret;
    },
  });
}

/**
 * Convert lean mongoose docs to plain JSON-friendly objects with `id`.
 * Safe to pass into Client Components / NextResponse.json.
 */
export function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) => {
      if (val && typeof val === "object" && typeof val.toJSON === "function") {
        return val.toJSON();
      }
      return val;
    }),
    (_key, val) => val,
  ) as T;
}

/** Recursively map `_id` → `id` on plain lean objects. */
export function withIds<T>(value: T): T {
  if (value == null || typeof value !== "object") return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((v) => withIds(v)) as T;

  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "__v") continue;
    if (k === "_id") {
      out.id = v == null ? v : String(v);
      continue;
    }
    out[k] = withIds(v);
  }
  return out as T;
}

/** Plain lean doc after `_id` → `id` (loose for Mongoose lean unions). */
export type LeanDoc = Record<string, any>;

export function leanDoc(value: unknown): LeanDoc | null {
  if (value == null) return null;
  return withIds(value) as LeanDoc;
}

export function leanList(value: unknown): LeanDoc[] {
  if (!Array.isArray(value)) return [];
  return withIds(value) as LeanDoc[];
}
