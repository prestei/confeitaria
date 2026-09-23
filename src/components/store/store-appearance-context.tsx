"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_STORE_APPEARANCE,
  type StoreAppearance,
} from "@/lib/store-appearance";

const StoreAppearanceContext = createContext<StoreAppearance>(
  DEFAULT_STORE_APPEARANCE,
);

export function StoreAppearanceProvider({
  value,
  children,
}: {
  value: StoreAppearance;
  children: React.ReactNode;
}) {
  return (
    <StoreAppearanceContext.Provider value={value}>
      {children}
    </StoreAppearanceContext.Provider>
  );
}

export function useStoreAppearance() {
  return useContext(StoreAppearanceContext);
}
