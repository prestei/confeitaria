"use client";

import { useMemo, useState } from "react";
import { formatBRL } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string | null;
  priceCents: number | null;
  promoPriceCents: number | null;
  slug: string;
  imageUrl: string | null;
};

export function InstagramContentTool({
  products,
  storeSlug,
  storeName,
}: {
  products: Product[];
  storeSlug: string;
  storeName: string;
}) {
  const [productId, setProductId] = useState(products[0]?.id || "");
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const product = products.find((p) => p.id === productId);

  const content = useMemo(() => {
    if (!product) return null;
    const price =
      product.promoPriceCents != null
        ? formatBRL(product.promoPriceCents)
        : formatBRL(product.priceCents);
    const link = `${origin}/${storeSlug}/produto/${product.slug}`;
    const caption = [
      `${product.name} ✨`,
      "",
      product.description?.slice(0, 160) ||
        `Feito com carinho por ${storeName}.`,
      "",
      price !== "Sob consulta" ? `A partir de ${price}` : "Sob encomenda",
      "",
      "Peça pela vitrine 👇",
      link,
    ].join("\n");
    const cta = "Peça agora pela vitrine — link na bio / nos comentários.";
    return { caption, cta, link };
  }, [product, origin, storeSlug, storeName]);

  if (products.length === 0) {
    return (
      <p className="text-sm text-cocoa-soft/60">
        Cadastre produtos para gerar publicações.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Produto</label>
        <select
          className="input max-w-md"
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {product && content && (
        <div className="grid gap-4 lg:grid-cols-[200px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-cocoa/8 bg-fog">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt=""
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-xs text-cocoa-soft/45">
                Sem imagem
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-soft/50">
                Legenda
              </p>
              <pre className="mt-1 whitespace-pre-wrap rounded-xl border border-cocoa/8 bg-fog/50 p-3 text-sm text-cocoa">
                {content.caption}
              </pre>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-soft/50">
                CTA
              </p>
              <p className="mt-1 text-sm text-cocoa">{content.cta}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-cocoa-soft/50">
                Link do produto
              </p>
              <p className="mt-1 break-all text-sm text-berry">{content.link}</p>
            </div>
            <button
              type="button"
              className="btn-primary !py-2 text-sm"
              onClick={() => navigator.clipboard.writeText(content.caption)}
            >
              Criar publicação (copiar legenda)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
