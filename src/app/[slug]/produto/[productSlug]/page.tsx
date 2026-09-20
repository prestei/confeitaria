import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc, type LeanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { Product } from "@/models/Product";
import { ProductConfigurator } from "@/components/store/product-configurator";

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

  const product = sortProductEmbeds(raw);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <ProductConfigurator
        storeSlug={store.slug}
        product={product as any}
        minAdvanceDays={store.minAdvanceDays}
      />
    </main>
  );
}
