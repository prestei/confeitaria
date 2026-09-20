import Link from "next/link";
import { connectDB } from "@/lib/db";
import { leanDoc } from "@/lib/serialize";
import { Store } from "@/models/Store";
import { Order } from "@/models/Order";
import { formatBRL, PAYMENT_STATUS_LABELS } from "@/lib/utils";

export default async function OrderPaidPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string; status?: string }>;
}) {
  const { slug } = await params;
  const { id, status: statusParam } = await searchParams;

  await connectDB();
  const store = leanDoc(await Store.findOne({ slug }).lean());

  const order =
    id && store
      ? leanDoc(
          await Order.findOne({ _id: id, storeId: store.id })
            .select({
              paymentStatus: 1,
              totalCents: 1,
              customerName: 1,
            })
            .lean(),
        )
      : null;

  const paymentStatus = (order?.paymentStatus ??
    "PENDING") as keyof typeof PAYMENT_STATUS_LABELS;
  const isApproved =
    paymentStatus === "APPROVED" || statusParam === "approved";
  const isRejected =
    paymentStatus === "REJECTED" || statusParam === "rejected";

  const title = isApproved
    ? "Pagamento confirmado"
    : isRejected
      ? "Pagamento não aprovado"
      : "Pagamento em análise";

  const description = isApproved
    ? "Recebemos seu pagamento. A confeitaria já pode preparar seu pedido."
    : isRejected
      ? "O pagamento foi recusado. Você pode tentar novamente pelo cardápio ou combinar outra forma com a loja."
      : "Se você pagou com Pix, a confirmação pode levar alguns instantes. A loja será avisada assim que o Mercado Pago confirmar.";

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg items-center px-5 py-16">
      <div className="panel w-full p-8 text-center">
        <h1 className="font-display text-3xl text-cocoa">{title}</h1>
        <p className="mt-3 text-cocoa-soft/80">{description}</p>
        {order && (
          <div className="mt-5 space-y-1 text-sm text-cocoa-soft/70">
            <p>Olá, {order.customerName}</p>
            <p>Total: {formatBRL(order.totalCents)}</p>
            <p>{PAYMENT_STATUS_LABELS[paymentStatus]}</p>
            <p className="text-xs text-cocoa-soft/55">
              Ref: {order.id.slice(0, 8)}
            </p>
          </div>
        )}
        <Link href={`/${slug}`} className="btn-primary mt-6 inline-flex">
          Voltar ao cardápio
        </Link>
      </div>
    </main>
  );
}
