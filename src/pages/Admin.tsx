import { ArrowUpRight, BadgeCheck, BadgePercent, TrendingUp, Building2, CalendarClock, CalendarDays, ChevronDown, CircleCheck, ClipboardList, Inbox, LayoutDashboard, LoaderCircle, MapPin, Package, PackagePlus, Phone, Plus, RefreshCw, Search, Sparkles, TriangleAlert, UserCheck, UserPlus, Users, Wallet } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { inr, useLang, type L } from '../i18n/lang';
import { MuhurthamCalendar, iso } from '../components/calendar';
import AdminReports, { CostsBox, ProviderRanking } from './AdminReports';
import AdminProducts from './AdminProducts';
import AdminCompany from './AdminCompany';
import AdminPromos from './AdminPromos';
import AdminMap from './AdminMap';
import { MUHURTHAM, muhurthamOn } from '../data/config';
import { WhatsAppIcon } from '../components/Layout';
import { distanceKm } from '../state/location';
import { PhotoStrip } from '../components/photos';
import { CloseOrder } from '../components/CloseOrder';
import { MapChip, OrderProgress, PremiumBadge, SERVICE_KEYS, SERVICE_LABEL, STATUS, STATUS_ORDER, CLOSED_STATUSES, CANCELLABLE_STATUSES, StatusBadge, fmtDate, needsOf, waLink } from '../components/status';
import { callApi } from '../state/api';
import { homeFor, roleOf, useAuth } from '../state/auth';

export type AOrder = {
  ref: string; received: string; status: string; event: string; date: string; town: string; address: string; guests: string;
  notes: string; pandal: string; size: string; items: string; boardText: string; total: number; provider: string; premium: boolean;
  name: string; phone: string; account: string; providerMobile: string; assignedAt: string; providerNote: string;
  mapLink?: string; lat?: number | null; lng?: number | null; photos?: string[];
  rating?: number; review?: string; payout?: number | null; costs?: number; hasRentals?: boolean; completedAt?: string; closeReason?: string; closedBy?: string; closedAt?: string;
};
export type Prov = { mobile: string; name: string; business: string; services: string[]; towns: string; active: boolean; tier: string; lat?: number | null; lng?: number | null; openJobs: number; totalJobs: number; doneJobs?: number; ratingAvg?: number; ratingCount?: number; revenue?: number };

