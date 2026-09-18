import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { CategoriesAdmin } from "@/components/painel/categories-admin";

export default async function CategoriasPage() {
  const session = await requireStoreSession();
  const categories = await prisma.category.findMany({
    where: { storeId: session.storeId },
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <CategoriesAdmin
      initialCategories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
