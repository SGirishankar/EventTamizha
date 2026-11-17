import { Bell, BellOff, BellRing, CheckCheck, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/lang';
import { enableNativeAlerts, isNativeApp, nativeAlertState } from '../native/push';
import { callApi } from '../state/api';
import { homeFor, useAuth } from '../state/auth';

type Note = { id: string; at: string; title: string; message: string; ref: string; read: boolean };

/* ---------------------------------------------------------------- phone / browser alerts */

export type DeviceAlertState = 'unsupported' | 'default' | 'granted' | 'denied';

export function deviceAlertState(): DeviceAlertState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission as DeviceAlertState;
}

/** Shows a notification in the phone's notification bar (through the service worker, so tapping it opens the app). */
export async function showDeviceAlert(title: string, body: string, tag: string, url: string): Promise<void> {
  if (isNativeApp()) return; // in the Android app the phone's own push (Firebase) shows the alert
  if (deviceAlertState() !== 'granted') return;
  const opts: NotificationOptions = { body, tag, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', data: { url } };
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.showNotification(title, opts); return; }
  } catch {
    /* fall through to the plain Notification API */
  }
  try { new Notification(title, opts); } catch { /* some phones only allow it through the service worker */ }
}

/** State + “turn on” action for the phone-alert permission, shared by the bell and the profile page. */
export function useDeviceAlerts() {
  const { t } = useLang();
  const [state, setState] = useState<DeviceAlertState>(() => (isNativeApp() ? 'default' : deviceAlertState()));
  useEffect(() => {
    if (isNativeApp()) void nativeAlertState().then(setState).catch(() => setState('unsupported'));
  }, []);
  const enable = useCallback(async () => {
    if (isNativeApp()) {
      try { setState(await enableNativeAlerts()); } catch { setState('unsupported'); }
      return;
    }
    if (deviceAlertState() === 'unsupported') return;
    try { await Notification.requestPermission(); } catch { /* older browsers use a callback form; the state below still updates */ }
    const next = deviceAlertState();
    setState(next);
    if (next === 'granted') {
      void showDeviceAlert('Event Tamizha', t({ ta: 'அறிவிப்புகள் இயக்கப்பட்டன. புதிய தகவல்கள் இங்கே வரும்.', en: 'Alerts are on. New updates will appear here.' }), 'alerts-on', '#/');
    }
  }, [t]);
  return { state, enable };
}

/* ---------------------------------------------------------------- bell */

type Toast = { title: string; message: string };

