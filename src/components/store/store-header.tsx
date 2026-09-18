"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Menu,
  Moon,
  Search,
  ShoppingBag,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "@/components/cart/cart-context";
import { digitsOnly, formatBRL } from "@/lib/utils";

type StoreHeaderStore = {
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  whatsapp: string;
  city: string | null;
  address: string | null;
  isPublished: boolean;
  deliveryEnabled: boolean;
  productionNote: string | null;
};

type Category = { slug: string; name: string; emoji: string | null };
type ProductHit = { slug: string; name: string };

export function StoreHeader({
  store,
  categories = [],
  products = [],
  minDeliveryFeeCents = null,
}: {
  store: StoreHeaderStore;
  categories?: Category[];
  products?: ProductHit[];
  minDeliveryFeeCents?: number | null;
}) {
  const { count } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const wa = `https://wa.me/55${digitsOnly(store.whatsapp)}`;
  const cover =
    store.coverUrl ||
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80";
  const location = store.city || store.address || null;

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, query]);

  const deliveryLabel =
    store.deliveryEnabled && minDeliveryFeeCents != null
      ? `A partir de ${formatBRL(minDeliveryFeeCents)}`
      : store.deliveryEnabled
        ? "Entrega disponível"
        : "Retirada no local";

  const iconBtn =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cocoa/10 bg-white text-cocoa shadow-sm transition hover:border-berry/35 hover:bg-blush/60 hover:text-berry-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-berry";

  return (
    <header className="relative z-40 bg-transparent">
      {/* 1) Capa full-width */}
      <div
        className="h-[7.5rem] w-full bg-cover bg-center sm:h-36 md:h-[10.5rem]"
        style={{ backgroundImage: `url(${cover})` }}
        role="img"
        aria-label={`Capa de ${store.name}`}
      />

      {/* 2) Card flutuante sobreposto à capa */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-3 sm:px-4 md:px-6">
        <div className="-mt-11 sm:-mt-14 md:-mt-16">
          <div className="rounded-[1.75rem] border border-berry/12 bg-cream shadow-[0_16px_48px_rgba(31,18,14,0.16)] sm:rounded-[2rem]">
            <div className="flex flex-col gap-4 p-3 sm:p-4 lg:flex-row lg:items-center lg:gap-5 lg:px-5 lg:py-4">
              {/* Esquerda */}
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <Link
                  href={`/${store.slug}`}
                  className="-mt-10 shrink-0 sm:-mt-12 md:-mt-14"
                  aria-label={store.name}
                >
                  {store.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.logoUrl}
                      alt=""
                      className="h-[4.25rem] w-[4.25rem] rounded-[1.15rem] object-cover shadow-[0_10px_28px_rgba(31,18,14,0.28)] ring-[3px] ring-cream sm:h-[5rem] sm:w-[5rem] md:h-[5.25rem] md:w-[5.25rem]"
                    />
                  ) : (
                    <div className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-[1.15rem] bg-gradient-to-br from-blush to-butter text-3xl shadow-[0_10px_28px_rgba(31,18,14,0.28)] ring-[3px] ring-cream sm:h-[5rem] sm:w-[5rem] md:h-[5.25rem] md:w-[5.25rem]">
                      🍰
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <Link href={`/${store.slug}`}>
                    <h1 className="truncate font-display text-[1.35rem] leading-none text-cocoa sm:text-2xl md:text-[1.75rem]">
                      {store.name}
                    </h1>
                  </Link>
                  {location && (
                    <p className="mt-1 truncate text-sm text-cocoa-soft/65">
                      {location}
                    </p>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-berry px-2.5 py-1 text-[11px] font-semibold text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                      {store.isPublished ? "Aberto" : "Fechado"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-cocoa/[0.06] px-2.5 py-1 text-[11px] font-medium text-cocoa-soft">
                      <Truck className="h-3.5 w-3.5 text-berry" aria-hidden />
                      {deliveryLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direita */}
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="relative min-w-0 flex-1 lg:w-[min(24rem,34vw)] lg:flex-none">
                  <label className="sr-only" htmlFor="store-product-search">
                    Pesquisar produto
                  </label>
                  <Search
                    className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-soft/45"
                    aria-hidden
                  />
                  <input
                    id="store-product-search"
                    type="search"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSearchOpen(true);
                    }}
                    onFocus={() => setSearchOpen(true)}
                    onBlur={() => {
                      window.setTimeout(() => setSearchOpen(false), 150);
                    }}
                    placeholder="Pesquisar produto..."
                    className="h-11 w-full rounded-full border border-cocoa/10 bg-white py-2.5 pl-10 pr-4 text-sm text-cocoa outline-none transition placeholder:text-cocoa-soft/40 focus:border-berry focus:ring-2 focus:ring-berry/20"
                    autoComplete="off"
                  />
                  {searchOpen && hits.length > 0 && (
                    <ul className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-2xl border border-berry/15 bg-cream shadow-xl">
                      {hits.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={`/${store.slug}/produto/${p.slug}`}
                            className="block px-4 py-2.5 text-sm text-cocoa transition hover:bg-blush/60"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setQuery("");
                              setSearchOpen(false);
                            }}
                          >
                            {p.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Link href="/entrar" className={iconBtn} aria-label="Conta">
                  <UserRound className="h-5 w-5" aria-hidden />
                </Link>

                <Link
                  href={`/${store.slug}/carrinho`}
                  className={`relative ${iconBtn}`}
                  aria-label={`Pedido com ${count} itens`}
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-[10px] font-bold text-white"
                    >
                      {count}
                    </motion.span>
                  )}
                </Link>

                <button
                  type="button"
                  className={iconBtn}
                  onClick={() => setMenuOpen(true)}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* 3) Barra secundária (modelo Kadan) */}
          {store.productionNote && (
            <div className="mt-2.5 flex items-center gap-3 rounded-2xl border border-caramel/25 bg-butter/80 px-3.5 py-2.5 sm:px-4">
              <Moon className="h-4 w-4 shrink-0 text-caramel" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-sm text-cocoa-soft">
                {store.productionNote}
              </p>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 rounded-full bg-cocoa px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-cocoa-soft"
              >
                Contato
              </a>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-cocoa/40"
              aria-label="Fechar menu"
              onClick={() => setMenuOpen(false)}
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-cream shadow-2xl"
              aria-label="Menu da loja"
            >
              <div className="flex items-center justify-between border-b border-cocoa/8 px-5 py-4">
                <span className="font-display text-lg text-cocoa">Menu</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl p-2 hover:bg-cocoa/5"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                <a
                  href="#cardapio"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-medium text-cocoa hover:bg-white"
                >
                  Cardápio
                </a>
                <Link
                  href={`/${store.slug}/encomenda`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-medium text-cocoa hover:bg-white"
                >
                  Encomenda personalizada
                </Link>
                {categories.map((c) => (
                  <a
                    key={c.slug}
                    href={`#cat-${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-cocoa-soft hover:bg-white hover:text-cocoa"
                  >
                    {c.emoji ? `${c.emoji} ` : ""}
                    {c.name}
                  </a>
                ))}
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 btn-berry text-center"
                >
                  WhatsApp
                </a>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
