import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QrCodePanel } from "@/components/painel/qr-code-panel";
import { PageHeader, PageShell } from "@/components/painel/page-header";

export default async function QrCodePage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/entrar");

  const store = await prisma.store.findUnique({
    where: { id: session.user.storeId },
  });
  if (!store) redirect("/entrar");

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const publicUrl = `${origin}/${store.slug}`;

  return (
    <PageShell>
      <PageHeader
        title="QR Code do cardápio"
        description="Gere e baixe o QR Code da sua loja para Instagram, cartões, embalagens e mesas."
      />
      <QrCodePanel
        publicUrl={publicUrl}
        storeName={store.name}
        storeSlug={store.slug}
      />
    </PageShell>
  );
}
