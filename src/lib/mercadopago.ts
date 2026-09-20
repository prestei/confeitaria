import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  InvalidWebhookSignatureError,
  WebhookSignatureValidator,
} from "mercadopago";
import type { PaymentStatus } from "@/lib/enums";
import {
  decryptSecretOrNull,
  encryptSecretIfNeeded,
} from "@/lib/crypto-secrets";

export function createMercadoPagoClient(accessToken: string) {
  return new MercadoPagoConfig({
    accessToken,
    options: { timeout: 10000 },
  });
}

export function mapMpStatus(status: string | undefined): PaymentStatus {
  switch (status) {
    case "approved":
      return "APPROVED";
    case "pending":
    case "in_process":
    case "authorized":
      return "PENDING";
    case "rejected":
      return "REJECTED";
    case "cancelled":
    case "refunded":
    case "charged_back":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

export function maskSecret(value: string | null | undefined) {
  const plain = value ? decryptSecretOrNull(value) ?? value : null;
  if (!plain) return null;
  if (plain.length <= 4) return "****";
  return `****${plain.slice(-4)}`;
}

export function resolveMpAccessToken(
  store: { mpAccessToken: string | null },
): string | null {
  return decryptSecretOrNull(store.mpAccessToken);
}

export function resolveMpWebhookSecret(
  store: { mpWebhookSecret: string | null },
): string | null {
  return decryptSecretOrNull(store.mpWebhookSecret);
}

export function prepareMpAccessTokenForStorage(
  value: string | null | undefined,
): string | null {
  return encryptSecretIfNeeded(value);
}

export function prepareMpWebhookSecretForStorage(
  value: string | null | undefined,
): string | null {
  return encryptSecretIfNeeded(value);
}

export function storeHasMercadoPago(store: {
  mpEnabled: boolean;
  mpPublicKey: string | null;
  mpAccessToken: string | null;
}) {
  const token = resolveMpAccessToken(store);
  return Boolean(
    store.mpEnabled && store.mpPublicKey?.trim() && token?.trim(),
  );
}

export async function createPayment(
  accessToken: string,
  body: Record<string, unknown>,
  idempotencyKey: string,
) {
  const client = createMercadoPagoClient(accessToken);
  const payment = new Payment(client);
  // Brick formData shape varies by method; SDK body is loosely typed for this use case.
  return payment.create({
    body: body as never,
    requestOptions: { idempotencyKey },
  });
}

export async function getPayment(accessToken: string, paymentId: string | number) {
  const client = createMercadoPagoClient(accessToken);
  const payment = new Payment(client);
  return payment.get({ id: paymentId });
}

/**
 * Validates Mercado Pago webhook signature against any of the candidate secrets.
 * Returns true if valid; false if secrets exist but none match.
 * Returns null when no secrets are configured (caller may allow in local/dev).
 */
export function validateMpWebhookSignature(input: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secrets: Array<string | null | undefined>;
}): boolean | null {
  const secrets = [
    ...new Set(
      input.secrets
        .map((s) => s?.trim())
        .filter((s): s is string => Boolean(s)),
    ),
  ];
  if (secrets.length === 0) return null;

  for (const secret of secrets) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: input.xSignature,
        xRequestId: input.xRequestId,
        dataId: input.dataId,
        secret,
        toleranceSeconds: 300,
      });
      return true;
    } catch (error) {
      if (!(error instanceof InvalidWebhookSignatureError)) throw error;
    }
  }
  return false;
}
