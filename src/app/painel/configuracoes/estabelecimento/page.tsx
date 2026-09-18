import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { SettingsSectionHeader } from "@/components/painel/settings-section-header";
import { EstablishmentForm } from "@/components/painel/settings-forms";

export default async function EstabelecimentoPage() {
  const session = await requireStoreSession();
  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
  });
  if (!store) redirect("/entrar");

  return (
    <div className="space-y-4">
      <SettingsSectionHeader
        title="Estabelecimento"
        description="Dados da loja exibidos na vitrine e nos pedidos."
      />
      <EstablishmentForm
        store={{
          name: store.name,
          description: store.description || "",
          logoUrl: store.logoUrl || "",
          whatsapp: store.whatsapp,
          address: store.address || "",
          city: store.city || "",
        }}
      />
    </div>
  );
}
