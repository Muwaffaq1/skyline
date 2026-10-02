// °C/°F toggle. Store-only — the model is Celsius-canonical, so switching
// converts at render and never refetches (PRD hard rule).

import { useSettings } from "../store/settings";

export function UnitToggle() {
  const unit = useSettings((s) => s.unit);
  const setUnit = useSettings((s) => s.setUnit);

  return (
    <div className="unit-toggle" role="group" aria-label="Temperature unit">
      <button
        type="button"
        className="unit-toggle__btn"
        aria-pressed={unit === "c"}
        onClick={() => setUnit("c")}
      >
        °C
      </button>
      <button
        type="button"
        className="unit-toggle__btn"
        aria-pressed={unit === "f"}
        onClick={() => setUnit("f")}
      >
        °F
      </button>
    </div>
  );
}