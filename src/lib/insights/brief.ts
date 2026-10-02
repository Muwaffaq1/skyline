// The Skyline Brief: one smart sentence under the location header — what the
// day looks like, composed from condition, near-future trend, rain and high.

import type { WeatherForecast } from "../../domain/types";
import { formatTemp, type Unit } from "../temperature";
import { findRainWindows } from "./rainWindow";
import { formatHour } from "../time";

const TREND_HOURS = 6;

/**
 * e.g. "Overcast now, clearing by afternoon, high of 21°."
 * Pure function; the unit only affects the formatted high.
 */
export function buildBrief(f: WeatherForecast, unit: Unit): string {
  const current = f.current;
  if (!current) return "Conditions steady through the day.";

  const parts: string[] = [];

  // Opening: condition + where temps are heading over the next ~6 hours.
  const trend = tempTrendClause(f);
  parts.push(trend ? `${current.conditionLabel.toLowerCase()} now, ${trend}` : `${current.conditionLabel.toLowerCase()} now`);

  // Rain window, when the near future has one.
  const window = findRainWindows(f.hourly)[0];
  if (window) {
    parts.push(`rain likely from ${formatHour(window.start)}`);
  }

  // Daily high, when the daily section made it through.
  const today = f.daily[0];
  if (today) {
    parts.push(`high of ${formatTemp(today.maxC, unit)}`);
  }

  if (parts.length === 1) return `${parts[0]}.`;
  return `${parts[0]}, ${parts.slice(1).join(", ")}.`;
}

function tempTrendClause(f: WeatherForecast): string | null {
  const temps = f.hourly.slice(0, TREND_HOURS + 1).map((h) => h.temperatureC);
  const first = temps[0];
  const last = temps[temps.length - 1];
  if (first === null || last === null) return null;
  const delta = last - first;
  if (delta >= 2) return "warming through the day";
  if (delta <= -2) return "cooling through the day";
  return null;
}