"use client";

import { useEffect } from "react";
import { trackStoreEvent } from "@/lib/analytics";

/** Fires STORE_VIEW once per browser session when the storefront mounts. */
export function StoreAnalyticsBeacon({ storeSlug }: { storeSlug: string }) {
  useEffect(() => {
    trackStoreEvent({
      storeSlug,
      type: "STORE_VIEW",
      once: true,
    });
  }, [storeSlug]);

  return null;
}