/** Bell with unread count for logged-in users (admin, providers, customers). Checks every 30 seconds; new messages also show in the phone's notification bar once allowed. */
export function NotificationBell({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useLang();
  const { user, token } = useAuth();
  const nav = useNavigate();
  const alerts = useDeviceAlerts();
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [supported, setSupported] = useState(true);
  const [toast, setToast] = useState<Toast | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<string> | null>(null);
  const tRef = useRef(t);
  tRef.current = t; // keep the polling callback stable even when the language changes

  /** Tell the person about messages they have not been told about on this phone yet. */
  const announce = useCallback((list: Note[]) => {
    if (!user) return;
    const t = tRef.current;
    const key = `event360-seen-${user.mobile}`;
    if (!seen.current) {
      try { seen.current = new Set(JSON.parse(localStorage.getItem(key) || '[]') as string[]); } catch { seen.current = new Set(); }
    }
    const known = seen.current;
    const fresh = list.filter((n) => !n.read && !known.has(n.id));
    if (fresh.length === 0) return;
    fresh.forEach((n) => known.add(n.id));
    try { localStorage.setItem(key, JSON.stringify(Array.from(known).slice(-200))); } catch { /* private mode */ }

    const url = `#${homeFor(user)}`;
    if (document.visibilityState === 'hidden') {
      if (fresh.length > 3) void showDeviceAlert('Event Tamizha', t({ ta: `${fresh.length} புதிய அறிவிப்புகள்`, en: `${fresh.length} new notifications` }), 'summary', url);
      else fresh.slice().reverse().forEach((n) => void showDeviceAlert(n.title, n.message, n.id, url));
    } else {
      const n = fresh[0];
      setToast(fresh.length > 1 ? { title: n.title, message: t({ ta: `மேலும் ${fresh.length - 1} புதிய அறிவிப்புகள்`, en: `and ${fresh.length - 1} more new` }) } : { title: n.title, message: n.message });
    }
  }, [user]);

  const load = useCallback(async () => {
    if (!token) return;
    const r = await callApi<{ notifications: Note[]; unread: number }>({ action: 'notifications', token });
    if (r.ok) { setNotes(r.notifications); setUnread(r.unread); setSupported(true); announce(r.notifications); }
    else if (r.error === 'BAD_ACTION') setSupported(false); // server script not updated yet
  }, [token, announce]);

  useEffect(() => {
    if (!token) return;
    void load();
    // Tabs in the background are slowed down by the browser, so this is "about every 30 seconds" there.
    const id = setInterval(() => { void load(); }, 30000);
    const vis = () => { if (document.visibilityState === 'visible') void load(); };
    document.addEventListener('visibilitychange', vis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', vis); };
  }, [token, load]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', away);
    document.addEventListener('touchstart', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('touchstart', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    setToast(null);
    if (next) {
      await load();
      if (token && unread > 0) {
        setUnread(0);
        void callApi({ action: 'notificationsRead', token });
      }
    } else {
      setNotes((n) => n.map((x) => ({ ...x, read: true })));
    }
  };

  if (!user || !supported) return null;
  const size = compact ? 'h-9 w-9 sm:h-10 sm:w-10' : 'h-11 w-11';
  return (
    <div ref={box} className="relative">
      <button type="button" onClick={() => void toggle()} aria-label={`Notifications${unread ? ` (${unread} new)` : ''}`} aria-expanded={open}
        className={`relative grid ${size} place-items-center rounded-full bg-ink/5 text-ink transition hover:bg-primary/10 hover:text-primary`}>
        <Bell size={compact ? 19 : 20} className={unread ? 'origin-top animate-[wiggle_1s_ease-in-out_2]' : ''} />
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">{unread > 99 ? '99+' : unread}</span>}
      </button>

      {toast && createPortal(
        <div role="status" onClick={() => { setToast(null); setOpen(true); void load(); }}
          className="fixed inset-x-3 cursor-pointer top-[max(env(safe-area-inset-top),0.75rem)] z-[90] mx-auto flex max-w-md items-start gap-3 rounded-2xl bg-white p-3.5 text-left shadow-deep ring-1 ring-primary/20 print:hidden">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><BellRing size={18} /></span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-extrabold text-ink">{toast.title}</span>
            <span className="line-clamp-2 block text-xs leading-relaxed text-ink/65">{toast.message}</span>
          </span>
          <button type="button" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); setToast(null); }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink/40 hover:bg-slate-100"><X size={15} /></button>
        </div>,
        document.body,
      )}

      {open && (
        <div role="dialog" aria-label="Notifications"
          className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-hidden rounded-2xl bg-white shadow-deep ring-1 ring-slate-200 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p lang={lang} className="font-extrabold">{t({ ta: 'அறிவிப்புகள்', en: 'Notifications' })}</p>
            <span lang={lang} className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><CheckCheck size={14} /> {t({ ta: 'அனைத்தும் படிக்கப்பட்டது', en: 'All read' })}</span>
          </div>
          {alerts.state === 'default' && (
            <div className="flex items-center gap-3 border-b border-slate-100 bg-blue-50/60 px-4 py-3">
              <BellRing size={20} className="shrink-0 text-primary" />
              <p lang={lang} className="min-w-0 flex-1 text-xs text-ink/70">{t({ ta: 'புதிய முன்பதிவு, பணி அறிவிப்புகளை உங்கள் தொலைபேசியில் பெறுங்கள்.', en: 'Get new booking and job alerts on your phone.' })}</p>
              <button type="button" onClick={() => void alerts.enable()} className="btn-primary !px-3 !py-1.5 !text-xs"><span lang={lang}>{t({ ta: 'இயக்கு', en: 'Turn on' })}</span></button>
            </div>
          )}
          {alerts.state === 'denied' && (
            <p lang={lang} className="border-b border-slate-100 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
              {t({ ta: 'தொலைபேசி அறிவிப்புகள் தடுக்கப்பட்டுள்ளன. உலாவி / ஆப் அமைப்பில் “Notifications” அனுமதியை இயக்கவும்.', en: 'Phone alerts are blocked. Allow “Notifications” in the browser / app settings.' })}
            </p>
          )}
          {notes.length === 0 ? (
            <div className="flex items-center gap-3 px-4 py-8 text-ink/50">
              <BellOff size={22} className="shrink-0" />
              <p lang={lang} className="text-sm">{t({ ta: 'இன்னும் அறிவிப்புகள் இல்லை.', en: 'No notifications yet.' })}</p>
            </div>
          ) : (
            <ul className="max-h-[calc(70vh-3.25rem)] divide-y divide-slate-100 overflow-y-auto">
              {notes.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => { setOpen(false); nav(homeFor(user)); }}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-primary/5 ${n.read ? '' : 'bg-primary/[0.04]'}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">{n.title}</span>
                      <span className="block text-xs leading-relaxed text-ink/65">{n.message}</span>
                      <span className="mt-0.5 block text-[10px] text-ink/40">{n.at}{n.ref ? ` · ${n.ref}` : ''}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
