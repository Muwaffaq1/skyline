// Sun experience row — one line inside the hourly card:
// "↑ 6:40 AM · ↓ 7:10 PM · Sunset in 2 h 14 m". Countdown targets whichever
// sun event comes next; no countdown once both have passed.

import { formatClock, locationNow, minutesOfDay } from "../../lib/time";
import { useCountdown } from "../../hooks/useCountdown";
import type { LocalWallTime } from "../../domain/types";

interface SunTimesProps {
  sunrise: LocalWallTime | null;
  sunset: LocalWallTime | null;
  utcOffsetSeconds: number;
}

export function SunTimes({ sunrise, sunset, utcOffsetSeconds }: SunTimesProps) {
  const now = locationNow(utcOffsetSeconds);

  const upcoming: { label: string; time: LocalWallTime } | null = (() => {
    const candidates: { label: string; time: LocalWallTime }[] = [];
    if (sunset && minutesOfDay(sunset) > minutesOfDay(now)) {
      candidates.push({ label: "Sunset in", time: sunset });
    }
    if (sunrise && minutesOfDay(sunrise) > minutesOfDay(now)) {
      candidates.push({ label: "Sunrise in", time: sunrise });
    }
    // Soonest next event wins.
    return candidates.sort((a, b) => minutesOfDay(a.time) - minutesOfDay(b.time))[0] ?? null;
  })();

  const countdown = useCountdown(upcoming?.time ?? null, utcOffsetSeconds);

  if (!sunrise && !sunset) return null;

  return (
    <p className="sun-times" aria-label={sunLabel(sunrise, sunset, upcoming, countdown)}>
      <span>{sunrise ? `↑ ${formatClock(sunrise)}` : null}</span>
      {sunrise && sunset && <span aria-hidden="true"> · </span>}
      <span>{sunset ? `↓ ${formatClock(sunset)}` : null}</span>
      {countdown && upcoming && (
        <span aria-hidden="true">
          {" · "}
          {upcoming.label} {countdown}
        </span>
      )}
    </p>
  );
}

function sunLabel(
  sunrise: LocalWallTime | null,
  sunset: LocalWallTime | null,
  upcoming: { label: string } | null,
  countdown: string | null,
): string {
  const parts: string[] = [];
  if (sunrise) parts.push(`Sunrise at ${formatClock(sunrise)}`);
  if (sunset) parts.push(`Sunset at ${formatClock(sunset)}`);
  if (upcoming && countdown) parts.push(`${upcoming.label.toLowerCase()} ${countdown}`);
  return parts.join(", ");
}