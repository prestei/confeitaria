import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc, leanList } from "@/lib/serialize";
import { formatBRL } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { Product } from "@/models/Product";
import { PageHeader } from "@/components/painel/page-header";
import { VitrineEditor } from "@/components/painel/vitrine-editor";

export default async function VitrinePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
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
  const { tab } = await searchParams;
  const initialTab = tab === "appearance" ? "appearance" : "identity";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Perfil da loja"
        description="Tagline, Instagram, publicação da vitrine, mensagem do WhatsApp e identidade pública. Use a aba Cores e aparência para o visual do cardápio."
      />
      <VitrineEditor
        initialTab={initialTab}
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
          themeColors: store.themeColors,
          typography: store.typography,
          cardStyle: store.cardStyle,
          pageLayout: store.pageLayout,
          businessHours: store.businessHours,
          address: store.address,
          city: store.city,
          isPublished: store.isPublished,
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
