import { CalendarDays, Check, ChevronDown, LoaderCircle, LocateFixed, MapPin, Phone, RefreshCw, TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { inr, useLang, type L } from '../i18n/lang';
import { WhatsAppIcon } from '../components/Layout';
import { MapChip, PremiumBadge, SERVICE_LABEL, StatusBadge, fmtDate, waLink } from '../components/status';
import { LocationPicker } from '../components/LocationPicker';
import { PhotoStrip } from '../components/photos';
import { callApi } from '../state/api';
import { homeFor, roleOf, useAuth } from '../state/auth';
import { NO_LOCATION, mapsUrl, type VenueLocation } from '../state/location';

type Job = {
  ref: string; received: string; status: string; event: string; date: string; town: string; address: string; guests: string;
  notes: string; pandal: string; size: string; items: string; boardText: string; total: number; name: string; phone: string;
  assignedAt: string; providerNote: string; hasRentals?: boolean; rating?: number; review?: string;
  mapLink?: string; lat?: number | null; lng?: number | null; photos?: string[]; closeReason?: string; closedBy?: string;
};

const TABS = [
  { k: 'todo', statuses: ['Assigned'], v: { ta: 'பதில் தேவை', en: 'To respond' } },
  { k: 'active', statuses: ['Accepted', 'Confirmed'], v: { ta: 'செய்ய வேண்டியவை', en: 'To do' } },
  { k: 'returns', statuses: ['ServiceDone'], v: { ta: 'பொருட்கள் எடுக்க', en: 'Collect items' } },
  { k: 'done', statuses: ['Done'], v: { ta: 'முடிந்தவை', en: 'Completed' } },
  { k: 'all', statuses: ['Assigned', 'Accepted', 'Confirmed', 'ServiceDone', 'Done', 'Cancelled', 'Rejected', 'New'], v: { ta: 'அனைத்து வரலாறு', en: 'All history' } },
] as const;

function JobCard({ j, token, onChanged }: { j: Job; token: string; onChanged: () => void }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(j.status === 'Assigned');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const respond = async (response: 'accept' | 'decline' | 'serviceDone' | 'returned') => {
    setBusy(response);
    setError(false);
    const r = await callApi({ action: 'providerRespond', token, ref: j.ref, response, note });
    setBusy(null);
    if (r.ok) onChanged();
    else setError(true);
  };

  const rows: [L, string][] = [
    [{ ta: 'விழா இடம்', en: 'Venue' }, j.address],
    [{ ta: 'பந்தல்', en: 'Pandal' }, j.pandal ? `${j.pandal}${j.size ? ` (${j.size})` : ''}` : ''],
    [{ ta: 'பொருட்கள்', en: 'Items' }, j.items],
    [{ ta: 'பலகை எழுத்து', en: 'Board text' }, j.boardText],
    [{ ta: 'விருந்தினர்கள்', en: 'Guests' }, j.guests],
    [{ ta: 'வாடிக்கையாளர் குறிப்பு', en: 'Customer notes' }, j.notes],
    [{ ta: 'உங்கள் குறிப்பு', en: 'Your note' }, j.providerNote],
  ];

  return (
    <article className="card">
      <button type="button" onClick={() => setOpen((x) => !x)} aria-expanded={open} className="flex w-full items-start gap-3 p-4 text-left sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold sm:text-lg">{j.event || '—'}</span>
            <StatusBadge status={j.status} />
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/65">
            <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {fmtDate(j.date, lang)}</span>
            {j.town && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {j.town}</span>}
          </p>
          <p className="mt-1.5 text-xs text-ink/45">{j.ref}{j.assignedAt && ` · ${t({ ta: 'ஒதுக்கப்பட்டது', en: 'assigned' })} ${j.assignedAt}`}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold text-primary">{inr(j.total)}</p>
          <ChevronDown size={18} className={`ml-auto mt-1 text-ink/40 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-ink/10 bg-turmeric-wash/50 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <b>{j.name}</b>
            <a href={`tel:+91${j.phone}`} className="chip bg-primary text-gold-1"><Phone size={12} /> {j.phone}</a>
            <a href={waLink(j.phone, `Hello ${j.name}, this is about your booking ${j.ref}.`)} target="_blank" rel="noreferrer" className="chip bg-[#25D366] text-white"><WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp</a>
            {j.mapLink && <MapChip link={j.mapLink} />}
          </div>
          <dl className="space-y-2 text-sm">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k.en} className="grid grid-cols-1 gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
                <dt lang={lang} className="font-semibold text-ink/55">{t(k)}</dt>
                <dd className="whitespace-pre-wrap break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <PhotoStrip urls={j.photos} />
          {(j.status === 'Cancelled' || j.status === 'Rejected') && (
            <p lang={lang} className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {j.status === 'Cancelled' ? t({ ta: 'வாடிக்கையாளர் இந்த முன்பதிவை ரத்து செய்தார். விழா இடத்துக்குச் செல்ல வேண்டாம்.', en: 'The customer cancelled this booking. Please do not go to the venue.' }) : t({ ta: 'நிறுவனம் இந்த முன்பதிவை நிராகரித்தது. விழா இடத்துக்குச் செல்ல வேண்டாம்.', en: 'The admin rejected this booking. Please do not go to the venue.' })}
              {j.closeReason && <span className="mt-0.5 block font-normal">{t({ ta: 'காரணம்', en: 'Reason' })}: {j.closeReason}</span>}
            </p>
          )}
          <p lang={lang} className="text-xs text-ink/45">{t({ ta: 'விலை மதிப்பீடு மட்டுமே; இறுதி விலையை நிறுவனம் உறுதி செய்யும்.', en: 'The price is an estimate; the business confirms the final price.' })}</p>

          {j.status === 'Done' && (j.rating ?? 0) > 0 && (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-amber-200">
              <p lang={lang} className="text-sm font-bold">{t({ ta: 'வாடிக்கையாளர் மதிப்பீடு', en: 'Customer rating' })}: <span className="text-amber-500">{'★★★★★'.slice(0, j.rating)}</span><span className="text-ink/20">{'★★★★★'.slice(j.rating)}</span></p>
              {j.review && <p className="mt-1 text-sm italic text-ink/70">“{j.review}”</p>}
            </div>
          )}

          {['Assigned', 'Accepted', 'Confirmed', 'ServiceDone'].includes(j.status) && (
            <div className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-ink/10">
              <input className="w-full" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300}
                placeholder={t({ ta: 'குறிப்பு (விருப்பம்)', en: 'Note (optional)' })} />
              <div className="flex flex-wrap gap-2">
                {j.status === 'Assigned' && (
                  <button type="button" disabled={busy !== null} onClick={() => void respond('accept')} className="btn-primary !py-2.5">
                    {busy === 'accept' ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} <span lang={lang}>{t({ ta: 'ஏற்கிறேன்', en: 'Accept' })}</span>
                  </button>
                )}
                {(j.status === 'Accepted' || j.status === 'Confirmed') && (
                  <button type="button" disabled={busy !== null} onClick={() => void respond('serviceDone')} className="btn-primary !py-2.5">
                    {busy === 'serviceDone' ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />}
                    <span lang={lang}>{j.hasRentals ? t({ ta: 'சேவை முடிந்தது (பொருட்கள் பின்னர் எடுக்க)', en: 'Service done (collect items later)' }) : t({ ta: 'முடிந்தது எனக் குறி', en: 'Mark as completed' })}</span>
                  </button>
                )}
                {j.status === 'ServiceDone' && (
                  <button type="button" disabled={busy !== null} onClick={() => void respond('returned')} className="btn-primary !py-2.5">
                    {busy === 'returned' ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={16} />} <span lang={lang}>{t({ ta: 'வாடகைப் பொருட்கள் திரும்பப் பெறப்பட்டன', en: 'Rental items collected' })}</span>
                  </button>
                )}
                {(j.status === 'Assigned' || j.status === 'Accepted') && (
                  <button type="button" disabled={busy !== null} onClick={() => void respond('decline')} className="btn-ghost !py-2.5 !text-red-700">
                    {busy === 'decline' ? <LoaderCircle size={16} className="animate-spin" /> : <X size={16} />} <span lang={lang}>{t({ ta: 'மறுக்கிறேன்', en: 'Decline' })}</span>
                  </button>
                )}
              </div>
              {error && <p role="alert" lang={lang} className="flex items-center gap-2 text-sm font-semibold text-amber-800"><TriangleAlert size={15} /> {t({ ta: 'செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', en: 'Could not save. Please try again.' })}</p>}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/** Shown instead of the jobs until the provider has saved a base location: the admin allocates jobs by distance, so it is compulsory. */
function LocationGate() {
  const { t, lang } = useLang();
  const { user, updateProfile } = useAuth();
  const [loc, setLoc] = useState<VenueLocation>(NO_LOCATION);
  const [address, setAddress] = useState(user?.address ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);

  const save = async () => {
    if (loc.lat === null || loc.lng === null) return setError({ ta: 'முதலில் “இருப்பிடத்தை இயக்கு” அழுத்தவும் (அல்லது நீண்ட Google Maps இணைப்பை ஒட்டவும்).', en: 'Tap “Enable location” first (or paste a long Google Maps link).' });
    setError(null);
    setBusy(true);
    const r = await updateProfile({ address: address.trim(), lat: loc.lat, lng: loc.lng, mapLink: loc.mapLink });
    setBusy(false);
    if (!r.ok) setError(r.error === 'NETWORK' ? { ta: 'இணைய இணைப்பு இல்லை.', en: 'No internet connection.' } : { ta: 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', en: 'Could not save. Please try again.' });
  };

  return (
    <section className="mx-auto max-w-xl px-4 py-8 sm:py-12">
      <div className="card space-y-5 p-5 sm:p-7">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><MapPin size={28} /></span>
        <div>
          <h1 lang={lang} className="text-2xl font-extrabold">{t({ ta: 'தொடர உங்கள் இருப்பிடம் தேவை', en: 'Share your location to continue' })}</h1>
          <p lang={lang} className="mt-2 text-sm text-ink/65">{t({ ta: 'நிர்வாகி உங்களுக்கு அருகிலுள்ள பணிகளை ஒதுக்குவதற்கு உங்கள் இருப்பிடம் கட்டாயம். கடை அல்லது வீட்டில் இருக்கும்போது இதைச் செய்யுங்கள்.', en: 'The admin gives you jobs by distance, so your location is required. Do this while you are at your shop or home.' })}</p>
        </div>
        <label className="block">
          <span lang={lang} className="mb-1.5 block text-sm font-semibold text-ink/75">{t({ ta: 'கடை / வீட்டு முகவரி', en: 'Shop / home address' })}</span>
          <textarea className="w-full" rows={2} maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <LocationPicker value={loc} onChange={setLoc} optional={false} needCoords title={{ ta: 'என் அடிப்படை இருப்பிடம்', en: 'My base location' }}
          hint={{ ta: '“இருப்பிடத்தை இயக்கு” அழுத்தினால் உங்கள் தொலைபேசியின் GPS பயன்படும்.', en: 'Tap “Enable location” to use your phone’s GPS.' }} />
        {error && <p role="alert" lang={lang} className="flex items-start gap-2 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-3 text-sm font-semibold text-amber-800"><TriangleAlert size={16} className="mt-0.5 shrink-0" /> {t(error)}</p>}
        <button type="button" onClick={() => void save()} disabled={busy} className="btn-primary w-full !py-3.5 disabled:opacity-70">
          {busy && <LoaderCircle size={18} className="animate-spin" />} <span lang={lang}>{t({ ta: 'சேமித்துத் தொடர', en: 'Save and continue' })}</span>
        </button>
      </div>
    </section>
  );
}

/** The provider can update the saved base location (for example after moving the shop). */
function BaseLocation() {
  const { t, lang } = useLang();
  const { user, updateProfile } = useAuth();
  const pos = user?.lat != null && user?.lng != null ? { lat: user.lat, lng: user.lng } : null;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<L | null>(null);
  const save = () => {
    setMsg(null);
    if (!('geolocation' in navigator) || !window.isSecureContext) return setMsg({ ta: 'இங்கு இருப்பிடம் பெற முடியாது (https தேவை).', en: 'Location is not available here (needs https).' });
    setBusy(true);
    navigator.geolocation.getCurrentPosition(async (p) => {
      const { latitude: lat, longitude: lng } = p.coords;
      const r = await updateProfile({ address: user?.address ?? '', lat, lng, mapLink: mapsUrl(lat, lng) });
      setBusy(false);
      setMsg(r.ok ? { ta: 'உங்கள் இருப்பிடம் சேமிக்கப்பட்டது.', en: 'Your base location is saved.' } : { ta: 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', en: 'Could not save. Please try again.' });
    }, (e) => {
      setBusy(false);
      setMsg(e.code === 1 ? { ta: 'இருப்பிட அனுமதி மறுக்கப்பட்டது. உலாவி அமைப்பில் இயக்கவும்.', en: 'Location permission is blocked. Allow it in the browser settings.' } : { ta: 'இருப்பிடம் கிடைக்கவில்லை. GPS இயக்கவும்.', en: 'Could not get your location. Switch on GPS.' });
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  };
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <MapPin size={18} className="shrink-0 text-primary" />
      <div className="min-w-0 flex-1 text-sm">
        <p lang={lang} className="font-bold">{t({ ta: 'என் இருப்பிடம் (அடிப்படை)', en: 'My base location' })}</p>
        <p lang={lang} className="text-xs text-ink/55">{pos ? `${user?.address ? user.address + ' · ' : ''}${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)}` : ''}</p>
        {msg && <p lang={lang} role="status" className="mt-1 text-xs font-semibold text-amber-800">{t(msg)}</p>}
      </div>
      <button type="button" onClick={save} disabled={busy} className="btn-primary !py-2.5">
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <LocateFixed size={16} />} <span lang={lang}>{t({ ta: 'புதுப்பி', en: 'Update' })}</span>
      </button>
    </div>
  );
}

export default function ProviderPage() {
  const { t, lang } = useLang();
  const { user, token, expire } = useAuth();
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]['k']>('todo');

  const isProvider = roleOf(user) === 'Provider';
  const needsLocation = user?.lat == null || user?.lng == null;
  const load = useCallback(async () => {
    if (!token || !isProvider || needsLocation) return; // other roles are redirected below; never ask the server (a refusal would log them out)
    setLoading(true);
    setFailed(false);
    const r = await callApi<{ orders: Job[] }>({ action: 'providerOrders', token });
    setLoading(false);
    if (r.ok) setJobs(r.orders);
    else if (r.error === 'FORBIDDEN' || r.error === 'INVALID_SESSION') expire();
    else setFailed(true);
  }, [token, isProvider, needsLocation, expire]);

  useEffect(() => { void load(); }, [load]);

  if (!isProvider) return user ? <Navigate to={homeFor(user)} replace /> : <Navigate to="/account" state={{ next: '/provider' }} replace />;

  if (needsLocation) return <LocationGate />;

  const cur = TABS.find((x) => x.k === tab)!;
  const shown = (jobs ?? []).filter((j) => (cur.statuses as readonly string[]).includes(j.status))
    .sort((a, b) => (cur.k === 'all' || cur.k === 'done' ? b.date.localeCompare(a.date) : 0));
  const count = (k: (typeof TABS)[number]) => (jobs ?? []).filter((j) => (k.statuses as readonly string[]).includes(j.status)).length;

  return (
    <>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-50 text-lg font-extrabold text-primary">{(user?.business || user?.name || '?').charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <p lang={lang} className="text-xs font-medium text-ink/50">{t({ ta: 'வணக்கம்', en: 'Welcome' })}</p>
              <h1 className="truncate text-lg font-extrabold text-ink sm:text-xl">{user?.business || user?.name}</h1>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {user?.tier === 'Premium' && <PremiumBadge />}
                {user?.services?.map((s) => <span key={s} lang={lang} className="chip !py-0.5 bg-slate-100 text-ink/70">{SERVICE_LABEL[s] ? t(SERVICE_LABEL[s]) : s}</span>)}
              </div>
            </div>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh" className="grid h-10 w-10 place-items-center rounded-lg bg-white text-ink/70 ring-1 ring-slate-300 transition hover:bg-slate-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-8">
        <BaseLocation />
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-3" role="tablist">
          {TABS.map((x) => {
            const on = tab === x.k;
            return (
              <button key={x.k} type="button" role="tab" aria-selected={on} onClick={() => setTab(x.k)}
                className={`rounded-2xl p-3 text-left transition sm:p-4 ${on ? 'bg-primary text-white shadow-glow' : 'card'}`}>
                <span className={`block text-2xl font-extrabold sm:text-3xl ${on ? 'text-white' : 'text-ink'}`}>{count(x)}</span>
                <span lang={lang} className={`block truncate text-xs font-bold ${on ? 'text-white/90' : 'text-ink/55'}`}>{t(x.v)}</span>
              </button>
            );
          })}
        </div>
        {failed && <p role="alert" lang={lang} className="mb-4 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{t({ ta: 'பணிகளை ஏற்ற முடியவில்லை. “புதுப்பிக்க” அழுத்தவும்.', en: 'Could not load your jobs. Tap Refresh.' })}</p>}
        {jobs === null && !failed ? (
          <div className="space-y-3" aria-busy="true">{[0, 1].map((i) => <div key={i} className="card h-24 animate-pulse bg-ink/5" />)}</div>
        ) : shown.length === 0 ? (
          <p lang={lang} className="card p-8 text-center text-ink/55">{t({ ta: 'இங்கே பணிகள் இல்லை.', en: 'No jobs here.' })}</p>
        ) : (
          <div className="space-y-3">{shown.map((j) => <JobCard key={j.ref + j.status} j={j} token={token!} onChanged={() => void load()} />)}</div>
        )}
      </section>
    </>
  );
}
