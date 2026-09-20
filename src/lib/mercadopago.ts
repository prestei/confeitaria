import { MercadoPagoConfig, Payment } from "mercadopago";
import type { PaymentStatus } from "@/lib/enums";

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
  if (!value) return null;
  if (value.length <= 4) return "****";
  return `****${value.slice(-4)}`;
}

export function storeHasMercadoPago(store: {
  mpEnabled: boolean;
  mpPublicKey: string | null;
  mpAccessToken: string | null;
}) {
  return Boolean(
    store.mpEnabled && store.mpPublicKey?.trim() && store.mpAccessToken?.trim(),
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
