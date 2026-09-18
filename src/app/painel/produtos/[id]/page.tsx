import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { ProductForm } from "@/components/painel/product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireStoreSession();
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, storeId: session.storeId },
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
    <ProductForm
      productId={product.id}
      initial={{
        name: product.name,
        description: product.description || "",
        imageUrl: product.imageUrl || "",
        gallery: product.gallery.join("\n"),
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
        optionGroups: product.optionGroups.map((g) => ({
          name: g.name,
          options: g.options.map((o) => ({
            name: o.name,
            priceDelta: (o.priceDeltaCents / 100).toFixed(2).replace(".", ","),
          })),
        })),
        addons: product.addons.map((a) => ({
          name: a.name,
          price: (a.priceCents / 100).toFixed(2).replace(".", ","),
        })),
      }}
    />
  );
}
