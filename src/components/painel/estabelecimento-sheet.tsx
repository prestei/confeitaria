"use client";

import { PainelRouteSheet } from "@/components/painel/painel-route-sheet";
import { VitrineEditor } from "@/components/painel/vitrine-editor";
import type { VitrineStore } from "@/components/painel/vitrine-editor";

type PreviewProduct = {
  name: string;
  priceLabel: string;
  imageUrl: string | null;
  featured?: boolean;
};

export function EstabelecimentoSheet({
  store,
  origin,
  products,
}: {
  store: VitrineStore;
  origin: string;
  products: PreviewProduct[];
}) {
  return (
    <PainelRouteSheet
      backHref="/painel/configuracoes"
      title="Estabelecimento"
      size="2xl"
      bodyClassName="!px-3 !py-3 sm:!px-4"
    >
      <VitrineEditor store={store} origin={origin} products={products} />
    </PainelRouteSheet>
  );
}
