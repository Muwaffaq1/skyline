// Rain-window detection: contiguous hours whose precipitation probability
// meets a threshold, summarized as "Rain likely from 4–6 PM" material.

import type { HourlyPoint, LocalWallTime } from "../../domain/types";

export interface RainWindow {
  startIdx: number; // inclusive, into the array passed to findRainWindows
  endIdx: number; // inclusive
  start: LocalWallTime;
  end: LocalWallTime;
  maxProbability: number;
}

/** Contiguous runs of hours with precipitationProbability ≥ threshold. */
export function findRainWindows(
  hours: HourlyPoint[],
  threshold = 50,
  minHours = 2,
): RainWindow[] {
  const windows: RainWindow[] = [];
  let startIdx = -1;
  let maxProb = 0;

  const flush = (endIdx: number) => {
    if (startIdx >= 0 && endIdx - startIdx + 1 >= minHours) {
      windows.push({
        startIdx,
        endIdx,
        start: hours[startIdx].time,
        end: hours[endIdx].time,
        maxProbability: maxProb,
      });
    }
    startIdx = -1;
    maxProb = 0;
  };

  for (let i = 0; i < hours.length; i++) {
    const p = hours[i].precipitationProbability;
    if (p !== null && p >= threshold) {
      if (startIdx === -1) startIdx = i;
      maxProb = Math.max(maxProb, p);
    } else {
      flush(i - 1);
    }
  }
  flush(hours.length - 1);

  return windows;
}

/** Indices (into the same array) covered by any rain window, for cell shading. */
export function rainWindowIndexSet(windows: RainWindow[]): Set<number> {
  const covered = new Set<number>();
  for (const w of windows) {
    for (let i = w.startIdx; i <= w.endIdx; i++) covered.add(i);
  }
  return covered;
}
