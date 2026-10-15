/** Filtro MongoDB para produtos visíveis na vitrine pública. */
export function storefrontProductQuery(storeId: string) {
  return {
    storeId,
    active: true,
    showOnStorefront: { $ne: false },
    $or: [
      { trackStock: { $ne: true } },
      { stockQty: { $gt: 0 } },
      { hideWhenOutOfStock: { $ne: true } },
    ],
  };
}
