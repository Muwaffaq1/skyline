// Layer 1 — Location. Minimal chrome: the city name is the heading, and the
// whole row is one ≥44px tap target that opens the search sheet. The pin
// glyph marks device location, distinguishing Current vs Selected location.

import type { WeatherLocation } from "../domain/types";

interface LocationHeaderProps {
  location: WeatherLocation;
  loading?: boolean;
  onOpenSearch: () => void;
}

export function LocationHeader({ location, loading, onOpenSearch }: LocationHeaderProps) {
  return (
    <header className="location-header-wrap">
      <h1 className="location-header__city">
        {location.city}
        {location.isDeviceLocation && (
          <svg
            viewBox="0 0 24 24"
            width={13}
            height={13}
            fill="currentColor"
            aria-hidden="true"
            className="location-header__glyph"
          >
            <path d="M12 2a7.5 7.5 0 0 0-7.5 7.5C4.5 14.6 12 22 12 22s7.5-7.4 7.5-12.5A7.5 7.5 0 0 0 12 2Zm0 10a2.75 2.75 0 1 1 0-5.5 2.75 2.75 0 0 1 0 5.5Z" />
          </svg>
        )}
      </h1>
      <button
        type="button"
        className="location-header"
        onClick={onOpenSearch}
        aria-haspopup="dialog"
        aria-label={`Change location. Current: ${location.city}`}
      >
        {loading ? (
          <span className="updated-footer__refreshing" aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>
    </header>
  );
}