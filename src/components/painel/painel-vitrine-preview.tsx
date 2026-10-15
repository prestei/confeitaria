import Link from "next/link";
import { digitsOnly } from "@/lib/utils";

export function PainelVitrinePreview({
  store,
  publicPath,
}: {
  store: {
    name: string;
    slug: string;
    logoUrl: string | null;
    coverUrl: string | null;
    description: string | null;
    whatsapp: string;
    paymentMethods: string[];
  };
  publicPath: string;
}) {
  const wa = `https://wa.me/55${digitsOnly(store.whatsapp)}`;
  const payments = store.paymentMethods?.slice(0, 4) ?? [];

  return (
    <aside className="hidden w-[min(100%,280px)] shrink-0 xl:block">
      <div className="sticky top-6">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-[#9A8F88]">
          Pré-visualização
        </p>
        <div className="mx-auto rounded-[2rem] border-[10px] border-[var(--painel-brand)] bg-[var(--painel-brand)] p-1 shadow-xl">
          <div className="overflow-hidden rounded-[1.4rem] bg-[#FFFBF7]">
            <div className="h-6 bg-[#FFFBF7]" />
            {store.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.coverUrl}
                alt=""
                className="h-28 w-full object-cover"
              />
            ) : (
              <div className="h-28 bg-gradient-to-b from-[#F5E6DC] to-[#FFFBF7]" />
            )}
            <div className="-mt-8 flex flex-col items-center px-4 pb-4 pt-0 text-center">
              {store.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={store.logoUrl}
                  alt=""
                  className="h-14 w-14 rounded-full border-4 border-[#FFFBF7] object-cover shadow-md"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#FFFBF7] bg-[#F8D4DC] text-sm font-bold text-[#4A3728] shadow-md">
                  {store.name.slice(0, 1)}
                </div>
              )}
              <p className="mt-2 text-sm font-semibold text-[#4A3728]">
                {store.name}
              </p>
              {store.description ? (
                <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-[#8C7A72]">
                  {store.description}
                </p>
              ) : null}
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="mt-3 w-full rounded-full bg-[#25D366] py-2 text-[11px] font-semibold text-white"
              >
                Pedir pelo WhatsApp
              </a>
              {payments.length > 0 ? (
                <div className="mt-3 flex flex-wrap justify-center gap-1">
                  {payments.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-[#6B5B52] ring-1 ring-[var(--painel-border)]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <Link
          href={publicPath}
          target="_blank"
          className="mt-4 block text-center text-xs font-semibold text-[var(--painel-accent)] hover:underline"
        >
          Abrir vitrine completa
        </Link>
      </div>
    </aside>
  );
}
