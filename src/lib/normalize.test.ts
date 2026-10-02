import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { normalizeForecast, locationKeyOf } from "./normalize";
import type { RawForecast } from "../api/openMeteo";
import { TEST_LOCATION } from "./testFixtures";

/**
 * A raw payload shaped like a real `past_days=1` response: hourly starts
 * YESTERDAY morning, so plain index arithmetic (start − 24) would grab the
 * wrong hours. Yesterday's temps must come from structural date matching.
 * Spans 3 days so the 24h slice has room past "now".
 */
function rawWithPastDays(): RawForecast {
  const times: string[] = [];
  const temps: number[] = [];
  const weather: number[] = [];
  const isDay: number[] = [];
  for (let d = 1; d <= 3; d++) {
    for (let h = 0; h < 24; h++) {
      times.push(`2026-10-0${d}T${String(h).padStart(2, "0")}:00`);
      temps.push(d === 1 ? 15 + h * 0.5 : d === 2 ? 20 + h * 0.1 : 21 + h * 0.1);
      weather.push(0);
      isDay.push(h >= 6 && h < 19 ? 1 : 0);
    }
  }
  return {
    timezone: "Africa/Lagos",
    utc_offset_seconds: 3600,
    current: {
      time: "2026-10-02T14:30",
      temperature_2m: 22,
      apparent_temperature: 21,
      is_day: 1,
      weather_code: 0,
    },
    hourly: {
      time: times,
      temperature_2m: temps,
      apparent_temperature: temps.map((x) => x - 1),
      weather_code: weather,
      precipitation_probability: times.map(() => 0),
      is_day: isDay,
      uv_index: times.map(() => 4),
      wind_speed_10m: times.map(() => 10),
    },
    daily: {
      time: ["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08"],
      weather_code: [0, 0, 0, 0, 0, 0, 0, 0],
      temperature_2m_max: [22, 26, 25, 24, 23, 22, 21, 20],
      temperature_2m_min: [12, 18, 17, 16, 15, 14, 13, 12],
      precipitation_probability_max: [0, 0, 0, 0, 0, 0, 0, 0],
      precipitation_sum: [0, 0, 0, 0, 0, 0, 0, 0],
      sunrise: ["2026-10-01T06:40", "2026-10-02T06:40", "2026-10-03T06:41", "2026-10-04T06:42", "2026-10-05T06:43", "2026-10-06T06:44", "2026-10-07T06:45", "2026-10-08T06:46"],
      sunset: ["2026-10-01T19:10", "2026-10-02T19:10", "2026-10-03T19:09", "2026-10-04T19:08", "2026-10-05T19:07", "2026-10-06T19:06", "2026-10-07T19:05", "2026-10-08T19:04"],
      uv_index_max: [6, 6, 6, 6, 6, 6, 6, 6],
      wind_speed_10m_max: [20, 20, 20, 20, 20, 20, 20, 20],
    },
  };
}

// locationNow() derives "now" from the real clock — pin it so the hourly
// slice and yesterday's hour are deterministic.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-02T14:30:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
});

describe("normalizeForecast with past_days", () => {
  it("slices the 24h window starting at the location's current hour", () => {
    const f = normalizeForecast(rawWithPastDays(), TEST_LOCATION);
    expect(f.hourly).toHaveLength(24);
    // Location-local "now" is 2026-10-02 15:30 → first hour ≥ now is 15:00.
    expect(f.hourly[0].time).toEqual({ y: 2026, mo: 10, d: 2, h: 15, mi: 0 });
  });

  it("extracts yesterday by structural date match, not index arithmetic", () => {
    const f = normalizeForecast(rawWithPastDays(), TEST_LOCATION);
    expect(f.yesterday).not.toBeNull();
    expect(f.yesterday!.date).toEqual({ y: 2026, mo: 10, d: 1, h: 0, mi: 0 });
    // Yesterday hour 14: 15 + 14*0.5 = 22.
    expect(f.yesterday!.tempByHour[14]).toBeCloseTo(22);
    expect(f.yesterday!.tempByHour[0]).toBeCloseTo(15);
    expect(f.yesterday!.minC).toBe(12);
    expect(f.yesterday!.maxC).toBe(22);
  });

  it("keeps daily[0] as TODAY (pre-today entries dropped) and maps new fields", () => {
    const f = normalizeForecast(rawWithPastDays(), TEST_LOCATION);
    expect(f.daily).toHaveLength(7);
    expect(f.daily[0].date).toEqual({ y: 2026, mo: 10, d: 2, h: 0, mi: 0 });
    // Hero high/low come from today, not yesterday.
    expect(f.current?.highC).toBe(26);
    expect(f.current?.lowC).toBe(18);
    expect(f.daily[0].sunrise).toEqual({ y: 2026, mo: 10, d: 2, h: 6, mi: 40 });
    expect(f.daily[0].sunset).toEqual({ y: 2026, mo: 10, d: 2, h: 19, mi: 10 });
    expect(f.daily[0].uvIndexMax).toBe(6);
    expect(f.daily[0].windKphMax).toBe(20);
    expect(f.hourly[0].uvIndex).toBe(4);
    expect(f.hourly[0].windKph).toBe(10);
    expect(f.hourly[0].apparentC).toBe(f.hourly[0].temperatureC! - 1);
  });

  it("stamps schemaVersion", () => {
    const f = normalizeForecast(rawWithPastDays(), TEST_LOCATION);
    expect(f.schemaVersion).toBe(2);
  });
});

describe("locationKeyOf", () => {
  it("rounds to 4dp so the same place maps to the same cache key", () => {
    expect(locationKeyOf(6.5244001, 3.4)).toBe("6.5244,3.4000");
    expect(locationKeyOf(6.5244, 3.4)).toBe(locationKeyOf(6.5244001, 3.4));
  });
});