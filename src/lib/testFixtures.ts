// Shared test fixtures for insight-engine tests. Not imported by app code.

import type {
  DailyPoint,
  HourlyPoint,
  LocalWallTime,
  WeatherForecast,
  WeatherLocation,
} from "../domain/types";

export const TEST_LOCATION: WeatherLocation = {
  id: "geo:1",
  city: "Testville",
  region: null,
  country: "Testland",
  latitude: 6.5,
  longitude: 3.4,
  timezone: "Africa/Lagos",
  isDeviceLocation: false,
};

export function wt(h: number, d = 2, mo = 10): LocalWallTime {
  return { y: 2026, mo, d, h, mi: 0 };
}

export function hour(h: number, overrides: Partial<HourlyPoint> = {}): HourlyPoint {
  return {
    time: wt(h),
    temperatureC: 22,
    apparentC: 22,
    condition: "CLEAR",
    conditionLabel: "Clear",
    isDay: true,
    precipitationProbability: 0,
    uvIndex: 3,
    windKph: 10,
    ...overrides,
  };
}

export function day(d: number, overrides: Partial<DailyPoint> = {}): DailyPoint {
  return {
    date: { y: 2026, mo: 10, d, h: 0, mi: 0 },
    minC: 18,
    maxC: 26,
    condition: "CLEAR",
    conditionLabel: "Clear",
    precipitationProbability: null,
    sunrise: { y: 2026, mo: 10, d, h: 6, mi: 40 },
    sunset: { y: 2026, mo: 10, d, h: 19, mi: 10 },
    uvIndexMax: 6,
    windKphMax: 20,
    precipSumMm: 0,
    ...overrides,
  };
}

export function forecast(overrides: Partial<WeatherForecast> = {}): WeatherForecast {
  return {
    schemaVersion: 2,
    locationKey: "6.5000,3.4000",
    location: TEST_LOCATION,
    current: {
      temperatureC: 22,
      feelsLikeC: 22,
      condition: "CLEAR",
      conditionLabel: "Clear",
      conditionCode: 0,
      isDay: true,
      highC: 26,
      lowC: 18,
      time: wt(14),
    },
    hourly: Array.from({ length: 10 }, (_, i) => hour(14 + i)),
    daily: [day(2), day(3), day(4), day(5), day(6), day(7), day(8)],
    yesterday: null,
    missingSections: [],
    utcOffsetSeconds: 3600,
    fetchedAt: 1_000_000,
    ...overrides,
  };
}