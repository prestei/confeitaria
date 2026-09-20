import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Store } from "@/models/Store";
import { getPayment, mapMpStatus } from "@/lib/mercadopago";
import { ONLINE_PAYMENT_METHOD } from "@/lib/utils";

async function resolveAndSync(paymentId: string) {
  await connectDB();
  const byPaymentId = await Order.findOne({ mpPaymentId: paymentId }).lean();

  if (byPaymentId) {
    const store = await Store.findOne({ _id: byPaymentId.storeId })
      .select({ mpAccessToken: 1 })
      .lean();
    if (store?.mpAccessToken) {
      const payment = await getPayment(store.mpAccessToken, paymentId);
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
    const token = store?.mpAccessToken;
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

  return Order.findOneAndUpdate(
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
      (body.data &&
        typeof body.data === "object" &&
        body.data !== null &&
        "id" in body.data &&
        String((body.data as { id: unknown }).id)) ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "";

    const topic = url.searchParams.get("topic") || type;

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
