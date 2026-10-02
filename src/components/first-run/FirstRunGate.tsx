// First-run permission screen (research pattern from Tide Guide): one
// value-first screen with a dual path. Location is never a hard requirement —
// a denied prompt routes to search and is never re-triggered.

import { useEffect } from "react";
import { useDeviceLocation } from "../../hooks/useDeviceLocation";
import type { WeatherLocation } from "../../domain/types";

interface FirstRunGateProps {
  onDeviceLocation: (location: WeatherLocation) => void;
  onOpenSearch: () => void;
}

export function FirstRunGate({ onDeviceLocation, onOpenSearch }: FirstRunGateProps) {
  const device = useDeviceLocation();

  // Granted while on the gate → adopt immediately.
  useEffect(() => {
    if (device.location) onDeviceLocation(device.location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.location]);

  const status: string | null =
    device.status === "prompting"
      ? "Finding your location…"
      : device.status === "denied"
        ? "Location access is off. Search for a city instead."
        : device.status === "unavailable"
          ? "Location isn't available on this device."
          : device.status === "error"
            ? "Couldn't get your location. Try again or search."
            : null;

  return (
    <div className="first-run">
      <div className="first-run__logo" aria-hidden="true">
        <svg viewBox="0 0 48 48" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="18" r="8" />
          <path d="M12 24h.5M36 24h.5M24 6v.5M15 9l.4.4M33 9l-.4.4" />
          <path d="M10 34a6 6 0 0 1 6-6 8 8 0 0 1 15.5 2A5 5 0 0 1 33 40H14a4 4 0 0 1-4-6z" />
        </svg>
      </div>
      <h1 className="first-run__value">Weather, the moment you open it.</h1>
      <p className="first-run__privacy">
        Skyline shows today's weather at a glance — current conditions, the next
        24 hours, and a 5-day outlook. Your location is only used to find your
        forecast and is never stored on a server.
      </p>

      <div className="first-run__actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => device.request()}
          disabled={device.status === "prompting"}
        >
          Use my location
        </button>
        <button type="button" className="btn-secondary" onClick={onOpenSearch}>
          Search for a city
        </button>
      </div>

      {status && (
        <p className="first-run__status" role="status">
          {status}
        </p>
      )}
    </div>
  );
}