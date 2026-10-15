import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { SettingsPageSheet } from "@/components/painel/settings-page-sheet";
import { SchedulingForm } from "@/components/painel/settings-forms";

export default async function AgendamentoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId })
      .select({
        schedulingEnabled: 1,
        minAdvanceDays: 1,
        minAdvanceHours: 1,
        productionNote: 1,
      })
      .lean(),
  );
  if (!store) redirect("/entrar");

  return (
    <SettingsPageSheet title="Agendamento">
      <SchedulingForm
        store={{
          schedulingEnabled: store.schedulingEnabled !== false,
          minAdvanceDays: store.minAdvanceDays ?? 0,
          minAdvanceHours: store.minAdvanceHours ?? 0,
          productionNote: store.productionNote || "",
        }}
      />
    </SettingsPageSheet>
  );
}
