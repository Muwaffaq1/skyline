// (condition, local time, sun events) → sky token name.
//
// Supersedes gradient.ts's hour-bucket logic: the sun position (from the
// daily sunrise/sunset, not just the API's is_day flag) drives dawn/golden
// phases, so the sky warms around golden hour and goes night outside it even
// when is_day still says 1 (the old "evening gap" hack is gone).
//
// Mood changes, structure never does (PRD visual constraint): the interface
// layout is identical under every token — only the atmosphere shifts.

import type { LocalWallTime, SkylineCondition } from "../domain/types";
import { minutesOfDay } from "./time";

export type SkyToken =
  | "clear-morning"
  | "clear-day"
  | "clear-evening"
  | "clear-golden"
  | "night"
  | "rain"
  | "cloudy"
  | "snow"
  | "fog";

export type SunPhase = "night" | "golden" | "morning" | "midday" | "afternoon";

export interface SkyContext {
  condition: SkylineCondition;
  localTime: LocalWallTime; // "now", or the scrubbed hour
  isDay: boolean;
  sunrise: LocalWallTime | null; // from the DailyPoint matching localTime's date
  sunset: LocalWallTime | null;
}

/** Golden hour: within ±45 min of a sun event. */
const GOLDEN_WINDOW_MIN = 45;

/**
 * Sun phase for a local time. Falls back to hour buckets when the daily
 * section (sunrise/sunset) is unavailable.
 */
export function sunPhaseFor(
  t: LocalWallTime,
  sunrise: LocalWallTime | null,
  sunset: LocalWallTime | null,
  isDay: boolean,
): SunPhase {
  if (sunrise && sunset) {
    const m = minutesOfDay(t);
    const rise = minutesOfDay(sunrise);
    const set = minutesOfDay(sunset);
    if (m < rise - GOLDEN_WINDOW_MIN) return "night";
    if (m <= rise + GOLDEN_WINDOW_MIN) return "golden";
    if (m < 12 * 60) return "morning";
    if (m < 17 * 60) return "midday";
    if (m < set - GOLDEN_WINDOW_MIN) return "afternoon";
    if (m <= set + GOLDEN_WINDOW_MIN) return "golden";
    return "night";
  }

  // No sun times: is_day + coarse hour buckets (the v1 behavior).
  if (!isDay) return "night";
  if (t.h < 11) return "morning";
  if (t.h < 17) return "midday";
  return "afternoon";
}

export function skyTokenForContext(ctx: SkyContext): SkyToken {
  const phase = sunPhaseFor(ctx.localTime, ctx.sunrise, ctx.sunset, ctx.isDay);
  if (phase === "night" || !ctx.isDay) return "night";

  if (ctx.condition !== "CLEAR") {
    switch (ctx.condition) {
      case "RAIN":
      case "HEAVY_RAIN":
      case "THUNDERSTORM":
        return "rain";
      case "SNOW":
        return "snow";
      case "FOG":
        return "fog";
      default:
        return "cloudy";
    }
  }

  switch (phase) {
    case "golden":
      return "clear-golden";
    case "morning":
      return "clear-morning";
    case "midday":
      return "clear-day";
    default:
      return "clear-evening";
  }
}
