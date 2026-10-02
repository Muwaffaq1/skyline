// Smart weather alerts: useful nudges ("Rain in about an hour"), evaluated
// on every successful fetch + a 5-minute visibility-gated tick.
// Alert ids are content-addressed (kind + the event's wall-time key) so the
// dedup layer in settings.firedAlerts fires each distinct event exactly once.

import type { WeatherForecast, LocalWallTime } from "../../domain/types";
import { compareWallTimes, formatClock, formatHour, wallKeyOf } from "../time";
import { findRainWindows } from "./rainWindow";

export interface WeatherAlert {
  id: string;
  title: string;
  body: string;
}

/** Minutes-ahead band for "rain is about to start" alerts. */
const RAIN_SOON_MIN = 45;
const RAIN_SOON_MAX = 90;
const TEMP_DROP_C = 5;
const TEMP_DROP_LOOKAHEAD_H = 3;
/** Evening mean vs current ≥ this → "much cooler this evening". */
const EVENING_COOLER_C = 4;
const EVENING_START_H = 18;

export function evaluateAlerts(f: WeatherForecast, now: LocalWallTime): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const current = f.current;
  if (!current) return alerts;

  const currentTemp = current.temperatureC;

  // Rain starting soon: the first window begins within 45–90 minutes.
  const window = findRainWindows(f.hourly).find(
    (w) => compareWallTimes(w.start, now) > 0,
  );
  if (window && currentTemp !== null) {
    const minsAhead = minutesAhead(window.start, now);
    if (minsAhead !== null && minsAhead >= RAIN_SOON_MIN && minsAhead <= RAIN_SOON_MAX) {
      alerts.push({
        id: `rain-${wallKeyOf(window.start)}`,
        title: "Rain in about an hour",
        body: `Rain likely starting around ${formatClock(window.start)}.`,
      });
    }
  }

  // Sharp drop within 3 hours.
  if (currentTemp !== null) {
    for (let i = 1; i <= TEMP_DROP_LOOKAHEAD_H && i < f.hourly.length; i++) {
      const h = f.hourly[i];
      if (h.temperatureC === null) continue;
      const drop = currentTemp - h.temperatureC;
      if (drop >= TEMP_DROP_C) {
        alerts.push({
          id: `drop-${wallKeyOf(h.time)}`,
          title: "Much cooler this evening",
          body: `Temperatures fall ${Math.round(drop)}° by ${formatHour(h.time)}.`,
        });
        break;
      }
    }
  }

  // Storm now.
  if (current.condition === "THUNDERSTORM") {
    alerts.push({
      id: `storm-${wallKeyOf(current.time)}`,
      title: "Thunderstorm",
      body: "A thunderstorm is overhead right now.",
    });
  }

  // Evening cool-down: mean of hours ≥ 18:00 vs current, ≥4° cooler.
  const evening = f.hourly.filter((h) => h.time.h >= EVENING_START_H && h.temperatureC !== null);
  if (evening.length > 0 && currentTemp !== null) {
    const mean = evening.reduce((sum, h) => sum + (h.temperatureC ?? 0), 0) / evening.length;
    if (currentTemp - mean >= EVENING_COOLER_C) {
      alerts.push({
        id: `evening-${wallKeyOf(f.hourly[0]?.time ?? now)}`,
        title: "Much cooler this evening",
        body: `Around ${Math.round(currentTemp - mean)}° cooler after ${formatHour({ ...now, h: EVENING_START_H, mi: 0 })}.`,
      });
    }
  }

  return alerts;
}

/**
 * Minutes from now until the given wall time. Hourly data carries no real
 * minute granularity, so this is hour-based: the band check ("45–90 min")
 * only needs the hour. A same-wall-hour result means the target is a day
 * away (hourly spans ≤24h), not "now".
 */
function minutesAhead(target: LocalWallTime, now: LocalWallTime): number | null {
  if (compareWallTimes(target, now) <= 0) return null;
  const raw = (target.h - now.h + 24) % 24;
  return (raw === 0 ? 24 : raw) * 60;
}