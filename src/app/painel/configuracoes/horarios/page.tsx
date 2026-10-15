import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { SettingsPageSheet } from "@/components/painel/settings-page-sheet";
import { HoursForm } from "@/components/painel/settings-forms";

export default async function HorariosPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId })
      .select({ businessHours: 1 })
      .lean(),
  );
  if (!store) redirect("/entrar");

  return (
    <SettingsPageSheet title="Horários">
      <HoursForm businessHours={store.businessHours || ""} />
    </SettingsPageSheet>
  );
}
