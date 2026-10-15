import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { BlockedDate } from "@/models/BlockedDate";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { storeHasMercadoPago } from "@/lib/mercadopago";
import { digitsOnly, ONLINE_PAYMENT_METHOD, whatsappLink } from "@/lib/utils";
import {
  CheckoutError,
  checkoutFingerprint,
  claimCheckoutSlot,
  releaseCheckoutSlot,
  resolveCheckoutLines,
} from "@/lib/checkout-items";
import { notifyNewCustomer, notifyNewOrder } from "@/lib/notify";

const itemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  customizations: z
    .record(z.string(), z.union([z.string(), z.number(), z.array(z.string())]))
    .optional(),
  priceMode: z.enum(["FIXED", "FROM", "QUOTE"]),
});

const schema = z.object({
  storeSlug: z.string(),
  customerName: z.string().min(2),
  customerPhone: z.string().min(8),
  customerEmail: z.string().email().optional().or(z.literal("")),
  companyName: z.string().optional(),
  needsInvoice: z.boolean().optional(),
  fulfillment: z.enum(["PICKUP", "DELIVERY"]),
  deliveryZone: z.string().optional(),
  eventDate: z.string().optional(),
  eventTime: z.string().optional(),
  guests: z.number().int().positive().optional(),
  notes: z.string().optional(),
  referenceNote: z.string().optional(),
  paymentMethod: z.string().optional(),
  deliveryAddress: z.string().optional(),
  checkoutMode: z.enum(["whatsapp"]).optional(),
  items: z.array(itemSchema).min(1),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    await connectDB();

    const store = await Store.findOne({ slug: data.storeSlug }).lean();
    if (!store || !store.isPublished) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const storeId = String(store._id);

    const whatsappCheckout = data.checkoutMode === "whatsapp";
    const customerPhone = digitsOnly(data.customerPhone);
    if (customerPhone.length < 8) {
      return NextResponse.json({ error: "WhatsApp inválido" }, { status: 400 });
    }

    let deliveryFeeCents = 0;
    if (data.fulfillment === "DELIVERY") {
      if (data.deliveryZone) {
        const zone = store.deliveryZones?.find((z) => z.name === data.deliveryZone);
        deliveryFeeCents = zone?.feeCents ?? 0;
      } else if (
        whatsappCheckout &&
        typeof store.deliveryFeeCents === "number" &&
        store.deliveryFeeCents > 0
      ) {
        deliveryFeeCents = store.deliveryFeeCents;
      }
    }

    let lines;
    try {
      lines = await resolveCheckoutLines(storeId, data.items);
    } catch (error) {
      if (error instanceof CheckoutError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
    const totalCents = subtotalCents + deliveryFeeCents;

    const resolvedHasQuote = lines.some((line) => line.priceMode === "QUOTE");
    const resolvedHasFrom = lines.some((line) => line.priceMode === "FROM");
    let priceLabel = "TOTAL";
    if (resolvedHasQuote) priceLabel = "TO_CONFIRM";
    else if (resolvedHasFrom) priceLabel = "ESTIMATE";

    const wantsOnlinePayment =
      !whatsappCheckout &&
      data.paymentMethod === ONLINE_PAYMENT_METHOD &&
      !resolvedHasQuote;

    if (whatsappCheckout && store.collectAddress && !data.deliveryAddress?.trim()) {
      return NextResponse.json(
        { error: "Informe o endereço para esta encomenda" },
        { status: 400 },
      );
    }

    if (wantsOnlinePayment && !storeHasMercadoPago(store)) {
      return NextResponse.json(
        { error: "Pagamento online não está disponível nesta loja" },
        { status: 400 },
      );
    }

    const offlineMethods = store.paymentMethods ?? [];
    if (
      !whatsappCheckout &&
      data.paymentMethod &&
      data.paymentMethod !== ONLINE_PAYMENT_METHOD &&
      offlineMethods.length > 0 &&
      !offlineMethods.includes(data.paymentMethod)
    ) {
      return NextResponse.json(
        { error: "Forma de pagamento não aceita nesta loja" },
        { status: 400 },
      );
    }

    if (
      !whatsappCheckout &&
      !data.paymentMethod &&
      (offlineMethods.length > 0 || storeHasMercadoPago(store))
    ) {
      return NextResponse.json(
        { error: "Escolha uma forma de pagamento" },
        { status: 400 },
      );
    }

    const requestedByProduct = new Map<string, number>();
    for (const item of lines) {
      if (!item.productId) continue;
      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }
    if (requestedByProduct.size > 0) {
      const stockProducts = await Product.find({
        _id: { $in: [...requestedByProduct.keys()] },
        storeId,
        trackStock: true,
      })
        .select({ name: 1, stockQty: 1, unit: 1 })
        .lean();
      for (const product of stockProducts) {
        const requested = requestedByProduct.get(String(product._id)) ?? 0;
        if (requested > product.stockQty) {
          return NextResponse.json(
            {
              error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stockQty} ${product.unit || "un"}.`,
            },
            { status: 400 },
          );
        }
      }
    }

    if (data.fulfillment === "DELIVERY" && !store.deliveryEnabled) {
      return NextResponse.json(
        { error: "Esta loja não oferece entrega" },
        { status: 400 },
      );
    }
    if (data.fulfillment === "PICKUP" && !store.pickupEnabled) {
      return NextResponse.json(
        { error: "Esta loja não oferece retirada" },
        { status: 400 },
      );
    }

    if (data.eventDate && store.schedulingEnabled === false) {
      return NextResponse.json(
        { error: "Agendamento não está disponível nesta loja" },
        { status: 400 },
      );
    }

    if (data.eventDate) {
      const event = new Date(data.eventDate + "T12:00:00");
      const blocked = await BlockedDate.findOne({
        storeId,
        date: event,
      }).lean();
      if (blocked) {
        return NextResponse.json(
          {
            error:
              blocked.reason ||
              "Esta data não está disponível para encomendas.",
          },
          { status: 400 },
        );
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(
        (event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      const minDays = store.minAdvanceDays ?? 0;
      if (diffDays < minDays) {
        return NextResponse.json(
          {
            error: `Para essa data, o prazo mínimo de encomenda (${minDays} dias) não foi atendido. Escolha outra data ou entre em contato.`,
          },
          { status: 400 },
        );
      }
      const minHours = store.minAdvanceHours ?? 0;
      if (minHours > 0) {
        const eventAt = new Date(
          `${data.eventDate}T${(data.eventTime || "12:00").slice(0, 5)}:00`,
        );
        const hoursUntil =
          (eventAt.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < minHours) {
          return NextResponse.json(
            {
              error: `Antecedência mínima de ${minHours} hora(s) não atendida para este horário.`,
            },
            { status: 400 },
          );
        }
      }
    }

    const checkoutKey = checkoutFingerprint(
      customerPhone,
      lines,
      data.eventDate,
      data.eventTime,
    );

    const claimed = await claimCheckoutSlot(storeId, checkoutKey);
    if (!claimed) {
      let existing = null;
      for (let attempt = 0; attempt < 25; attempt++) {
        existing = await Order.findOne({ storeId, checkoutKey }).lean();
        if (existing) break;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (!existing) {
        return NextResponse.json(
          { error: "Pedido já está sendo criado. Tente de novo em instantes." },
          { status: 409 },
        );
      }
      const existingPlain = withIds(existing);
      const existingMessage =
        existing.whatsappMessage ||
        buildWhatsAppMessage(
          { name: store.name },
          { ...existingPlain, items: existingPlain.items ?? [] },
        );
      return NextResponse.json({
        orderId: existingPlain.id,
        whatsappUrl: whatsappLink(store.whatsapp, existingMessage),
        message: existingMessage,
        priceLabel: existing.priceLabel,
        totalCents: existing.totalCents,
        requiresOnlinePayment: wantsOnlinePayment,
        duplicate: true,
      });
    }

    let customer = await Customer.findOne({
      storeId,
      phone: customerPhone,
    });
    let isNewCustomer = false;
    if (customer) {
      customer.name = data.customerName;
      if (data.customerEmail) customer.email = data.customerEmail;
      await customer.save();
    } else {
      try {
        isNewCustomer = true;
        customer = await Customer.create({
          storeId,
          name: data.customerName,
          phone: customerPhone,
          email: data.customerEmail || null,
        });
      } catch (error) {
        const duplicate =
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          (error as { code?: number }).code === 11000;
        if (!duplicate) {
          await releaseCheckoutSlot(storeId, checkoutKey);
          throw error;
        }
        customer = await Customer.findOne({ storeId, phone: customerPhone });
        isNewCustomer = false;
        if (!customer) {
          await releaseCheckoutSlot(storeId, checkoutKey);
          throw error;
        }
      }
    }

    let order;
    try {
      order = await Order.create({
        storeId,
        customerId: String(customer._id),
        kind: resolvedHasQuote ? "QUOTE" : "CART",
        customerName: data.customerName,
        customerPhone,
        customerEmail: data.customerEmail || null,
        companyName: data.companyName || null,
        needsInvoice: data.needsInvoice ?? false,
        fulfillment: data.fulfillment,
        deliveryZone: data.deliveryZone || null,
        deliveryFeeCents,
        eventDate: data.eventDate ? new Date(data.eventDate + "T12:00:00") : null,
        eventTime: data.eventTime || null,
        guests: data.guests || null,
        notes: data.notes || null,
        referenceNote: data.referenceNote || null,
        paymentMethod: whatsappCheckout ? "WhatsApp" : data.paymentMethod || null,
        paymentStatus: wantsOnlinePayment ? "PENDING" : "NONE",
        stockDeducted: false,
        amountPaidCents: 0,
        deliveryAddress: data.deliveryAddress?.trim() || null,
        checkoutKey,
        subtotalCents,
        totalCents,
        priceLabel,
        items: lines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          quantity: line.quantity,
          unitPriceCents: line.unitPriceCents,
          lineTotalCents: line.lineTotalCents,
          customizations: line.customizations,
        })),
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000
      ) {
        const existing = await Order.findOne({ storeId, checkoutKey }).lean();
        if (existing) {
          const existingPlain = withIds(existing);
          const existingMessage =
            existing.whatsappMessage ||
            buildWhatsAppMessage(
              { name: store.name },
              { ...existingPlain, items: existingPlain.items ?? [] },
            );
          return NextResponse.json({
            orderId: existingPlain.id,
            whatsappUrl: whatsappLink(store.whatsapp, existingMessage),
            message: existingMessage,
            priceLabel: existing.priceLabel,
            totalCents: existing.totalCents,
            requiresOnlinePayment: wantsOnlinePayment,
            duplicate: true,
          });
        }
      }
      await releaseCheckoutSlot(storeId, checkoutKey);
      throw error;
    }

    const orderPlain = withIds(order.toObject());

    await AnalyticsEvent.create({
      storeId,
      type: "ORDER_COMPLETED",
      meta: { orderId: orderPlain.id },
    });

    const message = buildWhatsAppMessage(
      { name: store.name },
      {
        ...orderPlain,
        items: orderPlain.items ?? [],
      },
    );
    await Order.updateOne(
      { _id: order._id },
      { $set: { whatsappMessage: message } },
    );

    void notifyNewOrder({
      storeId,
      orderId: orderPlain.id,
      customerName: data.customerName,
      totalCents,
      priceLabel,
    }).catch((err) => console.error("[notify:order]", err));

    if (isNewCustomer) {
      void notifyNewCustomer({
        storeId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
      }).catch((err) => console.error("[notify:customer]", err));
    }

    return NextResponse.json({
      orderId: orderPlain.id,
      whatsappUrl: whatsappLink(store.whatsapp, message),
      message,
      priceLabel,
      totalCents,
      requiresOnlinePayment: wantsOnlinePayment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
