import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import { leanDoc, leanList } from "@/lib/serialize";
import { formatBRL } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { Product } from "@/models/Product";
import { PageTitle } from "@/components/painel/page-header";
import { VitrineEditor } from "@/components/painel/vitrine-editor";

export default async function EstabelecimentoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId }).lean(),
  );
  if (!store) redirect("/entrar");

  const products = leanList(
    await Product.find({ storeId: store.id, active: true })
      .sort({ featured: -1, sortOrder: 1 })
      .limit(8)
      .lean(),
  );

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-4 overflow-x-hidden sm:gap-5 md:overflow-visible">
      <header className="shrink-0">
        <Link
          href="/painel/configuracoes"
          className="inline-flex items-start gap-2 text-[var(--painel-brand,#0f352e)] transition hover:opacity-85 sm:items-center"
        >
          <ArrowLeft className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" aria-hidden />
          <PageTitle as="h1" className="text-lg leading-snug sm:text-2xl">
            Estabelecimento
          </PageTitle>
        </Link>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#8C8682] sm:mt-3">
          Configure as informações da sua loja para que seus clientes conheçam o
          seu negócio.
        </p>
      </header>
      <VitrineEditor
        store={{
          slug: store.slug,
          name: store.name,
          tagline: store.tagline,
          description: store.description,
          whatsapp: store.whatsapp,
          whatsappMessage: store.whatsappMessage,
          instagram: store.instagram,
          logoUrl: store.logoUrl,
          coverUrl: store.coverUrl,
          accentColor: store.accentColor,
          secondaryColor: store.secondaryColor,
          typography: store.typography,
          cardStyle: store.cardStyle,
          pageLayout: store.pageLayout,
          businessHours: store.businessHours,
          address: store.address,
          city: store.city,
          isPublished: store.isPublished,
          collectAddress: Boolean(store.collectAddress),
        }}
        origin={origin}
        products={products.map((p) => ({
          name: p.name,
          imageUrl: p.imageUrl,
          featured: p.featured,
          priceLabel:
            p.priceMode === "QUOTE"
              ? "Sob consulta"
              : p.promoPriceCents != null
                ? formatBRL(p.promoPriceCents)
                : formatBRL(p.priceCents),
        }))}
      />
    </div>
  );
}
