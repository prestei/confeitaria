import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { SettingsPageSheet } from "@/components/painel/settings-page-sheet";
import { AttendanceForm } from "@/components/painel/settings-forms";

export default async function AtendimentoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId })
      .select({
        pickupEnabled: 1,
        deliveryEnabled: 1,
        deliveryFeeCents: 1,
        pickupInstructions: 1,
        deliveryInstructions: 1,
        autoDeductStock: 1,
      })
      .lean(),
  );
  if (!store) redirect("/entrar");

  return (
    <SettingsPageSheet title="Retirada e entrega" size="lg">
      <AttendanceForm
        store={{
          pickupEnabled: store.pickupEnabled !== false,
          deliveryEnabled: store.deliveryEnabled !== false,
          deliveryFeeCents: store.deliveryFeeCents,
          pickupInstructions: store.pickupInstructions || "",
          deliveryInstructions: store.deliveryInstructions || "",
          autoDeductStock: store.autoDeductStock === true,
        }}
      />
    </SettingsPageSheet>
  );
}
