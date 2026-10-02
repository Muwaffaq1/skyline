// Layer 3 — Hourly forecast. Horizontal scroll-snap strip covering roughly
// the next 24 hours (6–8 cells visible initially, per the PRD).
// Per the research: the first cell is labeled "Now" (not the clock time),
// and precipitation probability sits under its own hour, only when present.

import type { HourlyPoint } from "../../domain/types";
import { formatHour } from "../../lib/time";
import { formatTemp, type Unit } from "../../lib/temperature";
import { WeatherIcon } from "../WeatherIcon";

interface HourlyStripProps {
  hours: HourlyPoint[];
  unit: Unit;
}

export function HourlyStrip({ hours, unit }: HourlyStripProps) {
  const cells = hours.filter((h) => h.temperatureC !== null);
  if (cells.length === 0) return null;

  return (
    <section className="card hourly-card" aria-label="Hourly forecast">
      <h2 className="section-heading">Hourly forecast</h2>
      <div className="hourly-strip" role="list">
        {cells.map((hour, i) => (
          <HourlyCell key={`${hour.time.y}-${hour.time.mo}-${hour.time.d}-${hour.time.h}`} hour={hour} unit={unit} isNow={i === 0} />
        ))}
      </div>
    </section>
  );
}

interface HourlyCellProps {
  hour: HourlyPoint;
  unit: Unit;
  isNow: boolean;
}

function HourlyCell({ hour, unit, isNow }: HourlyCellProps) {
  const timeLabel = isNow ? "Now" : formatHour(hour.time);
  const temp = formatTemp(hour.temperatureC!, unit);
  const precip =
    hour.precipitationProbability !== null ? `${hour.precipitationProbability}%` : "";

  // One composite sentence per cell — VoiceOver reads it as a whole.
  const ariaLabel = [
    timeLabel,
    hour.conditionLabel,
    temp,
    hour.precipitationProbability !== null
      ? `${hour.precipitationProbability}% chance of precipitation`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      role="listitem"
      className={`hourly-cell${isNow ? " hourly-cell--now" : ""}`}
      aria-label={ariaLabel}
    >
      <span className="hourly-time" aria-hidden="true">{timeLabel}</span>
      <span className="hourly-icon">
        <WeatherIcon condition={hour.condition} isDay={hour.isDay} size={26} decorative />
      </span>
      <span className="hourly-temp" aria-hidden="true">{temp}</span>
      <span className="hourly-precip" aria-hidden="true">{precip}</span>
    </div>
  );
}