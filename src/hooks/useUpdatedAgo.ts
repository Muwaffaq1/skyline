// Ticking "Updated X ago" string for the freshness footer (PRD refresh
// state: users need to understand whether data is fresh, especially when
// cached content loads first).

import { useEffect, useState } from "react";

export function useUpdatedAgo(fetchedAt: number | null): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (fetchedAt === null) return "";
  const ageMs = Math.max(0, now - fetchedAt);
  const minutes = Math.floor(ageMs / 60_000);
  if (minutes < 1) return "Updated just now";
  return `Updated ${minutes} min ago`;
}