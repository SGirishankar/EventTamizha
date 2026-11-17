import { Bell, ChevronRight, ClipboardList, Crown, Languages, ListChecks, LoaderCircle, LogOut, MapPin, Pencil, ShoppingCart, Trash2, TriangleAlert, Truck, type LucideIcon } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang, type L } from '../i18n/lang';
import { callApi } from '../state/api';
import { homeFor, roleOf, useAuth, type User } from '../state/auth';
import { savedLocation, type VenueLocation } from '../state/location';
import { LocationPicker } from './LocationPicker';
import { useDeviceAlerts } from './notifications';

const ERRORS: Record<string, L> = {
  BAD_LOGIN: { ta: 'கடவுச்சொல் தவறு.', en: 'The password is wrong.' },
  LOCKED: { ta: 'பல முறை தவறாக உள்ளிட்டீர்கள். 15 நிமிடம் கழித்து முயற்சிக்கவும்.', en: 'Too many wrong attempts. Please try again after 15 minutes.' },
  EXISTS: { ta: 'இந்த எண் ஏற்கனவே வேறு கணக்கில் உள்ளது.', en: 'This number already belongs to another account.' },
  BAD_INPUT: { ta: 'விவரங்களைச் சரிபார்க்கவும்.', en: 'Please check the details.' },
  LOCATION_REQUIRED: { ta: 'சேவை வழங்குநருக்கு இருப்பிடம் கட்டாயம். “இருப்பிடத்தை இயக்கு” அழுத்தவும்.', en: 'A service provider must save a location. Tap “Enable location”.' },
  FORBIDDEN: { ta: 'இந்த எண்ணை நிர்வாகி மட்டுமே மாற்ற முடியும்.', en: 'Only the admin can change this number.' },
  NETWORK: { ta: 'இணைய இணைப்பு இல்லை. மீண்டும் முயற்சிக்கவும்.', en: 'No internet connection. Please try again.' },
  INVALID_SESSION: { ta: 'மீண்டும் உள்நுழையவும்.', en: 'Please log in again.' },
};
const errorText = (c: string): L => ERRORS[c] ?? { ta: `ஏதோ தவறு நடந்தது (${c})`, en: `Something went wrong (${c})` };

