// Yesterday comparison: current temp vs yesterday's temp at the same
// location-local hour. Null when either side is missing — never guessed.

import type { LocalWallTime, YesterdaySummary } from "../../domain/types";

/** Δ vs yesterday same hour, or null when the comparison can't be made. */
export function yesterdayDelta(
  currentTempC: number,
  yesterday: YesterdaySummary | null,
  now: LocalWallTime,
): number | null {
  if (!yesterday) return null;
  const yesterdayTemp = yesterday.tempByHour[now.h] ?? null;
  if (yesterdayTemp === null) return null;
  return currentTempC - yesterdayTemp;
}