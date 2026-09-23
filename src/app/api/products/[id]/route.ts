import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Product } from "@/models/Product";
import { mediaUrlSchema } from "@/lib/media-url";
import { maybeNotifyLowStockTransition } from "@/lib/notify";
import { z } from "zod";

const patchSchema = z.object({
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  suggestInCart: z.boolean().optional(),
  availability: z
    .enum([
      "AVAILABLE",
      "SOLD_OUT",
      "MADE_TO_ORDER",
      "LAST_UNITS",
      "SCHEDULED_DAYS",
    ])
    .optional(),
});

const putSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  imageUrl: mediaUrlSchema,
  gallery: z.array(z.string()).optional(),
  productType: z.enum(["READY", "CUSTOM", "CAKE", "PARTY_KIT", "CORPORATE"]),
  priceMode: z.enum(["FIXED", "FROM", "QUOTE"]),
  priceCents: z.number().int().nonnegative().optional().nullable(),
  promoPriceCents: z.number().int().nonnegative().optional().nullable(),
  availability: z.enum([
    "AVAILABLE",
    "SOLD_OUT",
    "MADE_TO_ORDER",
    "LAST_UNITS",
    "SCHEDULED_DAYS",
  ]),
  featured: z.boolean().optional(),
  suggestInCart: z.boolean().optional(),
  active: z.boolean().optional(),
  trackStock: z.boolean().optional(),
  stockQty: z.number().int().optional(),
  stockMin: z.number().int().optional(),
  unit: z.string().optional(),
  kitContents: z.string().optional().nullable(),
  minAdvanceDays: z.number().int().optional().nullable(),
  optionGroups: z
    .array(
      z.object({
        name: z.string(),
        required: z.boolean().default(true),
        minSelect: z.number().int().min(0).optional(),
        maxSelect: z.number().int().min(0).optional(),
        options: z.array(
          z.object({
            name: z.string(),
            priceDeltaCents: z.number().int().default(0),
          }),
        ),
      }),
    )
    .optional(),
  addons: z
    .array(
      z.object({
        name: z.string(),
        priceCents: z.number().int(),
      }),
    )
    .optional(),
});

async function getOwnedProduct(id: string, storeId: string) {
  return Product.findOne({ _id: id, storeId }).lean();
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const body = patchSchema.parse(await req.json());
  await connectDB();
  const product = await getOwnedProduct(id, session.user.storeId);
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const updated = await Product.findOneAndUpdate(
    { _id: id, storeId: session.user.storeId },
    { $set: body },
    { new: true },
  ).lean();

  return NextResponse.json(withIds(updated));
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const product = await getOwnedProduct(id, session.user.storeId);
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  try {
    const data = putSchema.parse(await req.json());
    const trackStock = data.trackStock ?? product.trackStock;
    const stockQty = data.stockQty ?? product.stockQty;
    let availability = data.availability;
    if (trackStock && stockQty <= 0) availability = "SOLD_OUT";

    const stockMin = data.stockMin ?? product.stockMin;
    const updated = await Product.findOneAndUpdate(
      { _id: id, storeId: session.user.storeId },
      {
        $set: {
          name: data.name,
          description: data.description ?? null,
          categoryId: data.categoryId || null,
          imageUrl: data.imageUrl || null,
          gallery: data.gallery || [],
          productType: data.productType,
          priceMode: data.priceMode,
          priceCents: data.priceMode === "QUOTE" ? null : data.priceCents ?? null,
          promoPriceCents: data.promoPriceCents ?? null,
          availability,
          featured: data.featured ?? false,
          suggestInCart: data.suggestInCart ?? false,
          active: data.active ?? true,
          trackStock,
          stockQty,
          stockMin,
          unit: data.unit || "un",
          kitContents: data.kitContents ?? null,
          minAdvanceDays: data.minAdvanceDays ?? null,
          optionGroups: (data.optionGroups ?? []).map((g, gi) => {
            const minSelect = g.minSelect ?? (g.required ? 1 : 0);
            const maxSelect = Math.max(g.maxSelect ?? 1, minSelect);
            return {
              name: g.name,
              required: g.required,
              minSelect,
              maxSelect,
              sortOrder: gi,
              options: g.options.map((o, oi) => ({
                name: o.name,
                priceDeltaCents: o.priceDeltaCents,
                sortOrder: oi,
              })),
            };
          }),
          addons: (data.addons ?? []).map((a) => ({
            name: a.name,
            priceCents: a.priceCents,
          })),
        },
      },
      { new: true },
    ).lean();

    void maybeNotifyLowStockTransition({
      storeId: session.user.storeId,
      productName: data.name,
      previousQty: product.stockQty,
      nextQty: stockQty,
      stockMin,
      trackStock,
    }).catch((err) => console.error("[notify:stock]", err));

    return NextResponse.json(withIds(updated));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const product = await getOwnedProduct(id, session.user.storeId);
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  await Product.deleteOne({ _id: id, storeId: session.user.storeId });
  return NextResponse.json({ ok: true });
}
