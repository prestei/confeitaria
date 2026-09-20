import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")),
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  await connectDB();
  const storeId = session.user.storeId;
  const products = await Product.find({ storeId })
    .sort({ featured: -1, sortOrder: 1, name: 1 })
    .lean();

  const categoryIds = [
    ...new Set(
      products
        .map((p) => p.categoryId)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];
  const categories = categoryIds.length
    ? (withIds(
        await Category.find({ _id: { $in: categoryIds }, storeId }).lean(),
      ) as Array<{ id: string; name: string; [key: string]: unknown }>)
    : [];
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const productsWithId = withIds(products) as Array<
    (typeof products)[number] & { id: string }
  >;
  return NextResponse.json(
    productsWithId.map((p) => ({
      ...p,
      category: p.categoryId ? (catMap.get(p.categoryId) ?? null) : null,
    })),
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());
    await connectDB();

    let slug = slugify(data.name);
    const taken = await Product.findOne({
      storeId: session.user.storeId,
      slug,
    }).lean();
    if (taken) slug = `${slug}-${Date.now().toString(36).slice(-3)}`;

    const trackStock = data.trackStock ?? false;
    let availability = data.availability;
    if (trackStock && (data.stockQty ?? 0) <= 0) {
      availability = "SOLD_OUT";
    }

    const product = await Product.create({
      storeId: session.user.storeId,
      name: data.name,
      slug,
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
      active: data.active ?? true,
      trackStock,
      stockQty: data.stockQty ?? 0,
      stockMin: data.stockMin ?? 5,
      unit: data.unit || "un",
      kitContents: data.kitContents ?? null,
      minAdvanceDays: data.minAdvanceDays ?? null,
      optionGroups: (data.optionGroups ?? []).map((g, gi) => ({
        name: g.name,
        required: g.required,
        sortOrder: gi,
        options: g.options.map((o, oi) => ({
          name: o.name,
          priceDeltaCents: o.priceDeltaCents,
          sortOrder: oi,
        })),
      })),
      addons: (data.addons ?? []).map((a) => ({
        name: a.name,
        priceCents: a.priceCents,
      })),
    });

    return NextResponse.json(withIds(product.toObject()));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.issues },
        { status: 400 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
