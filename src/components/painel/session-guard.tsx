"use client";

import { useEffect } from "react";

/** Sends the confeiteira back to login when the JWT session is gone. */
export function SessionGuard() {
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = await res.json().catch(() => null);
        if (!cancelled && !data?.user) {
          window.location.href = "/entrar";
        }
      } catch {
        /* keep the page if the check itself fails */
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    void check();
    document.addEventListener("visibilitychange", onVisible);
    const timer = window.setInterval(() => void check(), 60_000);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
