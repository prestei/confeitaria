import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StoreSettingsForm } from "@/components/painel/store-settings-form";

export default async function StoreSettingsPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/entrar");

  const store = await prisma.store.findUnique({
    where: { id: session.user.storeId },
  });
  if (!store) redirect("/entrar");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-cocoa">Minha loja</h1>
        <p className="mt-2 text-cocoa-soft/75">
          Personalize a vitrine, WhatsApp e regras de encomenda.
        </p>
      </div>
      <StoreSettingsForm store={store} />
    </div>
  );
}
