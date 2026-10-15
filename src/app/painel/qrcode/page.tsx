import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { QrCodePanel } from "@/components/painel/qr-code-panel";
import { PageHeader, PageShell } from "@/components/painel/page-header";

export default async function QrCodePage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/entrar");

  await connectDB();
  const store = leanDoc(
    await Store.findOne({ _id: session.user.storeId }).lean(),
  );
  if (!store) redirect("/entrar");

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const publicUrl = `${origin}/${store.slug}`;

  return (
    <PageShell>
      <PageHeader
        title="QR Code da vitrine"
        description="Personalize o cartão com o nome da loja e baixe o QR da sua página para Instagram, cartões, embalagens e mesas."
      />
      <QrCodePanel
        publicUrl={publicUrl}
        storeName={store.name}
        storeSlug={store.slug}
        tagline={store.tagline}
        city={store.city}
        instagram={store.instagram}
        logoUrl={store.logoUrl}
        accentColor={store.accentColor}
      />
    </PageShell>
  );
}
