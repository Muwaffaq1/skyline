// Connectivity flag via the browser's online/offline events. Used to switch
// the DegradedBanner to its offline copy. navigator.onLine can be wrong
// (captive portals report online), so it's treated as a hint only.

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useIsOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // SSR-safe snapshot (never used in this app, but required)
  );
}