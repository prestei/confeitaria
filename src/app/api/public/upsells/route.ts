import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { withIds } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { CatalogAddon } from "@/models/Addon";
import { Product } from "@/models/Product";
import { effectivePriceCents } from "@/lib/pricing";

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "Informe a loja" }, { status: 400 });
  }

  await connectDB();
  const store = await Store.findOne({ slug, isPublished: true })
    .select({ _id: 1 })
    .lean();
  if (!store) {
    return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
  }

  const storeId = String(store._id);
  const [addons, products] = await Promise.all([
    CatalogAddon.find({
      storeId,
      active: true,
      suggestInCart: true,
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
    Product.find({
      storeId,
      active: true,
      suggestInCart: true,
      availability: { $ne: "SOLD_OUT" },
    })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
  ]);

  return NextResponse.json({
    addons: withIds(addons).map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      imageUrl: a.imageUrl,
      priceCents: a.priceCents,
    })),
    products: withIds(products)
      .map((p) => {
        const price = effectivePriceCents(p);
        if (price == null) return null;
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          imageUrl: p.imageUrl,
          productType: p.productType,
          priceMode: p.priceMode,
          priceCents: price,
        };
      })
      .filter(Boolean),
  });
}
