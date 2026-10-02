// Persisted settings + the last successful forecast snapshot.
// The snapshot is what makes an offline cold start paint the full screen
// instantly (PRD returning-user flow: perceived speed comes from cache).

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WeatherForecast, WeatherLocation } from "../domain/types";
import { SCHEMA_VERSION } from "../domain/types";
import { locationKeyOf } from "../lib/normalize";
import { defaultUnit, type Unit } from "../lib/temperature";
import type { DemoScenario } from "../lib/demo";

/** Saved cities are capped so the chip row stays a quick-switcher, not a list. */
export const MAX_SAVED_CITIES = 10;

interface SkylineState {
  unit: Unit;
  selectedLocation: WeatherLocation | null;
  hasSeenFirstRun: boolean;
  lastForecast: WeatherForecast | null;
  savedCities: WeatherLocation[];
  demoMode: DemoScenario | null;
  notificationsEnabled: boolean;
  notificationsPromptDismissed: boolean;
  firedAlerts: Record<string, number>; // alert id → epoch ms of last fire
  setUnit: (unit: Unit) => void;
  selectLocation: (location: WeatherLocation) => void;
  markFirstRunDone: () => void;
  cacheForecast: (forecast: WeatherForecast) => void;
  saveLocation: (location: WeatherLocation) => void;
  removeLocation: (location: WeatherLocation) => void;
  setDemoMode: (demo: DemoScenario | null) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  dismissNotificationsPrompt: () => void;
  markAlertFired: (id: string) => void;
}

export const useSettings = create<SkylineState>()(
  persist(
    (set) => ({
      unit: defaultUnit(),
      selectedLocation: null,
      hasSeenFirstRun: false,
      lastForecast: null,
      savedCities: [],
      demoMode: null,
      notificationsEnabled: false,
      notificationsPromptDismissed: false,
      firedAlerts: {},
      setUnit: (unit) => set({ unit }),
      selectLocation: (selectedLocation) => set({ selectedLocation }),
      markFirstRunDone: () => set({ hasSeenFirstRun: true }),
      cacheForecast: (lastForecast) => set({ lastForecast }),
      saveLocation: (location) =>
        set((s) => {
          const key = locationKeyOf(location.latitude, location.longitude);
          const rest = s.savedCities.filter(
            (c) => locationKeyOf(c.latitude, c.longitude) !== key,
          );
          // Most-recently-saved last; cap trims from the oldest end.
          return { savedCities: [...rest, location].slice(-MAX_SAVED_CITIES) };
        }),
      removeLocation: (location) =>
        set((s) => {
          const key = locationKeyOf(location.latitude, location.longitude);
          return {
            savedCities: s.savedCities.filter(
              (c) => locationKeyOf(c.latitude, c.longitude) !== key,
            ),
          };
        }),
      setDemoMode: (demoMode) => set({ demoMode }),
      setNotificationsEnabled: (notificationsEnabled) => set({ notificationsEnabled }),
      dismissNotificationsPrompt: () => set({ notificationsPromptDismissed: true }),
      markAlertFired: (id) =>
        set((s) => {
          const now = Date.now();
          const fired: Record<string, number> = { ...s.firedAlerts, [id]: now };
          // Prune entries older than 48h so the record never grows unbounded.
          for (const [k, at] of Object.entries(fired)) {
            if (now - at > 48 * 60 * 60_000) delete fired[k];
          }
          return { firedAlerts: fired };
        }),
    }),
    {
      name: "skyline-settings",
      version: 2,
      // v1 → v2: persisted snapshots predate schemaVersion and the new fields;
      // a refetch is cheap, so stale snapshots are discarded rather than adapted.
      migrate: (persisted, _version) => {
        const s = persisted as Partial<SkylineState> & { lastForecast?: WeatherForecast | null };
        const snapshot =
          s.lastForecast && s.lastForecast.schemaVersion === SCHEMA_VERSION
            ? s.lastForecast
            : null;
        return {
          ...s,
          lastForecast: snapshot,
          savedCities: s.savedCities ?? [],
          demoMode: s.demoMode ?? null,
          notificationsEnabled: s.notificationsEnabled ?? false,
          notificationsPromptDismissed: s.notificationsPromptDismissed ?? false,
          firedAlerts: s.firedAlerts ?? {},
        } as SkylineState;
      },
      partialize: (s) => ({
        unit: s.unit,
        selectedLocation: s.selectedLocation,
        hasSeenFirstRun: s.hasSeenFirstRun,
        lastForecast: s.lastForecast,
        savedCities: s.savedCities,
        demoMode: s.demoMode,
        notificationsEnabled: s.notificationsEnabled,
        notificationsPromptDismissed: s.notificationsPromptDismissed,
        firedAlerts: s.firedAlerts,
      }),
    },
  ),
);
