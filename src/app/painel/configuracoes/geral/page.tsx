import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { User } from "@/models/User";
import { PageTitle } from "@/components/painel/page-header";
import { GeneralSettingsForm } from "@/components/painel/general-settings-form";

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
    <div className="w-full max-w-none space-y-4 pb-2 sm:space-y-5 sm:pb-4">
      <header className="shrink-0">
        <Link
          href="/painel/configuracoes"
          className="inline-flex max-w-full items-center gap-1.5 text-[var(--painel-brand,#0f352e)] transition hover:opacity-85 sm:gap-2"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
          <PageTitle as="h1" className="text-lg leading-snug sm:text-2xl">
            Configurações gerais
          </PageTitle>
        </Link>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[#8C8682] sm:mt-2 sm:text-sm">
          Configure as informações básicas da sua loja e preferências de
          funcionamento.
        </p>
      </header>
      <GeneralSettingsForm
        store={{
          name: store.name || "",
          description: store.description || "",
          logoUrl: store.logoUrl || "",
          coverUrl: store.coverUrl || "",
          address: store.address || "",
          businessHours: store.businessHours || "",
          plan: store.plan || "starter",
          notifyNewOrders: store.notifyNewOrders,
          notifyLowStock: store.notifyLowStock,
          notifyNewCustomers: store.notifyNewCustomers,
          notifyViaEmail: store.notifyViaEmail !== false,
          notifyViaWhatsApp: store.notifyViaWhatsApp !== false,
        }}
        user={{
          email: user.email,
          phone: user.phone || "",
        }}
      />
    </div>
  );
}
