import { ORDERS } from '../data/config';

export type ApiFail = { ok: false; error: string };
export type ApiOk<T> = { ok: true } & T;

/** One call to the Google Apps Script backend. Never throws; errors come back as { ok: false, error }. */
export async function callApi<T extends object = object>(body: Record<string, unknown>): Promise<ApiOk<T> | ApiFail> {
  if (!ORDERS.url) return { ok: false, error: 'DISABLED' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    // text/plain keeps this a "simple" request, so the browser skips the CORS preflight that Apps Script cannot answer.
    const res = await fetch(ORDERS.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    return data && data.ok ? (data as ApiOk<T>) : { ok: false, error: String(data?.error || 'SERVER') };
  } catch {
    return { ok: false, error: 'NETWORK' };
  } finally {
    clearTimeout(timer);
  }
}

/** What every page needs on first load, fetched with ONE request and shared by the catalog, offers and company providers. */
export type BootData = {
  products: { added?: unknown[]; hidden?: string[]; overrides?: unknown[]; pandals?: unknown[] };
  content: { offers?: unknown[]; packages?: unknown[] };
  settings: Record<string, string>;
};

let bootCall: Promise<ApiOk<BootData> | ApiFail> | null = null;

/** The first caller sends the request; everyone else reuses it. If the script is an older version, callers fall back to their own request. */
export function loadBoot(): Promise<ApiOk<BootData> | ApiFail> {
  if (!bootCall) {
    bootCall = callApi<BootData>({ action: 'boot' }).then((r) => {
      if (!r.ok) bootCall = null; // let a later reload try again
      return r;
    });
  }
  return bootCall;
}
