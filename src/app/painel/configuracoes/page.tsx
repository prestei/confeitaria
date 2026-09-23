import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { storeHasMercadoPago } from "@/lib/mercadopago";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { PageHeader } from "@/components/painel/page-header";
import { SettingsHub } from "@/components/painel/settings-hub";

export default async function ConfiguracoesPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId })
      .select({
        name: 1,
        slug: 1,
        plan: 1,
        isPublished: 1,
        businessHours: 1,
        address: 1,
        paymentMethods: 1,
        mpEnabled: 1,
        mpPublicKey: 1,
        mpAccessToken: 1,
      })
      .lean(),
  );
  if (!store) redirect("/entrar");

  const planLabel =
    store.plan === "pro"
      ? "Pro"
      : store.plan === "business"
        ? "Business"
        : "Starter";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Configurações"
        description="Organize horários, cores do cardápio, dados da loja, pagamento e preferências da conta."
      />
      <SettingsHub
        status={{
          storeName: store.name,
          planLabel,
          isPublished: store.isPublished,
          hasHours: Boolean(store.businessHours?.trim()),
          hasAddress: Boolean(store.address?.trim()),
          paymentCount: store.paymentMethods.length,
          mpConfigured: storeHasMercadoPago({
            mpEnabled: store.mpEnabled,
            mpPublicKey: store.mpPublicKey,
            mpAccessToken: store.mpAccessToken,
          }),
          storeSlug: store.slug,
        }}
      />
    </div>
  );
}
