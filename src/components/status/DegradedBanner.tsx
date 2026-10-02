// Non-blocking degraded banner (PRD: "Degraded vs blocking failure states").
// Sits above the forecast stack; the cached view below is untouched.
// Variants, each with the PRD's specific copy:
//  - stale:        data older than the 3-hour block threshold
//  - refreshFailed: a refresh attempt errored but cache exists
//  - offline:      no connectivity
// "stale"/"refreshFailed" include the cached data's time so the user can
// judge how much to trust it.

export type DegradedReason = "stale" | "refreshFailed" | "offline";

interface DegradedBannerProps {
  reason: DegradedReason;
  /** Formatted cached-data time, e.g. "8:40 AM" — required for stale/refreshFailed. */
  cachedAtLabel?: string;
  onRetry: () => void;
}

export function DegradedBanner({ reason, cachedAtLabel, onRetry }: DegradedBannerProps) {
  let text: string;
  switch (reason) {
    case "stale":
      text = `Couldn't update weather. Showing data from ${cachedAtLabel ?? "earlier"}.`;
      break;
    case "refreshFailed":
      text = `Couldn't update weather. Showing data from ${cachedAtLabel ?? "earlier"}.`;
      break;
    case "offline":
      text = "You're offline. Showing the last downloaded forecast.";
      break;
  }

  return (
    <div className="banner" role="status">
      <p className="banner__text">{text}</p>
      {reason !== "offline" && (
        <button type="button" className="banner__retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}