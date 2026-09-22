"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";
import { FilterChip, FilterChipGroup } from "@/components/ui/filter-chip";

export type ChartPoint = { label: string; value: number };

const PERIODS = [
  { id: "today", label: "Hoje" },
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
] as const;

type PeriodId = (typeof PERIODS)[number]["id"];

export function PeriodChart({
  series,
  totals,
  valueKind = "money",
}: {
  series: Record<PeriodId, ChartPoint[]>;
  totals: Record<PeriodId, { cents: number; changePct: number | null }>;
  valueKind?: "money" | "count";
}) {
  const [period, setPeriod] = useState<PeriodId>("today");
  const data = series[period];
  const total = totals[period];

  const formatTotal = (n: number) =>
    valueKind === "money" ? formatBRL(n) : String(Math.round(n));

  const formatAxis = (n: number) =>
    valueKind === "money"
      ? n >= 100
        ? `R$ ${(n / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`
        : "R$ 0"
      : String(Math.round(n));

  const { max, path, area, lastPoint } = useMemo(() => {
    const values = data.map((d) => d.value);
    const maxVal = Math.max(1, ...values);
    const w = 100;
    const h = 100;
    const padY = 6;
    const usableH = h - padY * 2;

    const points = data.map((d, i) => {
      const x = data.length === 1 ? w / 2 : (i / (data.length - 1)) * w;
      const y = padY + usableH - (d.value / maxVal) * usableH;
      return { x, y, ...d };
    });

    if (points.length === 0) {
      return { max: maxVal, path: "", area: "", lastPoint: null };
    }

    const line = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");

    const areaPath = `${line} L ${points[points.length - 1].x.toFixed(2)} ${h} L ${points[0].x.toFixed(2)} ${h} Z`;

    return {
      max: maxVal,
      path: line,
      area: areaPath,
      lastPoint: points[points.length - 1],
    };
  }, [data]);

  const yTicks = [max, max * 0.66, max * 0.33, 0].map((v) => Math.round(v));

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F5E8E8] text-[#C85A5A]">
            <TrendingUp className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h2 className="font-sans text-[15px] font-semibold text-[#2D2926]">
              Desempenho de vendas
            </h2>
            <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="text-xl font-bold tracking-tight text-[#2D2926] tabular-nums sm:text-2xl">
                {formatTotal(total.cents)}
              </p>
              {total.changePct != null && (
                <p
                  className={cn(
                    "text-xs font-medium",
                    total.changePct >= 0 ? "text-[#4A9E5F]" : "text-[#C85A5A]",
                  )}
                >
                  {total.changePct >= 0 ? "↗" : "↘"}{" "}
                  {Math.abs(total.changePct).toFixed(1).replace(".", ",")}% este
                  período
                </p>
              )}
            </div>
          </div>
        </div>
        <FilterChipGroup>
          {PERIODS.map((p) => (
            <FilterChip
              key={p.id}
              label={p.label}
              active={period === p.id}
              onClick={() => setPeriod(p.id)}
            />
          ))}
        </FilterChipGroup>
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 flex h-[120px] w-11 flex-col justify-between py-0.5 text-[10px] tabular-nums text-[#B0AAA6]">
          {yTicks.map((t, i) => (
            <span key={i}>{formatAxis(t)}</span>
          ))}
        </div>

        <div className="ml-11">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-[120px] w-full"
            role="img"
            aria-label="Gráfico de vendas"
          >
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C85A5A" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#C85A5A" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {[25, 50, 75].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#E8E2DE"
                strokeWidth="0.4"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {area && <path d={area} fill="url(#salesFill)" stroke="none" />}
            {path && (
              <path
                d={path}
                fill="none"
                stroke="#C85A5A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            )}
            {lastPoint && (
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="2.2"
                fill="#C85A5A"
                stroke="white"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          <div className="mt-1 flex justify-between px-0.5 text-[10px] text-[#B0AAA6]">
            {data
              .filter((_, i) => {
                if (data.length <= 8) return true;
                return (
                  i === 0 ||
                  i === data.length - 1 ||
                  i % Math.ceil(data.length / 5) === 0
                );
              })
              .map((d) => (
                <span key={d.label}>{d.label}</span>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-[#F0EBE7] pt-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#5C5652]">
          <span className="h-2 w-2 rounded-full bg-[#C85A5A]" />
          {valueKind === "money" ? "Vendas realizadas" : "Eventos"}
        </span>
        <span className="text-[11px] text-[#B0AAA6]">Dados ao vivo</span>
      </div>
    </div>
  );
}
