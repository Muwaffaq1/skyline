// The ONLY file that knows Open-Meteo exists. Raw response shapes are defined
// here; src/lib/normalize.ts maps them onto the domain model. Swapping
// providers later touches this file and normalize.ts.

import type { WeatherLocation } from "../domain/types";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

export interface RawForecast {
  timezone: string;
  utc_offset_seconds: number;
  current?: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    is_day: number;
    weather_code: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: (number | null)[];
    apparent_temperature: (number | null)[];
    weather_code: number[];
    precipitation_probability: (number | null)[] | null;
    is_day: number[];
    uv_index: (number | null)[];
    wind_speed_10m: (number | null)[];
  } | null;
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: (number | null)[] | null;
    precipitation_sum: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: (number | null)[];
    wind_speed_10m_max: (number | null)[];
  } | null;
}

export async function fetchRawForecast(location: WeatherLocation): Promise<RawForecast> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: "temperature_2m,apparent_temperature,is_day,weather_code",
    hourly:
      "temperature_2m,apparent_temperature,weather_code,precipitation_probability,is_day,uv_index,wind_speed_10m",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: "7",
    past_days: "1", // yesterday, for the comparison insight
  });

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Forecast request failed with status ${res.status}`);
  }
  return (await res.json()) as RawForecast;
}

export interface RawGeocodeResult {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export async function searchLocations(query: string): Promise<WeatherLocation[]> {
  const params = new URLSearchParams({
    name: query,
    count: "8",
    language: "en",
    format: "json",
  });

  const res = await fetch(`${GEOCODE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Geocoding request failed with status ${res.status}`);
  }
  const data = (await res.json()) as { results?: RawGeocodeResult[] };

  // Empty `results` is a search miss (distinct from a network failure).
  return (data.results ?? []).map((r) => ({
    id: `geo:${r.id}`,
    city: r.name,
    region: r.admin1 ?? null,
    country: r.country ?? "",
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
    isDeviceLocation: false,
  }));
}