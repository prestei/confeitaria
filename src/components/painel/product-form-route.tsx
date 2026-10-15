"use client";

import { useRouter } from "next/navigation";
import { PainelRouteSheet } from "@/components/painel/painel-route-sheet";
import { ProductForm } from "@/components/painel/product-form";

type ProductFormRouteProps = {
  productId?: string;
  initial?: Parameters<typeof ProductForm>[0]["initial"];
};

export function ProductFormRoute({ productId, initial }: ProductFormRouteProps) {
  const router = useRouter();

  return (
    <PainelRouteSheet
      backHref="/painel/produtos"
      title={productId ? "Editar produto" : "Novo produto"}
      size="2xl"
      bodyClassName="!flex !min-h-0 !flex-1 !flex-col !overflow-hidden !p-0"
    >
      <ProductForm
        productId={productId}
        initial={initial}
        layout="sheet"
        onSaved={() => {
          router.push("/painel/produtos");
          router.refresh();
        }}
      />
    </PainelRouteSheet>
  );
}
