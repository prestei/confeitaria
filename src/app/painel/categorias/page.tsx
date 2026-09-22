import { connectDB } from "@/lib/db";
import { normalizeDisplayDays } from "@/lib/category";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { CategoriesAdmin } from "@/components/painel/categories-admin";

export default async function CategoriasPage() {
  const session = await requireStoreSession();
  await connectDB();

  const categories = leanList(
    await Category.find({ storeId: session.storeId })
      .sort({ sortOrder: 1 })
      .lean(),
  );

  const counts = await Product.aggregate<{ _id: string | null; count: number }>([
    { $match: { storeId: session.storeId } },
    { $group: { _id: "$categoryId", count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    counts.map((c) => [c._id ?? "", c.count]),
  );

  const withCount = categories.map((c) => ({
    ...c,
    discountPercent: c.discountPercent ?? 0,
    surchargePercent: c.surchargePercent ?? 0,
    displayDays: normalizeDisplayDays(c.displayDays),
    _count: { products: countMap[c.id] || 0 },
  }));

  return (
    <CategoriesAdmin
      initialCategories={JSON.parse(JSON.stringify(withCount))}
    />
  );
}
