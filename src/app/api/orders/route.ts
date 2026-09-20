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
import { ONLINE_PAYMENT_METHOD, whatsappLink } from "@/lib/utils";
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
    const hasQuote = data.items.some((i) => i.priceMode === "QUOTE");
    const hasFrom = data.items.some((i) => i.priceMode === "FROM");

    let deliveryFeeCents = 0;
    if (data.fulfillment === "DELIVERY" && data.deliveryZone) {
      const zone = store.deliveryZones?.find((z) => z.name === data.deliveryZone);
      deliveryFeeCents = zone?.feeCents ?? 0;
    }

    const subtotalCents = data.items.reduce(
      (sum, i) => sum + i.unitPriceCents * i.quantity,
      0,
    );
    const totalCents = subtotalCents + deliveryFeeCents;

    let priceLabel = "TOTAL";
    if (hasQuote) priceLabel = "TO_CONFIRM";
    else if (hasFrom) priceLabel = "ESTIMATE";

    const wantsOnlinePayment =
      data.paymentMethod === ONLINE_PAYMENT_METHOD && !hasQuote;

    if (wantsOnlinePayment && !storeHasMercadoPago(store)) {
      return NextResponse.json(
        { error: "Pagamento online não está disponível nesta loja" },
        { status: 400 },
      );
    }

    const offlineMethods = store.paymentMethods ?? [];
    if (
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
      !data.paymentMethod &&
      (offlineMethods.length > 0 || storeHasMercadoPago(store))
    ) {
      return NextResponse.json(
        { error: "Escolha uma forma de pagamento" },
        { status: 400 },
      );
    }

    const requestedByProduct = new Map<string, number>();
    for (const item of data.items) {
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
      const minDays = store.minAdvanceDays;
      if (diffDays < minDays) {
        return NextResponse.json(
          {
            error: `Para essa data, o prazo mínimo de encomenda (${minDays} dias) não foi atendido. Escolha outra data ou entre em contato.`,
          },
          { status: 400 },
        );
      }
    }

    let customer = await Customer.findOne({
      storeId,
      phone: data.customerPhone,
    });
    let isNewCustomer = false;
    if (customer) {
      customer.name = data.customerName;
      if (data.customerEmail) customer.email = data.customerEmail;
      await customer.save();
    } else {
      isNewCustomer = true;
      customer = await Customer.create({
        storeId,
        name: data.customerName,
        phone: data.customerPhone,
        email: data.customerEmail || null,
      });
    }

    const order = await Order.create({
      storeId,
      customerId: String(customer._id),
      kind: hasQuote ? "QUOTE" : "CART",
      customerName: data.customerName,
      customerPhone: data.customerPhone,
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
      paymentMethod: data.paymentMethod || null,
      paymentStatus: wantsOnlinePayment ? "PENDING" : "NONE",
      stockDeducted: false,
      subtotalCents,
      totalCents,
      priceLabel,
      items: data.items.map((i) => ({
        productId: i.productId || null,
        productName: i.productName,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
        lineTotalCents: i.unitPriceCents * i.quantity,
        customizations: i.customizations ?? null,
      })),
    });

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
