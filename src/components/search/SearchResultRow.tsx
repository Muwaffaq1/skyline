// Disambiguated search row: "City bold / Region, Country grey"
// (research pattern from Spotify/happn).

import type { WeatherLocation } from "../../domain/types";

interface SearchResultRowProps {
  location: WeatherLocation;
  onSelect: (location: WeatherLocation) => void;
}

export function SearchResultRow({ location, onSelect }: SearchResultRowProps) {
  const regionLabel =
    location.region && location.country
      ? `${location.region}, ${location.country}`
      : location.region || location.country || "";

  return (
    <button
      type="button"
      className="search-row"
      onClick={() => onSelect(location)}
    >
      <span className="search-row__city">{location.city}</span>
      {regionLabel && <span className="search-row__region">{regionLabel}</span>}
    </button>
  );
}