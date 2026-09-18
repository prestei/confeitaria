import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CustomOrderWizard } from "@/components/store/custom-order-wizard";

export const dynamic = "force-dynamic";

export default async function EncomendaPage({
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
    <main className="mx-auto max-w-6xl px-5 py-10 pb-20">
      <div className="mb-8 max-w-2xl">
        <Link
          href={`/${store.slug}`}
          className="text-sm font-medium text-berry-deep hover:underline"
        >
          ← Voltar ao cardápio
        </Link>
        <h1 className="mt-4 font-display text-4xl text-cocoa sm:text-5xl">
          Encomenda personalizada
        </h1>
        <p className="mt-3 text-cocoa-soft/80">
          Conte o que você precisa em poucos passos. Enviamos tudo organizado
          para o WhatsApp de {store.name}.
        </p>
      </div>
      <CustomOrderWizard store={store} />
    </main>
  );
}
