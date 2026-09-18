import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { SettingsSectionHeader } from "@/components/painel/settings-section-header";
import { PaymentForm } from "@/components/painel/settings-forms";

export default async function PagamentoPage() {
  const session = await requireStoreSession();
  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    select: {
      paymentMethods: true,
      pickupEnabled: true,
      deliveryEnabled: true,
      minAdvanceDays: true,
      productionNote: true,
    },
  });
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
