// Popular-cities shortcuts shown in the search sheet while the input is
// empty (research pattern from Eventbrite). Selected for geographic spread.

import type { WeatherLocation } from "../../domain/types";
import { SearchResultRow } from "./SearchResultRow";

export const POPULAR_CITIES: WeatherLocation[] = [
  { id: "pop:abuja", city: "Abuja", region: "FCT", country: "Nigeria", latitude: 9.0574, longitude: 7.4898, timezone: "auto", isDeviceLocation: false },
  { id: "pop:lagos", city: "Lagos", region: "Lagos", country: "Nigeria", latitude: 6.5244, longitude: 3.3792, timezone: "auto", isDeviceLocation: false },
  { id: "pop:nairobi", city: "Nairobi", region: "Nairobi", country: "Kenya", latitude: -1.2864, longitude: 36.8172, timezone: "auto", isDeviceLocation: false },
  { id: "pop:london", city: "London", region: "England", country: "United Kingdom", latitude: 51.5072, longitude: -0.1276, timezone: "auto", isDeviceLocation: false },
  { id: "pop:new-york", city: "New York", region: "New York", country: "United States", latitude: 40.7128, longitude: -74.006, timezone: "auto", isDeviceLocation: false },
  { id: "pop:tokyo", city: "Tokyo", region: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, timezone: "auto", isDeviceLocation: false },
];

export function PopularCities({ onSelect }: { onSelect: (location: WeatherLocation) => void }) {
  return (
    <div aria-label="Popular cities">
      <p className="search-hint">Popular cities</p>
      {POPULAR_CITIES.map((city) => (
        <SearchResultRow key={city.id} location={city} onSelect={onSelect} />
      ))}
    </div>
  );
}