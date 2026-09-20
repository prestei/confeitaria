import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "enc:v1:";

function encryptionKey(): Buffer {
  const raw =
    process.env.TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim();
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY ou AUTH_SECRET é necessário para criptografar segredos",
    );
  }
  return createHash("sha256").update(raw).digest();
}

/** True when value was produced by {@link encryptSecret}. */
export function isEncryptedSecret(value: string | null | undefined): boolean {
  return Boolean(value?.startsWith(PREFIX));
}

/**
 * Encrypts a secret at rest (AES-256-GCM).
 * Format: `enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>`
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a value from {@link encryptSecret}.
 * Plaintext legacy values (pre-encryption) are returned as-is.
 */
export function decryptSecret(value: string): string {
  if (!value.startsWith(PREFIX)) return value;

  const payload = value.slice(PREFIX.length);
  const [ivHex, tagHex, dataHex] = payload.split(":");
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error("Segredo criptografado inválido");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

/** Encrypt only if not already encrypted; empty → null. */
export function encryptSecretIfNeeded(
  value: string | null | undefined,
): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  if (isEncryptedSecret(trimmed)) return trimmed;
  return encryptSecret(trimmed);
}

export function decryptSecretOrNull(
  value: string | null | undefined,
): string | null {
  if (!value?.trim()) return null;
  try {
    return decryptSecret(value);
  } catch (error) {
    console.error("[crypto-secrets] decrypt failed", error);
    return null;
  }
}
