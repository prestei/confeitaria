import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CartProvider } from "@/components/cart/cart-context";
import { StoreHeader } from "@/components/store/store-header";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" },
        select: { slug: true, name: true, emoji: true },
      },
      products: {
        where: { active: true },
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      },
      deliveryZones: {
        select: { feeCents: true },
        orderBy: { feeCents: "asc" },
        take: 1,
      },
    },
  });
  if (!store || !store.isPublished) notFound();

  const minDeliveryFeeCents = store.deliveryZones[0]?.feeCents ?? null;

  return (
    <CartProvider slug={slug}>
      <div
        className="bg-atelier bg-grain min-h-screen"
        style={
          {
            ["--berry" as string]: store.accentColor || "#d4527a",
          } as React.CSSProperties
        }
      >
        <StoreHeader
          store={store}
          categories={store.categories}
          products={store.products}
          minDeliveryFeeCents={minDeliveryFeeCents}
        />
        {children}
      </div>
    </CartProvider>
  );
}
