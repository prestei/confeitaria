import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import ProductsAdmin from "@/components/painel/products-admin";

export default async function ProductsPage() {
  const session = await requireStoreSession();
  const products = await prisma.product.findMany({
    where: { storeId: session.storeId },
    include: {
      category: true,
      optionGroups: { include: { options: true }, orderBy: { sortOrder: "asc" } },
      addons: true,
    },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <ProductsAdmin
      initialProducts={JSON.parse(JSON.stringify(products))}
    />
  );
}
