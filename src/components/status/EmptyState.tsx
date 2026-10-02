// Blocking empty state — shown only when there is truly nothing to render
// (no cached snapshot AND the forecast request failed). One headline, one
// cause, one primary action + one alternate path, per the error pattern.

interface EmptyStateProps {
  onRetry: () => void;
  onOpenSearch: () => void;
}

export function EmptyState({ onRetry, onOpenSearch }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <p className="empty-state__title">Weather isn't available right now.</p>
      <p className="empty-state__cause">
        Check your connection and try again.
      </p>
      <div className="empty-state__actions">
        <button type="button" className="btn-primary" onClick={onRetry}>
          Retry
        </button>
        <button type="button" className="btn-secondary" onClick={onOpenSearch}>
          Search for a city
        </button>
      </div>
    </div>
  );
}