import Link from "next/link";

export default async function OrderSentPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ id?: string }>;
}) {
  const { slug } = await params;
  const { id } = await searchParams;

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg items-center px-5 py-16">
      <div className="panel w-full p-8 text-center">
        <div className="text-5xl">✨</div>
        <h1 className="mt-4 font-display text-3xl text-cocoa">Pedido preparado</h1>
        <p className="mt-3 text-cocoa-soft/80">
          Abrimos o WhatsApp com a mensagem estruturada. Se a janela não abriu,
          volte e tente novamente.
        </p>
        {id && (
          <p className="mt-2 text-xs text-cocoa-soft/55">Ref: {id.slice(0, 8)}</p>
        )}
        <Link href={`/${slug}`} className="btn-primary mt-6 inline-flex">
          Voltar ao cardápio
        </Link>
      </div>
    </main>
  );
}
