import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { leanDoc, leanList } from "@/lib/serialize";
import { storefrontProductQuery } from "@/lib/storefront";
import { digitsOnly, acceptsCardBrands, CARD_BRAND_PRESETS } from "@/lib/utils";
import { Store } from "@/models/Store";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { ProductCard } from "@/components/store/product-card";

export const dynamic = "force-dynamic";

function instagramHref(value: string) {
  const handle = value.replace(/^@/, "").trim();
  if (handle.startsWith("http")) return handle;
  return `https://instagram.com/${handle}`;
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  await connectDB();

  const store = leanDoc(
    await Store.findOne({ slug, isPublished: true }).lean(),
  );
  if (!store) notFound();

  const [products, categories] = await Promise.all([
    leanList(
      await Product.find(storefrontProductQuery(store.id))
        .sort({ featured: -1, sortOrder: 1, name: 1 })
        .lean(),
    ),
    leanList(
      await Category.find({ storeId: store.id, active: true })
        .sort({ sortOrder: 1, name: 1 })
        .lean(),
    ),
  ]);

  const wa = `https://wa.me/55${digitsOnly(store.whatsapp)}`;
  const initials = store.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => word[0]?.toUpperCase())
    .join("");

  const byCategory = new Map<string | null, typeof products>();
  for (const product of products) {
    const key = product.categoryId ?? null;
    const list = byCategory.get(key) ?? [];
    list.push(product);
    byCategory.set(key, list);
  }

  const orderedCategories = categories.filter((cat) =>
    (byCategory.get(cat.id)?.length ?? 0) > 0,
  );
  const uncategorized = byCategory.get(null) ?? [];

  const showBrands = acceptsCardBrands(store.paymentMethods ?? []);
  const brands = (store.cardBrands ?? []).filter((b: string) =>
    (CARD_BRAND_PRESETS as readonly string[]).includes(b),
  );

  return (
    <main className="mx-auto max-w-lg px-4 pb-28 pt-6">
      {store.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={store.coverUrl}
          alt=""
          className="mb-6 h-40 w-full rounded-2xl object-cover"
        />
      ) : null}

      <section className="flex flex-col items-center text-center">
        {store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.logoUrl}
            alt=""
            className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rosewood/15 text-lg font-semibold text-rosewood ring-4 ring-white">
            {initials}
          </div>
        )}
        <h1 className="mt-4 font-display text-3xl text-cocoa">{store.name}</h1>
        {store.tagline ? (
          <p className="mt-1 text-sm font-medium text-rosewood">{store.tagline}</p>
        ) : null}
        {store.description && (
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-cocoa-soft/80">
            {store.description}
          </p>
        )}
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex w-full max-w-xs items-center justify-center rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-sm"
        >
          Pedir pelo WhatsApp
        </a>
      </section>

      <section className="mt-8 space-y-3 rounded-2xl border border-cocoa/8 bg-white p-4 text-sm text-cocoa-soft/85">
        {store.businessHours ? (
          <p>
            <span className="font-semibold text-cocoa">Horário:</span>{" "}
            {store.businessHours}
          </p>
        ) : null}
        {(store.address || store.city) && (
          <p>
            <span className="font-semibold text-cocoa">Retirada:</span>{" "}
            {[store.address, store.city].filter(Boolean).join(" · ")}
            {store.pickupInstructions ? ` — ${store.pickupInstructions}` : ""}
          </p>
        )}
        {store.deliveryEnabled ? (
          <p>
            <span className="font-semibold text-cocoa">Entrega:</span>{" "}
            {store.deliveryInstructions || "Consulte disponibilidade pelo WhatsApp"}
            {store.deliveryFeeCents
              ? ` · taxa ${(store.deliveryFeeCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
              : ""}
          </p>
        ) : null}
        {store.paymentMethods?.length ? (
          <p>
            <span className="font-semibold text-cocoa">Pagamento:</span>{" "}
            {store.paymentMethods.join(" · ")}
            {showBrands && brands.length
              ? ` (${brands.join(", ")})`
              : ""}
          </p>
        ) : null}
      </section>

      {orderedCategories.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-cocoa-soft/60">
            Categorias
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {orderedCategories.map((cat) => (
              <a
                key={cat.id}
                href={`#cat-${cat.slug}`}
                className="flex flex-col items-center justify-center rounded-2xl border border-cocoa/8 bg-white px-3 py-4 text-center transition hover:border-cocoa/20"
              >
                <span className="text-2xl" aria-hidden>
                  {cat.emoji || "🍰"}
                </span>
                <span className="mt-2 text-sm font-semibold text-cocoa">
                  {cat.name}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {orderedCategories.map((cat) => (
        <section key={cat.id} id={`cat-${cat.slug}`} className="mt-10">
          <h2 className="mb-3 font-display text-xl text-cocoa">
            {cat.emoji ? `${cat.emoji} ` : ""}
            {cat.name}
          </h2>
          <div className="rounded-2xl border border-cocoa/8 bg-white px-4">
            {(byCategory.get(cat.id) ?? []).map((product) => (
              <ProductCard
                key={product.id}
                storeSlug={store.slug}
                product={{
                  slug: product.slug,
                  name: product.name,
                  description: product.description,
                  imageUrl: product.imageUrl,
                  productType: product.productType,
                  priceMode: product.priceMode,
                  priceCents: product.priceCents,
                  availability: product.availability,
                  featured: product.featured,
                  trackStock: product.trackStock,
                  stockQty: product.stockQty,
                  unit: product.unit,
                }}
              />
            ))}
          </div>
        </section>
      ))}

      {uncategorized.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-xl text-cocoa">Nossos produtos</h2>
          <div className="rounded-2xl border border-cocoa/8 bg-white px-4">
            {uncategorized.map((product) => (
              <ProductCard
                key={product.id}
                storeSlug={store.slug}
                product={{
                  slug: product.slug,
                  name: product.name,
                  description: product.description,
                  imageUrl: product.imageUrl,
                  productType: product.productType,
                  priceMode: product.priceMode,
                  priceCents: product.priceCents,
                  availability: product.availability,
                  featured: product.featured,
                  trackStock: product.trackStock,
                  stockQty: product.stockQty,
                  unit: product.unit,
                }}
              />
            ))}
          </div>
        </section>
      )}

      {products.length === 0 ? (
        <p className="mt-10 text-center text-sm text-cocoa-soft/70">
          Nenhum produto na vitrine ainda.
        </p>
      ) : null}

      <p className="mt-8 text-center text-xs text-cocoa-soft/50">
        <Link href={`/${store.slug}/carrinho`}>Ver carrinho</Link>
      </p>
    </main>
  );
}
