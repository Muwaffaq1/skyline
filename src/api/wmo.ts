// WMO weather-interpretation code → Skyline's normalized condition set.
// Labels double as accessibility labels ("Light rain", never "Icon 12").
// WIND exists in the enum for provider portability (PRD) but has no
// Open-Meteo trigger in V1.

import type { SkylineCondition } from "../domain/types";

export interface ConditionInfo {
  condition: SkylineCondition;
  label: string;
}

const CLEAR: ConditionInfo = { condition: "CLEAR", label: "Clear" };
const MOSTLY_CLEAR: ConditionInfo = { condition: "PARTLY_CLOUDY", label: "Mostly clear" };
const PARTLY_CLOUDY: ConditionInfo = { condition: "PARTLY_CLOUDY", label: "Partly cloudy" };
const CLOUDY: ConditionInfo = { condition: "CLOUDY", label: "Cloudy" };
const FOG: ConditionInfo = { condition: "FOG", label: "Foggy" };
const HEAVY_RAIN: ConditionInfo = { condition: "HEAVY_RAIN", label: "Heavy rain" };
const THUNDERSTORM: ConditionInfo = { condition: "THUNDERSTORM", label: "Thunderstorm" };

const byCode: Record<number, ConditionInfo> = {
  0: CLEAR,
  1: MOSTLY_CLEAR,
  2: PARTLY_CLOUDY,
  3: CLOUDY,
  45: FOG,
  48: FOG,

  51: { condition: "RAIN", label: "Light drizzle" },
  53: { condition: "RAIN", label: "Drizzle" },
  55: { condition: "RAIN", label: "Heavy drizzle" },
  56: { condition: "RAIN", label: "Freezing drizzle" },
  57: { condition: "RAIN", label: "Freezing drizzle" },
  61: { condition: "RAIN", label: "Light rain" },
  63: { condition: "RAIN", label: "Rain" },
  65: HEAVY_RAIN,
  66: { condition: "RAIN", label: "Freezing rain" },
  67: { condition: "RAIN", label: "Freezing rain" },
  80: { condition: "RAIN", label: "Light showers" },
  81: { condition: "RAIN", label: "Showers" },
  82: { condition: "HEAVY_RAIN", label: "Violent showers" },

  71: { condition: "SNOW", label: "Light snow" },
  73: { condition: "SNOW", label: "Snow" },
  75: { condition: "SNOW", label: "Heavy snow" },
  77: { condition: "SNOW", label: "Snow grains" },
  85: { condition: "SNOW", label: "Snow showers" },
  86: { condition: "SNOW", label: "Heavy snow showers" },

  95: THUNDERSTORM,
  96: { condition: "THUNDERSTORM", label: "Thunderstorm with hail" },
  99: { condition: "THUNDERSTORM", label: "Thunderstorm with heavy hail" },
};

const fallback: ConditionInfo = CLOUDY;

export function fromWmoCode(code: number): ConditionInfo {
  return byCode[code] ?? fallback;
}

/** Coarse label used when only the normalized condition is known. */
export const conditionLabels: Record<SkylineCondition, string> = {
  CLEAR: "Clear",
  PARTLY_CLOUDY: "Partly cloudy",
  CLOUDY: "Cloudy",
  FOG: "Foggy",
  RAIN: "Rain",
  HEAVY_RAIN: "Heavy rain",
  THUNDERSTORM: "Thunderstorm",
  SNOW: "Snow",
  WIND: "Windy",
};