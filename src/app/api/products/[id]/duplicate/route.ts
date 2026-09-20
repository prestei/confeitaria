import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Product } from "@/models/Product";
import { slugify } from "@/lib/utils";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.storeId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const product = await Product.findOne({
    _id: id,
    storeId: session.user.storeId,
  }).lean();
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  const baseSlug = slugify(`${product.name} copia`);
  let slug = baseSlug;
  const taken = await Product.findOne({
    storeId: session.user.storeId,
    slug,
  }).lean();
  if (taken) slug = `${baseSlug}-${Date.now().toString(36).slice(-4)}`;

  const copy = await Product.create({
    storeId: session.user.storeId,
    categoryId: product.categoryId,
    name: `${product.name} (cópia)`,
    slug,
    description: product.description,
    imageUrl: product.imageUrl,
    gallery: product.gallery,
    productType: product.productType,
    priceMode: product.priceMode,
    priceCents: product.priceCents,
    promoPriceCents: product.promoPriceCents,
    availability: product.availability,
    featured: false,
    active: false,
    trackStock: product.trackStock,
    stockQty: product.stockQty,
    stockMin: product.stockMin,
    unit: product.unit,
    minAdvanceDays: product.minAdvanceDays,
    kitContents: product.kitContents,
    optionGroups: (product.optionGroups ?? []).map((g, gi) => ({
      name: g.name,
      required: g.required,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      sortOrder: gi,
      options: (g.options ?? []).map((o, oi) => ({
        name: o.name,
        priceDeltaCents: o.priceDeltaCents,
        sortOrder: oi,
      })),
    })),
    addons: (product.addons ?? []).map((a) => ({
      name: a.name,
      priceCents: a.priceCents,
      maxQty: a.maxQty,
    })),
  });

  return NextResponse.json(withIds(copy.toObject()));
}
