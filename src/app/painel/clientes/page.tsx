import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBRL } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function ClientesPage() {
  const session = await auth();
  if (!session?.user?.storeId) redirect("/entrar");
  const storeId = session.user.storeId;

  const orders = await prisma.order.findMany({
    where: { storeId },
    orderBy: { createdAt: "desc" },
    select: {
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      totalCents: true,
      priceLabel: true,
      createdAt: true,
      status: true,
    },
  });

  const map = new Map<
    string,
    {
      name: string;
      phone: string;
      email: string | null;
      orders: number;
      lastOrder: Date;
      spent: number;
    }
  >();

  for (const o of orders) {
    const key = o.customerPhone;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name: o.customerName,
        phone: o.customerPhone,
        email: o.customerEmail,
        orders: 1,
        lastOrder: o.createdAt,
        spent: o.status !== "CANCELLED" && o.priceLabel !== "TO_CONFIRM" ? o.totalCents : 0,
      });
    } else {
      existing.orders += 1;
      if (o.createdAt > existing.lastOrder) {
        existing.lastOrder = o.createdAt;
        existing.name = o.customerName;
        existing.email = o.customerEmail || existing.email;
      }
      if (o.status !== "CANCELLED" && o.priceLabel !== "TO_CONFIRM") {
        existing.spent += o.totalCents;
      }
    }
  }

  const clients = [...map.values()].sort(
    (a, b) => b.lastOrder.getTime() - a.lastOrder.getTime(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-cocoa sm:text-4xl">Clientes</h1>
        <p className="mt-1 text-cocoa-soft/75">
          Contatos reunidos a partir dos pedidos recebidos.
        </p>
      </div>

      {clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum cliente ainda"
          description="Assim que chegarem pedidos, os contatos serão listados aqui automaticamente."
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-3xl border border-cocoa/8 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-cocoa/8 bg-fog/50 text-xs uppercase tracking-wide text-cocoa-soft/60">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nome</th>
                  <th className="px-5 py-3 font-semibold">WhatsApp</th>
                  <th className="px-5 py-3 font-semibold">Pedidos</th>
                  <th className="px-5 py-3 font-semibold">Último</th>
                  <th className="px-5 py-3 font-semibold">Total calc.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cocoa/6">
                {clients.map((c) => (
                  <tr key={c.phone} className="hover:bg-fog/30">
                    <td className="px-5 py-3.5 font-medium text-cocoa">{c.name}</td>
                    <td className="px-5 py-3.5 text-cocoa-soft">{c.phone}</td>
                    <td className="px-5 py-3.5">{c.orders}</td>
                    <td className="px-5 py-3.5 text-cocoa-soft">
                      {format(c.lastOrder, "dd/MM/yyyy")}
                    </td>
                    <td className="px-5 py-3.5">{formatBRL(c.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {clients.map((c) => (
              <Card key={c.phone} className="p-4">
                <p className="font-semibold text-cocoa">{c.name}</p>
                <p className="mt-1 text-sm text-cocoa-soft">{c.phone}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-cocoa-soft/70">
                  <span>{c.orders} pedido{c.orders > 1 ? "s" : ""}</span>
                  <span>Último: {format(c.lastOrder, "dd/MM/yyyy")}</span>
                  <span>{formatBRL(c.spent)}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
