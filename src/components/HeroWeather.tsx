// Layer 2 — Hero Weather. The current temperature is the strongest visual
// element on the screen (PRD information hierarchy).

import type { CurrentWeather } from "../domain/types";
import { formatTemp, type Unit } from "../lib/temperature";
import { WeatherIcon } from "./WeatherIcon";

interface HeroWeatherProps {
  current: CurrentWeather;
  unit: Unit;
}

export function HeroWeather({ current, unit }: HeroWeatherProps) {
  return (
    <section className="hero" aria-label="Current weather">
      <span className="hero__icon">
        <WeatherIcon condition={current.condition} isDay={current.isDay} size={56} decorative />
      </span>
      <p className="hero__temp">{formatTemp(current.temperatureC, unit)}</p>
      <p className="hero__condition" aria-live="polite">
        {current.conditionLabel}
      </p>
      {current.highC !== null && current.lowC !== null && (
        <p className="hero__highlow">
          High {formatTemp(current.highC, unit)} · Low {formatTemp(current.lowC, unit)}
        </p>
      )}
      <p className="hero__feels">
        Feels like {formatTemp(current.feelsLikeC, unit)}
      </p>
    </section>
  );
}