import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/store/product-card";
import { StoreFooter } from "@/components/store/store-footer";
import { StoreCategoryNav } from "@/components/store/store-category-nav";
import { StoreProductGrid } from "@/components/store/store-product-grid";
import { StoreInfoBar } from "@/components/store/store-info-bar";
import { StoreSectionTitle } from "@/components/store/store-section-title";
import { StoreCustomOrderBanner } from "@/components/store/store-custom-order-banner";
import { formatBRL } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      products: {
        where: { active: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      },
      deliveryZones: true,
    },
  });
  if (!store || !store.isPublished) notFound();

  const featured = store.products.filter((p) => p.featured);

  return (
    <main>
      <StoreInfoBar
        address={store.address}
        city={store.city}
        productionNote={null}
        minAdvanceDays={store.minAdvanceDays}
        description={store.description}
      />

      <section id="cardapio" className="shell scroll-mt-24 pb-6 pt-4">
        <StoreSectionTitle eyebrow="Navegue">Categorias</StoreSectionTitle>
        <StoreCategoryNav categories={store.categories} />
      </section>

      {featured.length > 0 && (
        <section className="shell pb-14 pt-4">
          <StoreSectionTitle eyebrow="Para se apaixonar">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-berry" aria-hidden />
              Destaques
            </span>
          </StoreSectionTitle>
          <StoreProductGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} storeSlug={store.slug} product={p} />
            ))}
          </StoreProductGrid>
        </section>
      )}

      {store.categories.map((cat, idx) => {
        const products = store.products.filter((p) => p.categoryId === cat.id);
        if (!products.length) return null;
        const band = idx % 2 === 1;
        return (
          <section
            key={cat.id}
            id={`cat-${cat.slug}`}
            className={
              band
                ? "bg-gradient-to-b from-blush/40 via-transparent to-transparent py-4"
                : ""
            }
          >
            <div className="shell scroll-mt-24 pb-14">
              <StoreSectionTitle>
                {cat.emoji ? `${cat.emoji} ` : ""}
                {cat.name}
              </StoreSectionTitle>
              <StoreProductGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} storeSlug={store.slug} product={p} />
                ))}
              </StoreProductGrid>
            </div>
          </section>
        );
      })}

      <StoreCustomOrderBanner slug={store.slug} />

      <section className="shell pb-20">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl border border-berry/15 bg-gradient-to-br from-white to-blush/50 p-6 shadow-[0_12px_36px_rgba(212,82,122,0.1)] sm:p-8">
            <h3 className="font-display text-2xl text-cocoa sm:text-3xl">
              Retirada e entrega
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-cocoa-soft/85">
              {store.pickupEnabled && (
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-berry" />
                  Retirada no local
                </li>
              )}
              {store.deliveryEnabled && (
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-caramel" />
                  Entrega nas regiões abaixo
                </li>
              )}
              {store.deliveryZones.map((z) => (
                <li key={z.id} className="pl-4 text-cocoa-soft/75">
                  {z.name} — {formatBRL(z.feeCents)}
                </li>
              ))}
              {!store.pickupEnabled &&
                !store.deliveryEnabled &&
                store.deliveryZones.length === 0 && (
                  <li>Consulte disponibilidade no WhatsApp</li>
                )}
            </ul>
          </div>
          <div className="rounded-3xl border border-caramel/25 bg-gradient-to-br from-butter/60 to-white p-6 shadow-[0_12px_36px_rgba(232,160,106,0.15)] sm:p-8">
            <h3 className="font-display text-2xl text-cocoa sm:text-3xl">
              Pagamento
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-cocoa-soft/85">
              {store.paymentMethods.map((m) => (
                <li key={m} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-berry" />
                  {m}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/${store.slug}/carrinho`} className="btn-berry !py-2.5 text-sm">
                Finalizar pedido
              </Link>
              <Link
                href={`/${store.slug}/encomenda`}
                className="btn-secondary !py-2.5 text-sm"
              >
                Orçamento
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StoreFooter store={store} />
    </main>
  );
}
