import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/store/checkout-form";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: { deliveryZones: true },
  });
  if (!store || !store.isPublished) notFound();

  return (
    <main className="px-5 py-10">
      <CheckoutForm store={store} />
    </main>
  );
}
