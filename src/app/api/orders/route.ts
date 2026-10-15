import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { BlockedDate } from "@/models/BlockedDate";
import { Customer } from "@/models/Customer";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { CatalogAddon } from "@/models/Addon";
import { Promotion } from "@/models/Promotion";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { storeHasMercadoPago } from "@/lib/mercadopago";
import { ONLINE_PAYMENT_METHOD, digitsOnly, whatsappLink } from "@/lib/utils";
import { notifyNewCustomer, notifyNewOrder } from "@/lib/notify";
import { getStoreOpenStatus } from "@/lib/hours";
import { computeUnitPriceCents } from "@/lib/pricing";
import { mergeProductAddons, UPSELL_SOURCE } from "@/lib/addons";
import { validatePromotion } from "@/lib/promotions";

const itemSchema = z.object({
  productId: z.string().optional(),
  productName: z.string(),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int().nonnegative(),
  customizations: z
    .record(z.string(), z.union([z.string(), z.number(), z.array(z.string())]))
    .optional(),
  priceMode: z.enum(["FIXED", "FROM", "QUOTE"]),
  source: z.enum(["PRODUCT", UPSELL_SOURCE]).optional(),
  addonId: z.string().optional(),
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
  promoCode: z.string().optional(),
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

    const openStatus = getStoreOpenStatus(store.businessHours);
    if (openStatus.scheduled && !openStatus.open) {
      return NextResponse.json(
        {
          error: openStatus.todayLabel
            ? `A loja está fechada agora (${openStatus.todayLabel}). Tente novamente no horário de funcionamento.`
            : "A loja está fechada no momento. Tente novamente no horário de funcionamento.",
        },
        { status: 400 },
      );
    }

    const storeId = String(store._id);
    const hasQuote = data.items.some((i) => i.priceMode === "QUOTE");
    const hasFrom = data.items.some((i) => i.priceMode === "FROM");

    let deliveryFeeCents = 0;
    if (data.fulfillment === "DELIVERY" && data.deliveryZone) {
      const zone = store.deliveryZones?.find((z) => z.name === data.deliveryZone);
      deliveryFeeCents = zone?.feeCents ?? 0;
    }

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

    const productIds = [
      ...new Set(data.items.map((i) => i.productId).filter(Boolean) as string[]),
    ];
    const products =
      productIds.length > 0
        ? await Product.find({ _id: { $in: productIds }, storeId }).lean()
        : [];
    const productById = new Map(products.map((p) => [String(p._id), p]));
    const catalogAddons = await CatalogAddon.find({
      storeId,
      active: true,
    }).lean();
    const addonById = new Map(
      catalogAddons.map((a) => [String(a._id), a]),
    );

    const pricedItems: Array<(typeof data.items)[number] & {
      unitPriceCents: number;
      lineTotalCents: number;
    }> = [];

    for (const item of data.items) {
      const custom = item.customizations ?? {};
      const source =
        item.source ||
        (typeof custom.__source === "string" ? custom.__source : "");
      const addonId =
        item.addonId ||
        (typeof custom.__addonId === "string" ? custom.__addonId : "");

      let unitPriceCents = item.unitPriceCents;

      if (source === UPSELL_SOURCE && addonId) {
        const addon = addonById.get(addonId);
        if (!addon) {
          return NextResponse.json(
            { error: "Adicional de fechamento inválido." },
            { status: 400 },
          );
        }
        unitPriceCents = addon.priceCents;
      } else if (item.productId) {
        const product = productById.get(item.productId);
        if (product) {
          unitPriceCents = computeUnitPriceCents(
            {
              ...product,
              addons: mergeProductAddons(
                product.addons,
                catalogAddons,
                product.categoryId,
              ),
            },
            item.customizations ?? null,
            item.priceMode,
          );
        }
      }

      pricedItems.push({
        ...item,
        unitPriceCents,
        lineTotalCents: unitPriceCents * item.quantity,
      });
    }

    const requestedByProduct = new Map<string, number>();
    for (const item of pricedItems) {
      if (!item.productId) continue;
      requestedByProduct.set(
        item.productId,
        (requestedByProduct.get(item.productId) ?? 0) + item.quantity,
      );
    }
    if (requestedByProduct.size > 0) {
      for (const [productId, requested] of requestedByProduct) {
        const product = productById.get(productId);
        if (!product) {
          return NextResponse.json(
            { error: "Um dos produtos do pedido não foi encontrado" },
            { status: 400 },
          );
        }
        if (product.availability === "SOLD_OUT") {
          return NextResponse.json(
            { error: `"${product.name}" está esgotado.` },
            { status: 400 },
          );
        }
        if (product.availability === "SCHEDULED_DAYS") {
          // Product only sold on days the store is open (structured hours).
          if (openStatus.scheduled && !openStatus.open) {
            return NextResponse.json(
              {
                error: `"${product.name}" só está disponível nos dias de funcionamento da loja.`,
              },
              { status: 400 },
            );
          }
        }
        if (product.trackStock && requested > product.stockQty) {
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

    const subtotalCents = pricedItems.reduce(
      (sum, i) => sum + i.lineTotalCents,
      0,
    );

    let discountCents = 0;
    let promoCode: string | null = null;
    let promotionId: string | null = null;

    if (data.promoCode?.trim() && !hasQuote) {
      const code = data.promoCode.trim().toUpperCase();
      const promo = await Promotion.findOne({
        storeId,
        code,
        active: true,
      }).lean();
      const result = validatePromotion(
        promo,
        pricedItems.map((i) => ({
          productId: i.productId,
          unitPriceCents: i.unitPriceCents,
          quantity: i.quantity,
          priceMode: i.priceMode,
        })),
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      discountCents = result.discountCents;
      promoCode = result.promotion.code;
      promotionId = String(result.promotion._id);
    }

    const totalCents = Math.max(0, subtotalCents - discountCents) + deliveryFeeCents;

    let priceLabel = "TOTAL";
    if (hasQuote) priceLabel = "TO_CONFIRM";
    else if (hasFrom) priceLabel = "ESTIMATE";

    const customerPhone = digitsOnly(data.customerPhone);
    if (customerPhone.length < 8) {
      return NextResponse.json({ error: "WhatsApp inválido" }, { status: 400 });
    }

    let customer = await Customer.findOne({
      storeId,
      phone: customerPhone,
    });
    let isNewCustomer = false;
    const noteText = data.notes?.trim() || null;
    const refText = data.referenceNote?.trim() || null;
    if (customer) {
      customer.name = data.customerName;
      if (data.customerEmail) customer.email = data.customerEmail;
      if (noteText) customer.notes = noteText;
      if (refText) customer.referenceNote = refText;
      await customer.save();
    } else {
      isNewCustomer = true;
      customer = await Customer.create({
        storeId,
        name: data.customerName,
        phone: customerPhone,
        email: data.customerEmail || null,
        notes: noteText,
        referenceNote: refText,
      });
    }

    // Claim usage atomically before creating the order to avoid oversell.
    if (promotionId) {
      const claimed = await Promotion.findOneAndUpdate(
        {
          _id: promotionId,
          storeId,
          active: true,
          $or: [
            { usageLimit: null },
            { usageLimit: { $exists: false } },
            { $expr: { $lt: ["$usageCount", "$usageLimit"] } },
          ],
        },
        { $inc: { usageCount: 1 } },
        { new: true },
      ).lean();
      if (!claimed) {
        return NextResponse.json(
          { error: "Este cupom atingiu o limite de usos" },
          { status: 400 },
        );
      }
    }

    let order;
    try {
      order = await Order.create({
        storeId,
        customerId: String(customer._id),
        kind: hasQuote ? "QUOTE" : "CART",
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
        paymentMethod: data.paymentMethod || null,
        paymentStatus: wantsOnlinePayment ? "PENDING" : "NONE",
        stockDeducted: false,
        subtotalCents,
        discountCents,
        totalCents,
        priceLabel,
        promoCode,
        promotionId,
        items: pricedItems.map((i) => ({
          productId: i.productId || null,
          productName: i.productName,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
          lineTotalCents: i.lineTotalCents,
          customizations: i.customizations ?? null,
        })),
      });
    } catch (createError) {
      if (promotionId) {
        await Promotion.updateOne(
          { _id: promotionId, storeId },
          { $inc: { usageCount: -1 } },
        ).catch(() => {});
      }
      throw createError;
    }

    const orderPlain = withIds(order.toObject());

    await AnalyticsEvent.create({
      storeId,
      type: "ORDER_COMPLETED",
      meta: {
        orderId: orderPlain.id,
        totalCents,
        discountCents,
        promoCode,
      },
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
        customerPhone,
      }).catch((err) => console.error("[notify:customer]", err));
    }

    return NextResponse.json({
      orderId: orderPlain.id,
      whatsappUrl: whatsappLink(store.whatsapp, message),
      message,
      priceLabel,
      totalCents,
      discountCents,
      subtotalCents,
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
