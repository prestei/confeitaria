import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QrCodePanel } from "@/components/painel/qr-code-panel";

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
    <div className="space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blush px-3 py-1 text-sm font-semibold text-berry-deep">
          <QrCode className="h-4 w-4" aria-hidden />
          Divulgação
        </div>
        <h1 className="font-display text-3xl text-cocoa sm:text-4xl">
          QR Code do cardápio
        </h1>
        <p className="mt-2 max-w-2xl text-cocoa-soft/75">
          Gere e baixe o QR Code da sua loja para Instagram, cartões, embalagens
          e mesas. Ao escanear, o cliente abre seu cardápio online.
        </p>
      </div>

      <QrCodePanel
        publicUrl={publicUrl}
        storeName={store.name}
        storeSlug={store.slug}
      />
    </div>
  );
}
