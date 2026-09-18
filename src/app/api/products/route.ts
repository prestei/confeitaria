import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  productType: z.enum(["READY", "CUSTOM", "CAKE", "PARTY_KIT", "CORPORATE"]),
  priceMode: z.enum(["FIXED", "FROM", "QUOTE"]),
  priceCents: z.number().int().nonnegative().optional().nullable(),
  availability: z.enum([
    "AVAILABLE",
    "SOLD_OUT",
    "MADE_TO_ORDER",
    "LAST_UNITS",
    "SCHEDULED_DAYS",
  ]),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
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

  const products = await prisma.product.findMany({
    where: { storeId: session.user.storeId },
    include: {
      category: true,
      optionGroups: { include: { options: true }, orderBy: { sortOrder: "asc" } },
      addons: true,
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const data = schema.parse(await req.json());
    let slug = slugify(data.name);
    const taken = await prisma.product.findUnique({
      where: {
        storeId_slug: { storeId: session.user.storeId, slug },
      },
    });
    if (taken) slug = `${slug}-${Date.now().toString(36).slice(-3)}`;

    const product = await prisma.product.create({
      data: {
        storeId: session.user.storeId,
        name: data.name,
        slug,
        description: data.description,
        categoryId: data.categoryId || null,
        imageUrl: data.imageUrl || null,
        productType: data.productType,
        priceMode: data.priceMode,
        priceCents: data.priceMode === "QUOTE" ? null : data.priceCents ?? null,
        availability: data.availability,
        featured: data.featured ?? false,
        active: data.active ?? true,
        kitContents: data.kitContents,
        minAdvanceDays: data.minAdvanceDays,
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

    return NextResponse.json(product);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
