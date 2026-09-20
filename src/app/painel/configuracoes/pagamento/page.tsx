import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
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
      })
      .lean(),
  );
  if (!store) redirect("/entrar");

  return (
    <div className="space-y-4">
      <SettingsSectionHeader
        title="Pagamento"
        description="Formas de pagamento e opções de retirada ou entrega."
      />
      <PaymentForm
        store={{
          paymentMethods: store.paymentMethods,
          pickupEnabled: store.pickupEnabled,
          deliveryEnabled: store.deliveryEnabled,
          minAdvanceDays: store.minAdvanceDays,
          productionNote: store.productionNote || "",
        }}
      />
    </div>
  );
}
