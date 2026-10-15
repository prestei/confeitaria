import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { applyCategoryPriceAdjust } from "@/lib/category";
import { leanDoc, leanList } from "@/lib/serialize";
import { mergeProductAddons } from "@/lib/addons";
import { Store } from "@/models/Store";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { CatalogAddon } from "@/models/Addon";

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

  let priceCents = product.priceCents;
  let promoPriceCents = product.promoPriceCents;

  if (product.categoryId) {
    const cat = await Category.findOne({
      _id: product.categoryId,
      storeId: String(store._id),
    })
      .select({ discountPercent: 1, surchargePercent: 1 })
      .lean();
    if (cat) {
      const opts = {
        discountPercent: cat.discountPercent ?? 0,
        surchargePercent: cat.surchargePercent ?? 0,
      };
      if (opts.discountPercent || opts.surchargePercent) {
        priceCents = applyCategoryPriceAdjust(priceCents, opts);
        promoPriceCents =
          promoPriceCents != null
            ? applyCategoryPriceAdjust(promoPriceCents, opts)
            : promoPriceCents;
      }
    }
  }

  // Ensure nested optionGroups/options are sorted like the Prisma include did
  const catalog = leanList(
    await CatalogAddon.find({
      storeId: String(store._id),
      active: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
  );

  const sorted = {
    ...product,
    priceCents,
    promoPriceCents,
    optionGroups: [...(product.optionGroups ?? [])]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((g) => ({
        ...g,
        options: [...(g.options ?? [])].sort(
          (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
        ),
      })),
    addons: mergeProductAddons(
      product.addons,
      catalog,
      product.categoryId,
    ),
  };

  return NextResponse.json({
    product: leanDoc(sorted),
    minAdvanceDays: store.minAdvanceDays,
  });
}
