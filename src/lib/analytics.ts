"use client";

import type { AnalyticsEventType } from "@/lib/enums";

const SESSION_KEY = "dp_analytics_session";

function sessionId() {
  if (typeof window === "undefined") return null;
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function onceKey(type: string, extra = "") {
  return `dp_tracked:${type}:${extra}`;
}

export function trackStoreEvent(input: {
  storeSlug: string;
  type: AnalyticsEventType | string;
  productId?: string | null;
  source?: string | null;
  meta?: Record<string, unknown> | null;
  /** Fire at most once per browser session for this type (+extra). */
  once?: boolean;
  onceExtra?: string;
}) {
  if (typeof window === "undefined") return;

  if (input.once) {
    const key = onceKey(input.type, input.onceExtra ?? input.storeSlug);
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
  }

  const params = new URLSearchParams(window.location.search);
  const utmSource =
    params.get("utm_source") ||
    params.get("ref") ||
    document.referrer ||
    null;

  const body = {
    storeSlug: input.storeSlug,
    type: input.type,
    productId: input.productId ?? null,
    source: input.source ?? utmSource,
    meta: {
      ...(input.meta ?? {}),
      path: window.location.pathname,
      sessionId: sessionId(),
    },
  };

  const payload = JSON.stringify(body);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
  } catch {
    // fall through
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}
