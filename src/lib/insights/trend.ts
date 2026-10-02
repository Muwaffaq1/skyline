// Hour-over-hour temperature trend with a ±0.5 °C deadband so rounding
// jitter doesn't flicker arrows.

export type TempTrend = "up" | "down" | "flat";

const DEADBAND_C = 0.5;

export function tempTrend(prevC: number | null, currC: number | null): TempTrend {
  if (prevC === null || currC === null) return "flat";
  const delta = currC - prevC;
  if (delta > DEADBAND_C) return "up";
  if (delta < -DEADBAND_C) return "down";
  return "flat";
}

const ARROWS: Record<TempTrend, string> = { up: "▲", down: "▼", flat: "→" };
const WORDS: Record<TempTrend, string> = {
  up: "getting warmer",
  down: "getting cooler",
  flat: "steady",
};

export function trendArrow(trend: TempTrend): string {
  return ARROWS[trend];
}

export function trendWord(trend: TempTrend): string {
  return WORDS[trend];
}
