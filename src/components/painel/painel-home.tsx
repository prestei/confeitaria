"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  Package,
  PackagePlus,
  ShoppingBag,
  Users,
  Wheat,
} from "lucide-react";
import type { StockMovementType } from "@/lib/enums";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";
import {
  insumoLevelLabel,
  type InsumoStockLevel,
} from "@/lib/painel-home-metrics";
import { PainelHomeHeaderActions } from "@/components/painel/painel-home-header-actions";
import {
  PainelMetricCard,
  PainelMetricRow,
  PainelMetricSlide,
} from "@/components/painel/metric-card";

export type PainelHomeKpis = {
  salesTodayCents: number;
  salesChangePct: number | null;
  ordersToday: number;
  ordersChangePct: number | null;
  lowStockCount: number;
  customersToday: number;
  customersChangePct: number | null;
};

export type PainelHomeSalesPoint = { label: string; valueCents: number };

export type PainelHomeLowStockItem = {
  id: string;
  name: string;
  quantityLabel: string;
  minLabel: string;
  level: InsumoStockLevel;
  emoji: string;
};

export type PainelHomeCategorySlice = {
  name: string;
  pct: number;
  cents: number;
  color: string;
};

export type PainelHomeTopProduct = {
  id: string;
  href: string;
  name: string;
  imageUrl: string | null;
  soldLabel: string;
};

export type PainelHomeMovement = {
  id: string;
  dateLabel: string;
  type: StockMovementType;
  description: string;
  quantityLabel: string;
  userName: string;
};

export type PainelHomeProps = {
  greeting: string;
  firstName: string;
  notificationCount: number;
  userName: string;
  userInitials: string;
  dateLabel: string;
  kpis: PainelHomeKpis;
  sales7d: PainelHomeSalesPoint[];
  lowStockInsumos: PainelHomeLowStockItem[];
  categorySlices: PainelHomeCategorySlice[];
  categoryTotalCents: number;
  topProducts: PainelHomeTopProduct[];
  movements: PainelHomeMovement[];
  productionImageUrl: string | null;
};

const LEVEL_PILL: Record<InsumoStockLevel, string> = {
  critical: "bg-[#FCE8E8] text-[#C44B4B]",
  warning: "bg-[#FDF0E0] text-[#B87A2A]",
  attention: "bg-[#EDE4F7] text-[#7B5BA8]",
};

const MOVEMENT_PILL: Record<
  StockMovementType,
  { label: string; className: string }
> = {
  IN: { label: "Entrada", className: "bg-[#E4F0E8] text-[#2D7A4A]" },
  OUT: { label: "Saída", className: "bg-[#FCE8E8] text-[#C44B4B]" },
  ADJUST: { label: "Ajuste", className: "bg-[#EDE4F7] text-[#7B5BA8]" },
};

const QUICK_ACTIONS = [
  {
    href: "/painel/produtos/novo",
    icon: PackagePlus,
    title: "Cadastrar produto",
    description: "Adicione novos itens ao catálogo",
    tone: "bg-[#E8F0EE] text-[var(--painel-brand,#0f352e)]",
  },
  {
    href: "/painel/insumos",
    icon: Wheat,
    title: "Cadastrar insumo",
    description: "Registre ingredientes e materiais",
    tone: "bg-[#FDF0E0] text-[#B87A2A]",
  },
  {
    href: "/painel/pedidos",
    icon: ClipboardList,
    title: "Registrar pedido",
    description: "Anote encomendas manualmente",
    tone: "bg-[#FCE8E8] text-[#C44B4B]",
  },
  {
    href: "/painel/agenda",
    icon: CalendarDays,
    title: "Agendar produção",
    description: "Planeje o que fazer e quando",
    tone: "bg-[#EDE4F7] text-[#7B5BA8]",
  },
] as const;

function TrendLine({
  pct,
  suffix = "em relação a ontem",
}: {
  pct: number | null;
  suffix?: string;
}) {
  if (pct == null) return null;
  const up = pct >= 0;
  return (
    <p
      className={cn(
        "flex items-center gap-0.5 text-[10px] font-medium leading-tight sm:text-xs",
        up ? "text-[#2D7A4A]" : "text-[#C44B4B]",
      )}
    >
      <ArrowUpRight
        className={cn("h-3.5 w-3.5", !up && "rotate-90")}
        aria-hidden
      />
      {up ? "" : "−"}
      {Math.abs(pct)}% {suffix}
    </p>
  );
}

