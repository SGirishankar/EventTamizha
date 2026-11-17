import { ArrowLeft, Armchair, BadgePercent, Mail, Search, ShoppingBag, CalendarCheck, Calculator, ClipboardList, Clock, Compass, House, Lightbulb, LogOut, MapPin, Menu, Phone, ShoppingCart, Speaker, Tent, UserRound, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { inr, useLang, type L } from '../i18n/lang';
import { BUSINESS, TOWNS } from '../data/config';
import { useCatalog } from '../state/catalog';
import { useEstimate } from '../state/estimate';
import { homeFor, isStaff, roleOf, useAuth } from '../state/auth';
import { whatsappLink } from '../state/whatsapp';
import { BrandMark, DEMO_NOTE } from './ui';
import { ErrorBoundary } from './ErrorBoundary';
import { Splash, useVisibleCategories } from './app';
import { NotificationBell } from './notifications';
import { InstallButton } from './InstallApp';
import { useCompany } from '../state/company';

export const NAV: { to: string; v: L }[] = [
  { to: '/', v: { ta: 'முகப்பு', en: 'Home' } },
  { to: '/pandals', v: { ta: 'பந்தல் வகைகள்', en: 'Pandal Types' } },
  { to: '/lighting', v: { ta: 'மின்விளக்கு அலங்காரம்', en: 'Lighting Decoration' } },
  { to: '/rentals', v: { ta: 'வாடகைப் பொருட்கள்', en: 'Rental Products' } },
  { to: '/offers', v: { ta: 'சலுகைகள்', en: 'Offers' } },
  { to: '/contact', v: { ta: 'தொடர்புக்கு', en: 'Contact Us' } },
];

const EXTRA_NAV: { to: string; v: L }[] = [
  { to: '/estimate', v: { ta: 'விலை மதிப்பீடு', en: 'Get an Estimate' } },
];

export const BOOK_NOW: L = { ta: 'முன்பதிவு செய்யுங்கள்', en: 'Book Now' };
export const GET_ESTIMATE: L = { ta: 'விலை மதிப்பீடு', en: 'Get an Estimate' };

export function WhatsAppIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2s.2-1.1.1-1.2-.2-.2-.5-.3z" />
    </svg>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  const base = 'rounded-full px-2.5 py-1.5 text-xs font-bold transition sm:px-3.5';
  return (
    <div className="flex rounded-full bg-ink/5 p-1" role="group" aria-label="Language / மொழி">
      <button type="button" lang="ta" onClick={() => setLang('ta')} aria-pressed={lang === 'ta'} aria-label="தமிழ்"
        className={`${base} ${lang === 'ta' ? 'bg-primary text-white shadow' : 'text-ink/60 hover:text-ink'}`}>
        <span className="sm:hidden">த</span><span className="hidden sm:inline">தமிழ்</span>
      </button>
      <button type="button" lang="en" onClick={() => setLang('en')} aria-pressed={lang === 'en'} aria-label="English"
        className={`${base} ${lang === 'en' ? 'bg-primary text-white shadow' : 'text-ink/60 hover:text-ink'}`}>
        <span className="sm:hidden">EN</span><span className="hidden sm:inline">English</span>
      </button>
    </div>
  );
}

function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  useCompany();
  const { t, lang } = useLang();
  const tamizha = BUSINESS.name.en === 'Event Tamizha' && lang === 'en';
  return (
    <Link to="/" className={`flex items-center gap-2 sm:gap-2.5 ${compact ? 'min-w-0' : 'shrink-0'}`}>
      <BrandMark className={compact ? 'h-11 w-11 sm:h-12 sm:w-12' : 'h-12 w-12'} />
      <span className={`min-w-0 leading-tight ${compact ? 'hidden min-[430px]:block' : ''}`}>
        <span className={`block ${compact ? 'truncate' : 'whitespace-nowrap'} font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight sm:text-2xl ${light ? 'text-white' : 'text-ink'}`}>
          {tamizha
            ? <>Event <span className={light ? 'text-[#FFC83D]' : 'text-[#E8590C]'}>Tamizha</span></>
            : <span lang={lang} className="block max-w-[11rem] truncate sm:max-w-[16rem]">{t(BUSINESS.name)}</span>}
        </span>
        <span lang={lang} className={`${compact ? 'hidden sm:block' : 'block'} whitespace-nowrap text-[10px] font-semibold leading-tight sm:text-[11px] sm:tracking-wide ${light ? 'text-sky-200' : 'text-ink/50'}`}>{t(BUSINESS.descriptor)}</span>
      </span>
    </Link>
  );
}

