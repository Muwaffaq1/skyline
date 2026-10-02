// Demo mode: a pure render-time override layer for portfolio demos.
//
// applyDemo NEVER mutates the query cache or the persisted snapshot — it
// returns a rewritten copy that only render paths (useSkyToken, WeatherScreen)
// consume. cacheForecast always stores the raw query data, so exiting a demo
// restores the real forecast exactly. Alerts evaluation is skipped while a
// demo is active (useNotifications).

import type {
  HourlyPoint,
  SkylineCondition,
  WeatherForecast,
} from "../domain/types";
import { conditionLabels } from "../api/wmo";
export const DEMO_SCENARIOS = [
  "storm",
  "rain",
  "clear",
  "snow",
  "night",
  "sunset",
  "fog",
] as const;

export type DemoScenario = (typeof DEMO_SCENARIOS)[number];

export const DEMO_LABELS: Record<DemoScenario, string> = {
  storm: "Thunderstorm",
  rain: "Rain",
  clear: "Clear day",
  snow: "Snow",
  night: "Night",
  sunset: "Golden hour",
  fog: "Fog",
};

interface ScenarioShape {
  condition: SkylineCondition;
  /** Hour the demo claims it is — null keeps the real local time. */
  hourOverride: number | null;
  tempC: number;
  precipProbability: number;
  windKph: number;
  uvIndex: number;
  /** Beyond the first hours, real data tapers back in (when it exists). */
  rewriteAllHours: boolean;
}

const SCENARIOS: Record<DemoScenario, ScenarioShape> = {
  storm: {
    condition: "THUNDERSTORM",
    hourOverride: 16,
    tempC: 24,
    precipProbability: 90,
    windKph: 55,
    uvIndex: 1,
    rewriteAllHours: false,
  },
  rain: {
    condition: "RAIN",
    hourOverride: null,
    tempC: 18,
    precipProbability: 75,
    windKph: 22,
    uvIndex: 2,
    rewriteAllHours: true,
  },
  clear: {
    condition: "CLEAR",
    hourOverride: 13,
    tempC: 26,
    precipProbability: 0,
    windKph: 8,
    uvIndex: 7,
    rewriteAllHours: false,
  },
  snow: {
    condition: "SNOW",
    hourOverride: null,
    tempC: -3,
    precipProbability: 80,
    windKph: 18,
    uvIndex: 1,
    rewriteAllHours: true,
  },
  night: {
    condition: "CLEAR",
    hourOverride: 23,
    tempC: 14,
    precipProbability: 0,
    windKph: 6,
    uvIndex: 0,
    rewriteAllHours: true,
  },
  sunset: {
    condition: "CLEAR",
    hourOverride: null, // pinned to sunset−1h at runtime, below
    tempC: 22,
    precipProbability: 0,
    windKph: 10,
    uvIndex: 2,
    rewriteAllHours: false,
  },
  fog: {
    condition: "FOG",
    hourOverride: 7,
    tempC: 11,
    precipProbability: 10,
    windKph: 4,
    uvIndex: 1,
    rewriteAllHours: false,
  },
};

/** How many hourly cells the scenario rewrites when not rewriting all. */
const DEMO_HOURS = 8;

function demoHourly(point: HourlyPoint, shape: ScenarioShape, i: number): HourlyPoint {
  return {
    ...point,
    temperatureC: Math.round((shape.tempC + i * 0.3) * 10) / 10,
    apparentC: shape.tempC - 1,
    condition: shape.condition,
    conditionLabel: conditionLabels[shape.condition],
    isDay: shape.hourOverride !== null ? shape.hourOverride >= 6 && shape.hourOverride < 20 : shape.condition !== "THUNDERSTORM",
    precipitationProbability: shape.precipProbability,
    uvIndex: shape.uvIndex,
    windKph: shape.windKph,
  };
}

/**
 * Rewrites a forecast copy so the scenario drives the sky, hero, timeline,
 * cards and alerts. With no forecast available it fabricates a complete one
 * from a fixed template, so demos work offline.
 */
export function applyDemo(
  forecast: WeatherForecast | null,
  demo: DemoScenario | null,
): WeatherForecast | null {
  if (!demo) return forecast;

  const shape = SCENARIOS[demo];
  const base: WeatherForecast =
    forecast ??
    ({
      schemaVersion: 2,
      locationKey: "demo",
      location: {
        id: "demo",
        city: "Demo City",
        region: null,
        country: "Demo",
        latitude: 6.5,
        longitude: 3.4,
        timezone: "Africa/Lagos",
        isDeviceLocation: false,
      },
      current: null,
      hourly: [],
      daily: [],
      yesterday: null,
      missingSections: [],
      utcOffsetSeconds: 3600,
      fetchedAt: Date.now(),
    } as WeatherForecast);

  const out: WeatherForecast = {
    ...base,
    current: base.current ? { ...base.current } : null,
    hourly: base.hourly.map((h) => ({ ...h })),
    daily: base.daily.map((d) => ({ ...d })),
    missingSections: [],
  };

  if (out.current) {
    out.current = {
      ...out.current,
      temperatureC: shape.tempC,
      feelsLikeC: shape.tempC - 1,
      condition: shape.condition,
      conditionLabel: conditionLabels[shape.condition],
      isDay: shape.hourOverride !== null
        ? shape.hourOverride >= 6 && shape.hourOverride < 20
        : shape.condition !== "THUNDERSTORM",
      highC: Math.max(out.current.highC ?? shape.tempC, shape.tempC),
      lowC: Math.min(out.current.lowC ?? shape.tempC, shape.tempC),
    };
  }

  // Rewrite the near-future hourly slice; hourly may be empty when offline.
  out.hourly = out.hourly.map((h, i) =>
    shape.rewriteAllHours || i < DEMO_HOURS ? demoHourly(h, shape, i) : h,
  );

  // Sunset scenario: shift the first hours toward the golden window so the
  // golden-hour sky, countdown and scrubbing are demonstrable together.
  if (demo === "sunset" && out.hourly.length > 0) {
    const sunsetHour = out.daily[0]?.sunset?.h ?? 18;
    const startHour = Math.max(0, sunsetHour - 1); // ~golden hour
    out.hourly = out.hourly.map((h, i) =>
      i < DEMO_HOURS ? { ...h, time: { ...h.time, h: (startHour + i) % 24 } } : h,
    );
  }

  return out;
}
