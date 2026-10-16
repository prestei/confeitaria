import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { PageTitle } from "@/components/painel/page-header";
import {
  AttendanceForm,
  AttendancePromoBanner,
} from "@/components/painel/attendance-form";

export default async function AtendimentoPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId })
      .select({
        name: 1,
        whatsapp: 1,
        address: 1,
        city: 1,
        businessHours: 1,
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
    <div className="w-full max-w-none space-y-4 pb-2 sm:space-y-5 sm:pb-4">
      <header className="flex shrink-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/painel/configuracoes"
            className="inline-flex max-w-full items-start gap-1.5 text-[var(--painel-brand,#0f352e)] transition hover:opacity-85 sm:items-center sm:gap-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
            <PageTitle as="h1" className="text-lg leading-snug sm:text-2xl">
              Retirada e entrega
            </PageTitle>
          </Link>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[#8C8682] sm:mt-2 sm:text-sm">
            Configure as modalidades de atendimento, endereço de retirada e
            instruções exibidas na vitrine e no pedido pelo WhatsApp.
          </p>
        </div>
        <AttendancePromoBanner />
      </header>
      <AttendanceForm
        store={{
          name: store.name || "",
          whatsapp: store.whatsapp || "",
          address: store.address || "",
          city: store.city || "",
          businessHours: store.businessHours || "",
          pickupEnabled: store.pickupEnabled !== false,
          deliveryEnabled: store.deliveryEnabled !== false,
          deliveryFeeCents: store.deliveryFeeCents,
          pickupInstructions: store.pickupInstructions || "",
          deliveryInstructions: store.deliveryInstructions || "",
          autoDeductStock: store.autoDeductStock === true,
        }}
      />
    </div>
  );
}
