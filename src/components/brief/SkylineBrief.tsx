// The Skyline Brief — one smart sentence under the location header.
// Single line of muted text; never wraps the layout (PRD one-screen rule).

import { useSettings } from "../../store/settings";
import { buildBrief } from "../../lib/insights/brief";
import type { WeatherForecast } from "../../domain/types";

export function SkylineBrief({ forecast }: { forecast: WeatherForecast }) {
  const unit = useSettings((s) => s.unit);
  return (
    <p className="skyline-brief" aria-label="Today's summary">
      {buildBrief(forecast, unit)}
    </p>
  );
}