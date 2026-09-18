import { Suspense } from "react";
import Link from "next/link";
import { subDays, startOfDay } from "date-fns";
import { BarChart3 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireStoreSession } from "@/lib/tenant";
import { PageHeader, SectionCard, StatTile } from "@/components/painel/page-header";
import { PeriodChart } from "@/components/painel/period-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { AnalyticsFilters } from "@/components/painel/analytics-filters";
import { format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

function daysFromRange(range: string) {
  if (range === "today") return 1;
  if (range === "7") return 7;
  if (range === "90") return 90;
  return 30;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const session = await requireStoreSession();
  const sp = await searchParams;
  const range = sp.range || "30";
  const days = daysFromRange(range);
  const since = startOfDay(subDays(new Date(), days - 1));

  const [events, orders, products] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { storeId: session.storeId, createdAt: { gte: since } },
    }),
    prisma.order.findMany({
      where: {
        storeId: session.storeId,
        createdAt: { gte: since },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.product.findMany({
      where: { storeId: session.storeId },
      select: { id: true, name: true },
    }),
  ]);

  const nameById = Object.fromEntries(products.map((p) => [p.id, p.name]));
  const views = events.filter((e) => e.type === "STORE_VIEW").length;
  const productViews = events.filter((e) => e.type === "PRODUCT_VIEW").length;
  const waClicks = events.filter((e) => e.type === "WHATSAPP_CLICK").length;
  const productClicks = events.filter((e) => e.type === "PRODUCT_CLICK").length;
  const conversion =
    views > 0 ? Math.round((orders.length / views) * 1000) / 10 : null;

  const topAccessed = rankByProduct(events, "PRODUCT_VIEW", nameById);
  const topClicked = rankByProduct(events, "PRODUCT_CLICK", nameById);

  const sources = new Map<string, number>();
  for (const e of events) {
    if (!e.source) continue;
    sources.set(e.source, (sources.get(e.source) || 0) + 1);
  }
  const sourceRows = [...sources.entries()].sort((a, b) => b[1] - a[1]);

  const chartSource =
    events.length > 0
      ? events.map((e) => ({ createdAt: e.createdAt, type: e.type }))
      : orders.map((o) => ({
          createdAt: o.createdAt,
          type: "ORDER_COMPLETED",
        }));

  const end = startOfDay(new Date());
  const start = subDays(end, Math.min(days, 30) - 1);
  const interval = eachDayOfInterval({ start, end });
  const points = interval.map((day) => {
    const next = subDays(day, -1);
    const value = chartSource.filter(
      (e) => e.createdAt >= day && e.createdAt < next,
    ).length;
    return {
      label: format(day, "dd/MM", { locale: ptBR }),
      value,
    };
  });

  const sumPoints = (pts: { value: number }[]) =>
    pts.reduce((s, p) => s + p.value, 0);

  const series = {
    today: points.slice(-1),
    "7": points.slice(-7),
    "30": points,
  };

  const totals = {
    today: { cents: sumPoints(series.today), changePct: null as number | null },
    "7": { cents: sumPoints(series["7"]), changePct: null },
    "30": { cents: sumPoints(series["30"]), changePct: null },
  };

  const hasData = events.length > 0 || orders.length > 0;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Relatórios"
        description="Métricas úteis da vitrine — sem números artificiais."
        actions={
          <Suspense fallback={null}>
            <AnalyticsFilters current={range} />
          </Suspense>
        }
      />

      {!hasData ? (
        <EmptyState
          icon={BarChart3}
          title="Ainda sem métricas"
          description="À medida que clientes visitam a vitrine e fazem pedidos, os dados aparecem aqui."
          action={{ label: "Ver vitrine", href: "/painel/vitrine" }}
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Visualizações da vitrine" value={views || "—"} />
            <StatTile label="Visualizações de produtos" value={productViews || "—"} />
            <StatTile label="Cliques no WhatsApp" value={waClicks || "—"} />
            <StatTile
              label="Conversão em pedidos"
              value={conversion != null ? `${conversion}%` : "—"}
              hint={`${orders.length} pedidos no período`}
            />
          </div>

          <SectionCard>
            <div className="p-5">
              <PeriodChart series={series} totals={totals} valueKind="count" />
            </div>
          </SectionCard>

          <div className="grid gap-5 lg:grid-cols-2">
            <SectionCard title="Produtos mais acessados">
              <RankList rows={topAccessed} empty="Sem visualizações de produto." />
            </SectionCard>
            <SectionCard title="Produtos mais clicados">
              <RankList
                rows={topClicked.length ? topClicked : topAccessed}
                empty="Sem cliques registrados."
              />
            </SectionCard>
          </div>

          <SectionCard title="Origem dos acessos">
            {sourceRows.length === 0 ? (
              <p className="px-5 py-6 text-sm text-cocoa-soft/60">
                Origem ainda não disponível. Quando houver UTM ou referrer, aparece aqui.
              </p>
            ) : (
              <ul className="divide-y divide-cocoa/6">
                {sourceRows.map(([source, count]) => (
                  <li
                    key={source}
                    className="flex justify-between px-5 py-3 text-sm"
                  >
                    <span className="font-medium text-cocoa">{source}</span>
                    <span className="tabular-nums text-cocoa-soft/65">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <p className="text-xs text-cocoa-soft/50">
            Cliques em produtos no período: {productClicks || "—"}.{" "}
            <Link href="/painel/integracoes" className="text-berry-deep hover:underline">
              Conectar canais
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

function rankByProduct(
  events: { type: string; productId: string | null }[],
  type: string,
  nameById: Record<string, string>,
) {
  const map = new Map<string, number>();
  for (const e of events) {
    if (e.type !== type || !e.productId) continue;
    map.set(e.productId, (map.get(e.productId) || 0) + 1);
  }
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, count]) => ({ name: nameById[id] || "Produto", count }));
}

function RankList({
  rows,
  empty,
}: {
  rows: { name: string; count: number }[];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="px-5 py-6 text-sm text-cocoa-soft/60">{empty}</p>;
  }
  return (
    <ol className="divide-y divide-cocoa/6">
      {rows.map((r, i) => (
        <li key={r.name} className="flex items-center gap-3 px-5 py-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-fog text-xs font-bold text-cocoa-soft">
            {i + 1}
          </span>
          <span className="flex-1 truncate text-sm font-medium text-cocoa">
            {r.name}
          </span>
          <span className="text-xs tabular-nums text-cocoa-soft/65">{r.count}</span>
        </li>
      ))}
    </ol>
  );
}
