import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { SettingsSectionHeader } from "@/components/painel/settings-section-header";
import { HoursForm } from "@/components/painel/settings-forms";

export default async function HorariosPage() {
  const session = await requireStoreSession();
  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    select: { businessHours: true },
  });
  if (!store) redirect("/entrar");

  return (
    <div className="space-y-4">
      <SettingsSectionHeader
        title="Horários"
        description="Defina o horário de funcionamento da confeitaria."
      />
      <HoursForm businessHours={store.businessHours || ""} />
    </div>
  );
}
