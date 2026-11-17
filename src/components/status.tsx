import { MapPin, Star } from 'lucide-react';
import { useLang, type L } from '../i18n/lang';

export const STATUS: Record<string, { v: L; cls: string }> = {
  New: { v: { ta: 'பெறப்பட்டது', en: 'Received' }, cls: 'bg-amber-100 text-amber-800' },
  Assigned: { v: { ta: 'வழங்குநர் ஒதுக்கப்பட்டார்', en: 'Provider assigned' }, cls: 'bg-sky-100 text-sky-800' },
  Accepted: { v: { ta: 'வழங்குநர் ஏற்றுக்கொண்டார்', en: 'Accepted by provider' }, cls: 'bg-indigo-100 text-indigo-800' },
  Confirmed: { v: { ta: 'உறுதி செய்யப்பட்டது', en: 'Confirmed' }, cls: 'bg-peacock/15 text-peacock-dark' },
  ServiceDone: { v: { ta: 'சேவை முடிந்தது · பொருட்கள் திரும்பப் பெற வேண்டும்', en: 'Service done · items to be collected' }, cls: 'bg-orange-100 text-orange-800' },
  Done: { v: { ta: 'நிறைவடைந்தது', en: 'Completed' }, cls: 'bg-emerald-100 text-emerald-800' },
  Cancelled: { v: { ta: 'ரத்து செய்யப்பட்டது', en: 'Cancelled' }, cls: 'bg-red-100 text-red-700' },
  Rejected: { v: { ta: 'நிராகரிக்கப்பட்டது', en: 'Rejected' }, cls: 'bg-rose-100 text-rose-800' },
};

export const STATUS_ORDER = ['New', 'Assigned', 'Accepted', 'Confirmed', 'ServiceDone', 'Done', 'Cancelled', 'Rejected'];

/** Bookings that are over: nothing more happens to them. */
export const CLOSED_STATUSES = ['Done', 'Cancelled', 'Rejected'];
/** The customer (or the admin, to reject) can still stop a booking until the service is done. */
export const CANCELLABLE_STATUSES = ['New', 'Assigned', 'Accepted', 'Confirmed'];

export const SERVICE_LABEL: Record<string, L> = {
  pandal: { ta: 'பந்தல்', en: 'Pandal' },
  lighting: { ta: 'மின்விளக்கு', en: 'Lighting' },
  rentals: { ta: 'வாடகைப் பொருட்கள்', en: 'Rentals' },
};
export const SERVICE_KEYS = Object.keys(SERVICE_LABEL);

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const { t, lang } = useLang();
  const st = STATUS[status];
  return <span lang={lang} className={`chip !py-1 ${st?.cls ?? 'bg-ink/10 text-ink/70'} ${className}`}>{st ? t(st.v) : status}</span>;
}

export function PremiumBadge({ className = '' }: { className?: string }) {
  const { t, lang } = useLang();
  return (
    <span lang={lang} className={`chip !py-0.5 bg-gradient-to-r from-[#1e3a8a] via-[#2563eb] to-[#0ea5e9] text-white shadow-sm ${className}`}>
      <Star size={11} className="fill-current" /> {t({ ta: 'பிரீமியம்', en: 'Premium' })}
    </span>
  );
}

/** Which services an order needs, worked out from what the customer chose. */
export function needsOf(o: { pandal: string; items: string; boardText: string }): string[] {
  const n: string[] = [];
  if (o.pandal || /Additional decoration/i.test(o.items)) n.push('pandal');
  if (/Lighting decoration/i.test(o.items)) n.push('lighting');
  if (/Rental products|Sound service/i.test(o.items)) n.push('rentals');
  return n;
}

export function fmtDate(iso: string, lang: string) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function waLink(mobile: string, text: string) {
  return `https://wa.me/91${mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(text)}`;
}

/** Step-by-step progress of a booking. Rental orders get an extra "Items collected" step. */
export function OrderProgress({ status, hasRentals = false, reason = '' }: { status: string; hasRentals?: boolean; reason?: string }) {
  const { t, lang } = useLang();
  if (status === 'Cancelled' || status === 'Rejected') {
    return (
      <div lang={lang} className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
        <p className="font-semibold">{status === 'Cancelled' ? t({ ta: 'இந்த முன்பதிவு ரத்து செய்யப்பட்டது.', en: 'This booking was cancelled.' }) : t({ ta: 'இந்த முன்பதிவு நிராகரிக்கப்பட்டது.', en: 'This booking was rejected.' })}</p>
        {reason && <p className="mt-0.5">{t({ ta: 'காரணம்', en: 'Reason' })}: {reason}</p>}
      </div>
    );
  }
  const steps: L[] = [
    { ta: 'பெறப்பட்டது', en: 'Received' },
    { ta: 'வழங்குநர் ஒதுக்கீடு', en: 'Provider assigned' },
    { ta: 'ஏற்கப்பட்டது', en: 'Accepted' },
    { ta: 'சேவை முடிந்தது', en: 'Service done' },
    ...(hasRentals ? [{ ta: 'பொருட்கள் திரும்பப் பெறப்பட்டன', en: 'Items collected' }] : []),
    { ta: 'நிறைவு', en: 'Completed' },
  ];
  const at: Record<string, number> = { New: 0, Assigned: 1, Accepted: 2, Confirmed: 2, ServiceDone: 3, Done: steps.length - 1 };
  const current = at[status] ?? 0;
  return (
    <ol className="flex items-start">
      {steps.map((s, i) => {
        const done = i <= current;
        const now = i === current && status !== 'Done';
        return (
          <li key={s.en} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && <span className={`absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2 ${i <= current ? 'bg-primary' : 'bg-slate-200'}`} aria-hidden />}
            <span className={`relative z-10 grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold ring-4 ring-white ${done ? 'bg-primary text-white' : 'bg-slate-200 text-ink/40'} ${now ? 'animate-pulse' : ''}`}>
              {done && !now ? '✓' : i + 1}
            </span>
            <span lang={lang} className={`mt-1.5 px-0.5 text-[10px] font-semibold leading-tight sm:text-[11px] ${done ? 'text-ink' : 'text-ink/40'}`}>{t(s)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** "Open venue in Maps" button, shown to the admin, the provider and the customer when a venue location was shared. */
export function MapChip({ link }: { link: string }) {
  const { t, lang } = useLang();
  return (
    <a href={link} target="_blank" rel="noreferrer" className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
      <MapPin size={12} /> <span lang={lang}>{t({ ta: 'விழா இடம் – வரைபடம்', en: 'Venue on map' })}</span>
    </a>
  );
}