function Sales7dChart({ data }: { data: PainelHomeSalesPoint[] }) {
  const { path, area, last, max, yTicks } = useMemo(() => {
    const values = data.map((d) => d.valueCents);
    const maxVal = Math.max(1, ...values);
    const w = 100;
    const h = 100;
    const padY = 8;
    const usable = h - padY * 2;
    const points = data.map((d, i) => {
      const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
      const y = padY + usable - (d.valueCents / maxVal) * usable;
      return { x, y, ...d };
    });
    if (points.length === 0) {
      return {
        max: maxVal,
        path: "",
        area: "",
        last: null,
        yTicks: [0, 0, 0, 0],
      };
    }
    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
    const areaPath = `${line} L ${points[points.length - 1].x.toFixed(2)} ${h} L ${points[0].x.toFixed(2)} ${h} Z`;
    const ticks = [maxVal, maxVal * 0.66, maxVal * 0.33, 0].map((v) =>
      Math.round(v),
    );
    return {
      max: maxVal,
      path: line,
      area: areaPath,
      last: points[points.length - 1],
      yTicks: ticks,
    };
  }, [data]);

  const formatAxis = (cents: number) => {
    if (cents >= 100_000) {
      return `R$ ${(cents / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
    }
    if (cents >= 100) {
      return `R$ ${Math.round(cents / 100)}`;
    }
    return "R$ 0";
  };

  return (
    <div>
      <div className="relative">
        <div className="absolute left-0 top-0 flex h-[148px] w-10 flex-col justify-between py-1 text-[10px] tabular-nums text-[#B0AAA6]">
          {yTicks.map((t, i) => (
            <span key={i}>{formatAxis(t)}</span>
          ))}
        </div>
        <div className="relative ml-10">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-[148px] w-full"
            role="img"
            aria-label="Vendas dos últimos 7 dias"
          >
            <defs>
              <linearGradient id="homeSalesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1e6b5c" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#1e6b5c" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[25, 50, 75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="var(--painel-border)"
                strokeWidth="0.35"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {area && <path d={area} fill="url(#homeSalesFill)" />}
            {path && (
              <path
                d={path}
                fill="none"
                stroke="#1e6b5c"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {last && (
              <>
                <circle
                  cx={last.x}
                  cy={last.y}
                  r="2.4"
                  fill="#1e6b5c"
                  stroke="white"
                  strokeWidth="1.2"
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
          </svg>
          {last && (
            <div
              className="pointer-events-none absolute rounded-md bg-[var(--painel-brand,#0f352e)] px-2 py-1 text-[10px] font-semibold text-white shadow-md"
              style={{
                right: "4%",
                top: `${Math.max(8, Math.min(72, 100 - (last.y / 100) * 80))}%`,
              }}
            >
              {last.label} · {formatBRL(last.valueCents)}
            </div>
          )}
          <div className="mt-1 flex justify-between text-[10px] text-[#B0AAA6]">
            {data.map((d) => (
              <span key={d.label}>{d.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryDonut({
  slices,
  totalCents,
}: {
  slices: PainelHomeCategorySlice[];
  totalCents: number;
}) {
  const { segments, dashTotal } = useMemo(() => {
    const r = 16;
    const c = 2 * Math.PI * r;
    let offset = 0;
    const segs = slices.map((s) => {
      const dash = (s.pct / 100) * c;
      const seg = {
        ...s,
        dash,
        offset,
        r,
        c,
      };
      offset += dash;
      return seg;
    });
    return { segments: segs, dashTotal: c };
  }, [slices]);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative mx-auto h-[140px] w-[140px] shrink-0 sm:mx-0">
        <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="var(--painel-border)"
            strokeWidth="5"
          />
          {segments.map((s) => (
            <circle
              key={s.name}
              cx="20"
              cy="20"
              r={s.r}
              fill="none"
              stroke={s.color}
              strokeWidth="5"
              strokeDasharray={`${s.dash} ${dashTotal - s.dash}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-medium text-[#8C8682]">Total</span>
          <span className="text-sm font-bold tabular-nums text-[var(--painel-brand,#0f352e)]">
            {formatBRL(totalCents)}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {slices.map((s) => (
          <li
            key={s.name}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: s.color }}
              />
              <span className="truncate text-[#3D2B1F]">{s.name}</span>
            </span>
            <span className="shrink-0 tabular-nums font-semibold text-[#6B6560]">
              {s.pct}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProductThumb({
  src,
  name,
}: {
  src: string | null;
  name: string;
}) {
  if (src) {
    return (
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#E8F0EE]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0EE] text-sm"
      aria-hidden
    >
      🍰
    </span>
  );
}

export function PainelHome({
  greeting,
  firstName,
  notificationCount,
  userName,
  userInitials,
  dateLabel,
  kpis,
  sales7d,
  lowStockInsumos,
  categorySlices,
  categoryTotalCents,
  topProducts,
  movements,
  productionImageUrl,
}: PainelHomeProps) {
  return (
    <div className="w-full space-y-5 pb-2">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[var(--painel-brand,#0f352e)] sm:text-[28px]">
            {greeting}, {firstName}!{" "}
            <span aria-hidden>👋</span>
          </h1>
          <p className="mt-1 text-sm text-[#8C8682]">
            Confira suas vendas, estoque e o que precisa de atenção hoje.
          </p>
        </div>
        <PainelHomeHeaderActions
          notificationCount={notificationCount}
          userName={userName}
          userInitials={userInitials}
          dateLabel={dateLabel}
        />
      </header>

      <PainelMetricRow>
        <PainelMetricSlide>
          <PainelMetricCard
            label="Vendas do dia"
            value={formatBRL(kpis.salesTodayCents)}
            icon={ShoppingBag}
          >
            <TrendLine pct={kpis.salesChangePct} />
          </PainelMetricCard>
        </PainelMetricSlide>
        <PainelMetricSlide>
          <PainelMetricCard
            label="Pedidos realizados"
            value={String(kpis.ordersToday)}
            icon={Package}
          >
            <TrendLine pct={kpis.ordersChangePct} />
          </PainelMetricCard>
        </PainelMetricSlide>
        <PainelMetricSlide>
          <PainelMetricCard
            label="Itens em estoque baixo"
            value={String(kpis.lowStockCount)}
            icon={Box}
          >
            <Link
              href="/painel/insumos"
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold leading-tight text-[var(--painel-accent,#1e6b5c)] hover:underline sm:text-xs"
            >
              Ver insumos
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </PainelMetricCard>
        </PainelMetricSlide>
        <PainelMetricSlide>
          <PainelMetricCard
            label="Clientes atendidos"
            value={String(kpis.customersToday)}
            icon={Users}
          >
            <TrendLine pct={kpis.customersChangePct} />
          </PainelMetricCard>
        </PainelMetricSlide>
      </PainelMetricRow>

      <div className="grid gap-3 xl:grid-cols-12">
        <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4 shadow-[0_1px_2px_rgba(15,53,46,0.04)] xl:col-span-8">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--painel-brand,#0f352e)]">
            Vendas dos últimos 7 dias
          </h2>
          <Sales7dChart data={sales7d} />
        </section>

        <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4 shadow-[0_1px_2px_rgba(15,53,46,0.04)] xl:col-span-4">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--painel-brand,#0f352e)]">
            Insumos em estoque baixo
          </h2>
          {lowStockInsumos.length === 0 ? (
            <p className="py-6 text-sm text-[#8C8682]">Estoque em dia.</p>
          ) : (
            <ul className="divide-y divide-[var(--painel-border)]">
              {lowStockInsumos.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/painel/insumos"
                    className="flex items-center gap-3 py-3 transition hover:opacity-90"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F0ED] text-lg"
                      aria-hidden
                    >
                      {item.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#3D2B1F]">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#8C8682]">
                        {item.quantityLabel}
                        <span className="mx-1 text-[#D1D5DB]">·</span>
                        {item.minLabel}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        LEVEL_PILL[item.level],
                      )}
                    >
                      {insumoLevelLabel(item.level)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4 shadow-[0_1px_2px_rgba(15,53,46,0.04)]">
          <h2 className="mb-4 text-[15px] font-semibold text-[var(--painel-brand,#0f352e)]">
            Vendas por categoria
          </h2>
          {categorySlices.length === 0 ? (
            <p className="text-sm text-[#8C8682]">Sem vendas no período.</p>
          ) : (
            <CategoryDonut
              slices={categorySlices}
              totalCents={categoryTotalCents}
            />
          )}
        </section>

        <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4 shadow-[0_1px_2px_rgba(15,53,46,0.04)]">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--painel-brand,#0f352e)]">
            Produtos mais vendidos
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#8C8682]">Ainda sem vendas recentes.</p>
          ) : (
            <ol className="space-y-2.5">
              {topProducts.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={p.href}
                    className="flex items-center gap-3 rounded-lg transition hover:bg-[#F9FAFB] px-1 py-1"
                  >
                    <span className="w-4 shrink-0 text-xs font-bold tabular-nums text-[#B0AAA6]">
                      {i + 1}
                    </span>
                    <ProductThumb src={p.imageUrl} name={p.name} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-[#3D2B1F]">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-[#8C8682]">
                      {p.soldLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="relative overflow-hidden rounded-xl border border-[#DDF0E4] bg-gradient-to-br from-[#F4FAF7] to-[#E8F5EF] p-4 shadow-[0_1px_2px_rgba(15,53,46,0.04)] sm:p-5">
          <div className="relative z-[1] flex items-start gap-3 sm:block">
            <div className="min-w-0 flex-1 sm:max-w-[58%]">
              <h2 className="text-[15px] font-semibold text-[var(--painel-brand,#0f352e)]">
                Organize sua produção
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-[#5C5652] sm:mt-2 sm:text-sm">
                Controle seu estoque de insumos e evite desperdícios.
              </p>
              <Link
                href="/painel/agenda"
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--painel-brand,#0f352e)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--painel-brand-hover,#164a40)] sm:mt-4 sm:inline-flex sm:w-auto"
              >
                Cadastrar produção
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {productionImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={productionImageUrl}
                alt=""
                className="pointer-events-none h-20 w-20 shrink-0 rounded-xl object-cover object-center ring-2 ring-white/80 sm:absolute sm:-right-2 sm:bottom-0 sm:h-[85%] sm:w-auto sm:max-w-[48%] sm:rounded-none sm:object-contain sm:object-bottom sm:ring-0"
              />
            ) : (
              <span
                className="pointer-events-none flex h-20 w-20 shrink-0 items-center justify-center text-4xl sm:absolute sm:-right-1 sm:bottom-2 sm:block sm:h-auto sm:w-auto sm:text-7xl"
                aria-hidden
              >
                🎂
              </span>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-3 xl:grid-cols-12">
        <section className="overflow-hidden rounded-xl border border-[var(--painel-border)] bg-white shadow-[0_1px_2px_rgba(15,53,46,0.04)] xl:col-span-8">
          <div className="border-b border-[var(--painel-border)] px-4 py-3.5">
            <h2 className="text-[15px] font-semibold text-[var(--painel-brand,#0f352e)]">
              Movimentações recentes
            </h2>
          </div>
          {movements.length === 0 ? (
            <p className="px-4 py-8 text-sm text-[#8C8682]">
              Nenhuma movimentação registrada.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--painel-border)] md:hidden">
                {movements.map((m) => {
                  const pill = MOVEMENT_PILL[m.type];
                  return (
                    <li key={m.id} className="px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                            pill.className,
                          )}
                        >
                          {pill.label}
                        </span>
                        <time
                          className="shrink-0 text-xs tabular-nums text-[var(--painel-muted,#6b7280)]"
                          dateTime={m.dateLabel}
                        >
                          {m.dateLabel}
                        </time>
                      </div>
                      <p className="mt-1.5 text-sm font-medium leading-snug text-[#111827]">
                        {m.description}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-xs text-[var(--painel-muted,#6b7280)]">
                        <span className="font-semibold tabular-nums text-[#3D2B1F]">
                          {m.quantityLabel}
                        </span>
                        <span className="truncate">{m.userName}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--painel-border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--painel-muted,#6b7280)]">
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Descrição</th>
                      <th className="px-4 py-3 text-right">Quantidade</th>
                      <th className="px-4 py-3">Usuário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => {
                      const pill = MOVEMENT_PILL[m.type];
                      return (
                        <tr
                          key={m.id}
                          className="border-b border-[var(--painel-border)] last:border-0"
                        >
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[#6B6560]">
                            {m.dateLabel}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                                pill.className,
                              )}
                            >
                              {pill.label}
                            </span>
                          </td>
                          <td className="max-w-[200px] truncate px-4 py-3 font-medium text-[#3D2B1F]">
                            {m.description}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-[#3D2B1F]">
                            {m.quantityLabel}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[#6B6560]">
                            {m.userName}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <section className="rounded-xl border border-[var(--painel-border)] bg-white p-4 shadow-[0_1px_2px_rgba(15,53,46,0.04)] xl:col-span-4">
          <h2 className="mb-3 text-[15px] font-semibold text-[var(--painel-brand,#0f352e)]">
            Ações rápidas
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex min-w-0 flex-col gap-1.5 rounded-xl border border-[var(--painel-border)] bg-[#FAFBFC] p-2.5 transition hover:border-[#D1D5DB] hover:bg-white hover:shadow-sm sm:gap-2 sm:p-3"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      action.tone,
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold leading-snug text-[#3D2B1F] sm:text-[13px]">
                      {action.title}
                    </p>
                    <p className="mt-0.5 text-[10px] leading-snug text-[#8C8682] sm:text-[11px]">
                      {action.description}
                    </p>
                  </div>
                  <ChevronDown
                    className="ml-auto hidden h-4 w-4 -rotate-90 text-[#C4C0BC] opacity-0 transition group-hover:opacity-100 sm:block"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
