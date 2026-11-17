import { LoaderCircle, MapPin, Navigation, UserCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang, inr, type L } from '../i18n/lang';
import { distanceKm } from '../state/location';
import { StatusBadge, fmtDate } from '../components/status';
import { callApi } from '../state/api';
import type { AOrder, Prov } from './Admin';

/* Leaflet is loaded from a CDN on first use (no npm install needed). Map tiles come from OpenStreetMap. */
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
let leafletPromise: Promise<any> | null = null;
function loadLeaflet(): Promise<any> {
  const w = window as any;
  if (w.L) return Promise.resolve(w.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = LEAFLET_CSS;
      document.head.appendChild(css);
    }
    const s = document.createElement('script');
    s.src = LEAFLET_JS;
    s.async = true;
    s.onload = () => (w.L ? resolve(w.L) : reject(new Error('leaflet')));
    s.onerror = () => { leafletPromise = null; reject(new Error('leaflet')); };
    document.head.appendChild(s);
  });
  return leafletPromise;
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const ROAD_FACTOR = 1.3; // roads are usually ~30% longer than a straight line
const CLOSED = ['Done', 'Cancelled', 'Rejected'];

type Pt = { lat: number; lng: number };
const hasPt = (x: { lat?: number | null; lng?: number | null }): x is Pt => x.lat != null && x.lng != null;

