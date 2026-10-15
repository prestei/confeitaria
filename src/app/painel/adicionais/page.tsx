import { connectDB } from "@/lib/db";
import { leanList } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { CatalogAddon } from "@/models/Addon";
import { Category } from "@/models/Category";
import { AddonsAdmin } from "@/components/painel/addons-admin";

export default async function AdicionaisPage() {
  const session = await requireStoreSession();
  await connectDB();

  const [addons, categories] = await Promise.all([
    leanList(
      await CatalogAddon.find({ storeId: session.storeId })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ),
    leanList(
      await Category.find({ storeId: session.storeId })
        .sort({ sortOrder: 1 })
        .select({ name: 1 })
        .lean(),
    ),
  ]);

  return (
    <AddonsAdmin
      initialItems={JSON.parse(JSON.stringify(addons))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
