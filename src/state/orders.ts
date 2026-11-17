import { CATEGORY_LABEL, type Category } from '../data/config';
import { callApi } from './api';
import type { Lang } from '../i18n/lang';
import type { Breakdown, EstimateState } from './estimate';
import { NO_LOCATION, type VenueLocation } from './location';

/** One booking, sent as JSON to the Google Apps Script web app (see google-apps-script/Code.gs). */
export type OrderPayload = {
  ref: string;
  lang: Lang;
  name: string;
  phone: string;
  event: string;
  date: string;
  town: string;
  address: string;
  /** venue location (all optional): GPS position and/or a map link */
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  mapLink: string;
  guests: string;
  notes: string;
  pandal: string;
  size: string;
  areaSqft: number;
  pandalCost: number;
  items: string;
  boardText: string;
  distanceKm: number;
  transport: number;
  total: number;
  page: string;
  website: string; // honeypot — real visitors never fill this
  /** up to 3 reference photos as shrunk JPEG data URLs (saved to Drive by the script) */
  photos?: string[];
};

export type OrderForm = Pick<OrderPayload, 'name' | 'phone' | 'event' | 'date' | 'town' | 'address' | 'guests' | 'notes'>;

/** Short reference number, e.g. EV-261018-K7Q2. Created once per booking so a retry never creates a duplicate row. */
export function makeRef(now = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `EV-${yy}${mm}${dd}-${rand}`;
}

/** Plain-English text for the sheet / e-mail (the owner reads these). */
export function buildOrder(ref: string, lang: Lang, f: OrderForm, b: Breakdown, s: EstimateState, honeypot = '', loc: VenueLocation = NO_LOCATION, photos: string[] = []): OrderPayload {
  const lines: string[] = [];
  (Object.keys(b.lines) as Category[]).forEach((c) => {
    if (b.lines[c].length) {
      lines.push(`${CATEGORY_LABEL[c].en}: ` + b.lines[c].map((l) => `${l.item.name.en} x ${l.qty} = Rs.${l.total}`).join('; '));
    }
  });
  if (b.combo) lines.push(`Combo offer: ${b.combo.name.en} (saving Rs.${b.combo.discount})`);
  const boardText = '';
  return {
    ref,
    lang,
    name: f.name.trim(),
    phone: f.phone.replace(/[\s-]/g, ''),
    event: f.event,
    date: f.date,
    town: f.town,
    address: f.address.trim(),
    lat: loc.lat,
    lng: loc.lng,
    accuracy: loc.accuracy,
    mapLink: loc.mapLink,
    guests: f.guests,
    notes: f.notes.trim(),
    pandal: b.pandal ? b.pandal.name.en : '',
    size: b.pandal ? `${s.length} x ${s.breadth} ${s.unit}` : '',
    areaSqft: Math.round(b.areaSqft),
    pandalCost: Math.round(b.pandalCost),
    items: lines.join('\n'),
    boardText,
    distanceKm: s.distanceKm || 0,
    transport: Math.round(b.transport),
    total: Math.round(b.total),
    page: typeof location !== 'undefined' ? location.origin : '',
    website: honeypot,
    photos,
  };
}

export type SubmitResult = { ok: true; ref: string } | { ok: false; error: 'network' | 'server' };

/** Sends the booking. When the customer is logged in, the token links it to their account (My Orders). */
export async function submitOrder(p: OrderPayload, token?: string | null): Promise<SubmitResult> {
  const r = await callApi<{ ref?: string }>({ action: 'order', token: token || undefined, ...p });
  if (r.ok) return { ok: true, ref: r.ref || p.ref };
  return { ok: false, error: r.error === 'NETWORK' ? 'network' : 'server' };
}
