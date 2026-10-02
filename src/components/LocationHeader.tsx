// Layer 1 — Location. Minimal chrome: the city name is the heading, and the
// whole row is one ≥44px tap target that opens the search sheet. The pin
// glyph marks device location, distinguishing Current vs Selected location.
// A 600ms long-press on the city name opens demo mode (hidden entry point).

import { useEffect, useRef } from "react";
import type { WeatherLocation } from "../domain/types";

interface LocationHeaderProps {
  location: WeatherLocation;
  loading?: boolean;
  onOpenSearch: () => void;
  onOpenDemo: () => void;
}

const LONG_PRESS_MS = 600;
const MOVE_CANCEL_PX = 10;

export function LocationHeader({ location, loading, onOpenSearch, onOpenDemo }: LocationHeaderProps) {
  // Long-press on the city name → demo sheet. Track the down point so a
  // scroll gesture cancels instead of firing; timer ref survives re-renders.
  const longPressTimer = useRef<number | null>(null);
  const downPoint = useRef<{ x: number; y: number } | null>(null);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    downPoint.current = null;
  };

  useEffect(() => clearLongPress, []);

  const startLongPress = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // primary button / touch / pen only
    clearLongPress();
    downPoint.current = { x: e.clientX, y: e.clientY };
    longPressTimer.current = window.setTimeout(() => {
      longPressTimer.current = null;
      downPoint.current = null;
      onOpenDemo();
    }, LONG_PRESS_MS);
  };

  return (
    <header className="location-header-wrap">
      <h1
        className="location-header__city"
        onPointerDown={startLongPress}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
        onPointerMove={(e) => {
          const p = downPoint.current;
          if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > MOVE_CANCEL_PX) {
            clearLongPress();
          }
        }}
        onContextMenu={(e) => {
          if (longPressTimer.current !== null) e.preventDefault();
        }}
      >
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