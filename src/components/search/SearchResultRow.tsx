// Disambiguated search row: "City bold / Region, Country grey"
// (research pattern from Spotify/happn).
// V2: a trailing star saves/un saves the city without selecting it —
// saving is explicit, so selecting a result never silently curates the list.

import type { WeatherLocation } from "../../domain/types";
import { locationKeyOf } from "../../lib/normalize";
import { useSettings } from "../../store/settings";

interface SearchResultRowProps {
  location: WeatherLocation;
  onSelect: (location: WeatherLocation) => void;
}

export function SearchResultRow({ location, onSelect }: SearchResultRowProps) {
  const savedCities = useSettings((s) => s.savedCities);
  const saveLocation = useSettings((s) => s.saveLocation);
  const removeLocation = useSettings((s) => s.removeLocation);

  const key = locationKeyOf(location.latitude, location.longitude);
  const saved = savedCities.some((c) => locationKeyOf(c.latitude, c.longitude) === key);

  const regionLabel =
    location.region && location.country
      ? `${location.region}, ${location.country}`
      : location.region || location.country || "";

  return (
    <div className="search-row-wrap">
      <button type="button" className="search-row" onClick={() => onSelect(location)}>
        <span className="search-row__city">{location.city}</span>
        {regionLabel && <span className="search-row__region">{regionLabel}</span>}
      </button>
      <button
        type="button"
        className="search-row__star"
        aria-pressed={saved}
        aria-label={saved ? `Remove ${location.city} from saved cities` : `Save ${location.city}`}
        onClick={() => (saved ? removeLocation(location) : saveLocation(location))}
      >
        {saved ? "★" : "☆"}
      </button>
    </div>
  );
}