import { describe, expect, it } from "vitest";
import { findBestWindow } from "./bestTime";
import type { HourlyPoint, LocalWallTime } from "../../domain/types";

function t(h: number): LocalWallTime {
  return { y: 2026, mo: 10, d: 2, h, mi: 0 };
}

function hour(h: number, overrides: Partial<HourlyPoint> = {}): HourlyPoint {
  return {
    time: t(h),
    temperatureC: 22,
    apparentC: 22,
    condition: "CLEAR",
    conditionLabel: "Clear",
    isDay: true,
    precipitationProbability: 0,
    uvIndex: 4,
    windKph: 10,
    ...overrides,
  };
}

describe("findBestWindow", () => {
  it("prefers the comfort band over hot/rainy stretches", () => {
    const hours = [
      hour(0, { temperatureC: 33, precipitationProbability: 60 }),
      hour(1, { temperatureC: 34, precipitationProbability: 70 }),
      hour(2, { temperatureC: 24, precipitationProbability: 5 }),
      hour(3, { temperatureC: 23, precipitationProbability: 0 }),
    ];
    const best = findBestWindow(hours);
    expect(best).not.toBeNull();
    expect(best!.startIdx).toBe(2);
    expect(best!.endIdx).toBe(3);
  });

  it("returns null when every hour is too wet", () => {
    const hours = [hour(0, { precipitationProbability: 80 }), hour(1, { precipitationProbability: 90 })];
    expect(findBestWindow(hours)).toBeNull();
  });

  it("returns null for fewer than 2 usable hours", () => {
    const hours = [hour(0)];
    expect(findBestWindow(hours)).toBeNull();
  });

  it("only looks 12 hours ahead", () => {
    const hours = Array.from({ length: 20 }, (_, i) =>
      hour(i, { temperatureC: i < 12 ? 30 : 22 }),
    );
    const best = findBestWindow(hours)!;
    expect(best.endIdx).toBeLessThan(12);
  });

  it("penalizes strong UV", () => {
    const mild = [hour(0, { uvIndex: 2 }), hour(1, { uvIndex: 2 })];
    const harsh = [hour(0, { uvIndex: 10 }), hour(1, { uvIndex: 10 })];
    expect(findBestWindow(mild)!.avgScore).toBeGreaterThan(findBestWindow(harsh)!.avgScore);
  });

  it("penalizes strong wind", () => {
    const calm = [hour(0, { windKph: 5 }), hour(1, { windKph: 5 })];
    const gusty = [hour(0, { windKph: 45 }), hour(1, { windKph: 45 })];
    expect(findBestWindow(calm)!.avgScore).toBeGreaterThan(findBestWindow(gusty)!.avgScore);
  });
});