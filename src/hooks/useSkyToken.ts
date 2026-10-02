// The single derivation point for the sky token across live, scrubbed and
// demo states. Reads the persisted snapshot — the same channel live data
// flows through (cacheForecast updates it on every successful fetch) — so
// App-level first paint and WeatherScreen content can never disagree.

import { useSettings } from "../store/settings";
import { useView } from "../store/view";
import { applyDemo } from "../lib/demo";
import { skyTokenForContext, type SkyToken } from "../lib/sky";
import { locationNow, sameDate, wallKeyOf } from "../lib/time";
import type { LocalWallTime } from "../domain/types";

export function useSkyToken(): SkyToken {
  const lastForecast = useSettings((s) => s.lastForecast);
  const demoMode = useSettings((s) => s.demoMode);
  const viewingHourKey = useView((s) => s.viewingHourKey);

  const forecast = applyDemo(lastForecast, demoMode);
  const current = forecast?.current;
  if (!forecast || !current) return "cloudy";

  const live: LocalWallTime = locationNow(forecast.utcOffsetSeconds);

  // Resolve the scrubbed hour; a key that no longer exists (refetch shifted
  // the slice) snaps back to live.
  const scrubbed = viewingHourKey
    ? forecast.hourly.find((h) => wallKeyOf(h.time) === viewingHourKey)
    : undefined;

  const localTime = scrubbed?.time ?? live;
  const condition = scrubbed?.condition ?? current.condition;
  const isDay = scrubbed?.isDay ?? current.isDay;

  const day =
    forecast.daily.find((d) => sameDate(d.date, localTime)) ?? forecast.daily[0] ?? null;

  return skyTokenForContext({
    condition,
    localTime,
    isDay,
    sunrise: day?.sunrise ?? null,
    sunset: day?.sunset ?? null,
  });
}
