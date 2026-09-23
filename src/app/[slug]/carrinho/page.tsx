import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { storeHasMercadoPago } from "@/lib/mercadopago";
import { CheckoutForm } from "@/components/store/checkout-form";

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
      <CheckoutForm
        store={{
          slug: store.slug,
          name: store.name,
          pickupEnabled: store.pickupEnabled,
          deliveryEnabled: store.deliveryEnabled,
          paymentMethods: store.paymentMethods,
          minAdvanceDays: store.minAdvanceDays,
          deliveryZones: (store.deliveryZones || []).map(
            (z: { name: string; feeCents: number }) => ({
              name: z.name,
              feeCents: z.feeCents,
            }),
          ),
          mpOnlineEnabled: storeHasMercadoPago({
            mpEnabled: Boolean(store.mpEnabled),
            mpPublicKey: store.mpPublicKey ?? null,
            mpAccessToken: store.mpAccessToken ?? null,
          }),
          businessHours: store.businessHours,
        }}
      />
    </main>
  );
}
