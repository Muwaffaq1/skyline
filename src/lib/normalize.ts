// Raw Open-Meteo payload → WeatherForecast.
//
// Handles the PRD's normalization requirements:
// - timezone: timestamps stay location-local (LocalWallTime structs)
// - "Now": first hourly entry at or after the location's current hour
// - partial response: a failed section records itself in missingSections
//   instead of destroying the whole screen
// - DST: structural (y,mo,d,h) matching, so duplicate/missing hours render
//   exactly what exists

import { fromWmoCode } from "../api/wmo";
import type { RawForecast } from "../api/openMeteo";
import type {
  CurrentWeather,
  DailyPoint,
  HourlyPoint,
  LocalWallTime,
  WeatherForecast,
  WeatherLocation,
  YesterdaySummary,
} from "../domain/types";
import { SCHEMA_VERSION } from "../domain/types";
import { compareWallTimes, locationNow, parseLocalIso } from "./time";

export const HOURLY_HOURS = 24;

export function locationKeyOf(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

function normalizeCurrent(raw: RawForecast, today: DailyPoint | null): CurrentWeather | null {
  const c = raw.current;
  if (!c) return null;
  const info = fromWmoCode(c.weather_code);
  return {
    temperatureC: c.temperature_2m,
    feelsLikeC: c.apparent_temperature,
    condition: info.condition,
    conditionLabel: info.label,
    conditionCode: c.weather_code,
    isDay: c.is_day === 1,
    // today's daily entry supplies the hero's high/low; null when the daily
    // section failed
    highC: today?.maxC ?? null,
    lowC: today?.minC ?? null,
    time: parseLocalIso(c.time),
  };
}

function findNowIndex(times: string[], now: LocalWallTime): number {
  const nowHour: LocalWallTime = { ...now, mi: 0 };
  const idx = times.findIndex((t) => {
    try {
      return compareWallTimes(parseLocalIso(t), nowHour) >= 0;
    } catch {
      return false;
    }
  });
  return idx; // -1 when the payload has nothing at/after "now"
}

function normalizeHourly(
  raw: RawForecast,
  now: LocalWallTime,
): HourlyPoint[] {
  const hourly = raw.hourly;
  if (!hourly || !hourly.time?.length) return [];

  const start = findNowIndex(hourly.time, now);
  if (start === -1) return [];

  const slice = hourly.time.slice(start, start + HOURLY_HOURS);
  return slice.map((t, i) => {
    const j = start + i;
    const info = fromWmoCode(hourly.weather_code?.[j] ?? 3);
    return {
      time: parseLocalIso(t),
      temperatureC: hourly.temperature_2m?.[j] ?? null,
      apparentC: hourly.apparent_temperature?.[j] ?? null,
      condition: info.condition,
      conditionLabel: info.label,
      isDay: (hourly.is_day?.[j] ?? 1) === 1,
      precipitationProbability: hourly.precipitation_probability?.[j] ?? null,
      uvIndex: hourly.uv_index?.[j] ?? null,
      windKph: hourly.wind_speed_10m?.[j] ?? null,
    };
  });
}

function normalizeDaily(raw: RawForecast): DailyPoint[] {
  const daily = raw.daily;
  if (!daily || !daily.time?.length) return [];

  return daily.time.map((t, i) => {
    const info = fromWmoCode(daily.weather_code?.[i] ?? 3);
    const sunrise = daily.sunrise?.[i];
    const sunset = daily.sunset?.[i];
    return {
      date: parseLocalIso(t),
      minC: daily.temperature_2m_min[i],
      maxC: daily.temperature_2m_max[i],
      condition: info.condition,
      conditionLabel: info.label,
      precipitationProbability: daily.precipitation_probability_max?.[i] ?? null,
      sunrise: sunrise ? parseLocalIso(sunrise) : null,
      sunset: sunset ? parseLocalIso(sunset) : null,
      uvIndexMax: daily.uv_index_max?.[i] ?? null,
      windKphMax: daily.wind_speed_10m_max?.[i] ?? null,
      precipSumMm: daily.precipitation_sum?.[i] ?? null,
    };
  });
}

/** Calendar-day before `t`, pure date arithmetic (safe at month/year boundaries). */
function previousDay(t: LocalWallTime): LocalWallTime {
  const d = new Date(Date.UTC(t.y, t.mo - 1, t.d - 1));
  return { y: d.getUTCFullYear(), mo: d.getUTCMonth() + 1, d: d.getUTCDate(), h: 0, mi: 0 };
}

/**
 * Yesterday's hourly temps, matched structurally by date — NEVER by index
 * arithmetic, because past_days shifts the hourly array start.
 */
function buildYesterday(
  raw: RawForecast,
  now: LocalWallTime,
): YesterdaySummary | null {
  const hourly = raw.hourly;
  if (!hourly?.time?.length) return null;

  const yesterdayDate = previousDay(now);
  const tempByHour: (number | null)[] = new Array(24).fill(null);
  let seen = false;
  for (let i = 0; i < hourly.time.length; i++) {
    let t: LocalWallTime;
    try {
      t = parseLocalIso(hourly.time[i]);
    } catch {
      continue;
    }
    if (t.y !== yesterdayDate.y || t.mo !== yesterdayDate.mo || t.d !== yesterdayDate.d) continue;
    seen = true;
    tempByHour[t.h] = hourly.temperature_2m?.[i] ?? null;
  }
  if (!seen) return null;

  // Daily min/max for yesterday, when the daily section reaches that far back.
  const daily = raw.daily;
  let minC: number | null = null;
  let maxC: number | null = null;
  if (daily?.time?.length) {
    const idx = daily.time.findIndex((t) => {
      try {
        const dt = parseLocalIso(t);
        return dt.y === yesterdayDate.y && dt.mo === yesterdayDate.mo && dt.d === yesterdayDate.d;
      } catch {
        return false;
      }
    });
    if (idx >= 0) {
      minC = daily.temperature_2m_min?.[idx] ?? null;
      maxC = daily.temperature_2m_max?.[idx] ?? null;
    }
  }

  return { date: yesterdayDate, tempByHour, minC, maxC };
}

export function normalizeForecast(
  raw: RawForecast,
  location: WeatherLocation,
): WeatherForecast {
  const now = locationNow(raw.utc_offset_seconds ?? 0);
  // past_days prepends yesterday to the daily array — every consumer indexes
  // daily[0] as "today", so drop pre-today entries (yesterday survives in the
  // dedicated summary below).
  const todayStart: LocalWallTime = { ...now, h: 0, mi: 0 };
  const daily = normalizeDaily(raw).filter((d) => compareWallTimes(d.date, todayStart) >= 0);
  const current = normalizeCurrent(raw, daily[0] ?? null);
  const hourly = normalizeHourly(raw, now);
  const yesterday = buildYesterday(raw, now);

  const missingSections: WeatherForecast["missingSections"] = [];
  if (!current) missingSections.push("hourly", "daily"); // nothing usable rendered without current
  if (current && hourly.length === 0) missingSections.push("hourly");
  if (current && daily.length === 0) missingSections.push("daily");

  return {
    schemaVersion: SCHEMA_VERSION,
    locationKey: locationKeyOf(location.latitude, location.longitude),
    location,
    current,
    hourly,
    daily,
    yesterday,
    missingSections,
    utcOffsetSeconds: raw.utc_offset_seconds ?? 0,
    fetchedAt: Date.now(),
  };
}