"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Menu,
  Search,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";
import { useCart } from "@/components/cart/cart-context";
import { priceLabel } from "@/components/store/product-card";
import { formatBRL } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { effectivePriceCents, hasPromoPrice } from "@/lib/pricing";
import type { PriceMode, ProductType } from "@/lib/enums";

type Category = { id: string; slug: string; name: string; emoji: string | null };

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  productType: ProductType;
  priceMode: PriceMode;
  priceCents: number | null;
  promoPriceCents?: number | null;
  featured: boolean;
  categoryId: string | null;
};

export function StoreDesktopMenuStart({
  store,
  categories,
  featured,
  fromPriceCents,
}: {
  store: {
    slug: string;
    name: string;
    city: string | null;
    coverUrl: string | null;
    logoUrl: string | null;
    productionNote: string | null;
    minAdvanceDays: number;
  };
  categories: Category[];
  featured: Product[];
  fromPriceCents: number | null;
}) {
  const { count } = useCart();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("destaques");

  const cover =
    store.coverUrl ||
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1800&q=80";

  const promos = useMemo(() => {
    const list = featured.slice(0, 3);
    while (list.length < 3 && featured[list.length]) {
      list.push(featured[list.length]);
    }
    return list;
  }, [featured]);

  const filteredPromos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return promos;
    return featured
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      )
      .slice(0, 6);
  }, [featured, promos, query]);

  const displayCards = query.trim() ? filteredPromos : promos;

  function scrollCats(dir: -1 | 1) {
    const el = document.getElementById("desktop-cat-scroll");
    if (!el) return;
    el.scrollBy({ left: dir * 220, behavior: "smooth" });
  }

  return (
    <div className="menu-desktop-start relative bg-[#0b0b0b] text-white">
      {/* Banner de fundo */}
      <div className="relative h-44 overflow-hidden lg:h-52">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center blur-[2px]"
          style={{ backgroundImage: `url(${cover})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-[#0b0b0b]" />
      </div>

      <div className="relative z-10 mx-auto -mt-24 max-w-[1400px] px-6 lg:px-10 xl:px-12">
        {/* Header flutuante */}
        <header className="flex items-center gap-5 rounded-2xl border border-white/8 bg-[#161616]/95 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-md lg:gap-8 lg:px-6 lg:py-5">
          <Link href={`/${store.slug}`} className="flex min-w-0 items-center gap-3.5">
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-berry to-berry-deep text-2xl">
                🍰
              </div>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl leading-tight tracking-tight lg:text-[1.65rem]">
                {store.name}
              </h1>
              {store.city && (
                <p className="mt-0.5 text-sm text-white/45">{store.city}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Aberto para pedidos
                </span>
                {fromPriceCents != null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-2.5 py-1 text-[11px] font-medium text-white/70">
                    <ShoppingBag className="h-3 w-3 text-amber-300" aria-hidden />
                    A partir de {formatBRL(fromPriceCents)}
                  </span>
                )}
              </div>
            </div>
          </Link>

          <label className="relative mx-auto hidden min-w-0 max-w-xl flex-1 lg:block">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar produto..."
              className="w-full rounded-full border border-white/8 bg-[#0f0f0f] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-berry/50"
            />
          </label>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              href="/entrar"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-white/14"
              aria-label="Conta"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              href={`/${store.slug}/carrinho`}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-white/14"
              aria-label={`Carrinho com ${count} itens`}
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-berry px-1 text-[10px] font-bold">
                  {count}
                </span>
              )}
            </Link>
            <Link
              href={`/${store.slug}/encomenda`}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/8 text-white/80 transition hover:bg-white/14"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </Link>
          </div>
        </header>

        {/* Faixa de aviso */}
        <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-amber-400/35 bg-[#141210] px-4 py-3 lg:px-5">
          <p className="text-sm text-white/75">
            {store.productionNote ||
              (store.minAdvanceDays > 0
                ? `Encomendas de bolos personalizados com mínimo de ${store.minAdvanceDays} dias de antecedência.`
                : "Peça com antecedência para garantir a data do seu evento.")}
          </p>
          <a
            href="#prazos"
            className="shrink-0 rounded-full bg-amber-400 px-4 py-1.5 text-xs font-bold text-black transition hover:bg-amber-300"
          >
            Ver prazos
          </a>
        </div>

        {/* Busca mobile-desktop intermediário */}
        <label className="relative mt-4 block lg:hidden">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar produto..."
            className="w-full rounded-full border border-white/8 bg-[#161616] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35"
          />
        </label>

        {/* Banners de destaque */}
        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayCards.length === 0 && (
            <p className="col-span-full rounded-2xl border border-white/8 bg-[#161616] px-5 py-10 text-center text-white/50">
              Nenhum produto encontrado para “{query}”.
            </p>
          )}
          {displayCards.map((p) => (
            <Link
              key={p.id}
              href={`/${store.slug}/produto/${p.slug}`}
              className="group relative aspect-[16/11] overflow-hidden rounded-2xl bg-[#1a1a1a] ring-1 ring-white/6 transition hover:ring-berry/40"
            >
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] to-[#111]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
              {p.featured && (
                <span className="absolute right-3 top-3 rounded-md bg-berry px-2 py-1 text-[10px] font-bold tracking-wide text-white">
                  DESTAQUE
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h2 className="font-display text-2xl leading-tight text-white lg:text-[1.65rem]">
                  {p.name}
                </h2>
                {p.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-white/70">
                    {p.description}
                  </p>
                )}
                <p className="mt-3 text-base font-bold text-amber-300">
                  {priceLabel(
                    p.priceMode,
                    effectivePriceCents(p),
                    hasPromoPrice(p) ? p.priceCents : null,
                  )}
                </p>
              </div>
            </Link>
          ))}
        </section>

        {/* Categorias */}
        <nav
          className="mt-7 flex items-center gap-2 pb-8"
          aria-label="Categorias do cardápio"
        >
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1c1c1c] text-white/70 transition hover:bg-[#262626]"
            aria-label="Ver todas"
            onClick={() => {
              setActiveCat("destaques");
              document.getElementById("cardapio")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>

          <div
            id="desktop-cat-scroll"
            className="scrollbar-thin flex min-w-0 flex-1 gap-2 overflow-x-auto"
          >
            <a
              href="#destaques"
              onClick={() => setActiveCat("destaques")}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                activeCat === "destaques"
                  ? "bg-berry text-white shadow-lg shadow-berry/30"
                  : "bg-[#1c1c1c] text-white/75 hover:bg-[#262626]",
              )}
            >
              <Star className="h-3.5 w-3.5" aria-hidden />
              Mais pedidos
            </a>
            {categories.map((c) => (
              <a
                key={c.id}
                href={`#cat-${c.slug}`}
                onClick={() => setActiveCat(c.slug)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition",
                  activeCat === c.slug
                    ? "bg-berry text-white shadow-lg shadow-berry/30"
                    : "bg-[#1c1c1c] text-white/75 hover:bg-[#262626]",
                )}
              >
                <span aria-hidden>{c.emoji || "•"}</span>
                {c.name}
              </a>
            ))}
          </div>

          <div className="hidden shrink-0 gap-1 sm:flex">
            <button
              type="button"
              onClick={() => scrollCats(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1c1c1c] text-white/70 transition hover:bg-[#262626]"
              aria-label="Categorias anteriores"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scrollCats(1)}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1c1c1c] text-white/70 transition hover:bg-[#262626]"
              aria-label="Próximas categorias"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}
