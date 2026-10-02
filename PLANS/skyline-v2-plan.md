# Skyline V2 — Feature Plan

Status: **draft for approval**

Scope: the feature list supplied by the user (sky background, hourly timeline,
contextual cards, yesterday comparison, rain window, demo mode, sun
experience). Phased so each phase ships independently.

---

## Phase 1 — Data foundation (prerequisite for most features)

Extend the Open-Meteo forecast request (single call, cached in the weather
store):

```
hourly:  temperature_2m, apparent_temperature, precipitation_probability,
         weathercode, is_day, uv_index, wind_speed_10m
daily:   weathercode, temperature_2m_max, temperature_2m_min,
         sunrise, sunset, uv_index_max, wind_speed_10m_max, precipitation_sum
params:  forecast_days=7, past_days=2   (past_days → yesterday comparison)
```

- Cache: extend the existing weather store shape; bump cache version so old
  snapshots invalidate cleanly.
- Risk: `past_days` shifts hourly array indices — handle by aligning on the
  current hour when slicing.

## Phase 2 — Dynamic sky background

- Gradient driven by **sun position** (hour vs sunrise/sunset → dawn / day /
  dusk / night) crossed with **condition** (clear, cloud, rain, storm, snow,
  fog).
- Smooth CSS gradient transitions; update on data refresh and on demo-mode
  change.
- Demo mode (Phase 6) overrides the computed state.

## Phase 3 — Hourly timeline

- Horizontal scroll strip: hour label, temperature, **trend arrow** (vs the
  previous hour: ↑ warmer / ↓ cooler / → same), condition icon, precip %.
- **Rain window highlight**: contiguous hours with precip ≥ 50% get a shaded
  background; the card layer (Phase 4) summarizes it in words.

## Phase 4 — Insight & contextual cards

Rule engine renders **only the relevant card(s)**, priority order:

| Priority | Card | Trigger |
|---|---|---|
| 1 | Storm / heavy rain warning | weathercode storm, or precip ≥ 70% within 3 h |
| 2 | Rain window | first span of ≥ 2 consecutive hours ≥ 50% → "Rain likely 4–6 PM" |
| 3 | UV alert | UV index ≥ 6 → SPF / shade advice |
| 4 | Wind alert | wind ≥ 35 km/h |
| 5 | Temperature drop | ≥ 5 °C drop within the next 3 h |
| 6 | Best window | nicest outdoor window in next 12 h (18–26 °C, low wind, no precip) |
| 7 | Yesterday comparison | \|Δ\| vs yesterday same hour ≥ 2 ° → "3° cooler than yesterday" |
| 8 | Calm / clear (default) | nothing triggered → "Clear skies ahead" |

- **Skyline brief**: one generated sentence under the location header,
  composed from dominant condition + temp trend + rain window
  (e.g. "Overcast now, clearing by afternoon with a high of 21°.").

## Phase 5 — Sunrise / sunset experience

- Countdown to the next sunrise or sunset ("Sunset in 2 h 14 m").
- **Golden-hour tint**: gradient warms in the ±45 min window around
  sunrise/sunset.

## Phase 6 — Demo mode

- Dev/portfolio toggle: `?demo=storm|rain|clear|snow|night|sunset|fog` query
  param (and a hidden long-press toggle on the logo for demos without URL
  editing).
- Forces condition + time-of-day for the sky gradient, timeline and cards;
  injects synthetic data so every feature is demonstrable offline.
- Persistent "Demo mode" chip with one-tap exit.

## Suggested build order

1 → 2 → 3 → 4 → 5 → 6 (each phase is independently shippable; data foundation
unblocks everything else).

---

Open questions for approval:
1. Build all six phases, or start with a subset?
2. Demo mode: URL param only, or also the long-press toggle?
