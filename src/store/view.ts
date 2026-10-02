// Ephemeral view state — deliberately NOT persisted (unlike settings.ts).
// viewingHourKey: the hour the user is scrubbing, as a wall-time key
// (see wallKeyOf). null = live "now". A wall-time key, not an array index,
// so a background refetch that shifts the hourly slice can't silently
// repoint the selection; consumers resolve key → index each render and snap
// back to live when the key no longer exists.
// toasts: transient in-app alert cards (smart notifications), top-fixed.

import { create } from "zustand";
import type { WeatherAlert } from "../lib/insights/alerts";

export interface Toast extends WeatherAlert {
  key: number;
}

interface ViewState {
  viewingHourKey: number | null;
  toasts: Toast[];
  setViewingHourKey: (key: number | null) => void;
  pushToast: (alert: WeatherAlert) => void;
  dismissToast: (key: number) => void;
}

let toastKey = 1;

export const useView = create<ViewState>((set) => ({
  viewingHourKey: null,
  toasts: [],
  setViewingHourKey: (viewingHourKey) => set({ viewingHourKey }),
  pushToast: (alert) =>
    set((s) => ({ toasts: [...s.toasts, { ...alert, key: toastKey++ }] })),
  dismissToast: (key) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.key !== key) })),
}));