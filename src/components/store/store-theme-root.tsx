"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  resolveStoreAppearance,
  storeTypographyClass,
  type StoreAppearance,
} from "@/lib/store-appearance";
import { StoreAppearanceProvider } from "@/components/store/store-appearance-context";
import {
  resolveStoreTheme,
  storeThemeToCssVars,
  STORE_THEME_CHANNEL,
  themesEqual,
  type StoreTheme,
} from "@/lib/store-theme";

export function StoreThemeRoot({
  slug,
  initial,
  appearance: appearanceSeed,
  children,
}: {
  slug: string;
  initial: Partial<StoreTheme> & {
    accentColor?: string | null;
    secondaryColor?: string | null;
    themeColors?: Partial<StoreTheme> | null;
  };
  appearance?: Partial<StoreAppearance> & {
    typography?: string | null;
    cardStyle?: string | null;
    pageLayout?: string | null;
  };
  children: React.ReactNode;
}) {
  const appearance = useMemo(
    () => resolveStoreAppearance(appearanceSeed),
    [appearanceSeed],
  );
  const seed = useMemo(() => resolveStoreTheme(initial), [initial]);
  const [theme, setTheme] = useState<StoreTheme>(seed);

  useEffect(() => {
    setTheme(seed);
  }, [seed]);

  useEffect(() => {
    const channel = new BroadcastChannel(STORE_THEME_CHANNEL);
    channel.onmessage = (event: MessageEvent) => {
      const data = event.data as { slug?: string; theme?: StoreTheme } | null;
      if (!data?.theme || data.slug !== slug) return;
      setTheme(resolveStoreTheme({ themeColors: data.theme }));
    };

    async function pull() {
      if (document.hidden) return;
      try {
        const res = await fetch(
          `/api/public/store-theme?slug=${encodeURIComponent(slug)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return;
        const next = resolveStoreTheme({ themeColors: await res.json() });
        setTheme((prev) => (themesEqual(prev, next) ? prev : next));
      } catch {
        /* ignore network blips while browsing */
      }
    }

    const interval = window.setInterval(pull, 2500);
    document.addEventListener("visibilitychange", pull);
    return () => {
      channel.close();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", pull);
    };
  }, [slug]);

  return (
    <StoreAppearanceProvider value={appearance}>
      <div
        className={cn(
          "store-theme min-h-screen bg-ivory",
          storeTypographyClass(appearance.typography),
        )}
        style={storeThemeToCssVars(theme)}
      >
        {children}
      </div>
    </StoreAppearanceProvider>
  );
}
