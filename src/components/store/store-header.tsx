"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  MapPin,
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
import { getStoreOpenStatus } from "@/lib/hours";
import { trackStoreEvent } from "@/lib/analytics";

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
  pickupEnabled: boolean;
  productionNote: string | null;
  businessHours?: string | null;
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
  const [logoFailed, setLogoFailed] = useState(false);

  const wa = `https://wa.me/55${digitsOnly(store.whatsapp)}`;
  const cover =
    store.coverUrl ||
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1600&q=80";
  const location = [store.address, store.city].filter(Boolean).join(" · ") || null;
  const openStatus = useMemo(
    () => getStoreOpenStatus(store.businessHours),
    [store.businessHours],
  );
  const isOpen = store.isPublished && openStatus.open;

  function trackWhatsApp() {
    trackStoreEvent({
      storeSlug: store.slug,
      type: "WHATSAPP_CLICK",
      source: "header",
    });
  }

  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8);
  }, [products, query]);

  const deliveryFeeLabel =
    store.deliveryEnabled && minDeliveryFeeCents != null
      ? `A partir de ${formatBRL(minDeliveryFeeCents)}`
      : null;

  const iconBtn =
    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-cocoa/10 bg-surface text-cocoa shadow-sm transition hover:border-rosewood/30 hover:bg-sand hover:text-rosewood-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rosewood sm:h-11 sm:w-11";

  const initials = store.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <header className="relative z-40 bg-transparent">
      {/* 1) Capa full-width */}
      <div
        className="h-40 w-full bg-cover bg-center sm:h-52 md:h-60"
        style={{ backgroundImage: `url(${cover})` }}
        role="img"
        aria-label={`Capa de ${store.name}`}
      />

      {/* 2) Card flutuante sobreposto à capa */}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-3 sm:px-4 md:px-6">
        <div className="-mt-11 sm:-mt-16 md:-mt-[4.5rem]">
          <div className="rounded-2xl border border-cocoa/8 bg-surface shadow-[0_14px_40px_rgba(51,37,34,0.1)]">
            <div className="flex flex-col gap-3 p-3 sm:gap-4 sm:p-4 lg:flex-row lg:items-center lg:gap-5 lg:px-5 lg:py-4">
              {/* Identidade */}
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center sm:gap-4">
                <Link
                  href={`/${store.slug}`}
                  className="-mt-9 shrink-0 sm:-mt-12 md:-mt-14"
                  aria-label={store.name}
                >
                  {store.logoUrl && !logoFailed ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={store.logoUrl}
                      alt=""
                      onError={() => setLogoFailed(true)}
                      className="h-[4rem] w-[4rem] rounded-xl object-cover shadow-[0_10px_28px_rgba(51,37,34,0.2)] ring-[3px] ring-surface sm:h-[5rem] sm:w-[5rem] md:h-[5.25rem] md:w-[5.25rem]"
                    />
                  ) : (
                    <div className="flex h-[4rem] w-[4rem] items-center justify-center rounded-xl bg-sand font-display text-xl text-rosewood shadow-[0_10px_28px_rgba(51,37,34,0.2)] ring-[3px] ring-surface sm:h-[5rem] sm:w-[5rem] sm:text-2xl md:h-[5.25rem] md:w-[5.25rem]">
                      {initials || "DP"}
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/${store.slug}`}>
                        <h1 className="truncate font-display text-[1.25rem] leading-none text-cocoa sm:text-2xl md:text-[1.75rem]">
                          {store.name}
                        </h1>
                      </Link>
                      {location && (
                        <p className="mt-1 flex items-start gap-1 text-xs text-cocoa-soft/65 sm:text-sm">
                          <MapPin
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rosewood"
                            aria-hidden
                          />
                          <span className="min-w-0 leading-snug">{location}</span>
                        </p>
                      )}
                    </div>

                    {/* Ações compactas no mobile (ao lado do nome) */}
                    <div className="flex shrink-0 items-center gap-1.5 sm:hidden">
                      <Link
                        href={`/${store.slug}/carrinho`}
                        className={`relative ${iconBtn}`}
                        aria-label={`Pedido com ${count} itens`}
                      >
                        <ShoppingBag className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                        {count > 0 && (
                          <motion.span
                            key={count}
                            initial={{ scale: 0.6 }}
                            animate={{ scale: 1 }}
                            className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-rosewood px-1 text-[9px] font-bold text-white"
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
                        <Menu className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-2.5 sm:gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white ${
                        isOpen ? "bg-emerald-600" : "bg-cocoa-soft"
                      }`}
                      title={openStatus.todayLabel ?? openStatus.label}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
                      {isOpen ? "Aberto" : "Fechado"}
                    </span>
                    {store.deliveryEnabled && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-2.5 py-1 text-[11px] font-medium text-cocoa-soft">
                        <Truck className="h-3.5 w-3.5 text-rosewood" aria-hidden />
                        {deliveryFeeLabel ?? "Delivery"}
                      </span>
                    )}
                    {store.pickupEnabled && (
                      <span className="inline-flex items-center rounded-full bg-sand px-2.5 py-1 text-[11px] font-medium text-cocoa-soft">
                        Retirada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Busca + ações (desktop / tablet) */}
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
                    className="h-10 w-full rounded-full border border-cocoa/10 bg-ivory py-2.5 pl-10 pr-4 text-sm text-cocoa outline-none transition placeholder:text-cocoa-soft/40 focus:border-rosewood focus:ring-2 focus:ring-rosewood/15 sm:h-11"
                    autoComplete="off"
                  />
                  {searchOpen && hits.length > 0 && (
                    <ul className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-50 overflow-hidden rounded-xl border border-cocoa/10 bg-surface shadow-xl">
                      {hits.map((p) => (
                        <li key={p.slug}>
                          <Link
                            href={`/${store.slug}/produto/${p.slug}`}
                            className="block px-4 py-2.5 text-sm text-cocoa transition hover:bg-sand"
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

                <Link
                  href="/entrar"
                  className={`hidden sm:inline-flex ${iconBtn}`}
                  aria-label="Conta"
                >
                  <UserRound className="h-5 w-5" aria-hidden />
                </Link>

                <Link
                  href={`/${store.slug}/carrinho`}
                  className={`relative hidden sm:inline-flex ${iconBtn}`}
                  aria-label={`Pedido com ${count} itens`}
                >
                  <ShoppingBag className="h-5 w-5" aria-hidden />
                  {count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rosewood px-1 text-[10px] font-bold text-white"
                    >
                      {count}
                    </motion.span>
                  )}
                </Link>

                <button
                  type="button"
                  className={`hidden sm:inline-flex ${iconBtn}`}
                  onClick={() => setMenuOpen(true)}
                  aria-label="Abrir menu"
                >
                  <Menu className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>
          </div>

          {/* 3) Barra secundária */}
          {store.productionNote && (
            <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-cocoa/8 bg-sand/90 px-3.5 py-2.5 sm:px-4">
              <Moon className="h-4 w-4 shrink-0 text-rosewood" aria-hidden />
              <p className="min-w-0 flex-1 truncate text-sm text-cocoa-soft">
                {store.productionNote}
              </p>
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                onClick={trackWhatsApp}
                className="shrink-0 rounded-md bg-cocoa px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-cocoa-soft"
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
              className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-surface shadow-2xl"
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
                  className="rounded-xl px-4 py-3 font-medium text-cocoa hover:bg-sand"
                >
                  Cardápio
                </a>
                <Link
                  href={`/${store.slug}/encomenda`}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-4 py-3 font-medium text-cocoa hover:bg-sand"
                >
                  Encomenda personalizada
                </Link>
                {categories.map((c) => (
                  <a
                    key={c.slug}
                    href={`#cat-${c.slug}`}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-xl px-4 py-3 text-cocoa-soft hover:bg-sand hover:text-cocoa"
                  >
                    {c.emoji ? `${c.emoji} ` : ""}
                    {c.name}
                  </a>
                ))}
                <a
                  href={wa}
                  target="_blank"
                  rel="noreferrer"
                  onClick={trackWhatsApp}
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
