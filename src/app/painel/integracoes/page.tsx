import Link from "next/link";
import { redirect } from "next/navigation";
import { ImageIcon, MessageCircle, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { PageHeader, SectionCard } from "@/components/painel/page-header";
import { WhatsAppIntegrationForm } from "@/components/painel/whatsapp-integration-form";
import { InstagramContentTool } from "@/components/painel/instagram-content-tool";

export default async function IntegracoesPage() {
  const session = await requireStoreSession();
  const store = await prisma.store.findUnique({
    where: { id: session.storeId },
    include: { integrations: true },
  });
  if (!store) redirect("/entrar");

  const products = await prisma.product.findMany({
    where: { storeId: store.id, active: true },
    orderBy: { name: "asc" },
    take: 50,
  });

  const wa = store.integrations.find((i) => i.provider === "WHATSAPP");
  const ig = store.integrations.find((i) => i.provider === "INSTAGRAM");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Integrações"
        description="Cadastre uma vez na vitrine e reutilize em WhatsApp, Instagram e outros canais."
      />

      <SectionCard>
        <div className="flex flex-wrap items-start gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#128C7E]">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-cocoa">WhatsApp</h2>
              <span className="rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success">
                {store.whatsapp ? "Conectado" : "Pendente"}
              </span>
            </div>
            <p className="mt-1 text-sm text-cocoa-soft/70">
              Número, mensagem automática e atalho para pedidos.
            </p>
            <div className="mt-4">
              <WhatsAppIntegrationForm
                whatsapp={store.whatsapp}
                message={store.whatsappMessage || ""}
                status={wa?.status || (store.whatsapp ? "CONNECTED" : "DISCONNECTED")}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="flex flex-wrap items-start gap-4 p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fog text-cocoa">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-cocoa">Instagram</h2>
              <span className="rounded-md bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning">
                Em desenvolvimento
              </span>
            </div>
            <p className="mt-1 text-sm text-cocoa-soft/70">
              Em breve: publicar no catálogo e sincronizar produtos. Por enquanto,
              gere conteúdo a partir do cadastro que você já tem.
            </p>
            {store.instagram && (
              <p className="mt-2 text-xs text-cocoa-soft/55">
                Perfil informado: {store.instagram}
              </p>
            )}
            <p className="mt-2 text-xs text-cocoa-soft/50">
              Status da integração oficial:{" "}
              {ig?.status === "COMING_SOON" || !ig
                ? "ainda não disponível"
                : ig.status}
            </p>
            <Link
              href="/painel/vitrine"
              className="mt-3 inline-block text-sm font-medium text-berry-deep hover:underline"
            >
              Atualizar Instagram na vitrine
            </Link>
          </div>
        </div>
      </SectionCard>

      <SectionCard>
        <div className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-berry" />
            <h2 className="text-sm font-semibold text-cocoa">
              Conteúdo para Instagram
            </h2>
          </div>
          <p className="mb-4 text-sm text-cocoa-soft/70">
            Selecione um produto e gere legenda, CTA e link — reaproveitando o
            cadastro da vitrine.
          </p>
          <InstagramContentTool
            products={products.map((p) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              priceCents: p.priceCents,
              promoPriceCents: p.promoPriceCents,
              slug: p.slug,
              imageUrl: p.imageUrl,
            }))}
            storeSlug={store.slug}
            storeName={store.name}
          />
        </div>
      </SectionCard>
    </div>
  );
}
