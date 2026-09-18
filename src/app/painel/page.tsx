import { redirect } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  ShoppingBag,
  Share2,
  Settings,
  Plus,
  QrCode,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/order-status";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { DashboardMetrics } from "@/components/painel/dashboard-metrics";

export default async function PainelPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/entrar");

  const storeId = session.user.storeId;
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) redirect("/entrar");

  const [orders, productsCount, recent, customersAgg, allItems] =
    await Promise.all([
      prisma.order.findMany({ where: { storeId } }),
      prisma.product.count({ where: { storeId, active: true } }),
      prisma.order.findMany({
        where: { storeId },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.order.groupBy({
        by: ["customerPhone"],
        where: { storeId },
      }),
      prisma.orderItem.findMany({
        where: { order: { storeId, status: { not: "CANCELLED" } } },
        select: { productName: true, quantity: true },
      }),
    ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const in7 = new Date(today);
  in7.setDate(in7.getDate() + 7);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  const awaiting = orders.filter(
    (o) => o.status === "NEW" || o.status === "REVIEWING",
  ).length;
  const todayEvents = orders.filter(
    (o) => o.eventDate && o.eventDate >= today && o.eventDate < tomorrow,
  ).length;
  const upcoming = orders
    .filter(
      (o) =>
        o.eventDate &&
        o.eventDate >= today &&
        o.eventDate <= in7 &&
        o.status !== "CANCELLED",
    )
    .sort((a, b) => a.eventDate!.getTime() - b.eventDate!.getTime())
    .slice(0, 5);

  const revenue = orders
    .filter((o) => o.status !== "CANCELLED" && o.priceLabel !== "TO_CONFIRM")
    .reduce((s, o) => s + o.totalCents, 0);

  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const publicUrl = `${origin}/${store.slug}`;
  const firstName = (session.user.name || store.name).split(" ")[0];

  const ranking = new Map<string, number>();
  for (const item of allItems) {
    ranking.set(
      item.productName,
      (ranking.get(item.productName) || 0) + item.quantity,
    );
  }
  const topProducts = [...ranking.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-cocoa sm:text-4xl">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-1 text-cocoa-soft/75">
            Veja como está sua confeitaria hoje ·{" "}
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/painel/produtos" className="btn-primary !py-2.5 text-sm">
            <Plus className="h-4 w-4" />
            Novo produto
          </Link>
          <Link href="/painel/pedidos" className="btn-secondary !py-2.5 text-sm">
            Ver pedidos
          </Link>
        </div>
      </div>

      <DashboardMetrics
        metrics={[
          { label: "Aguardando", value: awaiting, icon: "orders" },
          { label: "Encomendas hoje", value: todayEvents, icon: "calendar" },
          { label: "Produtos ativos", value: productsCount, icon: "products" },
          {
            label: "Faturamento calc.",
            value: revenue,
            icon: "revenue",
            money: true,
          },
          {
            label: "Clientes",
            value: customersAgg.length,
            icon: "customers",
          },
        ]}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { href: "/painel/produtos", label: "Novo produto", icon: Plus },
          { href: "/painel/agenda", label: "Ver agenda", icon: CalendarDays },
          { href: "/painel/qrcode", label: "QR Code", icon: QrCode },
          { href: "/painel/loja", label: "Configurar loja", icon: Settings },
          {
            href: publicUrl,
            label: "Compartilhar cardápio",
            icon: Share2,
            external: true,
          },
        ].map((a) => (
          <Link
            key={a.label}
            href={a.href}
            target={a.external ? "_blank" : undefined}
            className="panel flex items-center gap-3 p-4 transition hover:-translate-y-0.5"
          >
            <a.icon className="h-5 w-5 text-berry" aria-hidden />
            <span className="text-sm font-semibold text-cocoa">{a.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-cocoa/6 px-5 py-4">
            <h2 className="font-display text-xl text-cocoa">Pedidos recentes</h2>
            <Link
              href="/painel/pedidos"
              className="text-sm font-medium text-berry-deep"
            >
              Ver todos
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={ShoppingBag}
                title="Nenhum pedido ainda"
                description="Quando clientes enviarem pedidos pelo cardápio, eles aparecem aqui."
              />
            </div>
          ) : (
            <ul className="divide-y divide-cocoa/6">
              {recent.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-cocoa">
                      {o.customerName}
                    </p>
                    <p className="truncate text-xs text-cocoa-soft/65">
                      {o.items[0]?.productName || "Pedido"}
                      {o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
                      {" · "}
                      {format(o.createdAt, "dd/MM HH:mm")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <OrderStatusBadge status={o.status} />
                    <span className="text-xs font-medium text-cocoa-soft">
                      {o.priceLabel === "TO_CONFIRM"
                        ? "A confirmar"
                        : formatBRL(o.totalCents)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-cocoa/6 px-5 py-4">
            <h2 className="font-display text-xl text-cocoa">
              Próximas encomendas
            </h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={CalendarDays}
                title="Agenda livre"
                description="Encomendas com data nos próximos 7 dias aparecerão aqui."
              />
            </div>
          ) : (
            <ul className="divide-y divide-cocoa/6">
              {upcoming.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div>
                    <p className="font-medium text-cocoa">
                      {o.eventDate && format(o.eventDate, "dd/MM")}
                      {o.eventTime ? ` · ${o.eventTime}` : ""}
                    </p>
                    <p className="text-xs text-cocoa-soft/65">{o.customerName}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-display text-xl text-cocoa">
          Produtos mais pedidos
        </h2>
        {topProducts.length === 0 ? (
          <p className="mt-3 text-sm text-cocoa-soft/70">
            Ainda sem dados de vendas.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {topProducts.map(([name, qty], i) => (
              <li key={name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blush text-xs font-bold text-berry-deep">
                  {i + 1}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-cocoa">
                  {name}
                </span>
                <span className="text-sm text-cocoa-soft/70">{qty} un.</span>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3">
          <QrCode className="mt-1 h-5 w-5 text-berry" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-cocoa">Link e QR Code</h2>
            <p className="mt-2 break-all text-sm text-berry">{publicUrl}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={publicUrl}
                target="_blank"
                className="btn-primary !py-2 text-sm"
              >
                Abrir cardápio
              </Link>
              <Link href="/painel/qrcode" className="btn-berry !py-2 text-sm">
                Gerar QR Code
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
