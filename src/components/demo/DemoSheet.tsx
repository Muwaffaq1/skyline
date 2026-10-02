// Demo scenario picker — a bottom sheet listing every scenario plus exit.
// Opened by long-pressing the city name (600 ms), so demos can be set up
// without editing the URL.

import { DEMO_LABELS, DEMO_SCENARIOS, type DemoScenario } from "../../lib/demo";
import { useSettings } from "../../store/settings";

interface DemoSheetProps {
  open: boolean;
  onClose: () => void;
}

export function DemoSheet({ open, onClose }: DemoSheetProps) {
  const demoMode = useSettings((s) => s.demoMode);
  const setDemoMode = useSettings((s) => s.setDemoMode);

  if (!open) return null;

  const pick = (scenario: DemoScenario) => {
    setDemoMode(scenario);
    onClose();
  };

  return (
    <div className="search-backdrop" onClick={onClose}>
      <div
        className="search-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Demo mode"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-sheet__grabber" aria-hidden="true" />
        <div className="search-sheet__header">
          <p className="demo-sheet__heading">Demo mode</p>
          <button type="button" className="search-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>

        <div className="search-results">
          {DEMO_SCENARIOS.map((scenario) => (
            <button
              key={scenario}
              type="button"
              className={`search-row demo-sheet__row${
                demoMode === scenario ? " demo-sheet__row--active" : ""
              }`}
              onClick={() => pick(scenario)}
            >
              <span className="search-row__city">{DEMO_LABELS[scenario]}</span>
              <span className="search-row__region">?demo={scenario}</span>
            </button>
          ))}
          <button
            type="button"
            className="search-row demo-sheet__row demo-sheet__row--exit"
            onClick={() => {
              setDemoMode(null);
              onClose();
            }}
          >
            <span className="search-row__city">Exit demo mode</span>
          </button>
        </div>
      </div>
    </div>
  );
}