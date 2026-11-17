/** A venue location picked on the booking page. */
export type VenueLocation = {
  lat: number | null;
  lng: number | null;
  /** GPS accuracy in metres (only when the browser gave the position) */
  accuracy: number | null;
  /** Google Maps link — generated from the GPS position, or pasted by the customer */
  mapLink: string;
  source: 'gps' | 'link' | '';
};

export const NO_LOCATION: VenueLocation = { lat: null, lng: null, accuracy: null, mapLink: '', source: '' };

export const mapsUrl = (lat: number, lng: number) => `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;

/** Accepts only http(s) links to a map (Google Maps, maps.app.goo.gl, OpenStreetMap, Apple Maps). */
export function cleanMapLink(raw: string): string {
  const v = raw.trim();
  if (!/^https?:\/\//i.test(v)) return '';
  try {
    const host = new URL(v).hostname.toLowerCase();
    const ok = /(^|\.)(google\.[a-z.]+|goo\.gl|openstreetmap\.org|apple\.com|maps\.app\.goo\.gl)$/.test(host);
    return ok ? v.slice(0, 300) : '';
  } catch {
    return '';
  }
}

/** Reads latitude/longitude out of a long Google Maps link (…@11.34,77.72… or ?q=11.34,77.72). Short links return null. */
export function coordsFromLink(link: string): { lat: number; lng: number } | null {
  const m = link.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/) || link.match(/[?&](?:q|ll|query)=(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : null;
}

/** Straight-line distance in km between two points (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = (x: number) => (x * Math.PI) / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The location saved in a profile, as a VenueLocation (NO_LOCATION when nothing is saved). */
export function savedLocation(u: { lat?: number | null; lng?: number | null; mapLink?: string } | null): VenueLocation {
  if (!u) return NO_LOCATION;
  const hasPoint = typeof u.lat === 'number' && typeof u.lng === 'number';
  const link = u.mapLink || (hasPoint ? mapsUrl(u.lat as number, u.lng as number) : '');
  if (!link) return NO_LOCATION;
  return { lat: hasPoint ? (u.lat as number) : null, lng: hasPoint ? (u.lng as number) : null, accuracy: null, mapLink: link, source: hasPoint ? 'gps' : 'link' };
}
