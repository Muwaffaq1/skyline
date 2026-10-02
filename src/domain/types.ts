// Skyline's normalized domain model — the UI depends ONLY on these types,
// never on provider responses (PRD: WeatherProvider abstraction).
//
// All temperatures are canonical Celsius. Unit conversion happens at render
// time so a °C/°F toggle never refetches (PRD hard requirement).

export type SkylineCondition =
  | "CLEAR"
  | "PARTLY_CLOUDY"
  | "CLOUDY"
  | "FOG"
  | "RAIN"
  | "HEAVY_RAIN"
  | "THUNDERSTORM"
  | "SNOW"
  | "WIND";

/**
 * Location-local wall-clock components. Open-Meteo timestamps are offset-less
 * local ISO strings — parsing them with `new Date()` would apply the *phone's*
 * timezone, so every timestamp stays in this struct form (PRD timezone rule:
 * a user in Lagos viewing Tokyo sees Tokyo-local times).
 */
export interface LocalWallTime {
  y: number;
  mo: number; // 1–12
  d: number;
  h: number; // 0–23
  mi: number;
}

export interface WeatherLocation {
  id: string; // geocoding id, or "device:{lat},{lon}" for device location
  city: string;
  region: string | null;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string; // IANA name
  isDeviceLocation: boolean; // PRD: Current Location vs Selected Location
}

export interface CurrentWeather {
  temperatureC: number;
  feelsLikeC: number;
  condition: SkylineCondition;
  conditionLabel: string; // human-readable, also used for aria-labels
  conditionCode: number; // raw provider code, kept for debugging
  isDay: boolean;
  highC: number | null; // from daily[0]; null when the daily section failed
  lowC: number | null;
  time: LocalWallTime;
}

export interface HourlyPoint {
  time: LocalWallTime;
  temperatureC: number | null; // null → cell is skipped (missing-hour edge case)
  apparentC: number | null; // "feels like" for that hour
  condition: SkylineCondition;
  conditionLabel: string;
  isDay: boolean;
  precipitationProbability: number | null; // null → render nothing, never "0%"
  uvIndex: number | null; // Open-Meteo hourly uv_index
  windKph: number | null; // wind_speed_10m, km/h
}

export interface DailyPoint {
  date: LocalWallTime; // midnight of that day, location-local
  minC: number;
  maxC: number;
  condition: SkylineCondition;
  conditionLabel: string;
  precipitationProbability: number | null;
  sunrise: LocalWallTime | null; // null when the daily section omitted it
  sunset: LocalWallTime | null;
  uvIndexMax: number | null;
  windKphMax: number | null;
  precipSumMm: number | null;
}

/** Yesterday's hourly temps by location-local hour — feeds the comparison insight. */
export interface YesterdaySummary {
  date: LocalWallTime;
  tempByHour: (number | null)[]; // index 0–23
  minC: number | null;
  maxC: number | null;
}

export type FailedSection = "hourly" | "daily";

/** Bump whenever the persisted snapshot shape changes; see store/settings.ts. */
export const SCHEMA_VERSION = 2;

export interface WeatherForecast {
  schemaVersion: number; // guards the persisted snapshot against stale shapes
  locationKey: string; // "lat,lon" at 4dp — also the query cache key
  location: WeatherLocation;
  current: CurrentWeather | null; // null enables partial-response isolation
  hourly: HourlyPoint[]; // ~24 entries starting at the location's "Now" hour
  daily: DailyPoint[]; // today + next 6 (UI shows 5)
  yesterday: YesterdaySummary | null; // null when past-hours data is unavailable
  missingSections: FailedSection[];
  utcOffsetSeconds: number;
  fetchedAt: number; // Date.now() at fetch success — drives the refresh policy
}