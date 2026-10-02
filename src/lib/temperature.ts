// Temperatures are canonical Celsius in the domain model; conversion happens
// here, at render time, so a unit toggle never triggers a refetch.

export type Unit = "c" | "f";

export function cToF(celsius: number): number {
  return celsius * 9 / 5 + 32;
}

/**
 * Rounded display value with a true minus sign (U+2212) for negatives —
 * tested down to -18°C and up to 47°C per the PRD's extreme-value list.
 */
export function formatTemp(celsius: number, unit: Unit): string {
  const value = unit === "f" ? cToF(celsius) : celsius;
  const rounded = Math.round(value);
  return rounded < 0 ? `−${Math.abs(rounded)}°` : `${rounded}°`;
}

/** Fahrenheit-leaning locales per the PRD's system-default rule. */
const FAHRENHEIT_LOCALES = new Set(["en-US", "en-LR", "my"]);

export function defaultUnit(): Unit {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const base = locale.split("-").slice(0, 2).join("-");
    return FAHRENHEIT_LOCALES.has(base) ? "f" : "c";
  } catch {
    return "c";
  }
}