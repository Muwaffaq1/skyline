// Best outdoor window: the nicest multi-hour stretch in the next 12 hours,
// scored on temperature, rain probability, wind and UV.

import type { HourlyPoint, LocalWallTime } from "../../domain/types";
import { compareWallTimes } from "../time";

export interface BestWindow {
  startIdx: number; // inclusive, into the array passed to findBestWindow
  endIdx: number; // inclusive
  start: LocalWallTime;
  end: LocalWallTime;
  avgScore: number;
}

const MIN_HOURS = 2;
const LOOKAHEAD_HOURS = 12;
const MAX_PRECIP_PROB = 30;

export function findBestWindow(hours: HourlyPoint[]): BestWindow | null {
  // Only usable, dry-ish hours compete.
  const eligible: boolean[] = hours.slice(0, LOOKAHEAD_HOURS).map((h) => {
    if (h.temperatureC === null) return false;
    const p = h.precipitationProbability;
    return !(p !== null && p >= MAX_PRECIP_PROB);
  });

  // Contiguous runs of eligible cells, scored by window average.
  let best: BestWindow | null = null;

  for (let start = 0; start < eligible.length; start++) {
    if (!eligible[start]) continue;
    for (let end = start; end < eligible.length && eligible[end]; end++) {
      if (end - start + 1 < MIN_HOURS) continue;
      const score = windowScore(hours, start, end);
      if (score === null) continue;
      if (!best || score > best.avgScore) {
        best = {
          startIdx: start,
          endIdx: end,
          start: hours[start].time,
          end: hours[end].time,
          avgScore: score,
        };
      }
    }
  }

  return best;
}

function windowScore(hours: HourlyPoint[], start: number, end: number): number | null {
  let total = 0;
  let counted = 0;
  for (let i = start; i <= end; i++) {
    const s = hourScore(hours[i]);
    if (s === null) return null;
    total += s;
    counted++;
  }
  return counted > 0 ? total / counted : null;
}

function hourScore(h: HourlyPoint): number | null {
  if (h.temperatureC === null) return null;

  // Temperature: 1.0 in the 18–26 °C comfort band, tapering linearly to 0 at 8 °C / 32 °C.
  const t = h.temperatureC;
  let tempScore: number;
  if (t >= 18 && t <= 26) tempScore = 1;
  else if (t < 18) tempScore = Math.max(0, (t - 8) / 10);
  else tempScore = Math.max(0, (32 - t) / 6);

  // Rain: linear penalty on probability.
  const prob = h.precipitationProbability ?? 0;
  const rainFactor = 1 - prob / 100;

  // Wind: calm is nice, 50 km/h is miserable (floor 0.2 so it never zeroes out).
  const wind = h.windKph ?? 0;
  const windFactor = Math.max(0.2, 1 - wind / 50);

  // UV: strong sun is uncomfortable for outdoor activity at the very top.
  const uv = h.uvIndex ?? 0;
  const uvFactor = uv >= 8 ? 0.5 : 1;

  return tempScore * rainFactor * windFactor * uvFactor;
}

/** Guard used by callers that need the window to still be in the future. */
export function isStillUpcoming(w: BestWindow, now: LocalWallTime): boolean {
  return compareWallTimes(w.end, now) >= 0;
}