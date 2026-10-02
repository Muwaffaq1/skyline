// Colored temperature-range bar (Apple Weather geometry): positioned between
// the week's min and max, cool→warm. Purely decorative — the row already
// shows low/high numbers (accessibility: never color alone).

interface TempRangeBarProps {
  min: number;
  max: number;
  weekMin: number;
  weekMax: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function TempRangeBar({ min, max, weekMin, weekMax }: TempRangeBarProps) {
  const span = Math.max(1, weekMax - weekMin);
  const left = clamp(((min - weekMin) / span) * 100, 0, 92);
  const width = clamp(((max - min) / span) * 100, 8, 100 - left);

  return (
    <span className="range-bar" aria-hidden="true">
      <span
        className="range-bar__fill"
        style={{ left: `${left}%`, width: `${width}%` }}
      />
    </span>
  );
}