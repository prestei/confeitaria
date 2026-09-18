import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { PageHeader } from "@/components/painel/page-header";
import { SettingsHub } from "@/components/painel/settings-hub";

export default async function ConfiguracoesPage() {
  const session = await requireStoreSession();
  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    select: {
      name: true,
      slug: true,
      plan: true,
      isPublished: true,
      businessHours: true,
      address: true,
      paymentMethods: true,
    },
  });
  if (!store) redirect("/entrar");

  const planLabel =
    store.plan === "pro"
      ? "Pro"
      : store.plan === "business"
        ? "Business"
        : "Starter";

  return (
    <div className="space-y-4">
      <PageHeader
        title="Configurações"
        description="Organize horários, dados da loja, pagamento e preferências da conta."
      />
      <SettingsHub
        status={{
          storeName: store.name,
          planLabel,
          isPublished: store.isPublished,
          hasHours: Boolean(store.businessHours?.trim()),
          hasAddress: Boolean(store.address?.trim()),
          paymentCount: store.paymentMethods.length,
          storeSlug: store.slug,
        }}
      />
    </div>
  );
}
