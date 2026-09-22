import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import ProductsAdmin from "@/components/painel/products-admin";

export default async function ProductsPage() {
  const session = await requireStoreSession();
  await connectDB();

  const [products, categories] = await Promise.all([
    leanList(
      await Product.find({ storeId: session.storeId })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ),
    leanList(
      await Category.find({ storeId: session.storeId })
        .sort({ sortOrder: 1 })
        .lean(),
    ),
  ]);

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const withCategory = products.map((p) => ({
    ...p,
    category: p.categoryId ? catMap[p.categoryId] ?? null : null,
  }));

  return (
    <ProductsAdmin
      initialProducts={JSON.parse(JSON.stringify(withCategory))}
    />
  );
}
