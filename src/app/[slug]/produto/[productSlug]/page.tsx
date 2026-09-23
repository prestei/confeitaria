import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { applyCategoryPriceAdjust } from "@/lib/category";
import { leanDoc, leanList, type LeanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { CatalogAddon } from "@/models/Addon";
import { ProductPageClient } from "@/components/store/product-page-client";
import { isStoreOpenNow } from "@/lib/hours";
import { mergeProductAddons } from "@/lib/addons";

function sortProductEmbeds(product: LeanDoc): LeanDoc {
  const optionGroups = [...(product.optionGroups || [])]
    .sort((a: LeanDoc, b: LeanDoc) => a.sortOrder - b.sortOrder)
    .map((g: LeanDoc) => ({
      ...g,
      options: [...(g.options || [])].sort(
        (a: LeanDoc, b: LeanDoc) => a.sortOrder - b.sortOrder,
      ),
    }));
  return { ...product, optionGroups };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ slug, isPublished: true }).lean(),
  );
  if (!store) notFound();

  const raw = leanDoc(
    await Product.findOne({
      storeId: store.id,
      slug: productSlug,
      active: true,
    }).lean(),
  );
  if (!raw) notFound();

  const catalog = leanList(
    await CatalogAddon.find({ storeId: store.id, active: true })
      .sort({ sortOrder: 1, name: 1 })
      .lean(),
  );

  let product = {
    ...sortProductEmbeds(raw),
    addons: mergeProductAddons(raw.addons, catalog, raw.categoryId),
  };

  if (product.categoryId) {
    const cat = leanDoc(
      await Category.findOne({
        _id: product.categoryId,
        storeId: store.id,
      })
        .select({ discountPercent: 1, surchargePercent: 1 })
        .lean(),
    );
    if (cat) {
      const opts = {
        discountPercent: cat.discountPercent ?? 0,
        surchargePercent: cat.surchargePercent ?? 0,
      };
      if (opts.discountPercent || opts.surchargePercent) {
        product = {
          ...product,
          priceCents: applyCategoryPriceAdjust(product.priceCents, opts),
          promoPriceCents:
            product.promoPriceCents != null
              ? applyCategoryPriceAdjust(product.promoPriceCents, opts)
              : product.promoPriceCents,
        };
      }
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <ProductPageClient
        storeSlug={store.slug}
        product={product as any}
        minAdvanceDays={store.minAdvanceDays}
        storeOpen={isStoreOpenNow(store.businessHours)}
      />
    </main>
  );
}
