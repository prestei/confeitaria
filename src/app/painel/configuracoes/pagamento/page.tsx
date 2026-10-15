import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { maskSecret, storeHasMercadoPago } from "@/lib/mercadopago";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { SettingsSectionHeader } from "@/components/painel/settings-section-header";
import { PaymentAdmin } from "@/components/painel/payment-admin";

export default async function PagamentoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId })
      .select({
        paymentMethods: 1,
        cardBrands: 1,
        mpPublicKey: 1,
        mpAccessToken: 1,
        mpWebhookSecret: 1,
        mpEnabled: 1,
      })
      .lean(),
  );
  if (!store) redirect("/entrar");

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        title="Pagamentos"
        description="Defina como o cliente paga: na entrega ou retirada hoje; pagamento online em breve."
      />
      <PaymentAdmin
        store={{
          paymentMethods: store.paymentMethods,
          cardBrands: store.cardBrands ?? [],
          mpEnabled: store.mpEnabled,
          mpPublicKey: store.mpPublicKey || "",
          mpAccessTokenMasked: maskSecret(store.mpAccessToken),
          mpWebhookSecretMasked: maskSecret(store.mpWebhookSecret),
          mpConfigured: storeHasMercadoPago({
            mpEnabled: store.mpEnabled,
            mpPublicKey: store.mpPublicKey,
            mpAccessToken: store.mpAccessToken,
          }),
        }}
      />
    </div>
  );
}
