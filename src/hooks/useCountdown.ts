// Minute-granularity countdown to a location-local wall time. Returns null
// when there's no target; re-renders every 30 s so the label stays honest.

import { useEffect, useState } from "react";
import { wallToEpochMs } from "../lib/time";
import type { LocalWallTime } from "../domain/types";

export function useCountdown(
  target: LocalWallTime | null,
  utcOffsetSeconds: number,
): string | null {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!target) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [target]);

  if (!target) return null;
  const remainingMs = wallToEpochMs(target, utcOffsetSeconds) - Date.now();
  if (remainingMs <= 0) return null;

  const totalMinutes = Math.round(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} m`;
  return `${hours} h ${minutes} m`;
}