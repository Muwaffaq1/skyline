// Contextual card rule engine. Only the top-priority triggered card renders
// on screen (evaluateCards returns all triggered ones, sorted by priority).

import type { WeatherForecast, LocalWallTime } from "../../domain/types";
import { compareWallTimes, formatHour } from "../time";
import { findRainWindows, type RainWindow } from "./rainWindow";
import { findBestWindow, type BestWindow } from "./bestTime";
import { yesterdayDelta } from "./yesterday";

export type InsightCard =
  | { kind: "storm"; title: string; body: string }
  | { kind: "rain-window"; title: string; body: string; window: RainWindow }
  | { kind: "uv"; title: string; body: string; uvIndex: number }
  | { kind: "wind"; title: string; body: string; windKph: number }
  | { kind: "temp-drop"; title: string; body: string; dropC: number; startTime: LocalWallTime }
  | { kind: "best-window"; title: string; body: string; window: BestWindow }
  | { kind: "yesterday"; title: string; body: string; deltaC: number }
  | { kind: "calm"; title: string; body: string };

// Priority order: danger first, then usefulness, then color.
const PRIORITY: InsightCard["kind"][] = [
  "storm",
  "rain-window",
  "uv",
  "wind",
  "temp-drop",
  "best-window",
  "yesterday",
  "calm",
];

const STORM_THRESHOLD_PROB = 70;
const STORM_LOOKAHEAD_H = 3;
const UV_ALERT_MIN = 6;
const WIND_ALERT_KPH = 35;
const TEMP_DROP_C = 5;
const TEMP_DROP_LOOKAHEAD_H = 3;
const YESTERDAY_DELTA_C = 2;

export function evaluateCards(f: WeatherForecast): InsightCard[] {
  const triggered: InsightCard[] = [];
  const current = f.current;
  if (!current) return triggered;

  const now = current.time;

  // 1 — storm / heavy rain: current condition, or high probability soon.
  if (current.condition === "THUNDERSTORM" || current.condition === "HEAVY_RAIN") {
    triggered.push({
      kind: "storm",
      title: "Storm warning",
      body: "Stay indoors if you can — heavy weather moving through.",
    });
  } else if (hasStormProbability(f, now)) {
    triggered.push({
      kind: "storm",
      title: "Storm likely soon",
      body: `High chance of heavy weather within the next ${STORM_LOOKAHEAD_H} hours.`,
    });
  }

  // 2 — rain window: first upcoming span of ≥2 hours ≥50%.
  const rainWindow = findRainWindows(f.hourly).find((w) =>
    compareWallTimes(w.end, now) > 0,
  );
  if (rainWindow) {
    triggered.push({
      kind: "rain-window",
      title: "Rain window",
      body: `Rain likely from ${formatHour(rainWindow.start)} to ${formatHour(rainWindow.end)}.`,
      window: rainWindow,
    });
  }

  // 3 — UV: strong sun within the next few hours (or right now).
  const uv = nextUvIndex(f, now);
  if (uv !== null && uv >= UV_ALERT_MIN) {
    triggered.push({
      kind: "uv",
      title: "High UV",
      body: `UV index ${Math.round(uv)} — sunscreen and shade if you're out long.`,
      uvIndex: uv,
    });
  }

  // 4 — wind.
  const wind = nextWind(f, now);
  if (wind !== null && wind >= WIND_ALERT_KPH) {
    triggered.push({
      kind: "wind",
      title: "Windy",
      body: `Gusts up to ${Math.round(wind)} km/h expected — hold onto your hat.`,
      windKph: wind,
    });
  }

  // 5 — temperature drop.
  const drop = findTempDrop(f);
  if (drop) {
    triggered.push({
      kind: "temp-drop",
      title: "Temperature drop",
      body: `Dropping ${Math.round(drop.dropC)}° by ${formatHour(drop.startTime)} — bring a layer.`,
      dropC: drop.dropC,
      startTime: drop.startTime,
    });
  }

  // 6 — best outdoor window.
  const best = findBestWindow(f.hourly);
  if (best) {
    triggered.push({
      kind: "best-window",
      title: "Best time today",
      body: `${formatHour(best.start)}–${formatHour(best.end)} looks great for being outside.`,
      window: best,
    });
  }

  // 7 — yesterday comparison.
  const delta = yesterdayDelta(current.temperatureC, f.yesterday, now);
  if (delta !== null && Math.abs(delta) >= YESTERDAY_DELTA_C) {
    const dir = delta > 0 ? "warmer" : "cooler";
    triggered.push({
      kind: "yesterday",
      title: "vs yesterday",
      body: `${Math.abs(Math.round(delta))}° ${dir} than yesterday at this time.`,
      deltaC: delta,
    });
  }

  // 8 — calm default.
  if (triggered.length === 0) {
    triggered.push({
      kind: "calm",
      title: "Clear skies ahead",
      body: "Nothing to watch out for today.",
    });
  }

  return triggered.sort(
    (a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind),
  );
}

function hasStormProbability(f: WeatherForecast, now: LocalWallTime): boolean {
  return f.hourly.some((h, i) => {
    if (i > STORM_LOOKAHEAD_H) return false;
    if (compareWallTimes(h.time, now) < 0) return false;
    return (
      h.precipitationProbability !== null &&
      h.precipitationProbability >= STORM_THRESHOLD_PROB
    );
  });
}

function nextUvIndex(f: WeatherForecast, now: LocalWallTime): number | null {
  for (const h of f.hourly) {
    if (compareWallTimes(h.time, now) < 0) continue;
    if (h.uvIndex !== null) return h.uvIndex;
  }
  return f.daily[0]?.uvIndexMax ?? null;
}

function nextWind(f: WeatherForecast, now: LocalWallTime): number | null {
  let max: number | null = null;
  for (const h of f.hourly) {
    if (compareWallTimes(h.time, now) < 0) continue;
    if (h.windKph !== null) max = Math.max(max ?? 0, h.windKph);
  }
  return max;
}

function findTempDrop(
  f: WeatherForecast,
): { dropC: number; startTime: LocalWallTime } | null {
  const currentTemp = f.current?.temperatureC ?? null;
  if (currentTemp === null) return null;

  for (let i = 1; i <= TEMP_DROP_LOOKAHEAD_H && i < f.hourly.length; i++) {
    const h = f.hourly[i];
    if (h.temperatureC === null) continue;
    const drop = currentTemp - h.temperatureC;
    if (drop >= TEMP_DROP_C) {
      return { dropC: drop, startTime: h.time };
    }
  }
  return null;
}