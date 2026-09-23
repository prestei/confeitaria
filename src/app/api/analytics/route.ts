import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { AnalyticsEventType } from "@/lib/enums";
import { AnalyticsEvent } from "@/models/AnalyticsEvent";
import { Store } from "@/models/Store";

const schema = z.object({
  storeSlug: z.string().min(1),
  type: z.enum([
    AnalyticsEventType.STORE_VIEW,
    AnalyticsEventType.PRODUCT_VIEW,
    AnalyticsEventType.WHATSAPP_CLICK,
    AnalyticsEventType.PRODUCT_CLICK,
    AnalyticsEventType.ORDER_STARTED,
    AnalyticsEventType.ORDER_COMPLETED,
  ]),
  productId: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  meta: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const data = schema.parse(await req.json());
    await connectDB();

    const store = await Store.findOne({ slug: data.storeSlug })
      .select({ _id: 1, isPublished: 1 })
      .lean();
    if (!store || !store.isPublished) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    await AnalyticsEvent.create({
      storeId: String(store._id),
      type: data.type,
      productId: data.productId || null,
      source: data.source || null,
      meta: data.meta ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[analytics]", error);
    return NextResponse.json({ error: "Erro ao registrar evento" }, { status: 500 });
  }
}
