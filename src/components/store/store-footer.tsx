import Link from "next/link";
import { digitsOnly } from "@/lib/utils";
import { cn } from "@/lib/cn";

export function StoreFooter({
  store,
  tone = "light",
}: {
  store: {
    slug: string;
    name: string;
    logoUrl: string | null;
    whatsapp: string;
    city: string | null;
    address: string | null;
  };
  tone?: "light" | "dark";
}) {
  const wa = `https://wa.me/55${digitsOnly(store.whatsapp)}`;
  const dark = tone === "dark";

  return (
    <footer
      className={cn(
        "border-t",
        dark
          ? "border-white/10 bg-[#0b0b0b]"
          : "border-berry/10 bg-gradient-to-b from-blush/30 to-cream",
      )}
    >
      <div className="shell grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p
            className={cn(
              "font-display text-2xl",
              dark ? "text-white" : "text-cocoa",
            )}
          >
            {store.name}
          </p>
          <p
            className={cn(
              "mt-2 text-sm",
              dark ? "text-white/45" : "text-cocoa-soft/70",
            )}
          >
            {[store.address, store.city].filter(Boolean).join(" · ") ||
              "Pedidos pelo cardápio online"}
          </p>
        </div>
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              dark ? "text-white" : "text-cocoa",
            )}
          >
            Navegação
          </p>
          <ul
            className={cn(
              "mt-3 space-y-2 text-sm",
              dark ? "text-white/55" : "text-cocoa-soft/80",
            )}
          >
            <li>
              <a
                href="#cardapio-mobile"
                className={dark ? "hover:text-white" : "hover:text-berry-deep"}
              >
                Cardápio
              </a>
            </li>
            <li>
              <Link
                href={`/${store.slug}/encomenda`}
                className={dark ? "hover:text-white" : "hover:text-berry-deep"}
              >
                Encomenda
              </Link>
            </li>
            <li>
              <Link
                href={`/${store.slug}/carrinho`}
                className={dark ? "hover:text-white" : "hover:text-berry-deep"}
              >
                Carrinho
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              dark ? "text-white" : "text-cocoa",
            )}
          >
            Contato
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="btn-berry mt-3 inline-flex !py-2 text-sm"
          >
            WhatsApp
          </a>
        </div>
      </div>
      <div
        className={cn(
          "border-t py-4 text-center text-xs",
          dark
            ? "border-white/10 text-white/35"
            : "border-berry/10 text-cocoa-soft/55",
        )}
      >
        Powered by DocePedido
      </div>
    </footer>
  );
}
