import { CalendarDays, Camera, Check, ChevronDown, ClipboardList, LoaderCircle, MapPin, RefreshCw, Star, Truck, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { inr, useLang, type L } from '../i18n/lang';
import { PageHero } from '../components/ui';
import { callApi } from '../state/api';
import { useAuth } from '../state/auth';
import { shrink } from './AdminProducts';
import { PhotoStrip } from '../components/photos';
import { MapChip, OrderProgress, PremiumBadge, StatusBadge, CANCELLABLE_STATUSES, fmtDate } from '../components/status';
import { CloseOrder } from '../components/CloseOrder';

type Order = {
  ref: string; received: string; status: string; event: string; date: string; town: string; address: string;
  guests: string; notes: string; pandal: string; size: string; items: string; boardText: string; total: number;
  provider: string; premium: boolean; hasRentals?: boolean; rating?: number; review?: string; reviewPhotos?: string[]; photos?: string[];
  mapLink?: string; closeReason?: string;
};

/** Star rating + comment for a completed booking. */
function ReviewBox({ o, token, onSaved }: { o: Order; token: string; onSaved: () => void }) {
  const { t, lang } = useLang();
  const [rating, setRating] = useState(o.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState(o.review ?? '');
  const [editing, setEditing] = useState(!o.rating);
  const [kept, setKept] = useState<string[]>(o.reviewPhotos ?? []);   // photos already saved
  const [added, setAdded] = useState<string[]>([]);                    // new photos, not yet sent
  const [photoErr, setPhotoErr] = useState(false);
  const MAX = 3;
  const savedKey = (o.reviewPhotos ?? []).join('|');
  useEffect(() => { setKept(o.reviewPhotos ?? []); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [savedKey]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const labels: L[] = [
    { ta: 'மோசம்', en: 'Poor' }, { ta: 'சுமார்', en: 'Fair' }, { ta: 'நன்று', en: 'Good' }, { ta: 'மிக நன்று', en: 'Very good' }, { ta: 'அருமை!', en: 'Excellent!' },
  ];
  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    setError(false);
    const r = await callApi({ action: 'review', token, ref: o.ref, rating, review: text.trim(), photos: added, keepPhotos: kept });
    setBusy(false);
    if (!r.ok) return setError(true);
    setAdded([]);
    setEditing(false);
    onSaved();
  };
  const addPhotos = async (files: FileList | null) => {
    setPhotoErr(false);
    const room = MAX - kept.length - added.length;
    const picked = Array.from(files ?? []).slice(0, Math.max(0, room));
    try {
      const out = await Promise.all(picked.map((f) => shrink(f)));
      setAdded((a) => [...a, ...out]);
    } catch { setPhotoErr(true); }
  };
  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
        <div>
          <p lang={lang} className="text-sm font-bold">{t({ ta: 'உங்கள் மதிப்பீடு', en: 'Your rating' })}: <span className="text-amber-500">{'★★★★★'.slice(0, rating)}</span><span className="text-ink/20">{'★★★★★'.slice(rating)}</span></p>
          {text && <p className="mt-0.5 text-sm italic text-ink/70">“{text}”</p>}
          {kept.length > 0 && <div className="mt-2 flex gap-2">{kept.map((u) => <img key={u} src={u} alt="" referrerPolicy="no-referrer" className="h-14 w-14 rounded-lg object-cover ring-1 ring-amber-200" />)}</div>}
        </div>
        <button type="button" onClick={() => setEditing(true)} lang={lang} className="shrink-0 text-xs font-bold text-primary hover:underline">{t({ ta: 'மாற்று', en: 'Edit' })}</button>
      </div>
    );
  }
  const shown = hover || rating;
  return (
    <div className="space-y-2.5 rounded-xl bg-white p-4 ring-1 ring-primary/20">
      <p lang={lang} className="text-sm font-bold">{t({ ta: 'சேவை எப்படி இருந்தது? மதிப்பிடுங்கள்', en: 'How was the service? Please rate it' })}</p>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="p-0.5 transition hover:scale-110">
            <Star size={30} className={n <= shown ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
          </button>
        ))}
        {shown > 0 && <span lang={lang} className="ml-2 text-sm font-semibold text-amber-600">{t(labels[shown - 1])}</span>}
      </div>
      <textarea rows={2} className="w-full text-sm" maxLength={1000} value={text} onChange={(e) => setText(e.target.value)}
        placeholder={t({ ta: 'உங்கள் கருத்து (விருப்பம்)', en: 'Tell us about your experience (optional)' })} />
      <div>
        <p lang={lang} className="mb-1.5 text-xs font-semibold text-ink/60">{t({ ta: 'படங்களைச் சேர்க்கவும் (அதிகபட்சம் 3) — சேவைப் பக்கத்தில் காட்டப்படும்', en: 'Add photos (up to 3) — shown under the service on our website' })}</p>
        <div className="flex flex-wrap gap-2">
          {kept.map((u) => (
            <span key={u} className="relative h-20 w-20">
              <img src={u} alt="" referrerPolicy="no-referrer" className="h-full w-full rounded-xl object-cover ring-1 ring-slate-200" />
              <button type="button" onClick={() => setKept((k) => k.filter((x) => x !== u))} aria-label="Remove photo" className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white shadow"><X size={13} /></button>
            </span>
          ))}
          {added.map((u, i) => (
            <span key={i} className="relative h-20 w-20">
              <img src={u} alt="" className="h-full w-full rounded-xl object-cover ring-1 ring-slate-200" />
              <button type="button" onClick={() => setAdded((a) => a.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white shadow"><X size={13} /></button>
            </span>
          ))}
          {kept.length + added.length < MAX && (
            <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary transition hover:bg-primary/10">
              <span className="flex flex-col items-center gap-0.5 text-[11px] font-bold"><Camera size={22} /><span lang={lang}>{t({ ta: 'படம்', en: 'Photo' })}</span></span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void addPhotos(e.target.files); e.target.value = ''; }} />
            </label>
          )}
        </div>
        {photoErr && <p lang={lang} className="mt-1 text-xs font-semibold text-amber-700">{t({ ta: 'படத்தைச் சேர்க்க முடியவில்லை.', en: 'Could not add that photo.' })}</p>}
      </div>
      {error && <p lang={lang} className="text-xs font-semibold text-amber-700">{t({ ta: 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', en: 'Could not save. Please try again.' })}</p>}
      <button type="button" onClick={() => void submit()} disabled={!rating || busy} className="btn-primary !py-2.5">
        {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />} <span lang={lang}>{t({ ta: 'மதிப்பீட்டைச் சமர்ப்பி', en: 'Submit rating' })}</span>
      </button>
    </div>
  );
}

function OrderCard({ o, token, onChanged }: { o: Order; token: string; onChanged: () => void }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const rows: [L, string][] = [
    [{ ta: 'சேவை வழங்குநர்', en: 'Service provider' }, o.provider],
    [{ ta: 'பந்தல்', en: 'Pandal' }, o.pandal ? `${o.pandal}${o.size ? ` (${o.size})` : ''}` : ''],
    [{ ta: 'கூடுதல் பொருட்கள்', en: 'Extra items' }, o.items],
    [{ ta: 'பலகை எழுத்து', en: 'Board text' }, o.boardText],
    [{ ta: 'விழா இடம்', en: 'Venue' }, o.address],
    [{ ta: 'விருந்தினர்கள்', en: 'Guests' }, o.guests],
    [{ ta: 'குறிப்புகள்', en: 'Notes' }, o.notes],
  ];
  return (
    <article className="card overflow-hidden">
      <button type="button" onClick={() => setOpen((x) => !x)} aria-expanded={open} className="flex w-full items-start gap-3 p-5 text-left sm:p-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-extrabold text-ink">{o.event || '—'}</span>
            <StatusBadge status={o.status} />
            {o.premium && <PremiumBadge />}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/65">
            <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {fmtDate(o.date, lang)}</span>
            {o.town && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {o.town}</span>}
          </p>
          <p className="mt-2 text-xs text-ink/45">{o.ref} · {o.received}</p>
        </div>
        <div className="shrink-0 text-right">
          <p lang={lang} className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">{t({ ta: 'மதிப்பீடு', en: 'Estimate' })}</p>
          <p className="text-lg font-extrabold text-primary">{inr(o.total)}</p>
          <ChevronDown size={18} className={`ml-auto mt-1 text-ink/40 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div className="space-y-3 px-5 pb-5 sm:px-6">
        <OrderProgress status={o.status} hasRentals={o.hasRentals} reason={o.closeReason} />
        {o.provider && o.status !== 'New' && o.status !== 'Cancelled' && o.status !== 'Rejected' && (
          <p lang={lang} className="flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-2 text-sm">
            <Truck size={16} className="shrink-0 text-primary" />
            <span>{t({ ta: 'உங்கள் சேவை வழங்குநர்', en: 'Your service provider' })}: <b>{o.provider}</b></span>
            {o.premium && <PremiumBadge className="ml-auto" />}
          </p>
        )}
        {o.status === 'ServiceDone' && (
          <p lang={lang} className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-orange-800">{t({ ta: 'சேவை முடிந்தது. வாடகைப் பொருட்களை எங்கள் குழு விரைவில் எடுத்துச் செல்லும்.', en: 'The service is done. Our team will collect the rental items soon.' })}</p>
        )}
        {o.status === 'Done' && <ReviewBox o={o} token={token} onSaved={onChanged} />}
        {CANCELLABLE_STATUSES.includes(o.status) && (
          <CloseOrder mode="cancel" token={token} orderRef={o.ref} hasProvider={!!o.provider} onDone={onChanged} />
        )}
      </div>
      {open && (
        <dl className="space-y-2.5 border-t border-ink/10 bg-turmeric-wash/50 px-5 py-4 text-sm sm:px-6">
          {rows.filter(([, v]) => v).map(([k, v]) => (
            <div key={k.en} className="grid grid-cols-1 gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-3">
              <dt lang={lang} className="font-semibold text-ink/60">{t(k)}</dt>
              <dd className="whitespace-pre-wrap break-words text-ink">{v}</dd>
            </div>
          ))}
          <p lang={lang} className="pt-1 text-xs text-ink/50">{t({ ta: 'விலைகள் மதிப்பீடு மட்டுமே. இறுதி விலையை நிறுவனம் உறுதி செய்யும்.', en: 'Prices are estimates. The final price will be confirmed by the business.' })}</p>
          {o.mapLink && <div className="pt-1"><MapChip link={o.mapLink} /></div>}
          {o.photos && o.photos.length > 0 && <div className="pt-1"><PhotoStrip urls={o.photos} title={{ ta: 'நீங்கள் சேர்த்த படங்கள்', en: 'Photos you added' }} /></div>}
        </dl>
      )}
    </article>
  );
}

export default function MyOrdersPage() {
  const { t, lang } = useLang();
  const { enabled, user, token, expire } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setFailed(false);
    const r = await callApi<{ orders: Order[] }>({ action: 'orders', token });
    setLoading(false);
    if (r.ok) setOrders(r.orders);
    else if (r.error === 'INVALID_SESSION') expire();
    else setFailed(true);
  }, [token, expire]);

  useEffect(() => { void load(); }, [load]);

  if (!enabled || !user) return <Navigate to="/account" state={{ next: '/orders' }} replace />;

  return (
    <>
      <PageHero k="wedding-ritual" title={{ ta: 'என் முன்பதிவுகள்', en: 'My Orders' }}
        sub={{ ta: `வணக்கம், ${user.name}! உங்கள் முன்பதிவுகளின் நிலை இங்கே.`, en: `Hello, ${user.name}! Here is the status of your bookings.` }} />
      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p lang={lang} className="text-sm text-ink/60">
            {orders ? t({ ta: `${orders.length} முன்பதிவுகள்`, en: `${orders.length} booking${orders.length === 1 ? '' : 's'}` }) : ''}
          </p>
          <button type="button" onClick={() => void load()} disabled={loading} className="btn-ghost !py-2">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> <span lang={lang}>{t({ ta: 'புதுப்பிக்க', en: 'Refresh' })}</span>
          </button>
        </div>

        {failed && (
          <p role="alert" lang={lang} className="mb-4 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
            {t({ ta: 'முன்பதிவுகளை ஏற்ற முடியவில்லை. இணையத்தைச் சரிபார்த்து “புதுப்பிக்க” அழுத்தவும்.', en: 'Could not load your bookings. Check your internet and tap Refresh.' })}
          </p>
        )}

        {orders === null && !failed ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="card h-28 animate-pulse bg-ink/5" />)}
          </div>
        ) : orders && orders.length === 0 ? (
          <div className="card p-8 text-center">
            <ClipboardList size={40} className="mx-auto text-ink/30" />
            <p lang={lang} className="mt-3 text-lg font-bold text-ink">{t({ ta: 'இன்னும் முன்பதிவுகள் இல்லை', en: 'No bookings yet' })}</p>
            <p lang={lang} className="mx-auto mt-1 max-w-sm text-sm text-ink/60">{t({ ta: 'உள்நுழைந்த பின் செய்யும் முன்பதிவுகள் இங்கே தெரியும்.', en: 'Bookings you make while logged in will show up here.' })}</p>
            <Link to="/booking" className="btn-primary mt-5 !py-3"><span lang={lang}>{t({ ta: 'முன்பதிவு செய்யுங்கள்', en: 'Book Now' })}</span></Link>
          </div>
        ) : (
          <div className="space-y-3">{orders?.map((o) => <OrderCard key={o.ref} o={o} token={token!} onChanged={() => void load()} />)}</div>
        )}
      </section>
    </>
  );
}
