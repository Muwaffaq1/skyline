// Device-location permission state machine (PRD location edge cases):
// - never-asked vs permanently denied distinguished via the Permissions API
// - a hard denial is terminal: the search path is always the alternative,
//   and the OS prompt is never triggered repeatedly
// - reverse geocoding failure degrades to a coordinate label without blocking

import { useCallback, useState } from "react";
import { reverseGeocode } from "../api/reverseGeocode";
import type { WeatherLocation } from "../domain/types";
import { locationKeyOf } from "../lib/normalize";

export type DeviceLocationStatus =
  | "idle"
  | "prompting"
  | "granted"
  | "denied"
  | "unavailable"
  | "error";

export function useDeviceLocation() {
  const [status, setStatus] = useState<DeviceLocationStatus>("idle");
  const [location, setLocation] = useState<WeatherLocation | null>(null);

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("prompting");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("granted");
        const { latitude, longitude } = position.coords;
        let loc: WeatherLocation = {
          id: `device:${locationKeyOf(latitude, longitude)}`,
          city: "Current location",
          region: null,
          country: "",
          latitude,
          longitude,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isDeviceLocation: true,
        };
        try {
          const place = await reverseGeocode(latitude, longitude);
          loc = { ...loc, city: place.city, region: place.region, country: place.country };
        } catch {
          // keep the coordinate label; the forecast only needs lat/lon
        }
        setLocation(loc);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setStatus("unavailable");
        } else {
          setStatus("error");
        }
      },
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, []);

  return { status, location, request };
}