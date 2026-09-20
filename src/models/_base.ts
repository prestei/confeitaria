import { Schema, type SchemaDefinition } from "mongoose";
import { applyIdTransform, newId } from "@/lib/serialize";

/** Base fields for every tenant-scoped document. */
export function tenantFields(): SchemaDefinition {
  return {
    storeId: { type: String, required: true, index: true },
  };
}

export function baseSchema(
  definition: SchemaDefinition,
  options?: {
    timestamps?: boolean | { createdAt?: boolean; updatedAt?: boolean };
    tenant?: boolean;
  },
) {
  const schema = new Schema(
    {
      _id: { type: String, default: newId },
      ...(options?.tenant ? tenantFields() : {}),
      ...definition,
    },
    {
      timestamps: options?.timestamps ?? false,
      _id: true,
    },
  );
  applyIdTransform(schema);
  return schema;
}
