import { Download, Share, Smartphone, X } from 'lucide-react';
import { useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n/lang';
import { APP_DOWNLOAD } from '../data/config';

/* "Download the app" button.
 * - Android Chrome: opens the real install prompt (the site installs like an app).
 * - iPhone / other browsers: shows the 3 steps to add it to the home screen.
 * - If APP_DOWNLOAD.playUrl or apkUrl is set (src/data/config.ts), the button opens that link instead.
 * It disappears once the app is installed (or when running inside the Play Store app). */

type InstallEvent = Event & { prompt: () => Promise<void> };

let deferred: InstallEvent | null = null;
let installed = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

if (typeof window !== 'undefined') {
  installed = window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  // Chrome fires this once, early: keep it so the button can use it whenever the person taps.
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e as InstallEvent; emit(); });
  window.addEventListener('appinstalled', () => { installed = true; deferred = null; emit(); });
}

const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const snapshot = () => `${installed ? 1 : 0}${deferred ? 1 : 0}`;

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

function HowTo({ onClose }: { onClose: () => void }) {
  const { t, lang } = useLang();
  const ios = isIOS();
  const steps = ios
    ? [
        { ta: 'Safari-யில் கீழே உள்ள பகிர் (Share) பொத்தானைத் தொடவும்.', en: 'In Safari, tap the Share button at the bottom.' },
        { ta: '"Add to Home Screen" என்பதைத் தேர்ந்தெடுக்கவும்.', en: 'Choose "Add to Home Screen".' },
        { ta: '"Add" என்பதைத் தொடவும். ஆப் முகப்புத் திரையில் வந்துவிடும்.', en: 'Tap "Add". The app appears on your home screen.' },
      ]
    : [
        { ta: 'Chrome-ல் மேலே வலது மூலையில் உள்ள ⋮ மெனுவைத் தொடவும்.', en: 'In Chrome, tap the ⋮ menu at the top right.' },
        { ta: '"Install app" அல்லது "Add to Home screen" என்பதைத் தொடவும்.', en: 'Tap "Install app" or "Add to Home screen".' },
        { ta: 'உறுதிப்படுத்தவும். ஆப் முகப்புத் திரையில் வந்துவிடும்.', en: 'Confirm. The app appears on your home screen.' },
      ];
  return createPortal(
    <div className="fixed inset-0 z-[70] grid place-items-end bg-night/60 p-3 backdrop-blur-[2px] sm:place-items-center" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-deep" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white"><Smartphone size={22} /></span>
            <p lang={lang} className="text-base font-extrabold text-ink">{t({ ta: 'ஆப்பை நிறுவ', en: 'Install the app' })}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-ink/70"><X size={16} /></button>
        </div>
        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm text-ink/80">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-extrabold text-primary">{i + 1}</span>
              <span lang={lang}>{t(s)}{ios && i === 0 && <Share size={14} className="ml-1 inline -mt-0.5 text-primary" />}</span>
            </li>
          ))}
        </ol>
        {!ios && (
          <p lang={lang} className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-ink/60">
            {t({ ta: 'WhatsApp போன்ற ஆப்புக்குள் திறந்திருந்தால், முதலில் Chrome-ல் திறக்கவும்.', en: 'If this page is open inside WhatsApp or another app, open it in Chrome first.' })}
          </p>
        )}
        <button type="button" onClick={onClose} className="btn-primary mt-4 w-full !py-2.5 text-sm"><span lang={lang}>{t({ ta: 'சரி', en: 'Got it' })}</span></button>
      </div>
    </div>,
    document.body,
  );
}

export function InstallButton({ variant }: { variant: 'banner' | 'drawer' | 'footer' }) {
  const { t, lang } = useLang();
  const snap = useSyncExternalStore(subscribe, snapshot, () => '00');
  const [help, setHelp] = useState(false);
  const store = APP_DOWNLOAD.playUrl || APP_DOWNLOAD.apkUrl;
  if (snap[0] === '1') return null; // already installed / running as the app

  const start = async () => {
    if (store) { window.open(store, '_blank', 'noopener'); return; }
    if (deferred) {
      const ev = deferred;
      deferred = null;
      emit();
      try { await ev.prompt(); } catch { /* ignore */ }
      return;
    }
    setHelp(true);
  };
  const label = store ? t({ ta: 'ஆப் பதிவிறக்கம்', en: 'Download app' }) : t({ ta: 'ஆப்பை நிறுவுக', en: 'Install app' });
  const modal = help ? <HowTo onClose={() => setHelp(false)} /> : null;

  if (variant === 'banner') {
    return (
      <>
        <button type="button" onClick={start} className="flex w-full items-center gap-3 rounded-xl bg-primary p-3 text-left text-white shadow-card active:scale-[0.99]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15"><Smartphone size={22} /></span>
          <span lang={lang} className="min-w-0 flex-1 leading-tight">
            <span className="block text-sm font-extrabold">{t({ ta: 'ஈவென்ட் தமிழா ஆப்', en: 'Get the Event Tamizha app' })}</span>
            <span className="block text-[11px] text-white/80">{t({ ta: 'வேகமான முன்பதிவு, முகப்புத் திரையில்', en: 'Faster booking, right on your home screen' })}</span>
          </span>
          <span lang={lang} className="shrink-0 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-primary">{label}</span>
        </button>
        {modal}
      </>
    );
  }
  if (variant === 'drawer') {
    return (
      <>
        <button type="button" onClick={start} className="flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-blue-50 py-2.5 text-xs font-bold text-primary">
          <Download size={15} /> <span lang={lang}>{label}</span>
        </button>
        {modal}
      </>
    );
  }
  return (
    <>
      <button type="button" onClick={start} className="btn-gold !px-4 !py-2"><Download size={15} /> <span lang={lang}>{label}</span></button>
      {modal}
    </>
  );
}
