// Debounced geocoding search (PRD manual location flow: "App waits briefly
// to debounce input"). Empty results are a search miss; a thrown error is a
// network failure — the sheet renders different copy for each.

import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { searchLocations } from "../api/openMeteo";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function useLocationSearch(query: string) {
  const debounced = useDebouncedValue(query.trim(), 300);
  return useQuery({
    queryKey: ["geocode", debounced],
    queryFn: () => searchLocations(debounced),
    enabled: debounced.length >= 2,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}