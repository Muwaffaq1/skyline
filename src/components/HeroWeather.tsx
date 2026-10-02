// Layer 2 — Hero Weather. The current temperature is the strongest visual
// element on the screen (PRD information hierarchy).
// V2: while the user scrubs the hourly strip, the hero shows that hour and a
// one-tap "back to now" reset; live conditions otherwise.

import type { CurrentWeather, HourlyPoint } from "../domain/types";
import { formatHour, wallKeyOf } from "../lib/time";
import { formatTemp, type Unit } from "../lib/temperature";
import { WeatherIcon } from "./WeatherIcon";
import { useView } from "../store/view";

interface HeroWeatherProps {
  current: CurrentWeather;
  unit: Unit;
  /** Full hourly slice, to resolve the scrubbed hour. */
  hourly: HourlyPoint[];
}

export function HeroWeather({ current, unit, hourly }: HeroWeatherProps) {
  const viewingHourKey = useView((s) => s.viewingHourKey);
  const setViewingHourKey = useView((s) => s.setViewingHourKey);

  const scrubbed = viewingHourKey
    ? hourly.find((h) => h.temperatureC !== null && wallKeyOf(h.time) === viewingHourKey)
    : undefined;

  return (
    <section className="hero" aria-label={scrubbed ? "Forecast for a selected hour" : "Current weather"}>
      {scrubbed ? (
        <>
          <p className="hero__viewing">
            <span>Viewing {formatHour(scrubbed.time)}</span>
            <button type="button" className="hero__reset" onClick={() => setViewingHourKey(null)}>
              Back to now
            </button>
          </p>
          <span className="hero__icon">
            <WeatherIcon condition={scrubbed.condition} isDay={scrubbed.isDay} size={56} decorative />
          </span>
          <p className="hero__temp">{formatTemp(scrubbed.temperatureC!, unit)}</p>
          <p className="hero__condition" aria-live="polite">
            {scrubbed.conditionLabel}
          </p>
        </>
      ) : (
        <>
          <span className="hero__icon">
            <WeatherIcon condition={current.condition} isDay={current.isDay} size={56} decorative />
          </span>
          <p className="hero__temp">{formatTemp(current.temperatureC, unit)}</p>
          <p className="hero__condition" aria-live="polite">
            {current.conditionLabel}
          </p>
        </>
      )}
      {current.highC !== null && current.lowC !== null && (
        <p className="hero__highlow">
          High {formatTemp(current.highC, unit)} · Low {formatTemp(current.lowC, unit)}
        </p>
      )}
      {!scrubbed && (
        <p className="hero__feels">
          Feels like {formatTemp(current.feelsLikeC, unit)}
        </p>
      )}
    </section>
  );
}
