import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { User } from "@/models/User";
import { SettingsSectionHeader } from "@/components/painel/settings-section-header";
import {
  AccountForm,
  NotificationsForm,
  PlanCard,
} from "@/components/painel/settings-forms";

export default async function GeralPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId }).lean(),
  );
  if (!store) redirect("/entrar");

  const user = leanDoc(await User.findOne({ _id: store.userId }).lean());
  if (!user) redirect("/entrar");

  return (
    <div className="space-y-4">
      <SettingsSectionHeader
        title="Configurações gerais"
        description="Conta, notificações e plano da assinatura."
      />
      <div className="space-y-4">
        <AccountForm
          user={{
            name: user.name,
            email: user.email,
            phone: user.phone || "",
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
