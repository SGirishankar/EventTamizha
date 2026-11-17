import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/lang';
import { DEVICE_KEY, ensureAlertChannel, isNativeApp, showBanner } from '../native/push';
import { callApi } from '../state/api';
import { homeFor, useAuth } from '../state/auth';

/**
 * Keeps notifications working. Renders nothing.
 *  - Tells the server which language the person uses, so alerts arrive in Tamil or English (never mixed).
 *  - Android app: once notifications are allowed (the friendly prompt asks), it gets this phone's Firebase token and sends it to the
 *    Google Script, which pushes new bookings / jobs / status changes to the banner and lock screen, even when the app is closed.
 *  - While the app is open, a push is also shown as a banner (Android does not do that by itself).
 * Tapping an alert opens the person's own screen.
 */
export function PushRegistrar() {
  const { user, token } = useAuth();
  const { lang } = useLang();
  const nav = useNavigate();
  const mobile = user?.mobile;

  // Alerts are written in the person's language.
  useEffect(() => {
    if (!token) return;
    void callApi({ action: 'setLang', token, lang });
  }, [token, lang]);

  useEffect(() => {
    if (!isNativeApp()) return;
    void ensureAlertChannel();
  }, []);

  useEffect(() => {
    if (!isNativeApp() || !token || !user) return;
    let dead = false;
    const off: Array<() => void> = [];
    void (async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await ensureAlertChannel();
        const reg = await PushNotifications.addListener('registration', (t) => {
          try { localStorage.setItem(DEVICE_KEY, t.value); } catch { /* private mode */ }
          void callApi({ action: 'registerDevice', token, device: t.value, platform: 'android' });
        });
        const tap = await PushNotifications.addListener('pushNotificationActionPerformed', () => nav(homeFor(user)));
        // App is open: Android would stay silent, so draw the banner ourselves.
        const live = await PushNotifications.addListener('pushNotificationReceived', (n) => { void showBanner(n.title || 'Event Tamizha', n.body || '', String(n.data?.ref || '')); });
        let local: { remove: () => Promise<void> } | null = null;
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          local = await LocalNotifications.addListener('localNotificationActionPerformed', () => nav(homeFor(user)));
        } catch { /* plugin missing: banners while the app is open are skipped */ }
        if (dead) { void reg.remove(); void tap.remove(); void live.remove(); void local?.remove(); return; }
        off.push(() => void reg.remove(), () => void tap.remove(), () => void live.remove(), () => void local?.remove());
        // Permission is asked by the friendly prompt; if it is already allowed, register this phone now.
        const perm = await PushNotifications.checkPermissions();
        if (perm.receive === 'granted') await PushNotifications.register();
      } catch {
        /* push is not available (for example no Google Play services): the in-app bell still works */
      }
    })();
    return () => { dead = true; off.forEach((f) => f()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, mobile]);

  return null;
}
