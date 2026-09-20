import { z } from "zod";

/** Absolute http(s) URL or app-hosted `/uploads/…` path. */
export function isMediaUrl(value: string): boolean {
  if (!value) return true;
  if (value.startsWith("/uploads/")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export const mediaUrlSchema = z
  .string()
  .refine(isMediaUrl, { message: "URL de imagem inválida" })
  .optional();
