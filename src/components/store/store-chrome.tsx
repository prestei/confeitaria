"use client";

import { usePathname } from "next/navigation";
import { StoreHeader } from "@/components/store/store-header";

type StoreHeaderProps = Parameters<typeof StoreHeader>[0];

export function StoreChrome({
  store,
  categories = [],
}: {
  store: StoreHeaderProps["store"];
  categories?: StoreHeaderProps["categories"];
}) {
  const pathname = usePathname();
  const isHome =
    pathname === `/${store.slug}` || pathname === `/${store.slug}/`;

  if (isHome) return null;

  return <StoreHeader store={store} categories={categories} />;
}
