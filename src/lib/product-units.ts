export const DEFAULT_PRODUCT_UNIT = "un";

/** Unidades comuns para venda de produtos (confeitaria / delivery). */
export const PRODUCT_UNITS: { value: string; label: string }[] = [
  { value: "un", label: "Unidade (un)" },
  { value: "dz", label: "Dúzia (dz)" },
  { value: "g", label: "Gramas (g)" },
  { value: "kg", label: "Quilogramas (kg)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "L", label: "Litros (L)" },
  { value: "fatia", label: "Fatia" },
  { value: "pct", label: "Pacote (pct)" },
  { value: "cx", label: "Caixa (cx)" },
];

export function isStandardProductUnit(unit: string) {
  return PRODUCT_UNITS.some((u) => u.value === unit);
}
