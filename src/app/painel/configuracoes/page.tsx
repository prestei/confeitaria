import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageTitle } from "@/components/painel/page-header";
import { SettingsHub } from "@/components/painel/settings-hub";

export default async function ConfiguracoesPage() {
  const session = await requireStoreSession();
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ _id: session.storeId })
      .select({
        name: 1,
        slug: 1,
        plan: 1,
        isPublished: 1,
      })
      .lean(),
  );
  if (!store) redirect("/entrar");

  const planLabel =
    store.plan === "pro"
      ? "Pro"
      : store.plan === "business"
        ? "Business"
        : "Starter";

  return (
    <div className="space-y-4 sm:space-y-5">
      <header className="shrink-0">
        <Link
          href="/painel"
          className="inline-flex items-start gap-2 text-[var(--painel-brand,#0f352e)] transition hover:opacity-85 sm:items-center"
        >
          <ArrowLeft className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" aria-hidden />
          <PageTitle as="h1" className="text-lg leading-snug sm:text-2xl">
            Configurações
          </PageTitle>
        </Link>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--painel-muted,#6b7280)] sm:mt-3">
          Horários, dados da loja, atendimento e preferências da conta.
        </p>
      </header>
      <SettingsHub
        status={{
          storeName: store.name,
          planLabel,
          isPublished: store.isPublished,
          storeSlug: store.slug,
        }}
      />
    </div>
  );
}
