import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { PageTitle } from "@/components/painel/page-header";
import {
  SchedulingForm,
  SchedulingPromoBanner,
} from "@/components/painel/scheduling-form";

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
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-4 pb-4 sm:gap-5 sm:pb-4">
      <header className="flex shrink-0 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            href="/painel/configuracoes"
            className="inline-flex max-w-full items-start gap-1.5 text-[var(--painel-brand,#0f352e)] transition hover:opacity-85 sm:items-center sm:gap-2"
          >
            <ArrowLeft
              className="mt-0.5 h-4 w-4 shrink-0 sm:mt-0 sm:h-5 sm:w-5"
              aria-hidden
            />
            <PageTitle as="h1" className="text-lg leading-snug sm:text-2xl">
              Agendamento
            </PageTitle>
          </Link>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[#8C8682] sm:mt-2 sm:text-sm">
            Defina as regras de agendamento para seus pedidos e organize melhor
            a sua rotina.
          </p>
        </div>
        <SchedulingPromoBanner />
      </header>
      <SchedulingForm
        store={{
          schedulingEnabled: store.schedulingEnabled !== false,
          minAdvanceDays: store.minAdvanceDays ?? 0,
          minAdvanceHours: store.minAdvanceHours ?? 0,
          productionNote: store.productionNote || "",
        }}
      />
    </div>
  );
}
