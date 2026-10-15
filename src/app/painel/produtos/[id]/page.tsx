import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc, type LeanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Product } from "@/models/Product";
import { ProductForm } from "@/components/painel/product-form";

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

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireStoreSession();
  const { id } = await params;
  const { tab } = await searchParams;
  await connectDB();

  const raw = leanDoc(
    await Product.findOne({ _id: id, storeId: session.storeId }).lean(),
  );
  if (!raw) notFound();

  const product = sortProductEmbeds(raw);

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <ProductForm
      productId={product.id}
      storeSlug={session.storeSlug ?? undefined}
      productSlug={product.slug}
      origin={origin}
      initialTab={tab}
      initial={{
        name: product.name,
        description: product.description || "",
        imageUrl: product.imageUrl || "",
        gallery: (product.gallery || []).join("\n"),
        categoryId: product.categoryId || "",
        productType: product.productType,
        priceMode: product.priceMode,
        price:
          product.priceCents != null
            ? (product.priceCents / 100).toFixed(2).replace(".", ",")
            : "",
        promoPrice:
          product.promoPriceCents != null
            ? (product.promoPriceCents / 100).toFixed(2).replace(".", ",")
            : "",
        availability: product.availability,
        featured: product.featured,
        suggestInCart: Boolean(product.suggestInCart),
        active: product.active,
        trackStock: product.trackStock,
        stockQty: String(product.stockQty),
        stockMin: String(product.stockMin),
        unit: product.unit,
        kitContents: product.kitContents || "",
        minAdvanceDays:
          product.minAdvanceDays != null ? String(product.minAdvanceDays) : "",
        optionGroups: product.optionGroups.map((g: LeanDoc) => ({
          name: g.name,
          required: Boolean(g.required),
          minSelect: String(g.minSelect ?? (g.required ? 1 : 0)),
          maxSelect: String(g.maxSelect ?? 1),
          open: true,
          options: (g.options || []).map((o: LeanDoc) => ({
            name: o.name,
            priceDelta: (o.priceDeltaCents / 100).toFixed(2).replace(".", ","),
          })),
        })),
        addons: (product.addons || []).map((a: LeanDoc) => ({
          name: a.name,
          price: (a.priceCents / 100).toFixed(2).replace(".", ","),
        })),
      }}
    />
  );
}