function Row({ icon: I, label, value, to, onClick, danger = false }: { icon: LucideIcon; label: L; value?: ReactNode; to?: string; onClick?: () => void; danger?: boolean }) {
  const { t, lang } = useLang();
  const inner = (
    <>
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${danger ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}><I size={20} /></span>
      <span lang={lang} className={`min-w-0 flex-1 truncate text-base font-semibold ${danger ? 'text-red-600' : 'text-ink'}`}>{t(label)}</span>
      {value !== undefined && <span className="shrink-0 text-sm text-ink/55">{value}</span>}
      <ChevronRight size={18} className="shrink-0 text-ink/30" />
    </>
  );
  const cls = 'flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-primary/[0.04]';
  return to
    ? <Link to={to} className={cls}>{inner}</Link>
    : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

/** The logged-in account page: who you are, your saved location (editable), shortcuts, language, phone alerts, log out. */
export function ProfileView({ user }: { user: User }) {
  const { t, lang, setLang } = useLang();
  const { token, logout, updateProfile, deleteAccount } = useAuth();
  const alerts = useDeviceAlerts();
  const nav = useNavigate();
  const role = roleOf(user);
  const isCustomer = role === 'Customer';
  const isProvider = role === 'Provider';
  const mustSetLocation = isProvider && (user.lat == null || user.lng == null);

  const [editing, setEditing] = useState(mustSetLocation);
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobile);
  const [address, setAddress] = useState(user.address ?? '');
  const [loc, setLoc] = useState<VenueLocation>(() => savedLocation(user));
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [delPassword, setDelPassword] = useState('');
  const [delBusy, setDelBusy] = useState(false);
  const [delError, setDelError] = useState<L | null>(null);
  const [stats, setStats] = useState<{ active: number; done: number; all: number } | null>(null);

  // Booking counts for customers.
  useEffect(() => {
    if (!token || !isCustomer) return;
    let live = true;
    void callApi<{ orders: { status: string }[] }>({ action: 'orders', token }).then((r) => {
      if (!live || !r.ok) return;
      const done = r.orders.filter((o) => o.status === 'Done').length;
      const closed = r.orders.filter((o) => o.status === 'Done' || o.status === 'Cancelled' || o.status === 'Rejected').length;
      setStats({ active: r.orders.length - closed, done, all: r.orders.length });
    });
    return () => { live = false; };
  }, [token, isCustomer]);

  const openEdit = () => {
    setName(user.name); setMobile(user.mobile); setAddress(user.address ?? ''); setLoc(savedLocation(user));
    setPassword(''); setError(null); setSaved(false); setEditing(true);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const m = mobile.replace(/\D/g, '').slice(-10);
    const numberChanged = isCustomer && m !== user.mobile;
    if (!name.trim()) return setError({ ta: 'உங்கள் பெயரை உள்ளிடவும்.', en: 'Please enter your name.' });
    if (numberChanged && !/^[6-9]\d{9}$/.test(m)) return setError({ ta: 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்.', en: 'Enter a valid 10-digit mobile number.' });
    if (numberChanged && !password) return setError({ ta: 'எண்ணை மாற்ற உங்கள் கடவுச்சொல்லை உள்ளிடவும்.', en: 'Enter your password to change the number.' });
    if (isProvider && loc.lat === null) return setError(ERRORS.LOCATION_REQUIRED);
    setError(null);
    setBusy(true);
    const r = await updateProfile({
      name: name.trim(), address: address.trim(), lat: loc.lat, lng: loc.lng, mapLink: loc.mapLink,
      ...(numberChanged ? { newMobile: m, password } : {}),
    });
    setBusy(false);
    if (!r.ok) return setError(errorText(r.error));
    setEditing(false);
    setSaved(true);
    setPassword('');
  };

  const confirmDelete = async (e: FormEvent) => {
    e.preventDefault();
    if (delBusy) return;
    if (!delPassword) return setDelError({ ta: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்.', en: 'Enter your password.' });
    setDelError(null);
    setDelBusy(true);
    const r = await deleteAccount(delPassword);
    setDelBusy(false);
    if (!r.ok) return setDelError(errorText(r.error));
    nav('/', { replace: true });
  };

  const roleChip = role === 'Admin' ? t({ ta: 'நிர்வாகி', en: 'Admin' }) : isProvider ? `${user.tier === 'Premium' ? '★ ' : ''}${t({ ta: 'சேவை வழங்குநர்', en: 'Service Provider' })}` : '';
  const hasLoc = Boolean(user.mapLink) || (user.lat != null && user.lng != null);

  return (
    <div className="mx-auto max-w-xl space-y-4 px-4 pb-28 pt-6 sm:pt-10 md:pb-12">
      <h1 lang={lang} className="text-3xl font-extrabold text-ink">{t({ ta: 'சுயவிவரம்', en: 'Profile' })}</h1>

      {mustSetLocation && !editing && (
        <p role="alert" lang={lang} className="flex items-start gap-2 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" /> {t(ERRORS.LOCATION_REQUIRED)}
        </p>
      )}

      <section className="card p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-blue-100 text-3xl font-extrabold text-primary sm:h-20 sm:w-20">{user.name.trim().charAt(0).toUpperCase() || '?'}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xl font-extrabold uppercase tracking-wide text-ink">{user.name}</p>
            <p className="text-ink/60">+91 {user.mobile}</p>
            {roleChip && <span lang={lang} className="chip mt-1 bg-gold-1/25 text-gold-2">{roleChip}</span>}
          </div>
          {!editing && (
            <button type="button" onClick={openEdit} aria-label={t({ ta: 'சுயவிவரம் திருத்து', en: 'Edit profile' })}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-ink/60 transition hover:bg-primary/10 hover:text-primary"><Pencil size={18} /></button>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-sm">
          <MapPin size={16} className="shrink-0 text-peacock" />
          {hasLoc || user.address ? (
            <>
              <span className="min-w-0 flex-1 text-peacock">{user.address || t({ ta: 'வரைபட இருப்பிடம் சேமிக்கப்பட்டது', en: 'Map location saved' })}</span>
              <a href={user.mapLink || `https://www.google.com/maps?q=${user.lat},${user.lng}`} target="_blank" rel="noreferrer" className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <MapPin size={12} /> <span lang={lang}>{t({ ta: 'வரைபடத்தில் பார்க்க', en: 'Open in Maps' })}</span>
              </a>
            </>
          ) : (
            <span lang={lang} className="text-ink/50">{t({ ta: 'இருப்பிடம் சேமிக்கப்படவில்லை', en: 'No location saved yet' })}</span>
          )}
        </div>
        {isCustomer && stats && (
          <div className="mt-3 grid grid-cols-3 divide-x divide-slate-100 border-t border-slate-100 pt-3 text-center">
            {([[stats.active, { ta: 'செயலில்', en: 'Active' }], [stats.done, { ta: 'முடிந்தது', en: 'Completed' }], [stats.all, { ta: 'அனைத்தும்', en: 'All' }]] as [number, L][]).map(([n, l]) => (
              <div key={l.en}>
                <p className="text-3xl font-extrabold text-ink">{n}</p>
                <p lang={lang} className="text-sm text-ink/50">{t(l)}</p>
              </div>
            ))}
          </div>
        )}
        {saved && !editing && <p role="status" lang={lang} className="mt-3 text-sm font-semibold text-emerald-700">✓ {t({ ta: 'சுயவிவரம் சேமிக்கப்பட்டது.', en: 'Profile saved.' })}</p>}
      </section>

      {editing && (
        <form onSubmit={submit} noValidate className="card space-y-4 p-4 sm:p-5">
          <h2 lang={lang} className="text-lg font-extrabold">{t({ ta: 'சுயவிவரம் திருத்து', en: 'Edit profile' })}</h2>
          <label className="block">
            <span lang={lang} className="mb-1.5 block text-sm font-semibold text-ink/75">{t({ ta: 'பெயர்', en: 'Name' })}</span>
            <input className="w-full" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
          <label className="block">
            <span lang={lang} className="mb-1.5 block text-sm font-semibold text-ink/75">{t({ ta: 'கைபேசி எண்', en: 'Mobile number' })}</span>
            <input className="w-full disabled:opacity-60" type="tel" inputMode="numeric" value={mobile} disabled={!isCustomer} onChange={(e) => setMobile(e.target.value)} autoComplete="tel-national" />
            {!isCustomer && <span lang={lang} className="mt-1 block text-xs text-ink/50">{t({ ta: 'இந்த எண்ணை நிர்வாகி மூலம் மட்டுமே மாற்ற முடியும்.', en: 'This number can only be changed by the admin.' })}</span>}
          </label>
          {isCustomer && mobile.replace(/\D/g, '').slice(-10) !== user.mobile && (
            <label className="block">
              <span lang={lang} className="mb-1.5 block text-sm font-semibold text-ink/75">{t({ ta: 'உறுதிப்படுத்த கடவுச்சொல்', en: 'Your password (to confirm the new number)' })}</span>
              <input className="w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <span lang={lang} className="mt-1 block text-xs text-ink/50">{t({ ta: 'மாற்றிய பின் புதிய எண்ணால் உள்நுழைய வேண்டும். உங்கள் முன்பதிவுகள் அப்படியே இருக்கும்.', en: 'After this you log in with the new number. Your bookings stay with you.' })}</span>
            </label>
          )}
          <label className="block">
            <span lang={lang} className="mb-1.5 block text-sm font-semibold text-ink/75">{isProvider ? t({ ta: 'கடை / வீட்டு முகவரி', en: 'Shop / home address' }) : t({ ta: 'முகவரி / அடையாளம்', en: 'Address / landmark' })}</span>
            <textarea className="w-full" rows={2} maxLength={300} value={address} onChange={(e) => setAddress(e.target.value)} />
          </label>
          <LocationPicker value={loc} onChange={setLoc} optional={!isProvider} needCoords={isProvider}
            title={isProvider ? { ta: 'என் அடிப்படை இருப்பிடம்', en: 'My base location' } : { ta: 'என் இருப்பிடம்', en: 'My location' }}
            hint={isProvider
              ? { ta: 'நிர்வாகி அருகிலுள்ள பணிகளை ஒதுக்க இது கட்டாயம். கடை அல்லது வீட்டில் இருக்கும்போது “இருப்பிடத்தை இயக்கு” அழுத்துங்கள்.', en: 'Required: the admin gives you jobs by distance. Tap “Enable location” while you are at your shop or home.' }
              : { ta: 'இது உங்கள் இயல்பு இருப்பிடம். முன்பதிவில் இதைப் பயன்படுத்தலாம் அல்லது புதிய இடத்தைத் தேர்ந்தெடுக்கலாம்.', en: 'This is your default location. Use it when booking, or pick a new place at that time.' }} />
          {error && (
            <p role="alert" lang={lang} className="flex items-start gap-2 rounded-2xl border-2 border-amber-400/60 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              <TriangleAlert size={16} className="mt-0.5 shrink-0" /> {t(error)}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary flex-1 !py-3 disabled:opacity-70">
              {busy && <LoaderCircle size={17} className="animate-spin" />} <span lang={lang}>{t({ ta: 'சேமி', en: 'Save' })}</span>
            </button>
            {!mustSetLocation && <button type="button" onClick={() => setEditing(false)} className="btn-ghost !py-3"><span lang={lang}>{t({ ta: 'ரத்து', en: 'Cancel' })}</span></button>}
          </div>
        </form>
      )}

      <section className="card divide-y divide-slate-100 overflow-hidden !p-0">
        {isCustomer && <Row icon={ListChecks} label={{ ta: 'என் முன்பதிவுகள்', en: 'My bookings' }} to="/orders" />}
        {isCustomer && <Row icon={ShoppingCart} label={{ ta: 'என் கூடை', en: 'My cart' }} to="/cart" />}
        {role === 'Admin' && <Row icon={Crown} label={{ ta: 'நிர்வாகப் பலகை', en: 'Admin panel' }} to={homeFor(user)} />}
        {isProvider && <Row icon={Truck} label={{ ta: 'என் பணிகள்', en: 'My jobs' }} to={homeFor(user)} />}
        {!isCustomer && !isProvider && role !== 'Admin' && <Row icon={ClipboardList} label={{ ta: 'முகப்பு', en: 'Home' }} to="/" />}
      </section>

      <section className="card divide-y divide-slate-100 overflow-hidden !p-0">
        <Row icon={Languages} label={{ ta: 'மொழி', en: 'Language' }} value={lang === 'ta' ? 'தமிழ்' : 'English'} onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')} />
        {alerts.state !== 'unsupported' && (
          <Row icon={Bell} label={{ ta: 'தொலைபேசி அறிவிப்புகள்', en: 'Phone alerts' }}
            value={alerts.state === 'granted' ? t({ ta: 'இயக்கத்தில்', en: 'On' }) : alerts.state === 'denied' ? t({ ta: 'தடுக்கப்பட்டது', en: 'Blocked' }) : t({ ta: 'இயக்கு', en: 'Turn on' })}
            onClick={alerts.state === 'default' ? () => void alerts.enable() : undefined} />
        )}
        <Row icon={Pencil} label={{ ta: 'சுயவிவரம் திருத்து', en: 'Edit profile' }} onClick={openEdit} />
        <Row icon={MapPin} label={{ ta: 'இருப்பிடம் புதுப்பி', en: 'Update location' }} onClick={openEdit} />
        <Row icon={LogOut} danger label={{ ta: 'வெளியேற', en: 'Log out' }} onClick={() => { logout(); nav('/'); }} />
        {isCustomer && <Row icon={Trash2} danger label={{ ta: 'கணக்கை நீக்கு', en: 'Delete my account' }} onClick={() => { setDeleting((x) => !x); setDelError(null); }} />}
      </section>
      {deleting && isCustomer && (
        <form onSubmit={confirmDelete} noValidate className="card space-y-3 border-2 border-red-200 p-4 sm:p-5">
          <h2 lang={lang} className="text-lg font-extrabold text-red-700">{t({ ta: 'கணக்கை நிரந்தரமாக நீக்கவா?', en: 'Delete your account permanently?' })}</h2>
          <p lang={lang} className="text-sm text-ink/70">{t({ ta: 'உங்கள் உள்நுழைவு, சேமித்த இருப்பிடம், அறிவிப்புகள் நீக்கப்படும். முடிந்த முன்பதிவுகளில் உங்கள் பெயர், எண், முகவரி, படங்கள் அழிக்கப்படும். நடப்பில் உள்ள முன்பதிவுகள் சேவை முடியும் வரை மட்டும் இருக்கும். இதை மாற்ற முடியாது.', en: 'Your login, saved location and notifications are removed. In finished bookings your name, number, address and photos are wiped. Bookings still in progress are kept only until the service is done. This cannot be undone.' })}</p>
          <input className="w-full" type="password" value={delPassword} onChange={(e) => setDelPassword(e.target.value)} autoComplete="current-password"
            placeholder={t({ ta: 'உறுதிப்படுத்த கடவுச்சொல்', en: 'Your password to confirm' })} aria-label="Password" />
          {delError && <p role="alert" lang={lang} className="flex items-start gap-2 text-sm font-semibold text-amber-800"><TriangleAlert size={16} className="mt-0.5 shrink-0" /> {t(delError)}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={delBusy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-70">
              {delBusy && <LoaderCircle size={17} className="animate-spin" />} <span lang={lang}>{t({ ta: 'ஆம், நீக்கு', en: 'Yes, delete' })}</span>
            </button>
            <button type="button" onClick={() => setDeleting(false)} className="btn-ghost !py-3"><span lang={lang}>{t({ ta: 'ரத்து', en: 'Cancel' })}</span></button>
          </div>
        </form>
      )}
      <p lang={lang} className="px-1 text-center text-xs text-ink/45">
        <a href="terms.html" target="_blank" rel="noreferrer" className="underline">{t({ ta: 'விதிமுறைகள்', en: 'Terms' })}</a> · <a href="privacy.html" target="_blank" rel="noreferrer" className="underline">{t({ ta: 'தனியுரிமைக் கொள்கை', en: 'Privacy Policy' })}</a>
      </p>
      {alerts.state === 'denied' && (
        <p lang={lang} className="px-1 text-xs text-ink/50">{t({ ta: 'அறிவிப்புகளை இயக்க உலாவி / ஆப் அமைப்பில் “Notifications” அனுமதியை வழங்கவும்.', en: 'To turn alerts on, allow “Notifications” in the browser / app settings.' })}</p>
      )}
    </div>
  );
}
