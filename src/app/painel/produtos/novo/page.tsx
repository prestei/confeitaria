import { ProductFormRoute } from "@/components/painel/product-form-route";

export default async function NovoProdutoPage({
  searchParams,
}: {
  searchParams: Promise<{ preco?: string; nome?: string }>;
}) {
  const sp = await searchParams;
  const price = sp.preco?.replace(".", ",") ?? "";
  const name = sp.nome ? decodeURIComponent(sp.nome) : "";

  return (
    <ProductFormRoute
      initial={
        name || price
          ? {
              name,
              description: "",
              imageUrl: "",
              gallery: "",
              categoryId: "",
              productType: "READY",
              priceMode: "FIXED",
              price,
              promoPrice: "",
              availability: "AVAILABLE",
              featured: false,
              active: true,
              showOnStorefront: true,
              trackStock: false,
              stockQty: "0",
              stockMin: "5",
              unit: "un",
              optionGroups: [],
              addons: [],
            }
          : undefined
      }
    />
  );
}
