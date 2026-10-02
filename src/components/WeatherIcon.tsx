// Hand-drawn SVG weather icon set — one glyph per SkylineCondition with
// day/night variants. Accessibility: the aria-label is the condition name
// ("Light rain", never "icon 12"); pass `decorative` when adjacent text
// already names the condition.

import type { SkylineCondition } from "../domain/types";
import { conditionLabels } from "../api/wmo";

interface WeatherIconProps {
  condition: SkylineCondition;
  isDay?: boolean;
  size?: number;
  decorative?: boolean;
  className?: string;
}

const CLOUD_PATH =
  "M14 33h19.5a6.25 6.25 0 0 0 1.5-12.3 9.25 9.25 0 0 0-17.9-2.1A6.6 6.6 0 0 0 14 33Z";

function Sun({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const rays = Array.from({ length: 8 }, (_, i) => {
    const angle = (i * Math.PI) / 4;
    const x1 = cx + Math.cos(angle) * (r + 3.5);
    const y1 = cy + Math.sin(angle) * (r + 3.5);
    const x2 = cx + Math.cos(angle) * (r + 7);
    const y2 = cy + Math.sin(angle) * (r + 7);
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
  });
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} />
      {rays}
    </g>
  );
}

function Moon({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <path
      d={`M${cx + r * 0.55} ${cy - r * 0.75} a${r} ${r} 0 1 0 ${r * 0.62} ${
        r * 1.35
      } a${r * 0.78} ${r * 0.78} 0 1 1 -${r * 0.62} -${r * 1.35} Z`}
      transform={`rotate(-30 ${cx} ${cy})`}
    />
  );
}

function Drops({ xs, y }: { xs: number[]; y: number }) {
  return (
    <g>
      {xs.map((x, i) => (
        <line key={i} x1={x} y1={y} x2={x - 2.5} y2={y + 6} />
      ))}
    </g>
  );
}

function Flakes({ xs, y }: { xs: number[]; y: number }) {
  return (
    <g>
      {xs.map((x, i) => (
        <g key={i}>
          <line x1={x - 2.5} y1={y + 3} x2={x + 2.5} y2={y + 3} />
          <line x1={x} y1={y + 0.5} x2={x} y2={y + 5.5} />
          <line x1={x - 1.8} y1={y + 1.4} x2={x + 1.8} y2={y + 4.6} />
          <line x1={x + 1.8} y1={y + 1.4} x2={x - 1.8} y2={y + 4.6} />
        </g>
      ))}
    </g>
  );
}

function glyphs(condition: SkylineCondition, isDay: boolean) {
  switch (condition) {
    case "CLEAR":
      return isDay ? <Sun cx={24} cy={24} r={8} /> : <Moon cx={24} cy={23} r={9} />;
    case "PARTLY_CLOUDY":
      return (
        <g>
          {isDay ? (
            <Sun cx={17} cy={16} r={5.5} />
          ) : (
            <Moon cx={17} cy={15} r={6} />
          )}
          <path d="M19 38h12a5.5 5.5 0 0 0 1.2-10.8 8 8 0 0 0-15.4-1.9A5.8 5.8 0 0 0 19 38Z" />
        </g>
      );
    case "CLOUDY":
      return <path d={CLOUD_PATH} />;
    case "FOG":
      return (
        <g>
          <path d="M14 28h19.5a6.25 6.25 0 0 0 1.5-12.3 9.25 9.25 0 0 0-17.9-2.1A6.6 6.6 0 0 0 14 28Z" />
          <line x1={12} y1={35} x2={34} y2={35} />
          <line x1={16} y1={40} x2={30} y2={40} />
        </g>
      );
    case "RAIN":
      return (
        <g>
          <path d="M14 28h19.5a6.25 6.25 0 0 0 1.5-12.3 9.25 9.25 0 0 0-17.9-2.1A6.6 6.6 0 0 0 14 28Z" />
          <Drops xs={[18, 24, 30]} y={33} />
        </g>
      );
    case "HEAVY_RAIN":
      return (
        <g>
          <path d="M14 27h19.5a6.25 6.25 0 0 0 1.5-12.3 9.25 9.25 0 0 0-17.9-2.1A6.6 6.6 0 0 0 14 27Z" />
          <Drops xs={[16, 21, 26, 31]} y={32} />
        </g>
      );
    case "THUNDERSTORM":
      return (
        <g>
          <path d="M14 27h19.5a6.25 6.25 0 0 0 1.5-12.3 9.25 9.25 0 0 0-17.9-2.1A6.6 6.6 0 0 0 14 27Z" />
          <path d="M25 30l-5.5 8.5h4.5L22 45l8.5-10.5h-4.5L28 30Z" fill="currentColor" stroke="none" />
        </g>
      );
    case "SNOW":
      return (
        <g>
          <path d="M14 28h19.5a6.25 6.25 0 0 0 1.5-12.3 9.25 9.25 0 0 0-17.9-2.1A6.6 6.6 0 0 0 14 28Z" />
          <Flakes xs={[17, 24, 31]} y={32} />
        </g>
      );
    case "WIND":
      return (
        <g>
          <path d="M8 20h17a4.5 4.5 0 1 0-4.4-5.5" />
          <path d="M8 28h24a4.5 4.5 0 1 1-4.4 5.5" />
        </g>
      );
  }
}

export function WeatherIcon({
  condition,
  isDay = true,
  size = 28,
  decorative = false,
  className,
}: WeatherIconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": conditionLabels[condition] })}
    >
      {glyphs(condition, isDay)}
    </svg>
  );
}