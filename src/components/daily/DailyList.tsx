// Layer 4 — 5-day forecast. Vertical rows: weekday, icon + condition label
// (text, never color alone), optional precipitation %, then low° —range
// bar— high°. Today's row is bold and labeled "Today".

import type { DailyPoint, LocalWallTime } from "../../domain/types";
import { formatTemp, type Unit } from "../../lib/temperature";
import { formatWeekday } from "../../lib/time";
import { WeatherIcon } from "../WeatherIcon";
import { TempRangeBar } from "./TempRangeBar";

interface DailyListProps {
  days: DailyPoint[];
  unit: Unit;
  now: LocalWallTime;
}

export function DailyList({ days, unit, now }: DailyListProps) {
  if (days.length === 0) return null;

  const weekMin = Math.min(...days.map((d) => d.minC));
  const weekMax = Math.max(...days.map((d) => d.maxC));

  return (
    <section className="card daily-card" aria-label="5-day forecast">
      <h2 className="section-heading">5-day forecast</h2>
      <div role="list">
        {days.map((day, i) => (
          <DailyRow
            key={`${day.date.y}-${day.date.mo}-${day.date.d}`}
            day={day}
            unit={unit}
            now={now}
            isToday={i === 0}
            weekMin={weekMin}
            weekMax={weekMax}
          />
        ))}
      </div>
    </section>
  );
}

interface DailyRowProps {
  day: DailyPoint;
  unit: Unit;
  now: LocalWallTime;
  isToday: boolean;
  weekMin: number;
  weekMax: number;
}

function DailyRow({ day, unit, now, isToday, weekMin, weekMax }: DailyRowProps) {
  const dayLabel = formatWeekday(day.date, now);
  const low = formatTemp(day.minC, unit);
  const high = formatTemp(day.maxC, unit);

  const ariaLabel = [
    dayLabel,
    day.conditionLabel,
    `low ${low}`,
    `high ${high}`,
    day.precipitationProbability !== null
      ? `${day.precipitationProbability}% chance of precipitation`
      : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div role="listitem" className={`daily-row${isToday ? " daily-row--today" : ""}`} aria-label={ariaLabel}>
      <span className="daily-day" aria-hidden="true">{dayLabel}</span>
      <span className="daily-icon" aria-hidden="true">
        <WeatherIcon condition={day.condition} size={24} decorative />
      </span>
      <span className="daily-label" aria-hidden="true">{day.conditionLabel}</span>
      <span className="daily-precip" aria-hidden="true">
        {day.precipitationProbability !== null ? `${day.precipitationProbability}%` : ""}
      </span>
      <span className="daily-temps" aria-hidden="true">
        <span className="daily-low">{low}</span>
        <TempRangeBar min={day.minC} max={day.maxC} weekMin={weekMin} weekMax={weekMax} />
        <span className="daily-high">{high}</span>
      </span>
    </div>
  );
}