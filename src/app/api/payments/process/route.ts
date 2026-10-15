import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { Order } from "@/models/Order";
import { Store } from "@/models/Store";
import {
  createPayment,
  mapMpStatus,
  resolveMpAccessToken,
  storeHasMercadoPago,
} from "@/lib/mercadopago";
import { maybeDeductStockForOrder } from "@/lib/stock-order";
import { ONLINE_PAYMENT_METHOD } from "@/lib/utils";

const schema = z.object({
  orderId: z.string().min(1),
  formData: z.record(z.string(), z.unknown()),
});

export async function POST(req: Request) {
  try {
    const { orderId, formData } = schema.parse(await req.json());

    await connectDB();
    const order = await Order.findOne({ _id: orderId }).lean();
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const store = await Store.findOne({ _id: order.storeId })
      .select({
        mpEnabled: 1,
        mpPublicKey: 1,
        mpAccessToken: 1,
        name: 1,
      })
      .lean();

    if (!store) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    const accessToken = resolveMpAccessToken(store);
    if (!storeHasMercadoPago(store) || !accessToken) {
      return NextResponse.json(
        { error: "Pagamento online não configurado nesta loja" },
        { status: 400 },
      );
    }

    if (order.priceLabel === "TO_CONFIRM" || order.totalCents <= 0) {
      return NextResponse.json(
        { error: "Só é possível pagar online pedidos com valor definido" },
        { status: 400 },
      );
    }

    if (order.paymentStatus === "APPROVED") {
      return NextResponse.json({
        status: "approved",
        paymentStatus: "APPROVED",
        paymentId: order.mpPaymentId,
      });
    }

    const expectedAmount = Number((order.totalCents / 100).toFixed(2));
    const receivedAmount = Number(formData.transaction_amount);
    if (
      !Number.isFinite(receivedAmount) ||
      Math.abs(receivedAmount - expectedAmount) > 0.01
    ) {
      return NextResponse.json(
        { error: "Valor do pagamento não confere com o pedido" },
        { status: 400 },
      );
    }

    const payerFromForm =
      formData.payer && typeof formData.payer === "object"
        ? (formData.payer as Record<string, unknown>)
        : {};

    const orderIdStr = String(order._id);
    const body: Record<string, unknown> = {
      ...formData,
      transaction_amount: expectedAmount,
      description: `Pedido ${orderIdStr.slice(0, 8)} — ${store.name}`,
      external_reference: orderIdStr,
      payer: {
        ...payerFromForm,
        email:
          (typeof payerFromForm.email === "string" && payerFromForm.email) ||
          order.customerEmail ||
          undefined,
      },
      metadata: {
        order_id: orderIdStr,
        store_id: order.storeId,
      },
    };

    const result = await createPayment(
      accessToken,
      body,
      `order-${orderIdStr}-${randomUUID()}`,
    );

    const paymentStatus = mapMpStatus(result.status);
    const paymentId = result.id != null ? String(result.id) : null;
    const becameApproved = paymentStatus === "APPROVED";

    await Order.updateOne(
      { _id: order._id },
      {
        $set: {
          paymentMethod: ONLINE_PAYMENT_METHOD,
          paymentStatus,
          mpPaymentId: paymentId,
          paidAt: paymentStatus === "APPROVED" ? new Date() : null,
        },
      },
    );

    if (becameApproved) {
      try {
        await maybeDeductStockForOrder({
          orderId: orderIdStr,
          storeId: order.storeId,
          reason: "pay",
        });
      } catch (err) {
        console.error("[stock:deduct]", err);
      }
    }

    return NextResponse.json({
      status: result.status,
      statusDetail: result.status_detail,
      paymentStatus,
      paymentId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[payments/process]", error);
    return NextResponse.json(
      { error: "Não foi possível processar o pagamento" },
      { status: 500 },
    );
  }
}