const ERR: Record<string, L> = {
  NETWORK: { ta: 'இணைய இணைப்பு இல்லை.', en: 'No internet connection.' },
  EXISTS: { ta: 'இந்த எண்ணுக்கு ஏற்கனவே வேறு கணக்கு உள்ளது.', en: 'This mobile number already belongs to another account.' },
  BAD_INPUT: { ta: 'விவரங்களைச் சரிபார்க்கவும் (புதிய வழங்குநருக்கு கடவுச்சொல் தேவை, குறைந்தது 6 எழுத்துகள்).', en: 'Check the details (a new provider needs a password of at least 6 characters).' },
  BAD_PROVIDER: { ta: 'இந்த வழங்குநர் தற்போது செயலில் இல்லை.', en: 'This provider is not active.' },
  PROVIDER_NO_LOCATION: { ta: 'இந்த வழங்குநர் இன்னும் தன் இருப்பிடத்தைப் பதிவு செய்யவில்லை. இருப்பிடம் இல்லாமல் ஒதுக்க முடியாது.', en: 'This provider has not shared a location yet. Jobs cannot be assigned without it.' },
};
const errText = (c: string): L => ERR[c] ?? { ta: `தவறு (${c})`, en: `Something went wrong (${c})` };

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${on ? 'border-primary bg-primary text-gold-1' : 'border-ink/15 bg-white text-ink/65 hover:border-gold-2'}`}>
      {children}
    </button>
  );
}

function Contact({ phone, name }: { phone: string; name: string }) {
  const { lang } = useLang();
  return (
    <span className="flex flex-wrap items-center gap-2 text-sm">
      <b>{name}</b>
      <a href={`tel:+91${phone}`} className="chip bg-primary text-gold-1"><Phone size={12} /> {phone}</a>
      <a href={waLink(phone, '')} target="_blank" rel="noreferrer" aria-label={lang === 'ta' ? 'WhatsApp' : 'WhatsApp'} className="chip bg-[#25D366] text-white"><WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp</a>
    </span>
  );
}

function AdminOrderCard({ o, providers, token, onChanged }: { o: AOrder; providers: Prov[]; token: string; onChanged: () => void }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState(o.providerMobile);
  const [status, setStatus] = useState(o.status);
  const [busy, setBusy] = useState<'assign' | 'status' | null>(null);
  const [error, setError] = useState<L | null>(null);
  const [justAssigned, setJustAssigned] = useState<Prov | null>(null);

  useEffect(() => { setPick(o.providerMobile); setStatus(o.status); }, [o.providerMobile, o.status]);

  const needs = needsOf(o);
  const options = useMemo(() => {
    const score = (p: Prov) => needs.filter((n) => p.services.includes(n)).length * 2 + (p.tier === 'Premium' ? 1 : 0);
    const km = (p: Prov) => dist(p);
    return providers.filter((p) => p.active || p.mobile === o.providerMobile)
      .sort((a, b) => (score(b) - score(a)) || ((km(a) ?? 1e9) - (km(b) ?? 1e9)));
  }, [providers, needs, o.providerMobile, o.lat, o.lng]);
  /** Straight-line km from the venue to a provider's base location (null when either is unknown). */
  function dist(p: Prov): number | null {
    return o.lat != null && o.lng != null && p.lat != null && p.lng != null ? distanceKm({ lat: o.lat, lng: o.lng }, { lat: p.lat, lng: p.lng }) : null;
  }
  const nearest = providers.filter((p) => p.active).map((p) => ({ p, km: dist(p) })).filter((x): x is { p: Prov; km: number } => x.km !== null).sort((a, b) => a.km - b.km).slice(0, 3);

  const run = async (kind: 'assign' | 'status') => {
    setBusy(kind);
    setError(null);
    const r = kind === 'assign'
      ? await callApi({ action: 'adminAssign', token, ref: o.ref, provider: pick })
      : await callApi({ action: 'adminStatus', token, ref: o.ref, status });
    setBusy(null);
    if (!r.ok) return setError(errText(r.error));
    if (kind === 'assign' && pick) setJustAssigned(providers.find((p) => p.mobile === pick) ?? null);
    else setJustAssigned(null);
    onChanged();
  };

  const jobText = [
    `Event Tamizha — new job ${o.ref}`,
    `${o.event} on ${o.date}, ${o.town}`,
    `Customer: ${o.name} ${o.phone}`,
    o.address && `Venue: ${o.address}`,
    o.mapLink && `Map: ${o.mapLink}`,
    o.pandal && `Pandal: ${o.pandal}${o.size ? ` (${o.size})` : ''}`,
    o.items && `Items: ${o.items}`,
    o.boardText && `Board: ${o.boardText}`,
    'Please log in on the website (Service Provider login) to accept or decline.',
  ].filter(Boolean).join('\n');

  const rows: [L, string][] = [
    [{ ta: 'பந்தல்', en: 'Pandal' }, o.pandal ? `${o.pandal}${o.size ? ` (${o.size})` : ''}` : ''],
    [{ ta: 'கூடுதல் பொருட்கள்', en: 'Extra items' }, o.items],
    [{ ta: 'பலகை எழுத்து', en: 'Board text' }, o.boardText],
    [{ ta: 'விழா இடம்', en: 'Venue' }, o.address],
    [{ ta: 'விருந்தினர்கள்', en: 'Guests' }, o.guests],
    [{ ta: 'குறிப்புகள்', en: 'Notes' }, o.notes],
    [{ ta: 'வழங்குநர் குறிப்பு', en: 'Provider note' }, o.providerNote],
    [{ ta: 'மூடப்பட்ட காரணம்', en: 'Closed reason' }, o.closeReason ? `${o.closeReason}${o.closedBy ? ` — ${o.closedBy}` : ''}${o.closedAt ? ` · ${o.closedAt}` : ''}` : (o.closedBy ? `${o.closedBy}${o.closedAt ? ` · ${o.closedAt}` : ''}` : '')],
    [{ ta: 'கணக்கு', en: 'Account' }, o.account ? `+91 ${o.account}` : t({ ta: 'விருந்தினர்', en: 'Guest' })],
  ];

  return (
    <article className="card">
      <button type="button" onClick={() => setOpen((x) => !x)} aria-expanded={open} className="flex w-full items-start gap-3 p-4 text-left sm:p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold text-ink sm:text-lg">{o.event || '—'}</span>
            <StatusBadge status={o.status} />
            {o.premium && <PremiumBadge />}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/65">
            <span className="inline-flex items-center gap-1"><CalendarDays size={14} /> {fmtDate(o.date, lang)}</span>
            {o.town && <span className="inline-flex items-center gap-1"><MapPin size={14} /> {o.town}</span>}
            <span className="font-semibold text-ink/80">{o.name}</span>
          </p>
          <p className="mt-1.5 text-xs text-ink/45">
            {o.ref} · {o.received}
            {o.provider && <> · <span className="font-semibold text-gold-2">{o.provider}</span></>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-extrabold text-primary">{inr(o.total)}</p>
          <ChevronDown size={18} className={`ml-auto mt-1 text-ink/40 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-ink/10 bg-turmeric-wash/50 px-4 py-4 sm:px-5">
          <Contact phone={o.phone} name={o.name} />
          {o.mapLink && <div><MapChip link={o.mapLink} /></div>}
          <dl className="space-y-2 text-sm">
            {rows.filter(([, v]) => v).map(([k, v]) => (
              <div key={k.en} className="grid grid-cols-1 gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-3">
                <dt lang={lang} className="font-semibold text-ink/55">{t(k)}</dt>
                <dd className="whitespace-pre-wrap break-words">{v}</dd>
              </div>
            ))}
          </dl>
          <PhotoStrip urls={o.photos} />

          {o.mapLink && (
            <div className="rounded-2xl bg-white p-4 ring-1 ring-peacock/30">
              <p lang={lang} className="mb-2 text-sm font-bold">{t({ ta: 'விழா இடத்திற்கு அருகில் உள்ள வழங்குநர்கள்', en: 'Providers nearest to the venue' })}</p>
              {o.lat == null ? (
                <p lang={lang} className="text-xs text-ink/55">{t({ ta: 'இந்த இருப்பிட இணைப்பில் ஆயத்தொலைவு இல்லை (குறுகிய இணைப்பு). தூரத்தைக் கணக்கிட முடியாது.', en: 'This map link has no coordinates (short link), so distances cannot be calculated. Open it in Maps to check.' })}</p>
              ) : nearest.length === 0 ? (
                <p lang={lang} className="text-xs text-ink/55">{t({ ta: 'எந்த வழங்குநரும் தன் இருப்பிடத்தைப் பதிவு செய்யவில்லை. வழங்குநர்கள் தங்கள் பலகையில் “என் இருப்பிடம்” அமைக்க வேண்டும்.', en: 'No provider has saved a base location yet. Providers set it in their dashboard (“My base location”).' })}</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {nearest.map(({ p, km }) => (
                    <li key={p.mobile} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-semibold">{p.tier === 'Premium' ? '★ ' : ''}{p.business || p.name}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <b className="text-primary">{km.toFixed(1)} km</b>
                        <button type="button" onClick={() => setPick(p.mobile)} className="chip bg-primary text-gold-1"><span lang={lang}>{t({ ta: 'தேர்வு', en: 'Select' })}</span></button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
            <p lang={lang} className="mb-2 text-sm font-bold">{t({ ta: 'சேவை வழங்குநரை ஒதுக்கு', en: 'Assign service provider' })}
              {needs.length > 0 && <span className="ml-2 text-xs font-normal text-ink/50">({t({ ta: 'தேவை', en: 'needs' })}: {needs.map((n) => t(SERVICE_LABEL[n])).join(', ')})</span>}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select className="min-w-0 flex-1" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Provider">
                <option value="">{t({ ta: '— ஒதுக்கப்படவில்லை —', en: '— Not assigned —' })}</option>
                {options.map((p) => (
                  <option key={p.mobile} value={p.mobile} disabled={(p.lat == null || p.lng == null) && p.mobile !== o.providerMobile}>
                    {p.tier === 'Premium' ? '★ ' : ''}{p.business || p.name} · {p.services.map((s) => (SERVICE_LABEL[s] ? t(SERVICE_LABEL[s]) : s)).join('/')}{dist(p) !== null ? ` · ${dist(p)!.toFixed(1)} km` : ''}{p.active ? '' : ' (off)'}{p.lat == null || p.lng == null ? ' · no location' : ''}
                  </option>
                ))}
              </select>
              <button type="button" disabled={busy !== null || pick === o.providerMobile} onClick={() => void run('assign')} className="btn-primary !py-2.5">
                {busy === 'assign' && <LoaderCircle size={16} className="animate-spin" />}
                <span lang={lang}>{pick ? t({ ta: 'ஒதுக்கு', en: 'Assign' }) : t({ ta: 'திரும்பப் பெறு', en: 'Unassign' })}</span>
              </button>
            </div>
            {justAssigned && (
              <a href={waLink(justAssigned.mobile, jobText)} target="_blank" rel="noreferrer" className="btn-whatsapp mt-3 !py-2.5">
                <WhatsAppIcon className="h-4 w-4" /> <span lang={lang}>{t({ ta: 'பணியை WhatsApp-ல் அனுப்பு', en: 'Send the job on WhatsApp' })}</span>
              </a>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span lang={lang} className="text-sm font-bold">{t({ ta: 'நிலை', en: 'Status' })}</span>
            <select className="flex-1 sm:max-w-xs" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
              {STATUS_ORDER.filter((s) => s !== 'Rejected' || o.status === 'Rejected').map((s) => <option key={s} value={s}>{STATUS[s].v.en}</option>)}
            </select>
            <button type="button" disabled={busy !== null || status === o.status} onClick={() => void run('status')} className="btn-ghost !py-2.5">
              {busy === 'status' && <LoaderCircle size={16} className="animate-spin" />}
              <span lang={lang}>{t({ ta: 'சேமி', en: 'Save' })}</span>
            </button>
          </div>
          {error && <p role="alert" lang={lang} className="flex items-center gap-2 text-sm font-semibold text-amber-800"><TriangleAlert size={15} /> {t(error)}</p>}

          <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10"><OrderProgress status={o.status} hasRentals={o.hasRentals} reason={o.closeReason} /></div>

          {CANCELLABLE_STATUSES.includes(o.status) && (
            <CloseOrder mode="reject" token={token} orderRef={o.ref} hasProvider={!!o.providerMobile} onDone={onChanged} />
          )}

          {(o.rating ?? 0) > 0 && (
            <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
              <p lang={lang} className="text-sm font-bold">{t({ ta: 'வாடிக்கையாளர் மதிப்பீடு', en: 'Customer rating' })}: <span className="text-amber-500">{'★★★★★'.slice(0, o.rating)}</span><span className="text-ink/20">{'★★★★★'.slice(o.rating)}</span></p>
              {o.review && <p className="mt-1 text-sm italic text-ink/70">“{o.review}”</p>}
            </div>
          )}

          <CostsBox o={o} token={token} onChanged={onChanged} />
        </div>
      )}
    </article>
  );
}

function Lbl({ l, children }: { l: L; children: React.ReactNode }) {
  const { t, lang } = useLang();
  return <label className="block"><span lang={lang} className="mb-1 block text-sm font-semibold text-ink/70">{t(l)}</span>{children}</label>;
}

type FormState = { mobile: string; name: string; business: string; services: string[]; towns: string; tier: string; active: boolean; password: string };
const BLANK: FormState = { mobile: '', name: '', business: '', services: [], towns: '', tier: 'Standard', active: true, password: '' };

function ProviderForm({ initial, token, onDone }: { initial: Prov | null; token: string; onDone: (saved: boolean) => void }) {
  const { t, lang } = useLang();
  const [f, setF] = useState<FormState>(initial ? { ...BLANK, ...initial, password: '' } : BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const m = f.mobile.replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(m) || !f.name.trim()) return setError({ ta: 'பெயரும் சரியான 10 இலக்க கைபேசி எண்ணும் தேவை.', en: 'A name and a valid 10-digit mobile number are required.' });
    if (!initial && f.password.length < 6) return setError(ERR.BAD_INPUT);
    setBusy(true);
    setError(null);
    const r = await callApi({ action: 'adminSaveProvider', token, ...f, mobile: m });
    setBusy(false);
    if (r.ok) onDone(true);
    else setError(errText(r.error));
  };

  return (
    <form onSubmit={submit} noValidate className="card gold-frame relative space-y-5 p-5 shadow-deep sm:p-7">
      <h3 lang={lang} className="flex items-center gap-3 text-lg font-extrabold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary-light to-primary-dark text-gold-1 shadow-glow"><UserPlus size={18} /></span>{initial ? t({ ta: 'வழங்குநரைத் திருத்து', en: 'Edit provider' }) : t({ ta: 'புதிய சேவை வழங்குநர்', en: 'New service provider' })}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Lbl l={{ ta: 'பெயர்', en: 'Name' }}><input className="w-full" value={f.name} onChange={(e) => set('name', e.target.value)} /></Lbl>
        <Lbl l={{ ta: 'கைபேசி எண் (உள்நுழைவு)', en: 'Mobile (login ID)' }}><input className="w-full disabled:bg-ink/5" type="tel" inputMode="numeric" disabled={!!initial} value={f.mobile} onChange={(e) => set('mobile', e.target.value)} /></Lbl>
        <Lbl l={{ ta: 'நிறுவனப் பெயர்', en: 'Business name' }}><input className="w-full" value={f.business} onChange={(e) => set('business', e.target.value)} /></Lbl>
        <Lbl l={{ ta: 'சேவைப் பகுதிகள் (ஊர்கள்)', en: 'Towns served' }}><input className="w-full" value={f.towns} onChange={(e) => set('towns', e.target.value)} placeholder="Erode, Salem" /></Lbl>
      </div>
      <div>
        <p lang={lang} className="mb-1.5 text-sm font-semibold text-ink/70">{t({ ta: 'சேவைகள்', en: 'Services' })}</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_KEYS.map((k) => (
            <Pill key={k} on={f.services.includes(k)} onClick={() => set('services', f.services.includes(k) ? f.services.filter((x) => x !== k) : [...f.services, k])}>
              <span lang={lang}>{t(SERVICE_LABEL[k])}</span>
            </Pill>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Lbl l={{ ta: 'நிலை', en: 'Tier' }}>
          <select className="w-full" value={f.tier} onChange={(e) => set('tier', e.target.value)}>
            <option value="Standard">Standard</option><option value="Premium">★ Premium</option>
          </select>
        </Lbl>
        <Lbl l={initial ? { ta: 'புதிய கடவுச்சொல் (மாற்ற மட்டும்)', en: 'New password (leave blank to keep)' } : { ta: 'தற்காலிக கடவுச்சொல்', en: 'Temporary password' }}>
          <input className="w-full" type="text" autoComplete="off" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="min 6 characters" />
        </Lbl>
      </div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" className="h-5 w-5 !p-0 accent-[#1d4ed8]" checked={f.active} onChange={(e) => set('active', e.target.checked)} />
        <span lang={lang}>{t({ ta: 'செயலில் உள்ளது (உள்நுழையவும் பணிகள் பெறவும் முடியும்)', en: 'Active (can log in and receive jobs)' })}</span>
      </label>
      {error && <p role="alert" lang={lang} className="flex items-center gap-2 text-sm font-semibold text-amber-800"><TriangleAlert size={15} /> {t(error)}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={busy} className="btn-primary !py-3">{busy && <LoaderCircle size={16} className="animate-spin" />}<span lang={lang}>{t({ ta: 'சேமி', en: 'Save provider' })}</span></button>
        <button type="button" onClick={() => onDone(false)} className="btn-ghost !py-3"><span lang={lang}>{t({ ta: 'ரத்து', en: 'Cancel' })}</span></button>
      </div>
    </form>
  );
}

type Tab = 'overview' | 'orders' | 'map' | 'calendar' | 'reports' | 'products' | 'promos' | 'providers' | 'company';

const TABS: { id: Tab; icon: typeof LayoutDashboard; v: L }[] = [
  { id: 'overview', icon: LayoutDashboard, v: { ta: 'மேலோட்டம்', en: 'Overview' } },
  { id: 'orders', icon: ClipboardList, v: { ta: 'முன்பதிவுகள்', en: 'Orders' } },
  { id: 'map', icon: MapPin, v: { ta: 'வரைபடம் & தூரம்', en: 'Map & distance' } },
  { id: 'calendar', icon: CalendarDays, v: { ta: 'முகூர்த்த நாட்காட்டி', en: 'Calendar' } },
  { id: 'reports', icon: TrendingUp, v: { ta: 'லாபம் & தரவரிசை', en: 'Profit & ranking' } },
  { id: 'products', icon: Package, v: { ta: 'பொருட்கள்', en: 'Products' } },
  { id: 'promos', icon: BadgePercent, v: { ta: 'சலுகை & காம்போ', en: 'Offers & Combos' } },
  { id: 'providers', icon: Users, v: { ta: 'சேவை வழங்குநர்கள்', en: 'Providers' } },
  { id: 'company', icon: Building2, v: { ta: 'நிறுவன விவரம்', en: 'Company' } },
];

export default function AdminPage() {
  const { t, lang } = useLang();
  const { user, token, expire } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<AOrder[] | null>(null);
  const [providers, setProviders] = useState<Prov[]>([]);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [day, setDay] = useState('');
  const [editing, setEditing] = useState<Prov | 'new' | null>(null);

  const isAdmin = roleOf(user) === 'Admin';
  const load = useCallback(async () => {
    if (!token || !isAdmin) return; // other roles are redirected below; never ask the server (a refusal would log them out)
    setLoading(true);
    setFailed(false);
    const r = await callApi<{ orders: AOrder[]; providers: Prov[] }>({ action: 'adminOrders', token });
    setLoading(false);
    if (r.ok) { setOrders(r.orders); setProviders(r.providers); }
    else if (r.error === 'FORBIDDEN' || r.error === 'INVALID_SESSION') expire();
    else setFailed(true);
  }, [token, isAdmin, expire]);

  useEffect(() => { void load(); }, [load]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (orders ?? []).forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; });
    return c;
  }, [orders]);

  const perDay = useMemo(() => {
    const c: Record<string, number> = {};
    (orders ?? []).forEach((o) => { if (!['Cancelled', 'Rejected'].includes(o.status)) c[o.date] = (c[o.date] ?? 0) + 1; });
    return c;
  }, [orders]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (orders ?? []).filter((o) =>
      (filter === 'all' || o.status === filter) &&
      (!needle || [o.ref, o.name, o.phone, o.town, o.event, o.provider].some((x) => x.toLowerCase().includes(needle))));
  }, [orders, filter, q]);

  if (!isAdmin) return user ? <Navigate to={homeFor(user)} replace /> : <Navigate to="/account" state={{ next: '/admin' }} replace />;

  const today = iso(new Date());
  const all = orders ?? [];
  const revenue = all.filter((o) => !['Cancelled', 'Rejected'].includes(o.status)).reduce((s, o) => s + (o.total || 0), 0);
  const upcoming = all.filter((o) => o.date >= today && !CLOSED_STATUSES.includes(o.status)).sort((a, b) => a.date.localeCompare(b.date));
  const nextMuhurtham = MUHURTHAM.filter((m) => m.date >= today).slice(0, 6);
  const go = (k: Tab) => { setTab(k); setEditing(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const openProviderForm = () => { setTab('providers'); setEditing('new'); };
  const orderList = (list: AOrder[]) => (
    orders === null && !failed ? (
      <div className="space-y-3" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="card h-24 animate-pulse bg-ink/5" />)}</div>
    ) : list.length === 0 ? (
      <p lang={lang} className="card p-8 text-center text-ink/55">{t({ ta: 'முன்பதிவுகள் இல்லை.', en: 'No orders to show.' })}</p>
    ) : (
      <div className="space-y-3">{list.map((o) => <AdminOrderCard key={o.ref} o={o} providers={providers} token={token!} onChanged={() => void load()} />)}</div>
    )
  );

  const thisMonth = all.filter((o) => o.date.slice(0, 7) === today.slice(0, 7)).length;
  const mix: { k: string; n: number; bar: string }[] = [
    { k: 'New', n: counts.New ?? 0, bar: 'bg-amber-400' },
    { k: 'Assigned', n: counts.Assigned ?? 0, bar: 'bg-sky-400' },
    { k: 'Accepted', n: counts.Accepted ?? 0, bar: 'bg-indigo-400' },
    { k: 'Confirmed', n: counts.Confirmed ?? 0, bar: 'bg-teal-400' },
    { k: 'Done', n: counts.Done ?? 0, bar: 'bg-emerald-400' },
    { k: 'Cancelled', n: counts.Cancelled ?? 0, bar: 'bg-rose-400' },
    { k: 'Rejected', n: counts.Rejected ?? 0, bar: 'bg-rose-600' },
  ];
  const showOrders = (f: string) => () => { setFilter(f); setQ(''); go('orders'); };
  const kpis: { label: L; hint: L; value: number; icon: typeof Inbox; chip: string; onClick: () => void }[] = [
    { label: STATUS.New.v, hint: { ta: 'வழங்குநர் ஒதுக்க வேண்டும்', en: 'Needs a provider' }, value: counts.New ?? 0, icon: Inbox, chip: 'bg-amber-100 text-amber-700', onClick: showOrders('New') },
    { label: STATUS.Assigned.v, hint: { ta: 'பதிலுக்குக் காத்திருக்கிறது', en: 'Waiting for provider' }, value: counts.Assigned ?? 0, icon: UserCheck, chip: 'bg-sky-100 text-sky-700', onClick: showOrders('Assigned') },
    { label: STATUS.Accepted.v, hint: { ta: 'ஏற்கப்பட்டது / உறுதி', en: 'Accepted or confirmed' }, value: (counts.Accepted ?? 0) + (counts.Confirmed ?? 0), icon: BadgeCheck, chip: 'bg-indigo-100 text-indigo-700', onClick: showOrders('Accepted') },
    { label: STATUS.Done.v, hint: { ta: 'முடிந்த விழாக்கள்', en: 'Finished events' }, value: counts.Done ?? 0, icon: CircleCheck, chip: 'bg-emerald-100 text-emerald-700', onClick: showOrders('Done') },
  ];
  const actions: { label: L; hint: L; icon: typeof Inbox; tone: string; onClick: () => void }[] = [
    { label: { ta: 'பொருள் சேர்', en: 'Add product' }, hint: { ta: 'படத்துடன்', en: 'With a photo' }, icon: PackagePlus, tone: 'from-primary-light to-primary-dark', onClick: () => go('products') },
    { label: { ta: 'வழங்குநர் சேர்', en: 'Add provider' }, hint: { ta: 'புதிய கணக்கு', en: 'New login' }, icon: UserPlus, tone: 'from-sky-400 to-sky-700', onClick: openProviderForm },
    { label: { ta: 'புதிய முன்பதிவுகள்', en: 'New orders' }, hint: { ta: `${counts.New ?? 0} காத்திருக்கின்றன`, en: `${counts.New ?? 0} waiting` }, icon: ClipboardList, tone: 'from-amber-400 to-orange-600', onClick: showOrders('New') },
    { label: { ta: 'நாட்காட்டி', en: 'Calendar' }, hint: { ta: 'முகூர்த்தம் & முன்பதிவு', en: 'Muhurtham & bookings' }, icon: CalendarDays, tone: 'from-indigo-400 to-indigo-700', onClick: () => go('calendar') },
  ];

  return (
    <div className="bg-slate-50">
      {/* compact dashboard header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p lang={lang} className="text-xs font-medium text-ink/50">{t({ ta: 'வணக்கம்', en: 'Welcome back' })}, {user?.name}</p>
            <h1 className="text-xl font-extrabold text-ink sm:text-2xl"><span lang={lang}>{t({ ta: 'நிர்வாகப் பலகை', en: 'Admin Dashboard' })}</span></h1>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void load()} disabled={loading} aria-label="Refresh" className="grid h-10 w-10 place-items-center rounded-lg bg-white text-ink/70 ring-1 ring-slate-300 transition hover:bg-slate-50">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button type="button" onClick={openProviderForm} className="btn-primary"><UserPlus size={16} /> <span lang={lang}>{t({ ta: 'வழங்குநர் சேர்', en: 'Add provider' })}</span></button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl gap-6 px-4 pb-10 sm:px-6 lg:grid lg:grid-cols-[13.5rem_1fr] lg:pt-8">
        {/* slim sidebar (desktop) / sticky segmented tabs (phone) */}
        <aside className="sticky top-14 z-20 -mx-4 mb-4 bg-slate-50 px-4 py-2 md:top-[7.2rem] lg:top-44 lg:mx-0 lg:mb-0 lg:self-start lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-xl lg:bg-white lg:p-2 lg:shadow-card lg:ring-1 lg:ring-slate-200" aria-label="Admin">
            {TABS.map((x) => {
              const on = tab === x.id;
              const badge = x.id === 'orders' ? counts.New ?? 0 : x.id === 'providers' ? providers.length : 0;
              return (
                <button key={x.id} type="button" onClick={() => go(x.id)} aria-current={on ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-bold transition lg:py-2.5 ${on ? 'bg-blue-50 text-primary ring-1 ring-blue-100 lg:ring-0' : 'bg-white text-ink/65 ring-1 ring-slate-200 hover:text-primary lg:bg-transparent lg:ring-0 lg:hover:bg-slate-50'}`}>
                  <x.icon size={16} className={`shrink-0 ${on ? 'text-primary' : 'text-ink/40'}`} />
                  <span lang={lang} className="whitespace-nowrap lg:flex-1 lg:text-left">{t(x.v)}</span>
                  {badge > 0 && <span className={`rounded-full px-1.5 text-[10px] ${on ? 'bg-primary text-white' : 'bg-slate-100 text-ink/60'}`}>{badge}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 pt-2 lg:pt-0">
          {failed && <p role="alert" lang={lang} className="mb-4 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{t({ ta: 'தரவை ஏற்ற முடியவில்லை. புதுப்பிக்கவும்.', en: 'Could not load the data. Tap refresh.' })}</p>}

          {tab === 'overview' && (
            <div className="space-y-5">
              {/* summary: booked value + status mix */}
              <div className="rounded-xl bg-white p-5 shadow-card ring-1 ring-slate-200 sm:p-6">
                <div className="relative grid grid-cols-1 gap-5 md:grid-cols-[1fr_1.2fr] md:items-center">
                  <div>
                    <p lang={lang} className="flex items-center gap-2 text-xs font-semibold text-ink/50"><Wallet size={15} /> {t({ ta: 'மொத்த முன்பதிவு மதிப்பு', en: 'Total booked value' })}</p>
                    <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">{inr(revenue)}</p>
                    <p lang={lang} className="mt-1 text-sm text-ink/55">{all.length} {t({ ta: 'முன்பதிவுகள்', en: 'bookings' })} · {thisMonth} {t({ ta: 'இந்த மாதம்', en: 'this month' })}</p>
                  </div>
                  <div>
                    <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-100">
                      {mix.map((m) => m.n > 0 && <span key={m.k} className={m.bar} style={{ width: `${(m.n / Math.max(1, all.length)) * 100}%` }} title={`${m.k}: ${m.n}`} />)}
                    </div>
                    <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-3">
                      {mix.map((m) => (
                        <li key={m.k} className="flex items-center gap-1.5 text-ink/65">
                          <span className={`h-2.5 w-2.5 rounded-full ${m.bar}`} /> <span lang={lang} className="truncate">{t(STATUS[m.k].v)}</span> <b className="ml-auto text-ink">{m.n}</b>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {kpis.map((k) => (
                  <button key={k.label.en} type="button" onClick={k.onClick}
                    className="fk-card group relative overflow-hidden rounded-xl bg-white p-4 text-left ring-1 ring-slate-200 transition duration-200">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`grid h-11 w-11 place-items-center rounded-xl ${k.chip}`}><k.icon size={21} /></span>
                      <ArrowUpRight size={18} className="text-ink/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">{k.value}</p>
                    <p lang={lang} className="truncate text-xs font-semibold text-ink/55">{t(k.label)}</p>
                    <p lang={lang} className="mt-0.5 truncate text-[11px] text-ink/40">{t(k.hint)}</p>
                  </button>
                ))}
              </div>

              {/* quick actions */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {actions.map((a) => (
                  <button key={a.label.en} type="button" onClick={a.onClick}
                    className="group flex items-center gap-3 rounded-xl bg-white p-3.5 text-left ring-1 ring-slate-200 transition hover:bg-slate-50">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-primary`}><a.icon size={19} /></span>
                    <span className="min-w-0">
                      <span lang={lang} className="block truncate text-sm font-bold text-ink group-hover:text-primary">{t(a.label)}</span>
                      <span lang={lang} className="block truncate text-[11px] text-ink/45">{t(a.hint)}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_21rem]">
                {/* upcoming events */}
                <div className="self-start overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 lang={lang} className="flex items-center gap-2 text-base font-extrabold"><CalendarClock size={18} className="text-primary" /> {t({ ta: 'வரவிருக்கும் விழாக்கள்', en: 'Upcoming events' })}</h2>
                    <button type="button" onClick={() => { setFilter('all'); go('orders'); }} lang={lang} className="text-xs font-bold text-primary hover:underline">{t({ ta: 'அனைத்தும்', en: 'View all' })} →</button>
                  </div>
                  {orders === null && !failed ? (
                    <div className="space-y-2 p-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
                  ) : upcoming.length === 0 ? (
                    <div className="flex items-center gap-4 px-5 py-8">
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarDays size={26} /></span>
                      <div className="min-w-0">
                        <p lang={lang} className="font-bold text-ink">{t({ ta: 'வரவிருக்கும் முன்பதிவுகள் இல்லை', en: 'No upcoming bookings yet' })}</p>
                        <p lang={lang} className="text-sm text-ink/50">{t({ ta: 'புதிய முன்பதிவுகள் வந்ததும் இங்கே தெரியும்.', en: 'New bookings will appear here as soon as customers book.' })}</p>
                      </div>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {upcoming.slice(0, 6).map((o) => {
                        const d = new Date(`${o.date}T00:00:00`);
                        return (
                          <li key={o.ref}>
                            <button type="button" onClick={() => { setQ(o.ref); setFilter('all'); go('orders'); }} className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary/[0.03]">
                              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-center leading-none ${muhurthamOn(o.date) ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                                <span><span className="block text-lg font-extrabold">{d.getDate()}</span><span className="block text-[9px] font-bold uppercase">{d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short' })}</span></span>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-ink">{o.event || '—'} · {o.name}</span>
                                <span className="flex items-center gap-1 truncate text-xs text-ink/50"><MapPin size={12} /> {o.town || '—'}{o.provider ? ` · ${o.provider}` : ''}</span>
                              </span>
                              <span className="hidden shrink-0 text-right sm:block">
                                <span className="block text-sm font-extrabold text-ink">{inr(o.total)}</span>
                                <StatusBadge status={o.status} className="mt-0.5 !text-[10px]" />
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="space-y-5">
                  {/* muhurtham */}
                  <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                    <p lang={lang} className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 text-base font-extrabold"><Sparkles size={17} className="text-primary" /> {t({ ta: 'வரும் முகூர்த்த நாட்கள்', en: 'Coming muhurtham days' })}</p>
                    <ul className="space-y-1.5 p-3">
                      {nextMuhurtham.map((m) => {
                        const d = new Date(`${m.date}T00:00:00`);
                        return (
                          <li key={m.date}>
                            <button type="button" onClick={() => { setDay(m.date); go('calendar'); }} className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-primary/5">
                              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-center leading-none ${m.pirai === 'V' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                                <span><span className="block text-sm font-extrabold">{d.getDate()}</span><span className="block text-[8px] font-bold uppercase">{d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short' })}</span></span>
                              </span>
                              <span className="min-w-0 flex-1">
                                <span lang={lang} className="block truncate text-sm font-semibold">{d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { weekday: 'long' })}</span>
                                <span className="block text-[11px] text-ink/45">{m.tamil} · {m.pirai === 'V' ? '★ வளர்பிறை' : '☆ தேய்பிறை'}</span>
                              </span>
                              {perDay[m.date] ? <span className="rounded-full bg-peacock px-2 py-0.5 text-[10px] font-bold text-white">{perDay[m.date]}</span> : null}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* providers */}
                  <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <p lang={lang} className="flex items-center gap-2 text-base font-extrabold"><Users size={17} className="text-primary" /> {t({ ta: 'சேவை வழங்குநர்கள்', en: 'Service providers' })}</p>
                      <button type="button" onClick={openProviderForm} aria-label="Add provider" className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white"><Plus size={16} /></button>
                    </div>
                    {providers.length === 0 ? (
                      <p lang={lang} className="px-4 py-6 text-center text-sm text-ink/50">{t({ ta: 'இன்னும் வழங்குநர்கள் இல்லை.', en: 'No providers yet.' })}</p>
                    ) : (
                      <ul className="divide-y divide-slate-100">
                        {[...providers].sort((a, b) => b.totalJobs - a.totalJobs).slice(0, 4).map((p) => (
                          <li key={p.mobile} className="flex items-center gap-3 px-4 py-2.5">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary-light to-primary-dark text-sm font-extrabold text-white">{(p.business || p.name).charAt(0).toUpperCase()}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold">{p.tier === 'Premium' && <span className="text-amber-500">★ </span>}{p.business || p.name}</span>
                              <span lang={lang} className="block truncate text-[11px] text-ink/45">{p.services.map((s) => (SERVICE_LABEL[s] ? t(SERVICE_LABEL[s]) : s)).join(' · ')}</span>
                            </span>
                            <span lang={lang} className="shrink-0 text-right text-[11px] text-ink/50"><b className="block text-sm text-ink">{p.openJobs}</b>{t({ ta: 'நடப்பு', en: 'open' })}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <>
              <div className="mb-4 space-y-3">
                <label className="relative block">
                  <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" />
                  <input className="w-full !pl-10" placeholder={t({ ta: 'தேடு: எண், பெயர், ஊர்…', en: 'Search ref, name, phone, town…' })} value={q} onChange={(e) => setQ(e.target.value)} />
                </label>
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                  <Pill on={filter === 'all'} onClick={() => setFilter('all')}>{t({ ta: 'அனைத்தும்', en: 'All' })} {orders?.length ?? 0}</Pill>
                  {STATUS_ORDER.map((s) => <Pill key={s} on={filter === s} onClick={() => setFilter(s)}>{t(STATUS[s].v)} {counts[s] ?? 0}</Pill>)}
                </div>
              </div>
              {orderList(shown)}
            </>
          )}

          {tab === 'map' && <AdminMap orders={all} providers={providers} token={token!} onChanged={() => void load()} />}

          {tab === 'calendar' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[24rem_1fr]">
              <div className="xl:sticky xl:top-44 xl:self-start"><MuhurthamCalendar value={day} onPick={setDay} counts={perDay} allowPast /></div>
              <div>
                <h2 lang={lang} className="mb-3 text-lg font-extrabold">
                  {day ? fmtDate(day, lang) : t({ ta: 'ஒரு தேதியைத் தேர்ந்தெடுக்கவும்', en: 'Pick a date' })}
                  {day && muhurthamOn(day) && <span className="chip ml-2 bg-gold-1/30 align-middle text-wine">★ {muhurthamOn(day)!.tamil}</span>}
                </h2>
                {day ? orderList(all.filter((o) => o.date === day)) : <p lang={lang} className="card p-8 text-center text-ink/55">{t({ ta: 'அந்த நாளின் முன்பதிவுகள் இங்கே தெரியும்.', en: 'Bookings for that day appear here.' })}</p>}
              </div>
            </div>
          )}

          {tab === 'products' && <AdminProducts token={token!} />}

          {tab === 'company' && <AdminCompany token={token!} />}

          {tab === 'promos' && <AdminPromos token={token!} />}

          {tab === 'reports' && <AdminReports orders={orders ?? []} providers={providers} token={token!} />}

          {tab === 'providers' && (editing ? (
            <ProviderForm initial={editing === 'new' ? null : editing} token={token!} onDone={(saved) => { setEditing(null); if (saved) void load(); }} />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 lang={lang} className="text-lg font-extrabold">{t({ ta: 'சேவை வழங்குநர்கள்', en: 'Service providers' })} <span className="text-sm text-ink/45">{providers.length}</span></h2>
                <button type="button" onClick={() => setEditing('new')} className="btn-primary !py-2.5"><Plus size={16} /> <span lang={lang}>{t({ ta: 'புதிய வழங்குநர்', en: 'Add service provider' })}</span></button>
              </div>
              {providers.some((p) => p.active) && (
                <div>
                  <p lang={lang} className="mb-2 text-sm font-bold text-ink/60">🏆 {t({ ta: 'தரவரிசை', en: 'Ranking' })}</p>
                  <ProviderRanking providers={providers} limit={5} />
                </div>
              )}
              {providers.length === 0 && <p lang={lang} className="card p-8 text-center text-ink/55">{t({ ta: 'இன்னும் வழங்குநர்கள் இல்லை.', en: 'No providers yet. Add your first one.' })}</p>}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {providers.map((p) => (
                  <article key={p.mobile} className={`card flex flex-col p-4 sm:p-5 ${p.active ? '' : 'opacity-60'}`}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary-light to-primary-dark text-lg font-extrabold text-gold-1 shadow-glow">{(p.business || p.name).charAt(0).toUpperCase()}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate font-extrabold">{p.business || p.name}</span>
                          {p.tier === 'Premium' && <PremiumBadge />}
                          {!p.active && <span lang={lang} className="chip bg-ink/10 text-ink/60">{t({ ta: 'நிறுத்தப்பட்டது', en: 'Inactive' })}</span>}
                          {(p.lat == null || p.lng == null) && <span lang={lang} className="chip bg-amber-100 text-amber-800"><MapPin size={11} /> {t({ ta: 'இருப்பிடம் இல்லை', en: 'No location' })}</span>}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-ink/60">{p.name} · +91 {p.mobile}{p.towns ? ` · ${p.towns}` : ''}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">{p.services.map((s) => <span key={s} lang={lang} className="chip bg-gold-1/25 text-gold-2">{SERVICE_LABEL[s] ? t(SERVICE_LABEL[s]) : s}</span>)}</div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs">
                      <span lang={lang} className="text-ink/55">{t({ ta: 'நடப்பு', en: 'Open' })} <b className="text-ink">{p.openJobs}</b> · {t({ ta: 'மொத்தம்', en: 'Total' })} <b className="text-ink">{p.totalJobs}</b></span>
                      <span className="flex gap-1.5">
                        <a href={`tel:+91${p.mobile}`} aria-label="Call" className="grid h-9 w-9 place-items-center rounded-xl bg-primary/5 text-primary"><Phone size={15} /></a>
                        <button type="button" onClick={() => setEditing(p)} className="btn-ghost !px-3 !py-2"><span lang={lang}>{t({ ta: 'திருத்து', en: 'Edit' })}</span></button>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
