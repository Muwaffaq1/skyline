// Bottom-sheet location search (research pattern: sheet slides up, autofocus,
// Cancel dismisses). Row order per research: "Use my location" → popular
// cities (empty input) → results. Search miss and network failure get
// distinct copy per the PRD.

import { useEffect, useRef, useState } from "react";
import type { WeatherLocation } from "../../domain/types";
import { useDeviceLocation } from "../../hooks/useDeviceLocation";
import { useLocationSearch } from "../../hooks/useLocationSearch";
import { SearchResultRow } from "./SearchResultRow";
import { PopularCities } from "./PopularCities";

interface SearchSheetProps {
  open: boolean;
  onClose: () => void;
  onSelect: (location: WeatherLocation) => void;
}

export function SearchSheet({ open, onClose, onSelect }: SearchSheetProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const device = useDeviceLocation();
  const results = useLocationSearch(query);

  // Reset + focus on open. autoFocus alone misses re-opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      inputRef.current?.focus();
    }
  }, [open]);

  // Escape closes, like Cancel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Device location granted while the sheet is open → adopt it immediately.
  useEffect(() => {
    if (device.location) onSelect(device.location);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.location]);

  if (!open) return null;

  const trimmed = query.trim();
  const showBrowse = trimmed.length < 2;
  const isSearching = trimmed.length >= 2 && results.isFetching && !results.data;
  const isMiss =
    trimmed.length >= 2 &&
    !results.isFetching &&
    results.data !== undefined &&
    results.data.length === 0;
  const isSearchError = trimmed.length >= 2 && results.isError;

  const locationStatusText: string | null =
    device.status === "prompting"
      ? "Finding your location…"
      : device.status === "denied"
        ? "Location access is off for this site. Search for a city instead."
        : device.status === "unavailable"
          ? "Location isn't available on this device."
          : device.status === "error"
            ? "Couldn't get your location. Try again or search."
            : null;

  return (
    <div className="search-backdrop" onClick={onClose}>
      <div
        className="search-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Change location"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-sheet__grabber" aria-hidden="true" />
        <div className="search-sheet__header">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search for a city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Search for a city"
          />
          <button type="button" className="search-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="search-results">
          {/* Use-my-location row always sits above the browse/search lists. */}
          <button
            type="button"
            className="search-row search-row--action"
            onClick={() => device.request()}
          >
            <span className="search-row__city">Use my location</span>
            <span className="search-row__region">
              {device.status === "prompting" ? "Finding…" : "Precise weather for where you are"}
            </span>
          </button>

          {locationStatusText && <p className="search-hint">{locationStatusText}</p>}

          {showBrowse && <PopularCities onSelect={onSelect} />}

          {isSearching && <p className="search-hint">Searching…</p>}

          {!showBrowse &&
            results.data?.map((loc) => (
              <SearchResultRow key={loc.id} location={loc} onSelect={onSelect} />
            ))}

          {isMiss && (
            <p className="search-hint">
              No locations found for &ldquo;{trimmed}&rdquo;.
            </p>
          )}
          {isSearchError && (
            <p className="search-hint">
              Couldn't search right now. Check your connection and try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}