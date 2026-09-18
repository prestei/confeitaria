import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/utils";
import { requireStoreSession } from "@/lib/tenant";
import { PageHeader } from "@/components/painel/page-header";
import { VitrineEditor } from "@/components/painel/vitrine-editor";

export default async function VitrinePage() {
  const session = await requireStoreSession();
  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
  });
  if (!store) redirect("/entrar");

  const products = await prisma.product.findMany({
    where: { storeId: store.id, active: true },
    orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    take: 8,
  });

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Minha vitrine"
        description="Configure a identidade e a aparência da sua loja digital. Cadastre uma vez e reutilize em todos os canais."
      />
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
