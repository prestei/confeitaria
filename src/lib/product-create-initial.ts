import type { ProductFormInitial } from "@/components/painel/product-form";

export function productCreateInitialFromSearch(
  nome?: string,
  preco?: string,
): ProductFormInitial | undefined {
  const price = preco?.replace(".", ",") ?? "";
  const name = nome ? decodeURIComponent(nome) : "";
  if (!name && !price) return undefined;

  return {
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
  };
}
