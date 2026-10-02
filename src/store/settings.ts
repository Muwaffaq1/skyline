// Persisted settings + the last successful forecast snapshot.
// The snapshot is what makes an offline cold start paint the full screen
// instantly (PRD returning-user flow: perceived speed comes from cache).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WeatherForecast, WeatherLocation } from "../domain/types";
import { defaultUnit, type Unit } from "../lib/temperature";

interface SkylineState {
  unit: Unit;
  selectedLocation: WeatherLocation | null;
  hasSeenFirstRun: boolean;
  lastForecast: WeatherForecast | null;
  setUnit: (unit: Unit) => void;
  selectLocation: (location: WeatherLocation) => void;
  markFirstRunDone: () => void;
  cacheForecast: (forecast: WeatherForecast) => void;
}

export const useSettings = create<SkylineState>()(
  persist(
    (set) => ({
      unit: defaultUnit(),
      selectedLocation: null,
      hasSeenFirstRun: false,
      lastForecast: null,
      setUnit: (unit) => set({ unit }),
      selectLocation: (selectedLocation) => set({ selectedLocation }),
      markFirstRunDone: () => set({ hasSeenFirstRun: true }),
      cacheForecast: (lastForecast) => set({ lastForecast }),
    }),
    {
      name: "skyline-settings",
      partialize: (s) => ({
        unit: s.unit,
        selectedLocation: s.selectedLocation,
        hasSeenFirstRun: s.hasSeenFirstRun,
        lastForecast: s.lastForecast,
      }),
    },
  ),
);