/** Admin map: every booking venue and every provider base on one map, with km from a chosen venue to each provider. */
export default function AdminMap({ orders, providers, token, onChanged }: { orders: AOrder[]; providers: Prov[]; token: string; onChanged: () => void }) {
  const { t, lang } = useLang();
  const box = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  const [sel, setSel] = useState<string>('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<L | null>(null);

  const withPos = useMemo(() => orders.filter(hasPt).filter((o) => showClosed || !CLOSED.includes(o.status))
    .sort((a, b) => a.date.localeCompare(b.date)), [orders, showClosed]);
  const noPos = orders.filter((o) => !hasPt(o) && !CLOSED.includes(o.status)).length;
  const provPos = useMemo(() => providers.filter((p) => p.active && hasPt(p)), [providers]);
  const order = withPos.find((o) => o.ref === sel) ?? null;

  /** Providers sorted by distance from the selected venue. */
  const ranked = useMemo(() => {
    if (!order || !hasPt(order)) return [];
    return provPos.map((p) => ({ p, km: distanceKm(order as Pt, p as Pt) })).sort((a, b) => a.km - b.km);
  }, [order, provPos]);

  useEffect(() => {
    let dead = false;
    loadLeaflet().then((L) => {
      if (dead || !box.current) return;
      const map = L.map(box.current, { zoomControl: true, scrollWheelZoom: true }).setView([10.8, 78.7], 7); // Tamil Nadu
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setReady(true);
      setTimeout(() => map.invalidateSize(), 150);
    }).catch(() => !dead && setFailed(true));
    return () => { dead = true; mapRef.current?.remove(); mapRef.current = null; setReady(false); };
  }, []);

  useEffect(() => {
    const L = (window as any).L;
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    const bounds: [number, number][] = [];

    provPos.forEach((p) => {
      const icon = L.divIcon({ className: '', iconSize: [26, 26], iconAnchor: [13, 13],
        html: `<div style="width:26px;height:26px;border-radius:7px;background:#1d4ed8;color:#fff;font:700 13px/26px system-ui;text-align:center;border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45)">P</div>` });
      L.marker([p.lat, p.lng], { icon }).addTo(layer)
        .bindPopup(`<b>${esc(p.business || p.name)}</b><br>${esc(p.name)} · ${esc(p.mobile)}<br>${p.tier === 'Premium' ? '★ Premium<br>' : ''}Open jobs: ${p.openJobs}`);
      if (!order) bounds.push([p.lat as number, p.lng as number]);
    });

    withPos.forEach((o) => {
      const on = o.ref === sel;
      const color = on ? '#dc2626' : o.status === 'New' ? '#f59e0b' : '#16a34a';
      const icon = L.divIcon({ className: '', iconSize: [on ? 34 : 26, on ? 34 : 26], iconAnchor: [on ? 17 : 13, on ? 17 : 13],
        html: `<div style="width:100%;height:100%;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5)"></div>` });
      const m = L.marker([o.lat, o.lng], { icon, zIndexOffset: on ? 1000 : 0 }).addTo(layer)
        .bindPopup(`<b>${esc(o.event || '—')}</b> · ${esc(o.date)}<br>${esc(o.name)} ${esc(o.phone)}<br>${esc(o.town)}<br>${esc(o.ref)}${o.provider ? '<br>Provider: ' + esc(o.provider) : ''}`);
      m.on('click', () => setSel(o.ref));
      if (!order) bounds.push([o.lat as number, o.lng as number]);
    });

    if (order && hasPt(order)) {
      bounds.push([order.lat, order.lng]);
      ranked.forEach(({ p, km }, i) => {
        const near = i < 3;
        L.polyline([[order.lat, order.lng], [p.lat, p.lng]], { color: near ? '#dc2626' : '#94a3b8', weight: near ? 3 : 1.5, dashArray: near ? undefined : '6 6', opacity: 0.9 }).addTo(layer)
          .bindTooltip(`${km.toFixed(1)} km`, { permanent: near, direction: 'center', className: '' });
        if (near) bounds.push([p.lat as number, p.lng as number]);
      });
    }
    if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [ready, withPos, provPos, sel, order, ranked]);

  const assign = async (p: Prov) => {
    if (!order) return;
    setBusy(p.mobile);
    setMsg(null);
    const r = await callApi({ action: 'adminAssign', token, ref: order.ref, provider: p.mobile });
    setBusy('');
    if (!r.ok) return setMsg({ ta: 'ஒதுக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', en: 'Could not assign. Please try again.' });
    setMsg({ ta: `${p.business || p.name} ஒதுக்கப்பட்டார்.`, en: `Assigned to ${p.business || p.name}.` });
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-ink/70">
        <span lang={lang} className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-full bg-amber-500" /> {t({ ta: 'புதிய முன்பதிவு', en: 'New booking' })}</span>
        <span lang={lang} className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded-full bg-green-600" /> {t({ ta: 'ஒதுக்கப்பட்டது / நடப்பில்', en: 'In progress' })}</span>
        <span lang={lang} className="inline-flex items-center gap-1.5"><i className="inline-block h-3 w-3 rounded bg-blue-700" /> {t({ ta: 'சேவை வழங்குநர்', en: 'Provider base' })}</span>
        <label className="ml-auto inline-flex items-center gap-1.5">
          <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
          <span lang={lang}>{t({ ta: 'முடிந்த/ரத்தானவையும் காட்டு', en: 'Show completed / cancelled' })}</span>
        </label>
      </div>

      <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200">
        <div ref={box} className="h-[55svh] min-h-[320px] w-full bg-slate-100" />
        {!ready && !failed && <div className="absolute inset-0 grid place-items-center bg-slate-100/80"><LoaderCircle className="animate-spin text-primary" /></div>}
        {failed && <p role="alert" lang={lang} className="absolute inset-0 grid place-items-center bg-amber-50 p-6 text-center text-sm font-semibold text-amber-800">{t({ ta: 'வரைபடத்தை ஏற்ற முடியவில்லை. இணையத்தைச் சரிபார்க்கவும்.', en: 'Could not load the map. Check the internet connection.' })}</p>}
      </div>

      <p lang={lang} className="text-xs text-ink/55">
        {t({ ta: `${withPos.length} முன்பதிவுகள் · ${provPos.length} வழங்குநர்கள் வரைபடத்தில்.`, en: `${withPos.length} booking(s) and ${provPos.length} provider(s) on the map.` })}
        {noPos > 0 && ` ${t({ ta: `${noPos} முன்பதிவுகளுக்கு இடம் இல்லை.`, en: `${noPos} open booking(s) have no venue location.` })}`}
        {' '}{t({ ta: 'தூரம் நேர்கோட்டு கி.மீ.; சாலை தூரம் சுமார் 30% அதிகம்.', en: 'Distances are straight-line km; road distance is usually about 30% more.' })}
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card max-h-[26rem] overflow-y-auto p-2">
          <p lang={lang} className="px-2 pb-1 pt-1 text-sm font-extrabold">{t({ ta: 'முன்பதிவைத் தேர்ந்தெடுக்கவும்', en: 'Pick a booking' })}</p>
          {withPos.length === 0 && <p lang={lang} className="p-4 text-sm text-ink/55">{t({ ta: 'இடம் உள்ள முன்பதிவுகள் இல்லை.', en: 'No bookings with a venue location yet.' })}</p>}
          {withPos.map((o) => (
            <button key={o.ref} type="button" onClick={() => setSel(o.ref === sel ? '' : o.ref)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${o.ref === sel ? 'bg-red-50 ring-1 ring-red-200' : 'hover:bg-slate-50'}`}>
              <MapPin size={16} className={`shrink-0 ${o.ref === sel ? 'text-red-600' : 'text-ink/40'}`} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{o.event || '—'} · {o.name}</span>
                <span className="block truncate text-xs text-ink/55">{fmtDate(o.date, lang)} · {o.town} · {o.ref}</span>
              </span>
              <StatusBadge status={o.status} />
            </button>
          ))}
        </div>

        <div className="card p-4">
          {!order ? (
            <p lang={lang} className="py-8 text-center text-sm text-ink/55">{t({ ta: 'ஒரு முன்பதிவைத் தேர்ந்தால் ஒவ்வொரு வழங்குநருக்கும் உள்ள தூரம் இங்கே தெரியும்.', en: 'Pick a booking to see the distance to every provider.' })}</p>
          ) : (
            <>
              <p className="text-sm"><b>{order.event}</b> · {order.name} · {inr(order.total)}</p>
              <p className="mb-3 text-xs text-ink/55">{order.address || order.town}</p>
              {msg && <p role="status" lang={lang} className="mb-2 text-xs font-semibold text-emerald-700">{t(msg)}</p>}
              {ranked.length === 0 && <p lang={lang} className="text-sm text-ink/55">{t({ ta: 'இருப்பிடம் சேமித்த வழங்குநர்கள் இல்லை.', en: 'No active provider has saved a base location yet.' })}</p>}
              <ul className="space-y-2">
                {ranked.map(({ p, km }, i) => (
                  <li key={p.mobile} className={`rounded-xl p-3 ring-1 ${i === 0 ? 'bg-emerald-50 ring-emerald-200' : 'bg-white ring-slate-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{i === 0 && '★ '}{p.business || p.name}{p.tier === 'Premium' && <span className="ml-1 text-xs text-blue-700">Premium</span>}</p>
                        <p className="text-xs text-ink/55">{p.mobile} · {t({ ta: 'நடப்பு பணிகள்', en: 'open jobs' })}: {p.openJobs}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-extrabold text-primary">{km.toFixed(1)} km</p>
                        <p className="text-[11px] text-ink/50">≈ {(km * ROAD_FACTOR).toFixed(0)} km {t({ ta: 'சாலை', en: 'by road' })}</p>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <a className="chip bg-slate-100 text-ink/75" target="_blank" rel="noreferrer"
                        href={`https://www.google.com/maps/dir/?api=1&origin=${p.lat},${p.lng}&destination=${order.lat},${order.lng}`}>
                        <Navigation size={12} /> <span lang={lang}>{t({ ta: 'சாலை வழி', en: 'Road route' })}</span>
                      </a>
                      {order.providerMobile === p.mobile ? (
                        <span className="chip bg-emerald-100 text-emerald-800"><UserCheck size={12} /> <span lang={lang}>{t({ ta: 'ஒதுக்கப்பட்டது', en: 'Assigned' })}</span></span>
                      ) : !CLOSED.includes(order.status) && (
                        <button type="button" disabled={busy !== ''} onClick={() => void assign(p)} className="chip bg-primary text-gold-1">
                          {busy === p.mobile ? <LoaderCircle size={12} className="animate-spin" /> : <UserCheck size={12} />} <span lang={lang}>{t({ ta: 'ஒதுக்கு', en: 'Assign' })}</span>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
