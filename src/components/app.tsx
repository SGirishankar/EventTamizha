import { Armchair, Lightbulb, Speaker, Tent, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLang, type L } from '../i18n/lang';
import { BUSINESS, type PhotoKey } from '../data/config';
import { useCatalog } from '../state/catalog';
import { useCompany } from '../state/company';

/** Re-renders when a CSS media query starts or stops matching. */
export function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** Phone-sized screens get the app-style layout (bottom tabs, category grid). */
export const useIsApp = () => useMedia('(max-width: 767px)');

export type Category = { to: string; photo: PhotoKey; icon: LucideIcon; title: L; sub: L };

export const CATEGORIES: Category[] = [
  { to: '/pandals', photo: 'samiyana', icon: Tent, title: { ta: 'பந்தல் வகைகள்', en: 'Pandal Types' }, sub: { ta: 'ஷீட் | தீனோலை | சாமியானா', en: 'Sheet | Theenolai | Samiyana' } },
  { to: '/lighting', photo: 'lit-pandal', icon: Lightbulb, title: { ta: 'மின்விளக்கு அலங்காரம்', en: 'Lighting Decoration' }, sub: { ta: 'சீரியல் | மேடை | நுழைவு விளக்கு', en: 'Serial | Stage | Entrance lights' } },
  { to: '/rentals', photo: 'annadanam-canopy', icon: Armchair, title: { ta: 'வாடகைப் பொருட்கள்', en: 'Rental Products' }, sub: { ta: 'நாற்காலி | மேசை | ஜெனரேட்டர்', en: 'Chairs | Tables | Generator' } },
  { to: '/sound', photo: 'lit-pandal', icon: Speaker, title: { ta: 'ஒலி சேவை', en: 'Sound Service' }, sub: { ta: 'மைக் செட் | ஸ்பீக்கர் | DJ', en: 'Mic set | Speakers | DJ' } },
];

/** The category cards to show: “Sound service” appears only once the admin has added something to it. */
export function useVisibleCategories(): Category[] {
  const { items } = useCatalog();
  const hasSound = items.some((i) => i.category === 'sound');
  return CATEGORIES.filter((c) => c.to !== '/sound' || hasSound);
}

/** Full-screen welcome shown once per visit on phones: temple-maroon with the gopuram skyline. */
export function Splash() {
  useCompany();
  const { t, lang } = useLang();
  const isApp = useIsApp();
  const [show, setShow] = useState(() => {
    try { return !sessionStorage.getItem('event360-splash'); } catch { return true; }
  });
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!show) return;
    try { sessionStorage.setItem('event360-splash', '1'); } catch { /* private mode */ }
    const a = setTimeout(() => setLeaving(true), 700);
    const b = setTimeout(() => setShow(false), 1000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [show]);

  if (!show || !isApp) return null;
  return (
    <div aria-hidden className={`fixed inset-0 z-[1000] grid place-items-center overflow-hidden bg-gradient-to-b from-primary via-primary-dark to-wine text-center text-white transition-opacity duration-300 ${leaving ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative z-10 px-8">
        <img src="logo.webp" alt={t(BUSINESS.name)} width={512} height={512} className="mx-auto h-48 w-48 object-contain drop-shadow-2xl" />
        <p lang={lang} className="mt-2 text-sm text-white/85">{t(BUSINESS.descriptor)}</p>
        <div className="mx-auto my-4 h-px w-40 bg-gradient-to-r from-transparent via-gold-1 to-transparent" />
        <p className="font-[family-name:var(--font-display)] text-lg italic text-gold-1">Every Celebration, One Place!</p>
        <p lang="ta" className="mt-1 text-sm text-white/80">நம்ம ஊர் விழா, நம்ம மகிழ்ச்சி!</p>
      </div>
      <svg viewBox="0 0 400 150" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 w-full" aria-hidden>
        <defs><linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfdbfe" /><stop offset="1" stopColor="#3b82f6" /></linearGradient></defs>
        <circle cx="200" cy="96" r="56" fill="url(#sun)" opacity=".9" />
        <g fill="#0a1128">
          <rect x="132" y="108" width="136" height="42" /><rect x="144" y="92" width="112" height="16" /><rect x="156" y="78" width="88" height="14" />
          <rect x="167" y="66" width="66" height="12" /><rect x="176" y="55" width="48" height="11" /><rect x="185" y="46" width="30" height="9" />
          <rect x="196" y="32" width="8" height="14" /><circle cx="200" cy="29" r="5" />
          <rect x="0" y="136" width="400" height="14" />
          {[56, 332].map((x) => (
            <g key={x}>
              <path d={`M${x} 140 Q${x + 4} 110 ${x} 84`} stroke="#0a1128" strokeWidth="4" fill="none" />
              <ellipse cx={x - 14} cy="84" rx="16" ry="4" transform={`rotate(-25 ${x - 14} 84)`} /><ellipse cx={x + 14} cy="84" rx="16" ry="4" transform={`rotate(25 ${x + 14} 84)`} />
              <ellipse cx={x - 8} cy="78" rx="14" ry="3.5" transform={`rotate(-60 ${x - 8} 78)`} /><ellipse cx={x + 8} cy="78" rx="14" ry="3.5" transform={`rotate(60 ${x + 8} 78)`} />
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
