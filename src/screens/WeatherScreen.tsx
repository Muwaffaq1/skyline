// The one screen. Routing per PRD state model:
//   no location          → FirstRunGate (value-first, dual path)
//   location + loading   → spinner (brief; cache-first means this is rare)
//   nothing cached/fresh → EmptyState (blocking failure)
//   forecast present     → Now → Next → Later stack, with non-blocking
//                          DegradedBanner / section RetryRows on top.

import { useState } from "react";
import { applyDemo } from "../lib/demo";
import { DegradedBanner, type DegradedReason } from "../components/status/DegradedBanner";
import { EmptyState } from "../components/status/EmptyState";
import { RetryRow } from "../components/status/RetryRow";
import { FirstRunGate } from "../components/first-run/FirstRunGate";
import { LocationHeader } from "../components/LocationHeader";
import { HeroWeather } from "../components/HeroWeather";
import { HourlyStrip } from "../components/hourly/HourlyStrip";
import { DailyList } from "../components/daily/DailyList";
import { UpdatedFooter } from "../components/UpdatedFooter";
import { UnitToggle } from "../components/UnitToggle";
import { SearchSheet } from "../components/search/SearchSheet";
import { DemoSheet } from "../components/demo/DemoSheet";
import { CityChips } from "../components/cities/CityChips";
import { SkylineBrief } from "../components/brief/SkylineBrief";
import { ContextualCard } from "../components/insight/ContextualCard";
import { evaluateCards } from "../lib/insights/cards";
import { useWeather } from "../hooks/useWeather";
import { useNotifications } from "../hooks/useNotifications";
import { useIsOnline } from "../hooks/useIsOnline";
import { useSettings } from "../store/settings";
import { locationNow, formatClock } from "../lib/time";
import type { LocalWallTime, WeatherLocation } from "../domain/types";

/** Older than this → the PRD's "stale data" block threshold. */
const STALE_LIMIT_MS = 3 * 60 * 60_000;

export function WeatherScreen() {
  const unit = useSettings((s) => s.unit);
  const selectedLocation = useSettings((s) => s.selectedLocation);
  const selectLocation = useSettings((s) => s.selectLocation);
  const markFirstRunDone = useSettings((s) => s.markFirstRunDone);
  const dismissNotificationsPrompt = useSettings((s) => s.dismissNotificationsPrompt);
  const demoMode = useSettings((s) => s.demoMode);
  const [searchOpen, setSearchOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const isOnline = useIsOnline();

  const query = useWeather(selectedLocation);
  // Raw data for notifications (alerts skip demo); demo-routed data for the
  // screen, matching useSkyToken so sky and content never diverge.
  const notifications = useNotifications(query.data ?? null);
  const data = applyDemo(query.data ?? null, demoMode);

  const chooseLocation = (location: WeatherLocation) => {
    selectLocation(location);
    markFirstRunDone();
    setSearchOpen(false);
  };

  const openSearch = () => setSearchOpen(true);
  const closeSearch = () => setSearchOpen(false);
  const retry = () => void query.refetch();

  // ---- No location yet: first-run gate (only place the gate appears) ----
  if (!selectedLocation) {
    return (
      <>
        <FirstRunGate onDeviceLocation={chooseLocation} onOpenSearch={openSearch} />
        <SearchSheet open={searchOpen} onClose={closeSearch} onSelect={chooseLocation} />
      </>
    );
  }

  // ---- Loading with nothing to show ----
  if (!data && query.isPending) {
    return (
      <div className="screen-loading">
        <span className="screen-loading__spinner" role="status" aria-label="Loading weather" />
      </div>
    );
  }

  // ---- Blocking failure: request failed and nothing is cached ----
  if (!data || (!data.current && data.hourly.length === 0 && data.daily.length === 0)) {
    return (
      <>
        <EmptyState onRetry={retry} onOpenSearch={openSearch} />
        <SearchSheet open={searchOpen} onClose={closeSearch} onSelect={chooseLocation} />
      </>
    );
  }

  // ---- Main stack ----
  const now: LocalWallTime = locationNow(data.utcOffsetSeconds);
  const isStale = Date.now() - data.fetchedAt > STALE_LIMIT_MS;
  const bannerReason: DegradedReason | null = !isOnline
    ? "offline"
    : query.isError
      ? "refreshFailed"
      : isStale
        ? "stale"
        : null;

  // "Showing data from 8:40 AM" — the forecast's location-local time.
  const cachedAtLabel = data.current
    ? formatClock(data.current.time)
    : formatClock(epochToWall(data.fetchedAt, data.utcOffsetSeconds));

  return (
    <>
      {bannerReason && <DegradedBanner reason={bannerReason} cachedAtLabel={cachedAtLabel} onRetry={retry} />}

      <LocationHeader
        location={data.location}
        loading={query.isFetching}
        onOpenSearch={openSearch}
        onOpenDemo={() => setDemoOpen(true)}
      />

      <CityChips selected={data.location} />

      <SkylineBrief forecast={data} />

      <main>
        {data.current ? (
          <HeroWeather current={data.current} unit={unit} hourly={data.hourly} />
        ) : (
          <RetryRow sectionName="current conditions" onRetry={retry} />
        )}

        {data.current && (
          <ContextualCard card={evaluateCards(data)[0]} />
        )}

        {data.missingSections.includes("hourly") ? (
          <RetryRow sectionName="hourly" onRetry={retry} />
        ) : (
          <HourlyStrip hours={data.hourly} unit={unit} daily={data.daily} utcOffsetSeconds={data.utcOffsetSeconds} />
        )}

        {data.missingSections.includes("daily") ? (
          <RetryRow sectionName="daily" onRetry={retry} />
        ) : (
          <DailyList days={data.daily.slice(0, 5)} unit={unit} now={now} />
        )}
      </main>

      <div className="footer-row">
        <UpdatedFooter fetchedAt={data.fetchedAt} refreshing={query.isFetching} onRefresh={retry} />
        <UnitToggle />
      </div>

      {notifications.optInVisible && (
        <div className="notification-optin">
          <span>Get alerts like &ldquo;Rain in about an hour&rdquo;?</span>
          <span className="notification-optin__actions">
            <button type="button" className="notification-optin__button" onClick={() => void notifications.enable()}>
              Enable
            </button>
            <button
              type="button"
              className="notification-optin__button"
              onClick={dismissNotificationsPrompt}
            >
              Not now
            </button>
          </span>
        </div>
      )}

      <SearchSheet open={searchOpen} onClose={closeSearch} onSelect={chooseLocation} />
      <DemoSheet open={demoOpen} onClose={() => setDemoOpen(false)} />
    </>
  );
}

/** Location-local wall time of an epoch (for cached snapshots without a current section). */
function epochToWall(epochMs: number, utcOffsetSeconds: number): LocalWallTime {
  const shifted = new Date(epochMs + utcOffsetSeconds * 1000);
  return {
    y: shifted.getUTCFullYear(),
    mo: shifted.getUTCMonth() + 1,
    d: shifted.getUTCDate(),
    h: shifted.getUTCHours(),
    mi: shifted.getUTCMinutes(),
  };
}