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
} from "../domain/types";
import { compareWallTimes, locationNow, parseLocalIso } from "./time";

export const HOURLY_HOURS = 24;

export function locationKeyOf(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
}

function normalizeCurrent(raw: RawForecast, daily: RawForecast["daily"]): CurrentWeather | null {
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
    // daily[0] supplies the hero's high/low; null when the daily section failed
    highC: daily?.temperature_2m_max?.[0] ?? null,
    lowC: daily?.temperature_2m_min?.[0] ?? null,
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
      condition: info.condition,
      conditionLabel: info.label,
      isDay: (hourly.is_day?.[j] ?? 1) === 1,
      precipitationProbability: hourly.precipitation_probability?.[j] ?? null,
    };
  });
}

function normalizeDaily(raw: RawForecast): DailyPoint[] {
  const daily = raw.daily;
  if (!daily || !daily.time?.length) return [];

  return daily.time.map((t, i) => {
    const info = fromWmoCode(daily.weather_code?.[i] ?? 3);
    return {
      date: parseLocalIso(t),
      minC: daily.temperature_2m_min[i],
      maxC: daily.temperature_2m_max[i],
      condition: info.condition,
      conditionLabel: info.label,
      precipitationProbability: daily.precipitation_probability_max?.[i] ?? null,
    };
  });
}

export function normalizeForecast(
  raw: RawForecast,
  location: WeatherLocation,
): WeatherForecast {
  const now = locationNow(raw.utc_offset_seconds ?? 0);
  const current = normalizeCurrent(raw, raw.daily);
  const hourly = normalizeHourly(raw, now);
  const daily = normalizeDaily(raw);

  const missingSections: WeatherForecast["missingSections"] = [];
  if (!current) missingSections.push("hourly", "daily"); // nothing usable rendered without current
  if (current && hourly.length === 0) missingSections.push("hourly");
  if (current && daily.length === 0) missingSections.push("daily");

  return {
    locationKey: locationKeyOf(location.latitude, location.longitude),
    location,
    current,
    hourly,
    daily,
    missingSections,
    utcOffsetSeconds: raw.utc_offset_seconds ?? 0,
    fetchedAt: Date.now(),
  };
}