import { describe, expect, it } from "vitest";
import { yesterdayDelta } from "./yesterday";
import type { YesterdaySummary } from "../../domain/types";

const yesterday: YesterdaySummary = {
  date: { y: 2026, mo: 10, d: 1, h: 0, mi: 0 },
  tempByHour: Array.from({ length: 24 }, () => 20),
  minC: 18,
  maxC: 22,
};

const now = { y: 2026, mo: 10, d: 2, h: 14, mi: 30 };

describe("yesterdayDelta", () => {
  it("returns current − yesterday at the same hour", () => {
    expect(yesterdayDelta(24, yesterday, now)).toBe(4);
    expect(yesterdayDelta(17, yesterday, now)).toBe(-3);
  });

  it("returns null when there is no yesterday data", () => {
    expect(yesterdayDelta(20, null, now)).toBeNull();
  });

  it("returns null when yesterday's hour is missing", () => {
    const sparse: YesterdaySummary = { ...yesterday, tempByHour: [] };
    expect(yesterdayDelta(20, sparse, now)).toBeNull();
  });
});