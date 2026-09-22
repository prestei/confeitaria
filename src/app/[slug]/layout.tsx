import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { isCategoryVisibleToday } from "@/lib/category";
import { leanDoc, leanList } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { CartProvider } from "@/components/cart/cart-context";
import { StoreHeader } from "@/components/store/store-header";
import { StoreCartBar } from "@/components/store/store-cart-bar";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
      await Category.find({ storeId: store.id })
        .sort({ sortOrder: 1 })
        .select({ slug: 1, name: 1, emoji: 1, active: 1, displayDays: 1 })
        .lean(),
    ),
    leanList(
      await Product.find({ storeId: store.id, active: true })
        .select({ slug: 1, name: 1 })
        .sort({ name: 1 })
        .lean(),
    ),
  ]);

  const categories = allCategories.filter((c) => isCategoryVisibleToday(c));

  const zones = [...(store.deliveryZones || [])].sort(
    (a, b) => a.feeCents - b.feeCents,
  );
  const minDeliveryFeeCents = zones[0]?.feeCents ?? null;

  return (
    <CartProvider slug={slug}>
      <div
        className="min-h-screen bg-ivory"
        style={
          {
            ["--berry" as string]: store.accentColor || "#d4527a",
          } as React.CSSProperties
        }
      >
        <StoreHeader
          store={store as any}
          categories={categories as any}
          products={products as any}
          minDeliveryFeeCents={minDeliveryFeeCents}
        />
        {children}
        <StoreCartBar storeSlug={store.slug} />
      </div>
    </CartProvider>
  );
}
