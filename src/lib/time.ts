// Location-local wall-clock helpers.
//
// Rule: never pass an Open-Meteo timestamp to `new Date()` — an offset-less
// ISO string is parsed as *browser-local* time, which would shift hours for
// any forecast location in another timezone. Everything stays in LocalWallTime
// structs and is compared/formatted structurally, which also makes DST
// duplicate/missing hours a non-issue.

import type { LocalWallTime } from "../domain/types";

// Hourly/current values are "T HH:MM"; daily values are date-only — both are
// location-local, so one struct covers them (date-only → 00:00).
const LOCAL_ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/;

export function parseLocalIso(s: string): LocalWallTime {
  const m = LOCAL_ISO_RE.exec(s);
  if (!m) throw new Error(`Unparseable local ISO time: ${s}`);
  return {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: Number(m[4] ?? 0),
    mi: Number(m[5] ?? 0),
  };
}

/**
 * Location-local wall clock now, without a timezone database: shift the epoch
 * by the location's UTC offset, then read the components with UTC getters.
 */
export function locationNow(utcOffsetSeconds: number): LocalWallTime {
  const shifted = new Date(Date.now() + utcOffsetSeconds * 1000);
  return {
    y: shifted.getUTCFullYear(),
    mo: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
    mi: shifted.getUTCMinutes(),
  };
}

/** Structural comparison: negative if a < b, positive if a > b, else 0. */
export function compareWallTimes(a: LocalWallTime, b: LocalWallTime): number {
  const ka = a.y * 1_000_000 + a.mo * 10_000 + a.d * 100 + a.h;
  const kb = b.y * 1_000_000 + b.mo * 10_000 + b.d * 100 + b.h;
  return ka - kb;
}

export function sameHour(a: LocalWallTime, b: LocalWallTime): boolean {
  return a.y === b.y && a.mo === b.mo && a.d === b.d && a.h === b.h;
}

/** "1PM" / "11AM" */
export function formatHour(t: LocalWallTime): string {
  const hour12 = t.h % 12 === 0 ? 12 : t.h % 12;
  return `${hour12}${t.h < 12 ? "AM" : "PM"}`;
}

/** "8:40 AM" — used by the staleness banner copy. */
export function formatClock(t: LocalWallTime): string {
  const hour12 = t.h % 12 === 0 ? 12 : t.h % 12;
  const minute = String(t.mi).padStart(2, "0");
  return `${hour12}:${minute} ${t.h < 12 ? "AM" : "PM"}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** "Fri" — derived from the date components, not the wall clock. */
export function weekdayName(t: LocalWallTime): string {
  const day = new Date(Date.UTC(t.y, t.mo - 1, t.d)).getUTCDay();
  return WEEKDAYS[day];
}

/** "Today" when the two times share a date, otherwise the weekday. */
export function formatWeekday(t: LocalWallTime, today: LocalWallTime): string {
  return t.y === today.y && t.mo === today.mo && t.d === today.d
    ? "Today"
    : weekdayName(t);
}