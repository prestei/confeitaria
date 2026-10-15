"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartCustomization = Record<string, string | number | string[]>;

export type CartItem = {
  key: string;
  productId: string;
  productName: string;
  productType: string;
  quantity: number;
  unitPriceCents: number;
  customizations?: CartCustomization;
  priceMode: "FIXED" | "FROM" | "QUOTE";
  imageUrl?: string | null;
  source?: "PRODUCT" | "UPSELL";
  addonId?: string;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "key">) => void;
  updateQty: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
  hasQuoteItems: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

function storageKey(slug: string) {
  return `cart:${slug}`;
}

export function CartProvider({
  slug,
  children,
}: {
  slug: string;
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(slug));
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [slug]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(storageKey(slug), JSON.stringify(items));
  }, [items, ready, slug]);

  const addItem = useCallback((item: Omit<CartItem, "key">) => {
    const key = `${item.productId}:${JSON.stringify(item.customizations ?? {})}`;
    setItems((prev) => {
      const existing = prev.find((p) => p.key === key);
      if (existing) {
        return prev.map((p) =>
          p.key === key ? { ...p, quantity: p.quantity + item.quantity } : p,
        );
      }
      return [...prev, { ...item, key }];
    });
  }, []);

  const updateQty = useCallback((key: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((p) => (p.key === key ? { ...p, quantity } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => p.key !== key));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotalCents = items.reduce(
      (sum, i) => sum + i.unitPriceCents * i.quantity,
      0,
    );
    return {
      items,
      addItem,
      updateQty,
      removeItem,
      clear,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotalCents,
      hasQuoteItems: items.some((i) => i.priceMode === "QUOTE"),
    };
  }, [items, addItem, updateQty, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
