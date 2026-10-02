// TanStack Query wrapper implementing the PRD's refresh policy:
// - 0–10 min old: use cache, refresh optional      → staleTime
// - 10–30 min old: display cache, refresh on open  → refetchOnWindowFocus/Mount
// - 30+ min old: aggressively refresh              → refetchInterval
// - keepPreviousData: switching cities keeps the old forecast on screen until
//   the new one succeeds (PRD manual location flow)

import { useEffect } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { fetchRawForecast } from "../api/openMeteo";
import { locationKeyOf, normalizeForecast } from "../lib/normalize";
import type { WeatherForecast, WeatherLocation } from "../domain/types";
import { SCHEMA_VERSION } from "../domain/types";
import { useSettings } from "../store/settings";

const STALE_MS = 10 * 60_000;
const AGGRESSIVE_MS = 30 * 60_000;

export function weatherQueryKey(locationKey: string) {
  return ["weather", locationKey] as const;
}

export function useWeather(location: WeatherLocation | null) {
  const queryClient = useQueryClient();
  const cacheForecast = useSettings((s) => s.cacheForecast);
  const key = location ? locationKeyOf(location.latitude, location.longitude) : null;

  const query = useQuery({
    queryKey: weatherQueryKey(key ?? "none"),
    enabled: location !== null,
    placeholderData: keepPreviousData,
    staleTime: STALE_MS,
    gcTime: Infinity,
    refetchOnWindowFocus: true,
    refetchInterval: (q) => {
      const data = q.state.data as WeatherForecast | undefined;
      if (!data) return false;
      return Date.now() - data.fetchedAt > AGGRESSIVE_MS ? 5 * 60_000 : false;
    },
    queryFn: async () => {
      const raw = await fetchRawForecast(location!);
      return normalizeForecast(raw, location!);
    },
  });

  // Offline first-paint: if the in-memory cache is empty, seed it from the
  // persisted snapshot so a cold start with no network renders instantly.
  // The schemaVersion guard discards snapshots from older builds mid-migration.
  useEffect(() => {
    if (!key || query.data) return;
    const last = useSettings.getState().lastForecast;
    if (last && last.schemaVersion === SCHEMA_VERSION && last.locationKey === key) {
      queryClient.setQueryData(weatherQueryKey(key), last);
    }
  }, [key, query.data, queryClient]);

  // Persist every successful fetch for the next offline cold start.
  useEffect(() => {
    if (query.data) cacheForecast(query.data);
  }, [query.data, cacheForecast]);

  return query;
}