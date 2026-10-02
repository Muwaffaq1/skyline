// Fixed chip shown while demo mode is active — "Demo: Storm" with a one-tap
// exit so a portfolio demo never strands the app in a fake sky.

import { DEMO_LABELS } from "../../lib/demo";
import { useSettings } from "../../store/settings";

export function DemoChip() {
  const demoMode = useSettings((s) => s.demoMode);
  const setDemoMode = useSettings((s) => s.setDemoMode);

  if (!demoMode) return null;

  return (
    <div className="demo-chip">
      <span>Demo: {DEMO_LABELS[demoMode]}</span>
      <button
        type="button"
        className="demo-chip__exit"
        aria-label="Exit demo mode"
        onClick={() => setDemoMode(null)}
      >
        ×
      </button>
    </div>
  );
}