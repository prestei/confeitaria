import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { CartProvider } from "@/components/cart/cart-context";
import { StoreCartBar } from "@/components/store/store-cart-bar";
import { VitrineTopbar } from "@/components/store/vitrine-topbar";

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
        <VitrineTopbar store={{ slug: store.slug, name: store.name }} />
        {children}
        <StoreCartBar storeSlug={store.slug} />
      </div>
    </CartProvider>
  );
}
