import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function extensionForMime(mime: string): string | null {
  return ALLOWED[mime] ?? null;
}

export function isAllowedImageMime(mime: string): boolean {
  return mime in ALLOWED;
}

/** Persist an image under public/uploads/{storeId}/ and return the public path. */
export async function saveStoreUpload(
  storeId: string,
  bytes: Buffer,
  mime: string,
): Promise<{ url: string; filename: string }> {
  const ext = extensionForMime(mime);
  if (!ext) throw new Error("Tipo de arquivo não suportado");

  const safeStore = storeId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeStore) throw new Error("Loja inválida");

  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", safeStore);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return {
    filename,
    url: `/uploads/${safeStore}/${filename}`,
  };
}
