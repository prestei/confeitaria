import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const patchSchema = z.object({
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
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

async function getOwnedProduct(id: string, storeId: string) {
  return prisma.product.findFirst({ where: { id, storeId } });
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
  const product = await getOwnedProduct(id, session.user.storeId);
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(updated);
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

    await prisma.optionGroup.deleteMany({ where: { productId: id } });
    await prisma.addon.deleteMany({ where: { productId: id } });

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
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
        stockQty,
        stockMin: data.stockMin ?? 5,
        unit: data.unit || "un",
        optionGroups: data.optionGroups
          ? {
              create: data.optionGroups.map((g, gi) => ({
                name: g.name,
                required: g.required,
                sortOrder: gi,
                options: {
                  create: g.options.map((o, oi) => ({
                    name: o.name,
                    priceDeltaCents: o.priceDeltaCents,
                    sortOrder: oi,
                  })),
                },
              })),
            }
          : undefined,
        addons: data.addons
          ? {
              create: data.addons.map((a) => ({
                name: a.name,
                priceCents: a.priceCents,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(updated);
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
  const product = await getOwnedProduct(id, session.user.storeId);
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
