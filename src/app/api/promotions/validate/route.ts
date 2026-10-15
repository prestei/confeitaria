import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { validatePromotion } from "@/lib/promotions";
import { Promotion } from "@/models/Promotion";
import { Store } from "@/models/Store";

const schema = z.object({
  storeSlug: z.string().min(1),
  code: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().optional().nullable(),
        unitPriceCents: z.number().int().nonnegative(),
        quantity: z.number().int().positive(),
        priceMode: z.string().optional(),
      }),
    )
    .min(1),
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

    const code = data.code.trim().toUpperCase();
    const promo = await Promotion.findOne({
      storeId: String(store._id),
      code,
      active: true,
    }).lean();

    const result = validatePromotion(promo, data.items);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      discountCents: result.discountCents,
      promotion: {
        id: String(result.promotion._id),
        name: result.promotion.name,
        code: result.promotion.code,
        type: result.promotion.type,
        percentOff: result.promotion.percentOff,
        amountOffCents: result.promotion.amountOffCents,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error("[promotions/validate]", error);
    return NextResponse.json({ error: "Erro ao validar cupom" }, { status: 500 });
  }
}
