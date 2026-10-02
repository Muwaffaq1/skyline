// Layer 3 — Hourly forecast + interactive timeline. Horizontal scroll-snap
// strip covering roughly the next 24 hours (6–8 cells visible, per the PRD).
// V2 additions: trend arrows (vs the previous cell), rain-window shading,
// sun markers, and time scrubbing — tapping (or dragging on pointer devices)
// an hour sets the viewing hour, which repaints the hero and the sky.
// The scrub selection is a wall-time key, so a background refetch that
// shifts the slice can't silently point at the wrong hour.

import { useRef } from "react";
import type { DailyPoint, HourlyPoint, LocalWallTime } from "../../domain/types";
import { formatHour, locationNow, sameDate, wallKeyOf } from "../../lib/time";
import { formatTemp, type Unit } from "../../lib/temperature";
import { findRainWindows, rainWindowIndexSet } from "../../lib/insights/rainWindow";
import { tempTrend, trendArrow, trendWord } from "../../lib/insights/trend";
import { WeatherIcon } from "../WeatherIcon";
import { SunTimes } from "../sun/SunTimes";
import { useView } from "../../store/view";

interface HourlyStripProps {
  hours: HourlyPoint[];
  unit: Unit;
  /** Sun events by date, for horizon markers (sunrise only shows when it falls in the strip). */
  daily: DailyPoint[];
  utcOffsetSeconds: number;
}

const DRAG_THRESHOLD_PX = 6;

export function HourlyStrip({ hours, unit, daily, utcOffsetSeconds }: HourlyStripProps) {
  const cells = hours.filter((h) => h.temperatureC !== null);
  const setViewingHourKey = useView((s) => s.setViewingHourKey);
  const viewingHourKey = useView((s) => s.viewingHourKey);
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; active: boolean } | null>(null);

  if (cells.length === 0) return null;

  const rainCells = rainWindowIndexSet(findRainWindows(cells));

  // Sun events per cell date, from the daily section.
  const sunFor = (t: LocalWallTime) => {
    const day = daily.find((d) => sameDate(d.date, t));
    return { sunrise: day?.sunrise ?? null, sunset: day?.sunset ?? null };
  };

  const activeIdx = viewingHourKey
    ? cells.findIndex((h) => wallKeyOf(h.time) === viewingHourKey)
    : -1;

  // Today's sun events, for the countdown row.
  const today = daily.find((d) => sameDate(d.date, locationNow(utcOffsetSeconds))) ?? daily[0] ?? null;

  const scrubTo = (idx: number | null) => {
    setViewingHourKey(idx === null || idx < 0 ? null : wallKeyOf(cells[idx].time));
  };

  // --- pointer drag (mouse/pen): hold-move across cells scrubs. Touch keeps
  // native horizontal scroll; tap = click below handles it on touch devices.
  const cellIndexAt = (clientX: number): number | null => {
    const strip = stripRef.current;
    if (!strip) return null;
    const nodes = strip.querySelectorAll<HTMLElement>("[data-cell-idx]");
    for (const node of nodes) {
      const rect = node.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) {
        return Number(node.dataset.cellIdx);
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    drag.current = { startX: e.clientX, active: false };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = drag.current;
    if (!state) return;
    if (!state.active) {
      if (Math.abs(e.clientX - state.startX) < DRAG_THRESHOLD_PX) return;
      state.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    const idx = cellIndexAt(e.clientX);
    if (idx !== null) scrubTo(idx);
  };

  const endDrag = () => {
    drag.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const delta = e.key === "ArrowLeft" ? -1 : 1;
      const next = activeIdx < 0 ? 0 : Math.min(cells.length - 1, Math.max(0, activeIdx + delta));
      scrubTo(next);
      e.preventDefault();
    } else if (e.key === "Escape" && activeIdx >= 0) {
      scrubTo(null);
    }
  };

  return (
    <section className="card hourly-card" aria-label="Hourly forecast">
      <h2 className="section-heading">Hourly forecast</h2>
      <div
        className="hourly-strip"
        role="listbox"
        aria-label="Scrub through the next 24 hours"
        ref={stripRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
      >
        {cells.map((hour, i) => (
          <HourlyCell
            key={wallKeyOf(hour.time)}
            hour={hour}
            unit={unit}
            isNow={i === 0}
            prev={i > 0 ? cells[i - 1] : null}
            rain={rainCells.has(i)}
            active={i === activeIdx}
            sun={sunFor(hour.time)}
            index={i}
            onSelect={() => scrubTo(i === activeIdx ? null : i)}
          />
        ))}
      </div>
      <SunTimes
        sunrise={today?.sunrise ?? null}
        sunset={today?.sunset ?? null}
        utcOffsetSeconds={utcOffsetSeconds}
      />
    </section>
  );
}

interface HourlyCellProps {
  hour: HourlyPoint;
  unit: Unit;
  isNow: boolean;
  prev: HourlyPoint | null;
  rain: boolean;
  active: boolean;
  sun: { sunrise: LocalWallTime | null; sunset: LocalWallTime | null };
  index: number;
  onSelect: () => void;
}

function HourlyCell({ hour, unit, isNow, prev, rain, active, sun, index, onSelect }: HourlyCellProps) {
  const timeLabel = isNow ? "Now" : formatHour(hour.time);
  const temp = formatTemp(hour.temperatureC!, unit);
  const precip =
    hour.precipitationProbability !== null ? `${hour.precipitationProbability}%` : "";

  const trend = tempTrend(prev?.temperatureC ?? null, hour.temperatureC);

  // Horizon markers: the hour containing a sun event gets its glyph.
  const sunsetMark = sun.sunset?.h === hour.time.h;
  const sunriseMark = !sunsetMark && sun.sunrise?.h === hour.time.h;

  const classes = [
    "hourly-cell",
    isNow ? "hourly-cell--now" : "",
    rain ? "hourly-cell--rain" : "",
    active ? "hourly-cell--active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // One composite sentence per cell — VoiceOver reads it as a whole.
  const ariaLabel = [
    timeLabel,
    hour.conditionLabel,
    temp,
    !isNow ? trendWord(trend) : null,
    hour.precipitationProbability !== null
      ? `${hour.precipitationProbability}% chance of precipitation`
      : null,
    sunsetMark ? "sunset this hour" : null,
    sunriseMark ? "sunrise this hour" : null,
    active ? "viewing this hour" : null,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      className={classes}
      aria-label={ariaLabel}
      data-cell-idx={index}
      onClick={onSelect}
    >
      <span className="hourly-time" aria-hidden="true">
        {timeLabel}
        {sunsetMark && <span className="hourly-sun"> ↓</span>}
        {sunriseMark && <span className="hourly-sun"> ↑</span>}
      </span>
      <span className="hourly-icon">
        <WeatherIcon condition={hour.condition} isDay={hour.isDay} size={26} decorative />
      </span>
      <span className="hourly-temp" aria-hidden="true">
        {temp}
        {!isNow && (
          <span className="hourly-trend" aria-hidden="true">
            {trendArrow(trend)}
          </span>
        )}
      </span>
      <span className="hourly-precip" aria-hidden="true">{precip}</span>
    </button>
  );
}
