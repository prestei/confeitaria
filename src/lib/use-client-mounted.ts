import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True after the first client paint — use to skip SSR-incompatible libraries (e.g. @dnd-kit). */
export function useClientMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
