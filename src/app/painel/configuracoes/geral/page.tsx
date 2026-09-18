import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { SettingsSectionHeader } from "@/components/painel/settings-section-header";
import {
  AccountForm,
  NotificationsForm,
  PlanCard,
} from "@/components/painel/settings-forms";

export default async function GeralPage() {
  const session = await requireStoreSession();
  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    include: { user: true },
  });
  if (!store) redirect("/entrar");

  return (
    <div className="space-y-4">
      <SettingsSectionHeader
        title="Configurações gerais"
        description="Conta, notificações e plano da assinatura."
      />
      <div className="space-y-4">
        <AccountForm
          user={{
            name: store.user.name,
            email: store.user.email,
            phone: store.user.phone || "",
          }}
        />
        <NotificationsForm
          store={{
            notifyNewOrders: store.notifyNewOrders,
            notifyLowStock: store.notifyLowStock,
            notifyNewCustomers: store.notifyNewCustomers,
          }}
        />
        <PlanCard plan={store.plan} />
      </div>
    </div>
  );
}
