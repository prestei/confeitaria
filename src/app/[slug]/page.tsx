import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import {
  applyCategoryPriceAdjust,
  isCategoryVisibleToday,
  resolveCategoryEmoji,
} from "@/lib/category";
import { leanDoc, leanList } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { ProductCard } from "@/components/store/product-card";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreProductGrid } from "@/components/store/store-product-grid";
import { StoreCustomOrderBanner } from "@/components/store/store-custom-order-banner";
import { StoreFeaturedBanners } from "@/components/store/store-featured-banners";
import { StoreCategoryPills } from "@/components/store/store-category-pills";
import { StoreCategorySection } from "@/components/store/store-category-section";
import { isStoreOpenNow } from "@/lib/hours";
import { normalizePageLayout } from "@/lib/store-appearance";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ slug, isPublished: true }).lean(),
  );
  if (!store) notFound();

  const [allCategories, products] = await Promise.all([
    leanList(
      await Category.find({ storeId: store.id }).sort({ sortOrder: 1 }).lean(),
    ),
    leanList(
      await Product.find({ storeId: store.id, active: true })
        .sort({ featured: -1, sortOrder: 1 })
        .lean(),
    ),
  ]);

  const categories = allCategories.filter((c) => isCategoryVisibleToday(c));
  const categoryById = new Map(allCategories.map((c) => [c.id, c]));
  const storeOpen = isStoreOpenNow(store.businessHours);

  function withCategoryPrice<T extends { categoryId?: string | null; priceCents: number | null; promoPriceCents?: number | null }>(
    p: T,
  ) {
    const cat = p.categoryId ? categoryById.get(p.categoryId) : undefined;
    if (!cat) return p;
    const opts = {
      discountPercent: cat.discountPercent ?? 0,
      surchargePercent: cat.surchargePercent ?? 0,
    };
    if (!opts.discountPercent && !opts.surchargePercent) return p;
    return {
      ...p,
      priceCents: applyCategoryPriceAdjust(p.priceCents, opts),
      promoPriceCents:
        p.promoPriceCents != null
          ? applyCategoryPriceAdjust(p.promoPriceCents, opts)
          : p.promoPriceCents,
    };
  }

  const featured = products.filter((p) => p.featured).map(withCategoryPrice);
  const pageLayout = normalizePageLayout(store.pageLayout);
  const showFeaturedTop =
    featured.length > 0 && pageLayout !== "catalog";

  const productGridClass =
    pageLayout === "catalog"
      ? "grid grid-cols-2 gap-3 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6"
      : pageLayout === "showcase"
        ? "flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6"
        : "flex flex-col md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6";

  return (
    <main className="relative">
      {showFeaturedTop && (
        <div className="pt-5 pb-2 sm:pt-6">
          <StoreFeaturedBanners storeSlug={store.slug} products={featured as any} />
        </div>
      )}

      {/* Sticky parent must include the product sections (not only the pills). */}
      <div id="cardapio" className="scroll-mt-24 pt-4">
        <StoreCategoryPills
          categories={categories as any}
          showFeatured={featured.length > 0}
          customOrderHref={`/${store.slug}/encomenda`}
        />

        <div className="relative bg-ivory">
          {categories.map((cat, idx) => {
            const catProducts = products
              .filter((p) => p.categoryId === cat.id)
              .map(withCategoryPrice);
            if (!catProducts.length) return null;

            return (
              <StoreCategorySection
                key={cat.id}
                id={`cat-${cat.slug}`}
                index={idx}
                name={cat.name}
                emoji={resolveCategoryEmoji(cat.name, cat.emoji)}
                emphasize={pageLayout === "catalog"}
              >
                <StoreProductGrid className={cn(productGridClass)}>
                  {catProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      storeSlug={store.slug}
                      product={p as any}
                      storeOpen={storeOpen}
                    />
                  ))}
                </StoreProductGrid>
              </StoreCategorySection>
            );
          })}
        </div>
      </div>

      <StoreCustomOrderBanner slug={store.slug} />

      <StoreFooter
        store={{
          slug: store.slug,
          name: store.name,
          logoUrl: store.logoUrl,
          whatsapp: store.whatsapp,
          city: store.city,
          address: store.address,
          tagline: store.tagline,
        }}
      />
    </main>
  );
}
