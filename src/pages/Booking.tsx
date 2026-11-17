import { CircleCheck, ExternalLink, LoaderCircle, MapPin, Printer, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useLang, type L } from '../i18n/lang';
import { BUSINESS, EVENT_TYPES, ORDERS, TOWNS } from '../data/config';
import { MuhurthamCalendar, iso } from '../components/calendar';
import { AreaCalculator } from '../components/pandal';
import { EstimateSummary } from '../components/summary';
import { SelectedItems } from '../components/cartlines';
import { BrandMark, DemoBadge, PageHero } from '../components/ui';
import { WhatsAppIcon } from '../components/Layout';
import { useEstimate } from '../state/estimate';
import { useAuth } from '../state/auth';
import { whatsappLink } from '../state/whatsapp';
import { buildOrder, makeRef, submitOrder } from '../state/orders';
import { useCompany } from '../state/company';
import { LocationPicker } from '../components/LocationPicker';
import { PhotoPicker } from '../components/photos';
import { NO_LOCATION, savedLocation, type VenueLocation } from '../state/location';

type Form = { name: string; phone: string; event: string; date: string; town: string; address: string; guests: string; notes: string };
const EMPTY: Form = { name: '', phone: '', event: '', date: '', town: '', address: '', guests: '', notes: '' };

function Field({ label, error, children }: { label: L; error?: string; children: ReactNode }) {
  const { t, lang } = useLang();
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink/75">
        <span lang={lang}>{t(label)}</span>
      </span>
      {children}
      {error && <span data-error lang={lang} className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-700"><TriangleAlert size={13} /> {error}</span>}
    </label>
  );
}

const LocateIcon = () => <MapPin size={20} className="shrink-0 text-ink/45" />;

