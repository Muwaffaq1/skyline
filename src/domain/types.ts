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
  condition: SkylineCondition;
  conditionLabel: string;
  isDay: boolean;
  precipitationProbability: number | null; // null → render nothing, never "0%"
}

export interface DailyPoint {
  date: LocalWallTime; // midnight of that day, location-local
  minC: number;
  maxC: number;
  condition: SkylineCondition;
  conditionLabel: string;
  precipitationProbability: number | null;
}

export type FailedSection = "hourly" | "daily";

export interface WeatherForecast {
  locationKey: string; // "lat,lon" at 4dp — also the query cache key
  location: WeatherLocation;
  current: CurrentWeather | null; // null enables partial-response isolation
  hourly: HourlyPoint[]; // ~24 entries starting at the location's "Now" hour
  daily: DailyPoint[]; // today + next 5
  missingSections: FailedSection[];
  utcOffsetSeconds: number;
  fetchedAt: number; // Date.now() at fetch success — drives the refresh policy
}