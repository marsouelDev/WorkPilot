"use client";

import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const subscribe = (callback: () => void) => {
    const media = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    media.addEventListener("change", callback);

    return () => media.removeEventListener("change", callback);
  };

  const getSnapshot = () =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
      : false;

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