const mainLinkLabel = (role: ReturnType<typeof roleOf>): L =>
  role === 'Admin' ? { ta: 'நிர்வாகப் பலகை', en: 'Admin Panel' } : role === 'Provider' ? { ta: 'என் பணிகள்', en: 'My Jobs' } : { ta: 'என் முன்பதிவுகள்', en: 'My Orders' };

/** Header avatar: opens a small menu with the user's pages and Log out. Logged-out visitors get a plain Log in icon. */
function AccountMenu() {
  const { t, lang } = useLang();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('touchstart', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', away);
      document.removeEventListener('touchstart', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  if (!user) {
    return (
      <Link to="/account" aria-label="Log in" className="hidden h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/5 text-primary hover:bg-primary/10 sm:grid">
        <UserRound size={20} />
      </Link>
    );
  }
  const role = roleOf(user);
  const item = 'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold hover:bg-primary/5';
  return (
    <div ref={box} className="relative hidden sm:block">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu"
        className="grid h-11 w-11 place-items-center rounded-full bg-primary text-base font-extrabold text-white transition hover:brightness-110">
        {user.name.trim().charAt(0).toUpperCase() || <UserRound size={18} />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-3 w-64 rounded-2xl bg-white p-2 shadow-deep ring-1 ring-gold-2/25">
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate font-extrabold text-ink">{user.name}</p>
            <p className="text-xs text-ink/55">+91 {user.mobile}</p>
            {role !== 'Customer' && (
              <span lang={lang} className="chip mt-1.5 bg-blue-50 !py-0.5 text-primary">
                {role === 'Admin' ? t({ ta: 'நிர்வாகி', en: 'Admin' }) : `${user.tier === 'Premium' ? '★ ' : ''}${t({ ta: 'சேவை வழங்குநர்', en: 'Service Provider' })}`}
              </span>
            )}
          </div>
          <div className="border-t border-ink/10 pt-1">
            <Link role="menuitem" to={homeFor(user)} className={item}><ClipboardList size={16} className="text-primary" /> <span lang={lang}>{t(mainLinkLabel(role))}</span></Link>
            <Link role="menuitem" to="/account" className={item}><UserRound size={16} className="text-primary" /> <span lang={lang}>{t({ ta: 'என் கணக்கு', en: 'My Account' })}</span></Link>
            <button role="menuitem" type="button" onClick={() => { setOpen(false); logout(); nav('/'); }} className={`${item} text-red-700 hover:!bg-red-50`}>
              <LogOut size={16} /> <span lang={lang}>{t({ ta: 'வெளியேற', en: 'Log out' })}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Titles shown in the phone top bar. */
function titleFor(pathname: string): L | null {
  const all: { to: string; v: L }[] = [
    ...NAV, ...EXTRA_NAV,
    { to: '/explore', v: { ta: 'பிரிவுகள்', en: 'Categories' } },
    { to: '/account', v: { ta: 'என் கணக்கு', en: 'My Account' } },
    { to: '/orders', v: { ta: 'என் முன்பதிவுகள்', en: 'My Bookings' } },
    { to: '/booking', v: BOOK_NOW },
    { to: '/cart', v: { ta: 'என் கூடை', en: 'My Cart' } },
    { to: '/admin', v: { ta: 'நிர்வாகப் பலகை', en: 'Admin Panel' } },
    { to: '/provider', v: { ta: 'என் பணிகள்', en: 'My Jobs' } },
  ];
  return all.find((n) => n.to === pathname)?.v ?? null;
}

/** Phone top bar: menu on Home, back arrow + title everywhere else (like the app mock-up). */
function AppBar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { t, lang } = useLang();
  const { enabled: accounts, user } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const home = pathname === '/';
  const title = titleFor(pathname);
  const round = 'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/5 text-ink sm:h-10 sm:w-10';
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-2 sm:gap-2 sm:px-3">
      {home ? (
        <button type="button" onClick={onToggle} aria-expanded={open} aria-label="Menu" className={round}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      ) : (
        <button type="button" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label="Back" className={round}><ArrowLeft size={20} /></button>
      )}
      <div className="min-w-0 flex-1">
        {home ? <Logo compact /> : <p lang={lang} className="truncate text-lg font-extrabold text-ink">{title ? t(title) : t(BUSINESS.name)}</p>}
      </div>
      <LangToggle />
      <NotificationBell compact />
      {!home && (
        <button type="button" onClick={onToggle} aria-expanded={open} aria-label="Menu" className={round}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      )}
      {home && accounts && (
        <Link to={user ? '/account' : '/account'} aria-label="Account" className={`${round} ${user ? '!bg-primary font-extrabold !text-gold-1' : ''}`}>
          {user ? user.name.trim().charAt(0).toUpperCase() : <UserRound size={19} />}
        </Link>
      )}
    </div>
  );
}

/** Bottom tabs on phones: Home · Explore · Bookings · Estimate · Profile. */
function TabBar() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { breakdown: cart } = useEstimate();
  const cartCount = (cart.pandal && cart.areaSqft > 0 ? 1 : 0) + Object.values(cart.lines).reduce((n, ls) => n + ls.length, 0);
  const staffTabs: { to: string; icon: typeof House; v: L; match: (p: string) => boolean; badge?: number }[] = isStaff(user) ? [
    { to: homeFor(user), icon: ClipboardList, v: mainLinkLabel(roleOf(user)), match: (p) => p === homeFor(user) },
    { to: '/account', icon: UserRound, v: { ta: 'கணக்கு', en: 'Profile' }, match: (p) => p === '/account' },
  ] : [];
  const customerTabs: { to: string; icon: typeof House; v: L; match: (p: string) => boolean; badge?: number }[] = [
    { to: '/', icon: House, v: { ta: 'முகப்பு', en: 'Home' }, match: (p) => p === '/' },
    { to: '/explore', icon: Compass, v: { ta: 'பிரிவுகள்', en: 'Explore' }, match: (p) => ['/explore', '/pandals', '/lighting', '/rentals', '/sound'].includes(p) },
    { to: user ? homeFor(user) : '/orders', icon: CalendarCheck, v: { ta: 'என் முன்பதிவு', en: 'My Bookings' }, match: (p) => p === '/orders' || p === '/booking' },
    { to: '/cart', icon: ShoppingCart, v: { ta: 'கூடை', en: 'Cart' }, match: (p) => p === '/cart' || p === '/estimate', badge: cartCount },
    { to: '/account', icon: UserRound, v: { ta: 'கணக்கு', en: 'Profile' }, match: (p) => p === '/account' },
  ];
  const tabs = isStaff(user) ? staffTabs : customerTabs;
  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white px-1 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5 md:hidden print:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const on = tab.match(pathname);
          return (
            <li key={tab.v.en}>
              <Link to={tab.to} aria-current={on ? 'page' : undefined} className={`relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-semibold leading-tight transition ${on ? 'text-primary' : 'text-ink/45'}`}>
                                <span className={`relative grid h-8 w-12 place-items-center rounded-full transition ${on ? 'bg-blue-50 text-primary' : ''}`}>
                  <tab.icon size={19} strokeWidth={on ? 2.2 : 1.8} />
                  {tab.badge ? <span className="absolute right-1 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-extrabold text-white ring-2 ring-white">{tab.badge}</span> : null}
                </span>
                <span lang={lang} className="max-w-full truncate">{t(tab.v)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const NAV_ICONS: Record<string, typeof House> = {
  '/': House, '/pandals': Tent, '/lighting': Lightbulb, '/rentals': Armchair, '/sound': Speaker, '/offers': BadgePercent, '/contact': Phone, '/estimate': Calculator,
};

const CAT_PAGE: Record<string, string> = { decor: '/pandals', lighting: '/lighting', rentals: '/rentals', sound: '/sound' };

/** Flipkart-style search box with live suggestions (categories + catalogue items). */
function HeaderSearch() {
  const { t, lang } = useLang();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [focus, setFocus] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => setQ(''), [pathname]);
  const needle = q.trim().toLowerCase();
  const hit = (l: L) => l.ta.toLowerCase().includes(needle) || l.en.toLowerCase().includes(needle);
  const { items: all } = useCatalog();
  const visibleCats = useVisibleCategories();
  const cats = needle ? visibleCats.filter((c) => hit(c.title) || hit(c.sub)).slice(0, 4) : visibleCats.slice(0, 5);
  const items = needle ? all.filter((i) => hit(i.name)).slice(0, 6) : [];
  const go = (to: string) => { setQ(''); setFocus(false); nav(to); };
  return (
    <form role="search" onSubmit={(e) => { e.preventDefault(); go(needle ? `/explore?q=${encodeURIComponent(q.trim())}` : '/explore'); }}
      className="relative mx-auto min-w-0 max-w-xl flex-1">
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-primary/70" />
      <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder={t({ ta: 'பந்தல், விளக்கு, நாற்காலி, ஜெனரேட்டர் தேடுக…', en: 'Search pandals, lights, chairs, generators…' })}
        className="w-full !rounded-xl !border-transparent !bg-primary/[0.06] !py-2.5 !pl-11 !pr-4 text-sm !shadow-none transition hover:!bg-primary/10 focus:!border-gold-2/50 focus:!bg-white" aria-label="Search" />
      {focus && (cats.length > 0 || items.length > 0) && (
        <div className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl bg-white py-1.5 shadow-deep ring-1 ring-gold-2/20">
          {cats.map((c) => (
            <button key={c.to} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(c.to)}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-primary/5 hover:text-primary">
              <c.icon size={16} className="shrink-0 text-gold-2" /> <span lang={lang} className="truncate font-semibold">{t(c.title)}</span>
              <span lang={lang} className="ml-auto hidden truncate text-xs text-ink/40 lg:inline">{t(c.sub)}</span>
            </button>
          ))}
          {items.map((i) => (
            <button key={i.id} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(CAT_PAGE[i.category] ?? '/estimate')}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition hover:bg-primary/5 hover:text-primary">
              <Search size={14} className="shrink-0 text-ink/30" /> <span lang={lang} className="truncate">{t(i.name)}</span>
              <span className="ml-auto text-xs font-bold text-ink/50">{inr(i.price)}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}

/** The cart (everything chosen), with a badge counting the chosen items. */
function CartLink() {
  const { t, lang } = useLang();
  const { state, breakdown } = useEstimate();
  const n = Object.values(state.qty).filter((q) => q > 0).length + (state.pandalId ? 1 : 0);
  return (
    <Link to="/cart" className="group relative flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-bold text-ink/80 transition hover:bg-primary/5 hover:text-primary">
      <span className="relative">
        <ShoppingBag size={21} className="transition group-hover:-translate-y-0.5" />
        {n > 0 && <span className="absolute -right-2 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-gold-1 ring-2 ring-white">{n}</span>}
      </span>
      <span className="hidden leading-tight xl:block">
        <span lang={lang} className="block text-[11px] font-semibold text-ink/50">{t({ ta: 'கூடை', en: 'Cart' })}</span>
        <span className="block">{breakdown.hasAnything ? inr(breakdown.total) : '—'}</span>
      </span>
    </Link>
  );
}

/** Compact slide-in side menu (phones and laptops narrower than the full nav bar). */
function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang } = useLang();
  const { enabled: accounts, user, logout } = useAuth();
  const nav = useNavigate();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = prev; };
  }, [open, onClose]);
  const role = roleOf(user);
  return createPortal(
    <div className={`fixed inset-0 z-[60] print:hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-night/55 backdrop-blur-[2px] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} />
      <nav aria-label="Menu" className={`absolute inset-y-0 left-0 flex w-[min(17.5rem,82vw)] flex-col bg-white shadow-deep transition-transform duration-300 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="relative border-b border-slate-200 bg-white px-4 pb-4 pt-[max(env(safe-area-inset-top),1rem)]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 overflow-hidden"><Logo /></div>
            <button type="button" onClick={onClose} aria-label="Close menu" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-ink/70"><X size={16} /></button>
          </div>
          {accounts && (
            <Link to="/account" onClick={onClose} className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary font-extrabold text-white">
                {user ? user.name.trim().charAt(0).toUpperCase() : <UserRound size={17} />}
              </span>
              <span className="min-w-0 leading-tight">
                <span lang={lang} className="block truncate text-sm font-bold">{user ? user.name : t({ ta: 'உள்நுழைய / பதிவு', en: 'Log in / Sign up' })}</span>
                <span lang={lang} className="block truncate text-[11px] text-ink/50">
                  {user ? (role === 'Admin' ? t({ ta: 'நிர்வாகி', en: 'Admin' }) : role === 'Provider' ? t({ ta: 'சேவை வழங்குநர்', en: 'Service Provider' }) : `+91 ${user.mobile}`) : t({ ta: 'உங்கள் முன்பதிவுகளைப் பார்க்க', en: 'See your bookings' })}
                </span>
              </span>
            </Link>
          )}
        </div>
                <ul className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-2">
          {user && role !== 'Customer' && (
            <li>
              <NavLink to={homeFor(user)} onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${isActive ? 'bg-blue-50 text-primary' : 'bg-slate-50 text-ink'}`}>
                <ClipboardList size={17} /> <span lang={lang}>{t(mainLinkLabel(role))}</span>
              </NavLink>
            </li>
          )}
          {isStaff(user) && (
            <li>
              <NavLink to="/account" onClick={onClose} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-blue-50 text-primary' : 'text-ink/75 hover:bg-slate-50'}`}>
                <UserRound size={17} className="text-gold-2" /> <span lang={lang}>{t({ ta: 'என் கணக்கு', en: 'My Account' })}</span>
              </NavLink>
            </li>
          )}
          {!isStaff(user) && [...NAV, ...EXTRA_NAV].map((n) => {
            const I = NAV_ICONS[n.to] ?? House;
            return (
              <li key={n.to}>
                <NavLink to={n.to} end={n.to === '/'} onClick={onClose}
                  className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-blue-50 text-primary' : 'text-ink/75 hover:bg-slate-50 hover:text-primary'}`}>
                  {({ isActive }) => (
                    <>
                      <I size={17} className={isActive ? 'text-primary' : 'text-ink/40'} strokeWidth={1.9} />
                      <span lang={lang} className="min-w-0 flex-1 truncate">{t(n.v)}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
        <div className="space-y-2 border-t border-slate-200 bg-white p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          {!isStaff(user) && <InstallButton variant="drawer" />}
          {!isStaff(user) && (
            <div className="grid grid-cols-2 gap-2">
              <Link to="/estimate" onClick={onClose} className="btn-gold !px-2 !py-2.5 !text-xs"><span lang={lang}>{t(GET_ESTIMATE)}</span></Link>
              <Link to="/booking" onClick={onClose} className="btn-primary !px-2 !py-2.5 !text-xs"><span lang={lang}>{t(BOOK_NOW)}</span></Link>
            </div>
          )}
          {user && (
            <button type="button" onClick={() => { onClose(); logout(); nav('/'); }} className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold text-red-700 hover:bg-red-50">
              <LogOut size={14} /> <span lang={lang}>{t({ ta: 'வெளியேற', en: 'Log out' })}</span>
            </button>
          )}
        </div>
      </nav>
    </div>,
    document.body,
  );
}

function Header() {
  useCompany();
  const { t, lang } = useLang();
  const { enabled: accounts, user } = useAuth();
  const staff = isStaff(user);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const [scrolled, setScrolled] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <header className="sticky top-0 z-40 print:hidden">
      <div className="hidden border-b border-slate-200 bg-slate-50 text-ink/60 md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-1.5 text-xs">
          <p lang={lang} className="min-w-0"><MapPin size={13} className="mr-1.5 inline -mt-0.5 text-primary" /><span className="hidden lg:inline">{t({ ta: 'கோவை · ஈரோடு · சேலம் · மதுரை · திருப்பூர் · சென்னை மற்றும் தமிழகம் முழுவதும் சேவை', en: 'Serving Coimbatore · Erode · Salem · Madurai · Tiruppur · Chennai & all Tamil Nadu' })}</span><span className="lg:hidden">{t({ ta: 'தமிழகம் முழுவதும் சேவை', en: 'Serving all Tamil Nadu' })}</span></p>
          <div className="flex shrink-0 items-center gap-4 font-semibold">
            <a href={whatsappLink(lang)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:text-primary-dark"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>
            <a href={BUSINESS.phoneHref} className="flex items-center gap-1 text-primary hover:text-primary-dark"><Phone size={13} /> {BUSINESS.phoneDisplay}</a>
          </div>
        </div>
      </div>
      <div className={`bg-white/95 backdrop-blur transition-shadow ${scrolled ? 'shadow-card' : ''}`}>
        <div className="md:hidden"><AppBar open={open} onToggle={() => setOpen((o) => !o)} /></div>
        <div className="mx-auto hidden max-w-7xl items-center gap-4 px-6 py-3 md:flex">
          <button type="button" onClick={() => setOpen((o) => !o)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-primary/10 hover:text-primary" aria-expanded={open} aria-label="Menu">
            <Menu size={20} />
          </button>
          <Logo />
          {staff ? <div className="flex-1" /> : <HeaderSearch />}
          <div className="flex shrink-0 items-center gap-2">
            <LangToggle />
            {accounts && <NotificationBell />}
            {accounts && <AccountMenu />}
            {!staff && <CartLink />}
            {!staff && <Link to="/booking" className="btn-primary hidden whitespace-nowrap !py-2.5 lg:inline-flex"><span lang={lang}>{t(BOOK_NOW)}</span></Link>}
          </div>
        </div>
        <nav className={`hidden border-t border-gold-2/15 bg-white ${staff ? '' : 'lg:block'}`} aria-label="Main">
          <ul className="mx-auto flex max-w-7xl items-center gap-0.5 overflow-x-auto px-6 [scrollbar-width:none] xl:justify-between">
            {[...NAV.slice(1), EXTRA_NAV[0]].map((n) => (
              <li key={n.to} className="shrink-0">
                <NavLink to={n.to}
                  className={({ isActive }) => `group relative flex items-center gap-1.5 whitespace-nowrap px-2 py-2.5 text-[13px] font-semibold transition ${isActive ? 'text-primary' : 'text-ink/70 hover:text-primary'}`}>
                  {({ isActive }) => {
                    const I = NAV_ICONS[n.to] ?? House;
                    return (
                      <>
                        <I size={15} className="hidden text-ink/40 transition group-hover:text-primary 2xl:block" />
                        <span lang={lang}>{t(n.v)}</span>
                        <span className={`absolute inset-x-2 -bottom-px h-[3px] rounded-t-full bg-primary transition-transform duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                      </>
                    );
                  }}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
                <Drawer open={open} onClose={close} />
      </div>
    </header>
  );
}

/** Phone: bottom tabs + WhatsApp button. Desktop: floating WhatsApp button. */
function ActionBar() {
  const { user } = useAuth();
  const { breakdown, state } = useEstimate();
  const { lang } = useLang();
  const loc = useLocation();
  // Phones: keep the screen clean. The WhatsApp button only appears on browse/contact pages.
  const BROWSE = ['/', '/explore', '/pandals', '/lighting', '/rentals', '/sound', '/offers'];
  const browsing = BROWSE.includes(loc.pathname);
  const phoneChat = browsing || loc.pathname === '/contact';
  const staffPage = loc.pathname.startsWith('/admin') || loc.pathname.startsWith('/provider');
  const wa = whatsappLink(lang, { b: breakdown, s: state });
  // Hide the floating WhatsApp button while a section that needs the space is on screen.
  const [covered, setCovered] = useState(false);
  useEffect(() => {
    const els = document.querySelectorAll('[data-hide-fab]');
    if (!els.length) return setCovered(false);
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
      setCovered(seen.size > 0);
    });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loc.pathname]);
  if (staffPage || isStaff(user)) return null; // admin & provider screens have their own actions
  return (
    <>
      <div className="md:hidden print:hidden">
        {!covered && phoneChat && (
          <a href={wa} target="_blank" rel="noreferrer" aria-label="WhatsApp"
            className="fixed bottom-[calc(4.9rem+env(safe-area-inset-bottom))] right-4 z-30 grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/40">
            <WhatsAppIcon className="h-5 w-5" />
          </a>
        )}
        <TabBar />
      </div>
      <div className="fixed bottom-6 right-6 z-30 hidden flex-col items-end gap-3 md:flex print:hidden">
        <a href={wa} target="_blank" rel="noreferrer" className="floaty grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-[#25D366]/40" aria-label="WhatsApp">
          <WhatsAppIcon className="h-7 w-7" />
        </a>
      </div>
    </>
  );
}

function Footer() {
  useCompany();
  const { t, lang } = useLang();
  const { user } = useAuth();
  if (isStaff(user)) return null; // the footer only links to customer pages
  return (
    <footer className="relative mt-10 overflow-hidden bg-night text-white/80 print:hidden">
      <div className="garland" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-marigold/20 blur-3xl" />
      <div className="relative mx-auto grid grid-cols-1 max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Logo light />
          <p lang={lang} className="mt-4 text-sm">{t(BUSINESS.about)}</p>
          <p lang={lang} className="mt-2 text-sm font-semibold text-turmeric">{t(BUSINESS.tagline)}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={whatsappLink(lang)} target="_blank" rel="noreferrer" className="btn-whatsapp !px-4 !py-2"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>
            <a href={BUSINESS.phoneHref} className="btn-outline !px-4 !py-2 text-white"><Phone size={15} /> <span lang={lang}>{t({ ta: 'அழைக்க', en: 'Call' })}</span></a>
            <InstallButton variant="footer" />
          </div>
        </div>
        <div>
          <h3 lang={lang} className="mb-4 text-lg font-bold text-white">{t({ ta: 'சேவைகள்', en: 'Services' })}</h3>
          <ul className="space-y-2 text-sm">
            {[...NAV.slice(1, 5), ...EXTRA_NAV].map((n) => (
              <li key={n.to}><Link className="hover:text-turmeric" to={n.to}><span lang={lang}>{t(n.v)}</span></Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 lang={lang} className="mb-4 text-lg font-bold text-white">{t({ ta: 'சேவைப் பகுதிகள்', en: 'Areas we serve' })}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {TOWNS.map((x) => <li key={x.en} lang={lang} className="rounded-full bg-white/5 px-2.5 py-1 text-xs ring-1 ring-white/10">{t(x)}</li>)}
          </ul>
        </div>
        <div>
          <h3 lang={lang} className="mb-4 text-lg font-bold text-white">{t({ ta: 'தொடர்புக்கு', en: 'Contact' })}</h3>
          <p lang={lang} className="flex gap-2 text-sm"><MapPin size={16} className="mt-0.5 shrink-0 text-gold-1" />{t(BUSINESS.address)}</p>
          <p className="mt-3 text-sm"><a href={BUSINESS.phoneHref} className="flex items-center gap-2 hover:text-gold-1"><Phone size={16} className="text-gold-1" /> {BUSINESS.phoneDisplay}</a></p>
          <p lang={lang} className="mt-3 flex items-center gap-2 text-sm"><Clock size={16} className="text-gold-1" />{t(BUSINESS.hours)}</p>
          {BUSINESS.email && <p className="mt-3 text-sm"><a href={`mailto:${BUSINESS.email}`} className="flex items-center gap-2 break-all hover:text-gold-1"><Mail size={16} className="shrink-0 text-gold-1" /> {BUSINESS.email}</a></p>}
        </div>
      </div>
      <div className="relative border-t border-white/10 px-4 py-5 pb-24 text-center text-xs text-white/50 md:pb-5">
        <p lang={lang}>{t(DEMO_NOTE)}</p>
        <p className="mt-1">
          © {new Date().getFullYear()} {t(BUSINESS.name)} · <Link to="/credits" className="underline hover:text-turmeric"><span lang={lang}>{t({ ta: 'புகைப்பட நன்றி', en: 'Photo credits' })}</span></Link>
        </p>
        <p lang={lang} className="mt-1 font-semibold text-white/70">
          {t({ ta: 'நிறுவியவர்: நைட்மேர் டெக்னாலஜிஸ்', en: 'Founded by Knightmare Technologies' })}
        </p>
        <p lang={lang} className="mt-1">
          <a href="terms.html" className="underline hover:text-turmeric">{t({ ta: 'விதிமுறைகள்', en: 'Terms' })}</a> · <a href="privacy.html" className="underline hover:text-turmeric">{t({ ta: 'தனியுரிமை', en: 'Privacy' })}</a> · <a href="delete-account.html" className="underline hover:text-turmeric">{t({ ta: 'கணக்கு நீக்கம்', en: 'Delete account' })}</a>
        </p>
      </div>
    </footer>
  );
}

/** Admin and Provider only ever see their own dashboard (and their account page) — never the customer pages. */
const STAFF_ALLOWED = ['/account', '/credits'];

export function Layout() {
  const { pathname, hash } = useLocation();
  const { user } = useAuth();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) return void setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  if (isStaff(user) && pathname !== homeFor(user) && !STAFF_ALLOWED.includes(pathname)) return <Navigate to={homeFor(user)} replace />;
  return (
    <div className="flex min-h-screen flex-col">
      <Splash />
      <Header />
      <main className="flex-1 pb-24 md:pb-0">
        <ErrorBoundary resetKey={pathname}><Outlet /></ErrorBoundary>
      </main>
      <Footer />
      <ActionBar />
    </div>
  );
}
