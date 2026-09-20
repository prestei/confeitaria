"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const Scene = dynamic(
  () =>
    import("@/components/store/store-ambient-scene").then(
      (m) => m.StoreAmbientScene,
    ),
  { ssr: false },
);

/** Subtle pastry-toned ambient depth — desktop only, non-blocking */
export function StoreAmbientAccent() {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 hidden h-[28rem] opacity-[0.35] lg:block"
      aria-hidden
    >
      <Scene />
    </div>
  );
}
