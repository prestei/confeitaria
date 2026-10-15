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
import { StoreAnalyticsBeacon } from "@/components/store/store-analytics-beacon";
import { StoreThemeRoot } from "@/components/store/store-theme-root";
import { getStoreOpenStatus } from "@/lib/hours";
import { resolveStoreTheme } from "@/lib/store-theme";

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
  const openStatus = getStoreOpenStatus(store.businessHours);
  const storeClosed = openStatus.scheduled && !openStatus.open;

  const theme = resolveStoreTheme(store);

  return (
    <CartProvider slug={slug}>
      <StoreThemeRoot
        slug={store.slug}
        initial={{
          accentColor: store.accentColor,
          secondaryColor: store.secondaryColor,
          themeColors: theme,
        }}
        appearance={{
          typography: store.typography,
          cardStyle: store.cardStyle,
          pageLayout: store.pageLayout,
        }}
      >
        <StoreAnalyticsBeacon storeSlug={store.slug} />
        <StoreHeader
          store={store as any}
          categories={categories as any}
          products={products as any}
          minDeliveryFeeCents={minDeliveryFeeCents}
        />
        {storeClosed && (
          <div className="border-b border-rosewood/20 bg-sand px-4 py-2.5 text-center text-sm text-rosewood">
            Loja fechada no momento
            {openStatus.todayLabel ? ` (${openStatus.todayLabel})` : ""}.
            Pedidos só são aceitos no horário de funcionamento.
          </div>
        )}
        {children}
        <StoreCartBar storeSlug={store.slug} />
      </StoreThemeRoot>
    </CartProvider>
  );
}
