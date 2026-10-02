import { describe, expect, it } from "vitest";
import { evaluateCards } from "./cards";
import { forecast, hour, wt } from "../testFixtures";

describe("evaluateCards", () => {
  // Mildly unpleasant: hot, breezy, some rain risk — nothing crosses any
  // alert threshold, so only the calm default remains.
  const dullForecast = forecast({
    hourly: Array.from({ length: 10 }, (_, i) =>
      hour(14 + i, { temperatureC: 31, windKph: 15, precipitationProbability: 40, uvIndex: 3 }),
    ),
  });

  it("falls through to the calm card when nothing triggers", () => {
    const cards = evaluateCards(dullForecast);
    expect(cards).toHaveLength(1);
    expect(cards[0].kind).toBe("calm");
  });

  it("ranks storm above rain window", () => {
    const f = forecast({
      current: {
        temperatureC: 22,
        feelsLikeC: 22,
        condition: "THUNDERSTORM",
        conditionLabel: "Thunderstorm",
        conditionCode: 95,
        isDay: true,
        highC: 26,
        lowC: 18,
        time: wt(14),
      },
      hourly: [
        hour(14, { condition: "THUNDERSTORM", precipitationProbability: 90 }),
        hour(15, { precipitationProbability: 80 }),
        hour(16, { precipitationProbability: 80 }),
      ],
    });
    const cards = evaluateCards(f);
    expect(cards[0].kind).toBe("storm");
  });

  it("reports a rain window ≥50% spanning ≥2 hours", () => {
    const f = forecast({
      hourly: [
        hour(14, { precipitationProbability: 10 }),
        hour(15, { precipitationProbability: 70 }),
        hour(16, { precipitationProbability: 70 }),
        hour(17, { precipitationProbability: 10 }),
      ],
    });
    const cards = evaluateCards(f);
    const rain = cards.find((c) => c.kind === "rain-window");
    expect(rain).toBeDefined();
    if (rain?.kind === "rain-window") {
      expect(rain.body).toContain("3PM");
      expect(rain.body).toContain("4PM");
    }
  });

  it("alerts on high UV", () => {
    const f = forecast({ hourly: [hour(14, { uvIndex: 8 }), hour(15)] });
    expect(evaluateCards(f)[0].kind).toBe("uv");
  });

  it("alerts on strong wind", () => {
    const f = forecast({ hourly: [hour(14, { windKph: 40 }), hour(15, { windKph: 45 })] });
    expect(evaluateCards(f)[0].kind).toBe("wind");
  });

  it("alerts on a ≥5° drop within 3 hours", () => {
    const f = forecast({
      hourly: [hour(14), hour(15), hour(16), hour(17, { temperatureC: 16 })],
    });
    const cards = evaluateCards(f);
    expect(cards[0].kind).toBe("temp-drop");
  });

  it("compares with yesterday when |Δ| ≥ 2°", () => {
    const f = forecast({
      yesterday: {
        date: wt(0, 1),
        tempByHour: Array.from({ length: 24 }, () => 18),
        minC: 16,
        maxC: 20,
      },
    });
    const cards = evaluateCards(f);
    const y = cards.find((c) => c.kind === "yesterday");
    expect(y).toBeDefined();
  });

  it("stays silent on a <2° yesterday delta", () => {
    const f = forecast({
      yesterday: {
        date: wt(0, 1),
        tempByHour: Array.from({ length: 24 }, (_, h) => (h === 14 ? 21 : 18)),
        minC: 16,
        maxC: 20,
      },
    });
    const cards = evaluateCards(f);
    expect(cards.find((c) => c.kind === "yesterday")).toBeUndefined();
  });

  it("suggests the best window when conditions are pleasant", () => {
    const cards = evaluateCards(forecast());
    expect(cards.find((c) => c.kind === "best-window")).toBeDefined();
  });
});