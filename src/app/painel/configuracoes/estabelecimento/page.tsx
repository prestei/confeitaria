import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { SettingsSectionHeader } from "@/components/painel/settings-section-header";
import { EstablishmentForm } from "@/components/painel/settings-forms";

export default async function EstabelecimentoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId }).lean(),
  );
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
          coverUrl: store.coverUrl || "",
          whatsapp: store.whatsapp,
          address: store.address || "",
          city: store.city || "",
        }}
      />
    </div>
  );
}
