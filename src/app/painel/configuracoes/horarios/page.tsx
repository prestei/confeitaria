import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { PageTitle } from "@/components/painel/page-header";
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
    <div className="flex min-h-0 w-full max-w-none flex-1 flex-col gap-4 pb-4 sm:gap-5">
      <header className="shrink-0">
        <Link
          href="/painel/configuracoes"
          className="inline-flex max-w-full items-center gap-1.5 text-[var(--painel-brand,#0f352e)] transition hover:opacity-85 sm:gap-2"
        >
          <ArrowLeft className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" aria-hidden />
          <PageTitle as="h1" className="text-lg leading-snug sm:text-2xl">
            Horário de funcionamento
          </PageTitle>
        </Link>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#8C8682] sm:mt-2 sm:text-sm">
          Defina os dias e horários em que sua loja atende e exiba essas
          informações para seus clientes na sua vitrine.
        </p>
      </header>
      <HoursForm businessHours={store.businessHours || ""} />
    </div>
  );
}
