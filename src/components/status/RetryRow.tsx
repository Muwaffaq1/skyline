// Inline retry for a single failed section (partial-response isolation):
// current + hourly rendered fine, daily failed → a retry row inside the
// daily slot, not a whole-screen error.

interface RetryRowProps {
  sectionName: string;
  onRetry: () => void;
}

export function RetryRow({ sectionName, onRetry }: RetryRowProps) {
  return (
    <div className="card retry-row" role="status">
      <p className="retry-row__text">Couldn't load the {sectionName} forecast.</p>
      <button type="button" className="retry-row__action" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}