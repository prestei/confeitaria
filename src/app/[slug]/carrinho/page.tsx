import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { VitrineCheckout } from "@/components/store/vitrine-checkout";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ slug, isPublished: true }).lean(),
  );
  if (!store) notFound();

  return (
    <main className="bg-ivory">
      <VitrineCheckout
        store={{
          slug: store.slug,
          collectAddress: Boolean(store.collectAddress),
          pickupEnabled: store.pickupEnabled !== false,
          deliveryEnabled: store.deliveryEnabled !== false,
          deliveryFeeCents: store.deliveryFeeCents ?? 0,
          schedulingEnabled: store.schedulingEnabled !== false,
          minAdvanceDays: store.minAdvanceDays ?? 0,
          productionNote: store.productionNote,
        }}
      />
    </main>
  );
}
