import Link from "next/link";
import { startOfMonth } from "date-fns";
import { Calculator, PackagePlus } from "lucide-react";
import { connectDB } from "@/lib/db";
import { requireStoreSession } from "@/lib/tenant";
import { Store } from "@/models/Store";
import { Product } from "@/models/Product";
import { PricingCalculation } from "@/models/PricingCalculation";
import { leanDoc, leanList } from "@/lib/serialize";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";
import { OverviewLinkCard } from "@/components/painel/overview-link-card";
import { PainelVitrinePreview } from "@/components/painel/painel-vitrine-preview";

function greetingForHour(hour: number) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function PainelPage() {
  const session = await requireStoreSession();
  await connectDB();
  const storeId = session.storeId;
  const firstName =
    (session.name || "").split(" ").filter(Boolean)[0] || "Confeiteira";

  const store = leanDoc(await Store.findOne({ _id: storeId }).lean());
  if (!store) return null;

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const base = origin.replace(/\/$/, "");
  const publicUrl = `${base}/${store.slug}`;
  const displayHost = publicUrl.replace(/^https?:\/\//, "");

  const monthStart = startOfMonth(new Date());

  const [
    productTotal,
    trackedCount,
    outOfStockCount,
    newProductsMonth,
    newTrackedMonth,
    featured,
    recentPricing,
  ] = await Promise.all([
    Product.countDocuments({ storeId, active: true }),
    Product.countDocuments({ storeId, trackStock: true, active: true }),
    Product.countDocuments({
      storeId,
      active: true,
      trackStock: true,
      stockQty: { $lte: 0 },
    }),
    Product.countDocuments({ storeId, createdAt: { $gte: monthStart } }),
    Product.countDocuments({
      storeId,
      trackStock: true,
      createdAt: { $gte: monthStart },
    }),
    leanList(
      await Product.find({ storeId, active: true, featured: true })
        .sort({ sortOrder: 1, name: 1 })
        .limit(4)
        .lean(),
    ),
    leanList(
      await PricingCalculation.find({ storeId })
        .sort({ updatedAt: -1 })
        .limit(4)
        .lean(),
    ),
  ]);

  const published = store.isPublished;
  const hour = new Date().getHours();

  return (
    <div className="flex w-full max-w-[1200px] gap-8 xl:mx-auto">
      <div className="min-w-0 flex-1 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-[#4A3728] sm:text-[26px]">
            {greetingForHour(hour)}, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-[#8C7A72]">
            {published
              ? "Sua vitrine está pronta para receber pedidos."
              : "Publique a loja em Configurações → Estabelecimento para liberar o link público."}
          </p>
        </header>

        <OverviewLinkCard publicUrl={publicUrl} displayHost={displayHost} />

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Total de produtos"
            value={productTotal}
            hint={
              newProductsMonth > 0
                ? `${newProductsMonth} novo${newProductsMonth > 1 ? "s" : ""} este mês`
                : undefined
            }
          />
          <StatCard
            label="Estoque controlado"
            value={trackedCount}
            hint={
              newTrackedMonth > 0
                ? `${newTrackedMonth} com controle este mês`
                : undefined
            }
          />
          <StatCard
            label="Esgotados"
            value={outOfStockCount}
            alert={outOfStockCount > 0}
          />
        </div>

        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#4A3728]">
            Ações rápidas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <QuickAction
              href="/painel/produtos/novo"
              icon={PackagePlus}
              label="Cadastrar produto"
            />
            <QuickAction
              href="/painel/precificacao"
              icon={Calculator}
              label="Calcular precificação"
            />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#4A3728]">
              Produtos em destaque
            </h2>
            <Link
              href="/painel/produtos"
              className="text-xs font-semibold text-[var(--painel-accent)] hover:underline"
            >
              Ver todos
            </Link>
          </div>
          {featured.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#F0E6E0] bg-white px-4 py-8 text-center text-sm text-[#9A8F88]">
              Marque produtos como destaque para exibir aqui.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product) => (
                <Link
                  key={product.id}
                  href={`/painel/produtos/${product.id}`}
                  className="overflow-hidden rounded-2xl border border-[#F0E6E0] bg-white transition hover:shadow-md"
                >
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-28 items-center justify-center bg-[#E8F0EE] text-[var(--painel-brand)]">
                      🍰
                    </div>
                  )}
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-[#4A3728]">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-sm text-[#6B5B52]">
                      {product.priceMode === "QUOTE" || product.priceCents == null
                        ? "Sob consulta"
                        : formatBRL(product.priceCents)}
                    </p>
                    <span
                      className={cn(
                        "mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        product.active
                          ? "bg-[#E4F5E8] text-[#2D7A4A]"
                          : "bg-[#F5F0ED] text-[#8C8682]",
                      )}
                    >
                      {product.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-[#F0E6E0] bg-gradient-to-br from-[#FFF8F5] to-white p-5">
            <h2 className="text-sm font-semibold text-[#4A3728]">
              Calculadora de precificação
            </h2>
            <p className="mt-2 text-sm text-[#8C7A72]">
              Estime custos, margem e preço de venda com a fórmula certa para
              docerias.
            </p>
            <Link
              href="/painel/precificacao"
              className="mt-4 inline-flex rounded-xl bg-[#4A3728] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3D2E22]"
            >
              Abrir calculadora
            </Link>
          </section>

          <section className="rounded-2xl border border-[#F0E6E0] bg-white p-5">
            <h2 className="text-sm font-semibold text-[#4A3728]">
              Últimos cálculos
            </h2>
            {recentPricing.length === 0 ? (
              <p className="mt-3 text-sm text-[#9A8F88]">
                Nenhum cálculo salvo ainda.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[#F0E6E0]">
                {recentPricing.map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-2 py-2.5 text-sm"
                  >
                    <span className="truncate font-medium text-[#4A3728]">
                      {row.name}
                    </span>
                    <span className="shrink-0 text-[#6B5B52]">
                      {formatBRL(row.suggestedUnitPriceCents)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <PainelVitrinePreview
        store={{
          name: store.name,
          slug: store.slug,
          logoUrl: store.logoUrl,
          coverUrl: store.coverUrl,
          description: store.description,
          whatsapp: store.whatsapp,
          paymentMethods: store.paymentMethods ?? [],
        }}
        publicPath={publicUrl}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  alert,
}: {
  label: string;
  value: number;
  hint?: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-4",
        alert
          ? "border-amber-200/80 bg-amber-50/50"
          : "border-[#F0E6E0] bg-white",
      )}
    >
      <p className="text-2xl font-semibold tabular-nums text-[#4A3728]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[#9A8F88]">{label}</p>
      {hint ? (
        <p className="mt-1 text-[11px] font-medium text-[var(--painel-accent)]">{hint}</p>
      ) : null}
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof PackagePlus;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-center gap-2 rounded-2xl border border-[#F0E6E0] bg-white px-4 py-5 text-sm font-semibold text-[#4A3728] shadow-sm transition hover:border-[#E8D4DC] hover:bg-[#FFF8F5]"
    >
      <Icon className="h-5 w-5 text-[var(--painel-accent)]" aria-hidden />
      {label}
    </Link>
  );
}
