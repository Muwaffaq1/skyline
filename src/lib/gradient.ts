// (condition, isDay, location-local hour) → sky token name.
// Mood changes, structure never does (PRD visual constraint): the interface
// layout is identical under every token — only the atmosphere shifts.

import type { SkylineCondition } from "../domain/types";

export type SkyToken =
  | "clear-morning"
  | "clear-day"
  | "clear-evening"
  | "night"
  | "rain"
  | "cloudy"
  | "snow"
  | "fog";

export function skyTokenFor(
  condition: SkylineCondition,
  isDay: boolean,
  localHour: number,
): SkyToken {
  if (!isDay) return "night";

  switch (condition) {
    case "CLEAR":
      if (localHour < 11) return "clear-morning";
      if (localHour < 17) return "clear-day";
      return "clear-evening"; // is_day flips to 0 soon after; evening covers the gap
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