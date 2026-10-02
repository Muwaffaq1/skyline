// App frame: full-bleed atmospheric gradient + the phone column.
// The sky token derives from the persisted snapshot through useSkyToken so
// the first paint already carries the right atmosphere (cache-first, no
// flash of the wrong sky) — and stays coherent with scrubbing and demo mode.

import { useEffect, useRef } from "react";
import { GradientBackground } from "./theme/GradientBackground";
import { WeatherScreen } from "./screens/WeatherScreen";
import { ToastStack } from "./components/notifications/ToastStack";
import { DemoChip } from "./components/demo/DemoChip";
import { useSkyToken } from "./hooks/useSkyToken";

export default function App() {
  const token = useSkyToken();
  const frameRef = useRef<HTMLDivElement>(null);

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
      <DemoChip />
      <ToastStack />
      <div className="app-scroll">
        <WeatherScreen />
      </div>
    </div>
  );
}