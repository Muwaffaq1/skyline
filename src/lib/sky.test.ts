import { describe, expect, it } from "vitest";
import { sunPhaseFor, skyTokenForContext } from "./sky";

const sunrise = { y: 2026, mo: 10, d: 2, h: 6, mi: 40 };
const sunset = { y: 2026, mo: 10, d: 2, h: 19, mi: 10 };

function t(h: number, mi = 0) {
  return { y: 2026, mo: 10, d: 2, h, mi };
}

describe("sunPhaseFor", () => {
  it("is night well before sunrise", () => {
    expect(sunPhaseFor(t(3), sunrise, sunset, true)).toBe("night");
  });

  it("is golden within ±45 min of sunrise", () => {
    expect(sunPhaseFor(t(6, 10), sunrise, sunset, true)).toBe("golden");
    expect(sunPhaseFor(t(7, 20), sunrise, sunset, true)).toBe("golden");
  });

  it("is morning/midday/afternoon in between", () => {
    expect(sunPhaseFor(t(9), sunrise, sunset, true)).toBe("morning");
    expect(sunPhaseFor(t(13), sunrise, sunset, true)).toBe("midday");
    expect(sunPhaseFor(t(17), sunrise, sunset, true)).toBe("afternoon");
  });

  it("is golden within ±45 min of sunset", () => {
    expect(sunPhaseFor(t(18, 40), sunrise, sunset, true)).toBe("golden");
    expect(sunPhaseFor(t(19, 40), sunrise, sunset, true)).toBe("golden");
  });

  it("is night after the golden window, even when is_day still says 1", () => {
    expect(sunPhaseFor(t(20), sunrise, sunset, true)).toBe("night");
  });

  it("falls back to hour buckets without sun times", () => {
    expect(sunPhaseFor(t(9), null, null, true)).toBe("morning");
    expect(sunPhaseFor(t(21), null, null, true)).toBe("afternoon");
    expect(sunPhaseFor(t(21), null, null, false)).toBe("night");
  });
});

describe("skyTokenForContext", () => {
  it("maps clear sky through the sun phase", () => {
    expect(skyTokenForContext({ condition: "CLEAR", localTime: t(13), isDay: true, sunrise, sunset })).toBe("clear-day");
    expect(skyTokenForContext({ condition: "CLEAR", localTime: t(18, 45), isDay: true, sunrise, sunset })).toBe("clear-golden");
    expect(skyTokenForContext({ condition: "CLEAR", localTime: t(2), isDay: true, sunrise, sunset })).toBe("night");
  });

  it("keeps condition tokens by day", () => {
    expect(skyTokenForContext({ condition: "RAIN", localTime: t(13), isDay: true, sunrise, sunset })).toBe("rain");
    expect(skyTokenForContext({ condition: "SNOW", localTime: t(13), isDay: true, sunrise, sunset })).toBe("snow");
    expect(skyTokenForContext({ condition: "FOG", localTime: t(13), isDay: true, sunrise, sunset })).toBe("fog");
    expect(skyTokenForContext({ condition: "CLOUDY", localTime: t(13), isDay: true, sunrise, sunset })).toBe("cloudy");
  });

  it("is night for any condition when isDay is false", () => {
    expect(skyTokenForContext({ condition: "RAIN", localTime: t(22), isDay: false, sunrise, sunset })).toBe("night");
  });
});