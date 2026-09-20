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
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStoreSession();
  const { id } = await params;
  await connectDB();

  const raw = leanDoc(
    await Product.findOne({ _id: id, storeId: session.storeId }).lean(),
  );
  if (!raw) notFound();

  const product = sortProductEmbeds(raw);

  return (
    <ProductForm
      productId={product.id}
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
        active: product.active,
        trackStock: product.trackStock,
        stockQty: String(product.stockQty),
        stockMin: String(product.stockMin),
        unit: product.unit,
        optionGroups: product.optionGroups.map((g: any) => ({
          name: g.name,
          options: g.options.map((o: any) => ({
            name: o.name,
            priceDelta: (o.priceDeltaCents / 100).toFixed(2).replace(".", ","),
          })),
        })),
        addons: (product.addons || []).map((a: any) => ({
          name: a.name,
          price: (a.priceCents / 100).toFixed(2).replace(".", ","),
        })),
      }}
    />
  );
}
