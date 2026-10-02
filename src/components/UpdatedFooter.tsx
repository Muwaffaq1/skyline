// Freshness footer: "Updated 8 min ago", tap to refresh. This is the manual
// refresh path — always available, even without pull-to-refresh.

import { useUpdatedAgo } from "../hooks/useUpdatedAgo";

interface UpdatedFooterProps {
  fetchedAt: number;
  refreshing: boolean;
  onRefresh: () => void;
}

export function UpdatedFooter({ fetchedAt, refreshing, onRefresh }: UpdatedFooterProps) {
  const label = useUpdatedAgo(fetchedAt);

  return (
    <button
      type="button"
      className="updated-footer"
      onClick={onRefresh}
      aria-label={`${label}. Tap to refresh.`}
    >
      {refreshing && <span className="updated-footer__refreshing" aria-hidden="true" />}
      <span aria-hidden="true">{label}</span>
    </button>
  );
}