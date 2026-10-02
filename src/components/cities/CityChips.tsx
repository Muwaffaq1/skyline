// Quick-switch chips for saved cities — a horizontal scroll row under the
// location header. Hidden entirely until the user saves their first city,
// so the one-screen layout stays clean for people who don't use it.

import type { WeatherLocation } from "../../domain/types";
import { locationKeyOf } from "../../lib/normalize";
import { useSettings } from "../../store/settings";

export function CityChips({ selected }: { selected: WeatherLocation | null }) {
  const savedCities = useSettings((s) => s.savedCities);
  const selectLocation = useSettings((s) => s.selectLocation);

  if (savedCities.length === 0) return null;

  const selectedKey = selected ? locationKeyOf(selected.latitude, selected.longitude) : null;

  return (
    <nav className="city-chips" aria-label="Saved cities">
      {savedCities.map((city) => {
        const active = locationKeyOf(city.latitude, city.longitude) === selectedKey;
        return (
          <button
            key={city.id}
            type="button"
            className={`city-chip${active ? " city-chip--active" : ""}`}
            aria-pressed={active}
            onClick={() => selectLocation(city)}
          >
            {city.city}
          </button>
        );
      })}
    </nav>
  );
}