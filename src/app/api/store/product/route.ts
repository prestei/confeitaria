import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { Product } from "@/models/Product";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const storeSlug = searchParams.get("storeSlug");
  const productSlug = searchParams.get("productSlug");

  if (!storeSlug || !productSlug) {
    return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  await connectDB();
  const store = await Store.findOne({ slug: storeSlug })
    .select({ isPublished: 1, minAdvanceDays: 1 })
    .lean();
  if (!store || !store.isPublished) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }

  const product = await Product.findOne({
    storeId: String(store._id),
    slug: productSlug,
    active: true,
  }).lean();
  if (!product) {
    return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
  }

  // Ensure nested optionGroups/options are sorted like the Prisma include did
  const sorted = {
    ...product,
    optionGroups: [...(product.optionGroups ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((g) => ({
        ...g,
        options: [...(g.options ?? [])].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        ),
      })),
  };

  return NextResponse.json({
    product: leanDoc(sorted),
    minAdvanceDays: store.minAdvanceDays,
  });
}
