import { BellRing, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../i18n/lang';
import { showBanner } from '../native/push';
import { useAuth } from '../state/auth';
import { useDeviceAlerts } from './notifications';

const SNOOZE_KEY = 'event360-alert-ask';
const ASK_AGAIN_MS = 2 * 86400000; // "Later" asks again after 2 days

function snoozed(): boolean {
  try { return Date.now() - Number(localStorage.getItem(SNOOZE_KEY) || 0) < ASK_AGAIN_MS; } catch { return false; }
}

/**
 * A friendly sheet that asks to allow notifications as soon as a customer / provider / admin is signed in (the phone's own
 * permission box is easy to dismiss without understanding it). “Allow” opens the system prompt. If they said no before, a small
 * note explains where to switch it back on. Renders nothing when alerts are already on or not possible on this device.
 */
export function NotificationPrompt() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const alerts = useDeviceAlerts();
  const [hidden, setHidden] = useState(snoozed);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false); // wait a moment so the phone can report "already allowed" before we ask

  useEffect(() => { if (!user) setHidden(snoozed()); }, [user]);
  useEffect(() => {
    if (!user) { setReady(false); return; }
    const id = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(id);
  }, [user]);

  if (!user || !ready || hidden || alerts.state === 'granted' || alerts.state === 'unsupported') return null;
  const denied = alerts.state === 'denied';

  const later = () => {
    try { localStorage.setItem(SNOOZE_KEY, String(Date.now())); } catch { /* private mode */ }
    setHidden(true);
  };
  const allow = async () => {
    setBusy(true);
    await alerts.enable();
    setBusy(false);
    void showBanner(
      t({ ta: '🔔 அறிவிப்புகள் இயக்கப்பட்டன', en: '🔔 Notifications are on' }),
      t({ ta: 'உங்கள் முன்பதிவு தகவல்கள் இனி இங்கே வரும்.', en: 'Your booking updates will now appear here.' }),
    );
  };

  return createPortal(
    <div role="dialog" aria-label={t({ ta: 'அறிவிப்புகளை அனுமதிக்க', en: 'Allow notifications' })}
      className="fixed inset-x-3 bottom-[max(env(safe-area-inset-bottom),0.75rem)] z-[95] mx-auto max-w-md rounded-3xl bg-white p-5 shadow-deep ring-1 ring-primary/20 print:hidden md:bottom-6">
      <button type="button" onClick={later} aria-label={t({ ta: 'மூடு', en: 'Close' })} className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-ink/40 hover:bg-slate-100"><X size={16} /></button>
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><BellRing size={22} /></span>
        <div className="min-w-0 flex-1 pr-6">
          <p lang={lang} className="text-base font-extrabold text-ink">
            {denied ? t({ ta: 'அறிவிப்புகள் அணைக்கப்பட்டுள்ளன', en: 'Notifications are switched off' }) : t({ ta: 'முக்கிய தகவல்களைத் தவறவிடாதீர்கள்', en: 'Never miss an update' })}
          </p>
          <p lang={lang} className="mt-1 text-sm text-ink/70">
            {denied
              ? t({ ta: 'தொலைபேசி “Settings → Apps → Event Tamizha → Notifications” சென்று இயக்குங்கள். அப்போது முன்பதிவு தகவல்கள் திரையின் மேலேயும் லாக் ஸ்கிரீனிலும் தெரியும்.', en: 'Open phone “Settings → Apps → Event Tamizha → Notifications” and turn them on. Then booking updates show at the top of the screen and on the lock screen.' })
              : t({ ta: 'முன்பதிவு உறுதி, வழங்குநர் ஒதுக்கீடு, நிலை மாற்றங்கள் — ஆப் மூடியிருந்தாலும் திரையின் மேலேயும் லாக் ஸ்கிரீனிலும் உடனே தெரியும்.', en: 'Booking confirmations, provider updates and status changes — shown right away at the top of your screen and on the lock screen, even when the app is closed.' })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!denied && (
              <button type="button" disabled={busy} onClick={() => void allow()} className="btn-primary !px-5 !py-2.5 text-sm disabled:opacity-70">
                <span lang={lang}>{t({ ta: 'அனுமதி', en: 'Allow' })}</span>
              </button>
            )}
            <button type="button" onClick={later} className="btn-ghost !px-4 !py-2.5 text-sm">
              <span lang={lang}>{denied ? t({ ta: 'சரி', en: 'OK' }) : t({ ta: 'பிறகு', en: 'Not now' })}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
