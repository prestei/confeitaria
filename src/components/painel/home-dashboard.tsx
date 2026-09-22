import Link from "next/link";
import {
  Plus,
  PackagePlus,
  AlertTriangle,
  CalendarDays,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/utils";

export type DashStatus =
  | "IN_PRODUCTION"
  | "TO_PREPARE"
  | "WAITING"
  | "DELIVERY"
  | "READY";

export type ProductionRow = {
  id: string;
  href: string;
  time: string;
  productName: string;
  productImage: string | null;
  customerName: string;
  status: DashStatus;
};

export type KanbanCard = {
  id: string;
  href: string;
  productName: string;
  productImage: string | null;
  customerName: string;
  time: string;
};

export type DeliveryItem = {
  id: string;
  href: string;
  time: string;
  customerName: string;
  productName: string;
};

export type StockItem = {
  id: string;
  href: string;
  name: string;
  qtyLabel: string;
  critical: boolean;
};

export type TopProduct = {
  id: string;
  href: string;
  name: string;
  imageUrl: string | null;
  soldLabel: string;
};

export type SalesMetric = {
  label: string;
  value: string;
  changePct: number | null;
};

const STATUS_STYLE: Record<
  DashStatus,
  { label: string; className: string }
> = {
  IN_PRODUCTION: {
    label: "Em produção",
    className: "bg-[#FCE8D5] text-[#C47A2A]",
  },
  TO_PREPARE: {
    label: "A preparar",
    className: "bg-[#DCEAF8] text-[#3B7CB8]",
  },
  WAITING: {
    label: "Aguardando",
    className: "bg-[#EDE4F7] text-[#7B5BA8]",
  },
  DELIVERY: {
    label: "Entrega",
    className: "bg-[#DDF0E4] text-[#3D8A5A]",
  },
  READY: {
    label: "Pronto",
    className: "bg-[#DDF0E4] text-[#3D8A5A]",
  },
};

const QUICK_ACTIONS = [
  {
    href: "/painel/pedidos",
    label: "Novo pedido",
    icon: Plus,
    tone: "bg-[#FCE4EC] text-[#C45A7A]",
  },
  {
    href: "/painel/produtos/novo",
    label: "Adicionar produto",
    icon: PackagePlus,
    tone: "bg-[#EFE6DC] text-[#8B6B4A]",
  },
  {
    href: "/painel/estoque",
    label: "Baixo no estoque",
    icon: AlertTriangle,
    tone: "bg-[#E4F0E8] text-[#4A8A5E]",
  },
  {
    href: "/painel/agenda",
    label: "Ver agenda",
    icon: CalendarDays,
    tone: "bg-[#EDE4F7] text-[#7B5BA8]",
  },
] as const;

function ProductThumb({
  src,
  alt,
  size = "md",
}: {
  src: string | null;
  alt: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  if (!src) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-full bg-[#F3EEEA] text-[10px] font-semibold text-[#8C8682]",
          dim,
        )}
      >
        {alt.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <span className={cn("relative shrink-0 overflow-hidden rounded-full", dim)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
    </span>
  );
}

export function HomeDashboard({
  productionCount,
  productionRows,
  kanban,
  deliveries,
  lowStock,
  salesMetrics,
  topProducts,
}: {
  productionCount: number;
  productionRows: ProductionRow[];
  kanban: {
    todo: KanbanCard[];
    doing: KanbanCard[];
    done: KanbanCard[];
  };
  deliveries: DeliveryItem[];
  lowStock: StockItem[];
  salesMetrics: SalesMetric[];
  topProducts: TopProduct[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {QUICK_ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href + a.label}
              href={a.href}
              className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3.5 shadow-[0_1px_3px_rgba(61,43,31,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(61,43,31,0.08)]"
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  a.tone,
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="text-[13px] font-semibold leading-snug text-[#3D2B1F]">
                {a.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Middle: production table + kanban + side lists */}
      <div className="grid gap-3 xl:grid-cols-12 xl:items-start">
        {/* Produção de hoje */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(61,43,31,0.06)] xl:col-span-5">
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <h2 className="text-[15px] font-semibold text-[#3D2B1F]">
                Produção de hoje
              </h2>
              <span className="rounded-full bg-[#F3EEEA] px-2 py-0.5 text-[11px] font-semibold text-[#8B6B4A]">
                {productionCount} encomenda{productionCount === 1 ? "" : "s"}
              </span>
            </div>
            <Link
              href="/painel/pedidos"
              className="text-xs font-semibold text-[#C85A5A] hover:underline"
            >
              Ver todas
            </Link>
          </div>

          {productionRows.length === 0 ? (
            <p className="px-4 pb-5 text-sm text-[#8C8682]">
              Nenhuma encomenda para hoje.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left">
                <thead>
                  <tr className="border-t border-[#F0EBE7] text-[11px] font-semibold uppercase tracking-wide text-[#A09A96]">
                    <th className="px-4 py-2 font-semibold">Horário</th>
                    <th className="px-2 py-2 font-semibold">Produto</th>
                    <th className="px-2 py-2 font-semibold">Cliente</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {productionRows.map((row) => {
                    const st = STATUS_STYLE[row.status];
                    return (
                      <tr
                        key={row.id}
                        className="border-t border-[#F7F3EE] text-[13px]"
                      >
                        <td className="px-4 py-2.5 tabular-nums font-medium text-[#3D2B1F]">
                          <Link href={row.href} className="hover:underline">
                            {row.time}
                          </Link>
                        </td>
                        <td className="px-2 py-2.5">
                          <Link
                            href={row.href}
                            className="flex items-center gap-2 min-w-0"
                          >
                            <ProductThumb
                              src={row.productImage}
                              alt={row.productName}
                            />
                            <span className="truncate font-medium text-[#3D2B1F]">
                              {row.productName}
                            </span>
                          </Link>
                        </td>
                        <td className="px-2 py-2.5 text-[#6B6560]">
                          {row.customerName}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                              st.className,
                            )}
                          >
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Linha de produção */}
        <section className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(61,43,31,0.06)] xl:col-span-4">
          <h2 className="mb-3 text-[15px] font-semibold text-[#3D2B1F]">
            Linha de produção
          </h2>
          <div className="grid grid-cols-3 gap-2.5">
            {(
              [
                { key: "todo", title: "A fazer", items: kanban.todo },
                { key: "doing", title: "Produzindo", items: kanban.doing },
                { key: "done", title: "Pronto", items: kanban.done },
              ] as const
            ).map((col) => (
              <div key={col.key} className="min-w-0">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#A09A96]">
                  {col.title}
                </p>
                <div className="flex flex-col gap-2">
                  {col.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[#E8E2DE] px-2 py-4 text-center text-[10px] text-[#A09A96]">
                      —
                    </div>
                  ) : (
                    col.items.map((card) => (
                      <Link
                        key={card.id}
                        href={card.href}
                        className="rounded-xl bg-[#FBF7F2] p-2 transition hover:bg-[#F3EEEA]"
                      >
                        <div className="flex items-start gap-2">
                          <ProductThumb
                            src={card.productImage}
                            alt={card.productName}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold text-[#3D2B1F]">
                              {card.productName}
                            </p>
                            <p className="truncate text-[10px] text-[#8C8682]">
                              {card.customerName}
                            </p>
                            <p className="mt-0.5 text-[10px] tabular-nums text-[#A09A96]">
                              {card.time}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right stack */}
        <div className="flex flex-col gap-3 xl:col-span-3">
          <section className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(61,43,31,0.06)]">
            <h2 className="mb-3 text-[15px] font-semibold text-[#3D2B1F]">
              Próximas entregas
            </h2>
            {deliveries.length === 0 ? (
              <p className="text-sm text-[#8C8682]">Nenhuma entrega próxima.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {deliveries.map((d) => (
                  <li key={d.id}>
                    <Link
                      href={d.href}
                      className="flex items-baseline gap-2 text-[13px] transition hover:opacity-80"
                    >
                      <span className="shrink-0 tabular-nums font-semibold text-[#3D2B1F]">
                        {d.time}
                      </span>
                      <span className="min-w-0 truncate font-medium text-[#3D2B1F]">
                        {d.customerName}
                      </span>
                      <span className="min-w-0 truncate text-[#8C8682]">
                        {d.productName}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(61,43,31,0.06)]">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FCE4EC] text-[#C45A7A]">
                <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <h2 className="text-[15px] font-semibold text-[#3D2B1F]">
                Estoque baixo
              </h2>
            </div>
            {lowStock.length === 0 ? (
              <p className="text-sm text-[#8C8682]">Estoque em dia.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {lowStock.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={s.href}
                      className="flex items-center justify-between gap-2 text-[13px]"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            s.critical ? "bg-[#E05A5A]" : "bg-[#E8A84A]",
                          )}
                        />
                        <span className="truncate text-[#3D2B1F]">{s.name}</span>
                      </span>
                      <span
                        className={cn(
                          "shrink-0 tabular-nums font-semibold",
                          s.critical ? "text-[#E05A5A]" : "text-[#C47A2A]",
                        )}
                      >
                        {s.qtyLabel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* Bottom: sales + top products */}
      <div className="grid gap-3 md:grid-cols-12 md:items-stretch">
        <section className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(61,43,31,0.06)] md:col-span-6">
          <h2 className="mb-3 text-[15px] font-semibold text-[#3D2B1F]">
            Resumo de vendas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {salesMetrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl bg-[#FBF7F2] px-3.5 py-3"
              >
                <p className="text-[11px] font-medium text-[#8C8682]">
                  {m.label}
                </p>
                <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-[#3D2B1F]">
                  {m.value}
                </p>
                {m.changePct != null && (
                  <p
                    className={cn(
                      "mt-1 inline-flex items-center gap-0.5 text-[11px] font-semibold",
                      m.changePct >= 0 ? "text-[#3D8A5A]" : "text-[#E05A5A]",
                    )}
                  >
                    <ArrowUpRight
                      className={cn(
                        "h-3 w-3",
                        m.changePct < 0 && "rotate-90",
                      )}
                    />
                    {m.changePct >= 0 ? "+" : ""}
                    {Math.round(m.changePct)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(61,43,31,0.06)] md:col-span-6">
          <h2 className="mb-3 text-[15px] font-semibold text-[#3D2B1F]">
            Produtos mais vendidos
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-[#8C8682]">
              Ainda sem vendas neste mês.
            </p>
          ) : (
            <ol className="flex flex-col gap-2.5">
              {topProducts.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={p.href}
                    className="flex items-center gap-3 transition hover:opacity-80"
                  >
                    <span className="w-4 shrink-0 text-[12px] font-bold tabular-nums text-[#A09A96]">
                      {i + 1}
                    </span>
                    <ProductThumb src={p.imageUrl} alt={p.name} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#3D2B1F]">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-[12px] font-semibold text-[#8C8682]">
                      {p.soldLabel}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}

/** Helper re-export for page metrics formatting */
export { formatBRL };
