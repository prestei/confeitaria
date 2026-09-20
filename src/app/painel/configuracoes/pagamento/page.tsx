import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { maskSecret, storeHasMercadoPago } from "@/lib/mercadopago";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { SettingsSectionHeader } from "@/components/painel/settings-section-header";
import { PaymentForm } from "@/components/painel/settings-forms";

export default async function PagamentoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId })
      .select({
        paymentMethods: 1,
        pickupEnabled: 1,
        deliveryEnabled: 1,
        minAdvanceDays: 1,
        productionNote: 1,
        mpPublicKey: 1,
        mpAccessToken: 1,
        mpWebhookSecret: 1,
        mpEnabled: 1,
        autoDeductStock: 1,
      })
      .lean(),
  );
  if (!store) redirect("/entrar");

  return (
    <div className="space-y-6">
      <SettingsSectionHeader
        title="Pagamento"
        description="Mercado Pago no checkout; Pix e sinal (50%) pelo WhatsApp."
      />
      <PaymentForm
        store={{
          paymentMethods: store.paymentMethods,
          pickupEnabled: store.pickupEnabled,
          deliveryEnabled: store.deliveryEnabled,
          minAdvanceDays: store.minAdvanceDays,
          productionNote: store.productionNote || "",
          mpEnabled: store.mpEnabled,
          mpPublicKey: store.mpPublicKey || "",
          mpAccessTokenMasked: maskSecret(store.mpAccessToken),
          mpWebhookSecretMasked: maskSecret(store.mpWebhookSecret),
          mpConfigured: storeHasMercadoPago({
            mpEnabled: store.mpEnabled,
            mpPublicKey: store.mpPublicKey,
            mpAccessToken: store.mpAccessToken,
          }),
          autoDeductStock: store.autoDeductStock !== false,
        }}
      />
    </div>
  );
}