export default function BookingPage() {
  useCompany();
  const { t, lang } = useLang();
  const { breakdown, state } = useEstimate();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [ref, setRef] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [loc, setLoc] = useState<VenueLocation>(NO_LOCATION);
  const [photos, setPhotos] = useState<string[]>([]);
  const [where, setWhere] = useState<'saved' | 'new'>('saved');
  const [saveDefault, setSaveDefault] = useState(false);
  const attempt = useRef<string | null>(null); // same ref on every retry, so the sheet never gets duplicate rows
  const live = Boolean(ORDERS.url);
  const { user, token, updateProfile } = useAuth();
  const saved = savedLocation(user);
  const savedAddr = user?.address ?? '';
  const hasSaved = Boolean(user) && (Boolean(saved.mapLink) || Boolean(savedAddr));
  const mode: 'saved' | 'new' = hasSaved ? where : 'new';
  const applied = useRef<string | null>(null);

  // Logged-in customers: fill in their name, mobile and saved location (only into empty fields, once per login).
  useEffect(() => {
    if (!user || applied.current === user.mobile) return;
    applied.current = user.mobile;
    setForm((f) => ({ ...f, name: f.name || user.name, phone: f.phone || user.mobile, address: f.address || user.address || '' }));
    setLoc((cur) => (cur.mapLink ? cur : savedLocation(user)));
  }, [user]);

  const pickSavedPlace = () => { setWhere('saved'); setVal('address', savedAddr); setLoc(saved); };
  const pickNewPlace = () => { setWhere('new'); setVal('address', ''); setLoc(NO_LOCATION); };
  const setVal = (k: keyof Form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => (er[k] ? { ...er, [k]: undefined } : er));
  };
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setVal(k, e.target.value);
  const today = iso(new Date());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const er: typeof errors = {};
    const req = t({ ta: 'இந்தப் புலம் தேவை', en: 'This field is required' });
    if (!form.name.trim()) er.name = req;
    if (!/^(\+?91)?[6-9]\d{9}$/.test(form.phone.replace(/[\s-]/g, ''))) er.phone = t({ ta: 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடுங்கள்', en: 'Enter a valid 10-digit mobile number' });
    if (!form.event) er.event = req;
    if (!form.date) er.date = req;
    else if (form.date < today) er.date = t({ ta: 'கடந்த தேதியைத் தேர்வு செய்ய முடியாது', en: 'Date cannot be in the past' });
    if (!form.town) er.town = req;
    setErrors(er);
    if (Object.keys(er).length) {
      setTimeout(() => document.querySelector('[data-error]')?.closest('label')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      return;
    }
    if (!live) {
      setRef('DEMO-' + Date.now().toString(36).toUpperCase().slice(-6));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    attempt.current ??= makeRef();
    setSending(true);
    setSendError(false);
    const res = await submitOrder(buildOrder(attempt.current, lang, form, breakdown, state, honeypot, loc, photos), token);
    setSending(false);
    if (!res.ok) {
      setSendError(true);
      return;
    }
    attempt.current = null;
    // “Save as my default location”: remembered in the profile for next time.
    if (saveDefault && user && loc.mapLink) void updateProfile({ address: form.address.trim(), lat: loc.lat, lng: loc.lng, mapLink: loc.mapLink });
    setRef(res.ref);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eventLabel = EVENT_TYPES.find((x) => x.en === form.event);
  const townLabel = TOWNS.find((x) => x.en === form.town);

  if (ref) {
    const details: [L, string][] = [
      [{ ta: 'பெயர்', en: 'Name' }, form.name],
      [{ ta: 'கைபேசி', en: 'Mobile' }, form.phone],
      [{ ta: 'விழா', en: 'Function' }, eventLabel ? t(eventLabel) : form.event],
      [{ ta: 'தேதி', en: 'Date' }, new Date(form.date).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { dateStyle: 'full' })],
      [{ ta: 'ஊர்', en: 'Town' }, townLabel ? t(townLabel) : form.town],
      [{ ta: 'விழா நடைபெறும் இடம்', en: 'Venue address' }, form.address || '—'],
      [{ ta: 'வரைபட இருப்பிடம்', en: 'Map location' }, loc.mapLink || '—'],
      [{ ta: 'படங்கள்', en: 'Photos' }, photos.length ? String(photos.length) : '—'],
      [{ ta: 'விருந்தினர் எண்ணிக்கை', en: 'Expected guests' }, form.guests || '—'],
      [{ ta: 'குறிப்புகள்', en: 'Notes' }, form.notes || '—'],
    ];
    const extra = details.map(([k, v]) => `${t(k)}: ${v}`).join('\n');
    return (
      <div className="section max-w-4xl !pt-10">
        {live ? (
          <div className="mb-6 flex gap-3 rounded-3xl border-2 border-peacock/40 bg-peacock/10 p-5 print:hidden" role="status">
            <CircleCheck size={28} className="shrink-0 text-peacock" />
            <div>
              <p lang={lang} className="font-extrabold text-ink">{t({ ta: 'முன்பதிவு கோரிக்கை பெறப்பட்டது!', en: 'Booking request received!' })}</p>
              <p lang={lang} className="mt-1 text-sm text-ink/70">{t({ ta: 'உறுதிப்படுத்த நாங்கள் விரைவில் உங்களை அழைப்போம். குறிப்பு எண்:', en: 'We will call you shortly to confirm. Your reference:' })} <b>{ref}</b></p>
              {user && <Link to="/orders" className="mt-2 inline-block text-sm font-bold text-primary underline"><span lang={lang}>{t({ ta: 'என் முன்பதிவுகளில் பார்க்க →', en: 'View in My Orders →' })}</span></Link>}
            </div>
          </div>
        ) : (
  <div className="mb-6 flex gap-3 rounded-3xl border-2 border-marigold/50 bg-turmeric-wash p-5 print:hidden" role="status">
            <TriangleAlert size={28} className="shrink-0 text-marigold-dark" />
            <div>
              <p lang={lang} className="font-extrabold text-ink">{t({ ta: 'இது மாதிரி மட்டுமே — முன்பதிவு எங்கும் அனுப்பப்படவில்லை.', en: 'Demo only — this booking has NOT been sent anywhere.' })}</p>
              <p lang={lang} className="mt-1 text-sm text-ink/70">{t({ ta: 'உண்மையில் முன்பதிவு செய்ய, கீழே உள்ள WhatsApp பொத்தான் மூலம் அனுப்புங்கள் அல்லது நேரடியாக அழையுங்கள்.', en: 'To actually book, send it via the WhatsApp button below or call us directly.' })}</p>
            </div>
          </div>
        )}

        <article className="print-area card">
          <header className="flex flex-wrap items-start justify-between gap-4 bg-gradient-to-r from-primary to-primary-light p-6 text-white sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white"><BrandMark className="h-11 w-11" /></span>
              <div>
                <p lang={lang} className="font-[family-name:var(--font-display)] text-2xl font-extrabold">{lang === 'ta' ? t(BUSINESS.name) : <>Event <span className="text-gold-1">Tamizha</span></>}</p>
                <p lang={lang} className="text-sm text-gold-1">{t(BUSINESS.descriptor)}</p>
                <p className="text-xs text-white/70">{BUSINESS.phoneDisplay}</p>
              </div>
            </div>
            <div className="text-right">
              <p lang={lang} className="text-2xl font-extrabold">{t({ ta: 'முன்பதிவுச் சுருக்கம்', en: 'Booking Summary' })}</p>
              <p className="text-sm text-white/80">{t({ ta: 'குறிப்பு எண்', en: 'Ref.' })}: <b>{ref}</b></p>
              <p className="text-xs text-white/60">{new Date().toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-IN')}</p>
            </div>
          </header>
          <div className="garland" />
          <div className="p-6 sm:p-8">
            <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              {details.map(([k, v]) => (
                <div key={k.en}>
                  <dt lang={lang} className="text-[11px] font-bold uppercase tracking-wider text-primary">{t(k)}</dt>
                  <dd className="whitespace-pre-wrap font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <h2 lang={lang} className="mb-3 mt-8 border-t border-dashed border-ink/15 pt-6 text-xl font-extrabold">{t({ ta: 'மதிப்பீட்டு விவரம்', en: 'Estimate details' })}</h2>
            <EstimateSummary />
          </div>
        </article>

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <button type="button" onClick={() => window.print()} className="btn-primary !py-3"><Printer size={17} /> <span lang={lang}>{t({ ta: 'அச்சிட / PDF சேமிக்க', en: 'Print / Save as PDF' })}</span></button>
          <a href={whatsappLink(lang, { b: breakdown, s: state, extra })} target="_blank" rel="noreferrer" className="btn-whatsapp !py-3">
            <WhatsAppIcon /> <span lang={lang}>{t({ ta: 'WhatsApp-ல் அனுப்ப', en: 'Send on WhatsApp' })}</span>
          </a>
          <button type="button" onClick={() => {
            if (live) {
              setForm({ ...EMPTY, name: user?.name ?? '', phone: user?.mobile ?? '', address: user?.address ?? '' });
              setLoc(saved); setWhere('saved'); setPhotos([]); setSaveDefault(false);
            }
            setRef(null);
          }} className="btn-ghost !py-3"><span lang={lang}>{live ? t({ ta: 'புதிய முன்பதிவு', en: 'New booking' }) : t({ ta: 'திருத்த', en: 'Edit details' })}</span></button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHero k="wedding-ritual" title={{ ta: 'முன்பதிவு செய்யுங்கள்', en: 'Book Now' }}
        sub={live
          ? { ta: 'விழா விவரங்களைக் கொடுங்கள் — நாங்கள் உங்களை அழைத்து முன்பதிவை உறுதி செய்வோம்.', en: 'Share your function details — we will call you to confirm your booking.' }
          : { ta: 'விழா விவரங்களைக் கொடுங்கள் — முன்பதிவுச் சுருக்கத்தை அச்சிடலாம் அல்லது WhatsApp-ல் அனுப்பலாம்.', en: 'Share your function details — print the booking summary or send it on WhatsApp.' }} />
      <div className="section grid grid-cols-1 gap-8 !pt-10 lg:grid-cols-[1fr_400px]">
        <form onSubmit={submit} noValidate className="relative min-w-0 space-y-8">
          {live && (user ? (
            <p lang={lang} className="flex items-center gap-2 rounded-2xl border border-peacock/30 bg-peacock/10 px-4 py-3 text-sm text-ink/80">
              <CircleCheck size={18} className="shrink-0 text-peacock" />
              <span>{t({ ta: `${user.name} ஆக உள்நுழைந்துள்ளீர்கள் — இந்த முன்பதிவு “என் முன்பதிவுகளில்” தெரியும்.`, en: `Logged in as ${user.name} — this booking will appear in My Orders.` })}</span>
            </p>
          ) : (
            <p lang={lang} className="rounded-2xl border border-marigold/40 bg-turmeric-wash px-4 py-3 text-sm text-ink/75">
              {t({ ta: 'முன்பதிவின் நிலையைப் பார்க்க விரும்புகிறீர்களா?', en: 'Want to track this booking’s status?' })}{' '}
              <Link to="/account" state={{ next: '/booking' }} className="font-bold text-primary underline">{t({ ta: 'உள்நுழையவும் / பதிவு செய்யவும்', en: 'Log in or sign up' })}</Link>
              <span className="text-ink/50"> ({t({ ta: 'விருப்பம்', en: 'optional' })})</span>
            </p>
          ))}
          <div className="card space-y-5 p-5 sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-white">1</span>
              <span lang={lang}>{t({ ta: 'உங்கள் விவரங்கள்', en: 'Your details' })}</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={{ ta: 'பெயர்', en: 'Name' }} error={errors.name}>
                <input className="w-full" value={form.name} onChange={set('name')} autoComplete="name" />
              </Field>
              <Field label={{ ta: 'கைபேசி / WhatsApp எண்', en: 'Mobile / WhatsApp' }} error={errors.phone}>
                <input className="w-full" type="tel" inputMode="tel" value={form.phone} onChange={set('phone')} placeholder="98xxxxxxxx" autoComplete="tel" />
              </Field>
              <Field label={{ ta: 'விழா வகை', en: 'Function type' }} error={errors.event}>
                <select className="w-full" value={form.event} onChange={set('event')}>
                  <option value="">{t({ ta: '— தேர்ந்தெடுங்கள் —', en: '— Select —' })}</option>
                  {EVENT_TYPES.map((e) => <option key={e.en} value={e.en}>{t(e)}</option>)}
                </select>
              </Field>
              <Field label={{ ta: 'ஊர் / மாவட்டம்', en: 'Town / District' }} error={errors.town}>
                <select className="w-full" value={form.town} onChange={set('town')}>
                  <option value="">{t({ ta: '— தேர்ந்தெடுங்கள் —', en: '— Select —' })}</option>
                  {TOWNS.map((x) => <option key={x.en} value={x.en}>{t(x)}</option>)}
                  <option value="Other">{t({ ta: 'மற்றவை', en: 'Other' })}</option>
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Field label={{ ta: 'விழா தேதி', en: 'Function date' }} error={errors.date}>
                  <input className="w-full" type="date" min={today} value={form.date} onChange={set('date')} />
                </Field>
              </div>
              <Field label={{ ta: 'விருந்தினர் எண்ணிக்கை', en: 'Expected guests' }}>
                <input className="w-full" type="number" min={0} value={form.guests} onChange={set('guests')} />
              </Field>
            </div>
            <MuhurthamCalendar value={form.date} onPick={(d) => setVal('date', d)} demoBusy />
            {hasSaved && (
              <div role="radiogroup" aria-label="Venue" className="space-y-2">
                <p lang={lang} className="text-sm font-semibold text-ink/75">{t({ ta: 'விழா எங்கே நடைபெறுகிறது?', en: 'Where is the function?' })}</p>
                <div role="radio" tabIndex={0} aria-checked={mode === 'saved'} onClick={pickSavedPlace}
                  onKeyDown={(e: { key: string; preventDefault: () => void }) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickSavedPlace(); } }}
                  className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl p-3.5 text-left ring-2 transition ${mode === 'saved' ? 'bg-primary/[0.05] ring-primary' : 'bg-white ring-slate-200 hover:ring-primary/40'}`}>
                  <MapPin size={20} className="mt-0.5 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span lang={lang} className="block text-sm font-bold">{t({ ta: 'என் சேமித்த இருப்பிடம்', en: 'My saved location' })}</span>
                    <span className="block truncate text-xs text-ink/60">{savedAddr || t({ ta: 'வரைபட இருப்பிடம் சேமிக்கப்பட்டது', en: 'Map location saved' })}</span>
                  </span>
                  {saved.mapLink && <a href={saved.mapLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="chip shrink-0 bg-primary text-gold-1"><ExternalLink size={12} /> <span lang={lang}>{t({ ta: 'வரைபடம்', en: 'Map' })}</span></a>}
                </div>
                <button type="button" role="radio" aria-checked={mode === 'new'} onClick={pickNewPlace}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3.5 text-left ring-2 transition ${mode === 'new' ? 'bg-primary/[0.05] ring-primary' : 'bg-white ring-slate-200 hover:ring-primary/40'}`}>
                  <LocateIcon />
                  <span lang={lang} className="text-sm font-bold">{t({ ta: 'வேறு இடத்தைத் தேர்ந்தெடுக்க', en: 'Choose a different location' })}</span>
                </button>
              </div>
            )}
            {user && !hasSaved && (
              <p lang={lang} className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-ink/60 ring-1 ring-slate-200">
                {t({ ta: 'உங்கள் இயல்பு இருப்பிடத்தை ', en: 'Save a default location in your ' })}
                <Link to="/account" className="font-bold text-primary underline">{t({ ta: 'சுயவிவரத்தில்', en: 'profile' })}</Link>
                {t({ ta: ' சேமித்தால் அடுத்த முறை தானாக நிரம்பும்.', en: ' and it fills in automatically next time.' })}
              </p>
            )}
            <Field label={{ ta: 'விழா நடைபெறும் இடம்', en: 'Venue address' }}>
              <textarea className="w-full" rows={2} value={form.address} onChange={set('address')} />
            </Field>
            {mode === 'new' && <LocationPicker value={loc} onChange={setLoc} />}
            {user && mode === 'new' && loc.mapLink && (
              <label className="flex items-center gap-2.5 text-sm font-semibold text-ink/75">
                <input type="checkbox" className="h-4 w-4 accent-primary" checked={saveDefault} onChange={(e) => setSaveDefault(e.target.checked)} />
                <span lang={lang}>{t({ ta: 'இதை என் இயல்பு இருப்பிடமாகச் சேமி', en: 'Save this as my default location' })}</span>
              </label>
            )}
            <Field label={{ ta: 'கூடுதல் குறிப்புகள்', en: 'Additional notes' }}>
              <textarea className="w-full" rows={3} value={form.notes} onChange={set('notes')}
                placeholder={t({ ta: 'எ.கா. அமைக்க வேண்டிய நேரம், சிறப்புத் தேவைகள்…', en: 'e.g. setup time, special requests…' })} />
            </Field>
            <PhotoPicker value={photos} onChange={setPhotos} />
          </div>

          <div>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-white">2</span>
              <span lang={lang}>{t({ ta: 'பந்தல் & அளவு', en: 'Pandal & size' })}</span>
            </h2>
            <AreaCalculator />
            <div className="mt-4"><SelectedItems /></div>
            <p lang={lang} className="mt-3 text-sm text-ink/60">
              {t({ ta: 'விளக்கு, வாடகைப் பொருட்களைச் சேர்க்க', en: 'To add lighting or rentals, visit' })}{' '}
              <Link to="/estimate" className="font-bold text-primary underline">{t({ ta: 'விலை மதிப்பீடு பக்கம்', en: 'the estimate page' })}</Link>.
            </p>
          </div>

          <DemoBadge />
          {/* honeypot: hidden from people, bots fill it and the server drops the order */}
          <input tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)}
            className="absolute -left-[9999px] h-0 w-0 opacity-0" />
          <button type="submit" disabled={sending} className="btn-primary w-full !py-4 text-base disabled:opacity-70">
            {sending && <LoaderCircle size={18} className="animate-spin" />}
            <span lang={lang}>
              {sending
                ? t({ ta: 'அனுப்புகிறது…', en: 'Sending…' })
                : live
                  ? t({ ta: 'முன்பதிவை அனுப்ப', en: 'Send booking request' })
                  : t({ ta: 'முன்பதிவுச் சுருக்கத்தைத் தயாரிக்க (மாதிரி)', en: 'Prepare booking summary (demo)' })}
            </span>
            {!sending && ' →'}
          </button>
          {sendError && (
            <div role="alert" className="rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-4 text-sm">
              <p lang={lang} className="font-bold text-amber-800">{t({ ta: 'முன்பதிவை அனுப்ப முடியவில்லை. இணைய இணைப்பைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.', en: 'Could not send your booking. Check your internet and try again.' })}</p>
              <p lang={lang} className="mt-1 text-ink/70">{t({ ta: 'அல்லது WhatsApp / அழைப்பு மூலம் நேரடியாகத் தொடர்பு கொள்ளுங்கள்.', en: 'Or contact us directly on WhatsApp or by phone.' })}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={whatsappLink(lang, { b: breakdown, s: state })} target="_blank" rel="noreferrer" className="btn-whatsapp !py-2"><WhatsAppIcon /> <span lang={lang}>WhatsApp</span></a>
                <a href={BUSINESS.phoneHref} className="btn-ghost !py-2">{BUSINESS.phoneDisplay}</a>
              </div>
            </div>
          )}
        </form>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="card p-5 sm:p-6">
            <h2 lang={lang} className="mb-4 text-2xl font-extrabold">{t({ ta: 'மதிப்பீடு', en: 'Estimate' })}</h2>
            <EstimateSummary />
          </div>
        </aside>
      </div>
    </>
  );
}
