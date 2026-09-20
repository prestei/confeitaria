import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Store } from "@/models/Store";
import {
  getPayment,
  mapMpStatus,
  resolveMpAccessToken,
  resolveMpWebhookSecret,
  validateMpWebhookSignature,
} from "@/lib/mercadopago";
import { ONLINE_PAYMENT_METHOD } from "@/lib/utils";
import { notifyNewOrder } from "@/lib/notify";
import { maybeDeductStockForOrder } from "@/lib/stock-order";

async function collectWebhookSecrets() {
  const envSecret = process.env.MP_WEBHOOK_SECRET?.trim() || null;
  const stores = await Store.find({
    mpEnabled: true,
    mpWebhookSecret: { $ne: null },
  })
    .select({ mpWebhookSecret: 1 })
    .limit(200)
    .lean();

  return [
    envSecret,
    ...stores.map((s) => resolveMpWebhookSecret(s)),
  ];
}

async function resolveAndSync(paymentId: string) {
  await connectDB();
  const byPaymentId = await Order.findOne({ mpPaymentId: paymentId }).lean();

  if (byPaymentId) {
    const store = await Store.findOne({ _id: byPaymentId.storeId })
      .select({ mpAccessToken: 1 })
      .lean();
    const token = store ? resolveMpAccessToken(store) : null;
    if (token) {
      const payment = await getPayment(token, paymentId);
      return applyPayment(String(byPaymentId._id), paymentId, payment.status);
    }
  }

  const pending = await Order.find({
    paymentStatus: "PENDING",
    paymentMethod: ONLINE_PAYMENT_METHOD,
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  })
    .limit(40)
    .lean();

  const tried = new Set<string>();
  for (const candidate of pending) {
    const store = await Store.findOne({ _id: candidate.storeId })
      .select({ mpAccessToken: 1 })
      .lean();
    const token = store ? resolveMpAccessToken(store) : null;
    if (!token || tried.has(token)) continue;
    tried.add(token);
    try {
      const payment = await getPayment(token, paymentId);
      const ref =
        typeof payment.external_reference === "string"
          ? payment.external_reference
          : null;
      if (!ref) continue;
      return applyPayment(ref, paymentId, payment.status);
    } catch {
      // token does not own this payment
    }
  }

  return null;
}

async function applyPayment(
  orderId: string,
  paymentId: string,
  status: string | undefined,
) {
  const paymentStatus = mapMpStatus(status);
  const order = await Order.findOne({ _id: orderId }).lean();
  if (!order) return null;

  const becameApproved =
    paymentStatus === "APPROVED" && order.paymentStatus !== "APPROVED";

  const updated = await Order.findOneAndUpdate(
    { _id: orderId },
    {
      $set: {
        mpPaymentId: paymentId,
        paymentStatus,
        paidAt:
          paymentStatus === "APPROVED"
            ? order.paidAt ?? new Date()
            : order.paidAt,
      },
    },
    { new: true },
  ).lean();

  if (becameApproved && updated) {
    void notifyNewOrder({
      storeId: updated.storeId,
      orderId: String(updated._id),
      customerName: updated.customerName,
      totalCents: updated.totalCents,
      priceLabel: updated.priceLabel,
    }).catch((err) => console.error("[notify:order]", err));

    void maybeDeductStockForOrder({
      orderId: String(updated._id),
      storeId: updated.storeId,
      reason: "pay",
    }).catch((err) => console.error("[stock:deduct]", err));
  }

  return updated;
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));

    const type =
      (typeof body.type === "string" && body.type) ||
      (typeof body.action === "string" && body.action) ||
      url.searchParams.get("type") ||
      "";

    const dataId =
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      (body.data &&
        typeof body.data === "object" &&
        body.data !== null &&
        "id" in body.data &&
        String((body.data as { id: unknown }).id)) ||
      "";

    const topic = url.searchParams.get("topic") || type;
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    await connectDB();
    const secrets = await collectWebhookSecrets();
    const signatureOk = validateMpWebhookSignature({
      xSignature,
      xRequestId,
      // MP signs using the query `data.id` when present; fall back to body id.
      dataId: url.searchParams.get("data.id") || dataId || null,
      secrets,
    });

    if (signatureOk === false) {
      console.warn("[payments/webhook] invalid signature", {
        xRequestId,
        dataId,
      });
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }
    if (signatureOk === null) {
      console.warn(
        "[payments/webhook] nenhum segredo configurado (MP_WEBHOOK_SECRET ou mpWebhookSecret da loja) — validação pulada",
      );
    }

    if ((topic.includes("payment") || type.includes("payment")) && dataId) {
      await resolveAndSync(dataId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[payments/webhook]", error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: Request) {
  return POST(req);
}
