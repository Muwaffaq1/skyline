import { describe, expect, it } from "vitest";
import { findRainWindows, rainWindowIndexSet } from "./rainWindow";
import type { HourlyPoint, LocalWallTime } from "../../domain/types";

function t(h: number): LocalWallTime {
  return { y: 2026, mo: 10, d: 2, h, mi: 0 };
}

function hour(h: number, prob: number | null): HourlyPoint {
  return {
    time: t(h),
    temperatureC: 20,
    apparentC: 19,
    condition: "CLEAR",
    conditionLabel: "Clear",
    isDay: true,
    precipitationProbability: prob,
    uvIndex: null,
    windKph: null,
  };
}

describe("findRainWindows", () => {
  it("finds a contiguous run above the threshold", () => {
    const hours = [hour(0, 0), hour(1, 60), hour(2, 80), hour(3, 70), hour(4, 10)];
    const windows = findRainWindows(hours);
    expect(windows).toHaveLength(1);
    expect(windows[0].startIdx).toBe(1);
    expect(windows[0].endIdx).toBe(3);
    expect(windows[0].maxProbability).toBe(80);
  });

  it("ignores single isolated hours (minHours=2)", () => {
    const hours = [hour(0, 90), hour(1, 0), hour(2, 90)];
    expect(findRainWindows(hours)).toHaveLength(0);
  });

  it("treats null probability as no rain", () => {
    const hours = [hour(0, 70), hour(1, null), hour(2, 70)];
    expect(findRainWindows(hours)).toHaveLength(0);
  });

  it("finds two separate windows", () => {
    const hours = [hour(0, 0), hour(1, 50), hour(2, 50), hour(3, 0), hour(4, 60), hour(5, 60)];
    const windows = findRainWindows(hours);
    expect(windows).toHaveLength(2);
    expect(windows[1].startIdx).toBe(4);
  });

  it("respects a custom threshold", () => {
    const hours = [hour(0, 40), hour(1, 40)];
    expect(findRainWindows(hours, 50)).toHaveLength(0);
    expect(findRainWindows(hours, 40)).toHaveLength(1);
  });
});

describe("rainWindowIndexSet", () => {
  it("covers all indices of every window", () => {
    const hours = [hour(0, 0), hour(1, 60), hour(2, 60), hour(3, 60), hour(4, 0)];
    const set = rainWindowIndexSet(findRainWindows(hours));
    expect([...set].sort((a, b) => a - b)).toEqual([1, 2, 3]);
  });
});