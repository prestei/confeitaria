import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductConfigurator } from "@/components/store/product-configurator";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store || !store.isPublished) notFound();

  const product = await prisma.product.findFirst({
    where: { storeId: store.id, slug: productSlug, active: true },
    include: {
      optionGroups: {
        include: { options: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      addons: true,
    },
  });
  if (!product) notFound();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <ProductConfigurator
        storeSlug={store.slug}
        product={product}
        minAdvanceDays={store.minAdvanceDays}
      />
    </main>
  );
}
