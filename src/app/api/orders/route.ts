import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { whatsappLink } from "@/lib/utils";

const itemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  customizations: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])).optional(),
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

    const store = await prisma.store.findUnique({
      where: { slug: data.storeSlug },
      include: { deliveryZones: true },
    });
    if (!store || !store.isPublished) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    const hasQuote = data.items.some((i) => i.priceMode === "QUOTE");
    const hasFrom = data.items.some((i) => i.priceMode === "FROM");

    let deliveryFeeCents = 0;
    if (data.fulfillment === "DELIVERY" && data.deliveryZone) {
      const zone = store.deliveryZones.find((z) => z.name === data.deliveryZone);
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

    if (data.eventDate) {
      const event = new Date(data.eventDate + "T12:00:00");
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

    const order = await prisma.order.create({
      data: {
        storeId: store.id,
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
        subtotalCents,
        totalCents,
        priceLabel,
        items: {
          create: data.items.map((i) => ({
            productId: i.productId || null,
            productName: i.productName,
            quantity: i.quantity,
            unitPriceCents: i.unitPriceCents,
            lineTotalCents: i.unitPriceCents * i.quantity,
            customizations: i.customizations ?? undefined,
          })),
        },
      },
      include: { items: true },
    });

    const message = buildWhatsAppMessage(store, order);
    await prisma.order.update({
      where: { id: order.id },
      data: { whatsappMessage: message },
    });

    return NextResponse.json({
      orderId: order.id,
      whatsappUrl: whatsappLink(store.whatsapp, message),
      message,
      priceLabel,
      totalCents,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
