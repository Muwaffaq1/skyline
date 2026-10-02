// App frame: full-bleed atmospheric gradient + the phone column.
// The sky token comes from the persisted snapshot so the first paint already
// carries the right atmosphere (cache-first, no flash of the wrong sky).

import { useEffect, useRef } from "react";
import { GradientBackground } from "./theme/GradientBackground";
import { WeatherScreen } from "./screens/WeatherScreen";
import { useSettings } from "./store/settings";
import { skyTokenFor, type SkyToken } from "./lib/gradient";
import { locationNow } from "./lib/time";

export default function App() {
  const lastForecast = useSettings((s) => s.lastForecast);
  const frameRef = useRef<HTMLDivElement>(null);

  const token: SkyToken = lastForecast?.current
    ? skyTokenFor(
        lastForecast.current.condition,
        lastForecast.current.isDay,
        locationNow(lastForecast.utcOffsetSeconds).h,
      )
    : "cloudy";

  // Sync the browser chrome color to the gradient's top stop.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const color = getComputedStyle(el).getPropertyValue("--sky-top").trim();
    if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
  }, [token]);

  return (
    <div className="app-frame" data-sky={token} ref={frameRef}>
      <GradientBackground token={token} />
      <div className="app-scroll">
        <WeatherScreen />
      </div>
    </div>
  );
}