"use client";

import { PainelRouteSheet } from "@/components/painel/painel-route-sheet";
import { ProductForm } from "@/components/painel/product-form";

type ProductFormRouteProps = {
  productId?: string;
  initial?: Parameters<typeof ProductForm>[0]["initial"];
};

export function ProductFormRoute({ productId, initial }: ProductFormRouteProps) {
  return (
    <PainelRouteSheet
      backHref="/painel/produtos"
      title={productId ? "Editar produto" : "Novo produto"}
      size="2xl"
      bodyClassName="!py-4"
    >
      <ProductForm productId={productId} initial={initial} layout="sheet" />
    </PainelRouteSheet>
  );
}
