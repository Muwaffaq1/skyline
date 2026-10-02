// Reverse geocoding for "Use My Location" → display city name.
// BigDataCloud's reverse-geocode-client endpoint is designed for client-side,
// unregistered use: no API key, permissive CORS. On failure the caller falls
// back to a coordinate label so the flow never blocks on name resolution.

export interface ReverseGeocodeResult {
  city: string;
  region: string | null;
  country: string;
}

interface RawResult {
  city?: string;
  locality?: string;
  principalSubdivision?: string;
  countryName?: string;
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: "en",
  });
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
  );
  if (!res.ok) {
    throw new Error(`Reverse geocoding failed with status ${res.status}`);
  }
  const data = (await res.json()) as RawResult;
  return {
    city: data.city || data.locality || data.principalSubdivision || "Current location",
    region: data.principalSubdivision || null,
    country: data.countryName || "",
  };
}