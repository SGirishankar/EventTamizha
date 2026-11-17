import { Capacitor } from '@capacitor/core';
import { callApi } from '../state/api';

/** True only inside the Android app (the Capacitor wrapper); false on the website and in the PWA. */
export function isNativeApp(): boolean {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

/** The notification channel every alert uses. Importance 5 = pops up as a banner, rings, and shows on the lock screen. */
export const ALERT_CHANNEL = 'event360';

/** Creates the channel (Android 8+). Safe to call many times. Must exist before the first push arrives, or Android files it quietly. */
export async function ensureAlertChannel(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    await PushNotifications.createChannel({ id: ALERT_CHANNEL, name: 'Bookings and jobs', description: 'New bookings, jobs and status updates', importance: 5, visibility: 1, vibration: true, lights: true });
  } catch { /* push not available on this phone */ }
}

/**
 * Shows a banner + lock-screen notification right now. Android does not show a push in the notification bar while the app
 * is open, so the app draws it itself (local notification). Silent no-op if the plugin or permission is missing.
 */
export async function showBanner(title: string, body: string, ref = ''): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return;
    await LocalNotifications.schedule({ notifications: [{
      id: Math.floor(Date.now() % 2147483000), title, body, channelId: ALERT_CHANNEL, smallIcon: 'ic_stat_event360', extra: { ref },
    }] });
  } catch { /* not critical: the in-app bell still shows it */ }
}

/** Where the phone's Firebase token is kept, so it can be removed from the server on sign-out. */
export const DEVICE_KEY = 'event360-fcm-token';

export type NativeAlertState = 'default' | 'granted' | 'denied';

/** Current notification permission of the Android app (Android 13+ asks the person; older versions are always granted). */
export async function nativeAlertState(): Promise<NativeAlertState> {
  const { PushNotifications } = await import('@capacitor/push-notifications');
  const r = await PushNotifications.checkPermissions();
  return r.receive === 'granted' ? 'granted' : r.receive === 'denied' ? 'denied' : 'default';
}

/** Shows the system “Allow notifications?” prompt and, if allowed, registers this phone for push. */
export async function enableNativeAlerts(): Promise<NativeAlertState> {
  const { PushNotifications } = await import('@capacitor/push-notifications');
  await ensureAlertChannel();
  const r = await PushNotifications.requestPermissions();
  if (r.receive === 'granted') {
    try { const { LocalNotifications } = await import('@capacitor/local-notifications'); await LocalNotifications.requestPermissions(); } catch { /* optional */ }
    await PushNotifications.register();
  }
  return r.receive === 'granted' ? 'granted' : r.receive === 'denied' ? 'denied' : 'default';
}

/** On sign-out: tell the server this phone no longer belongs to that account (must run before the session is closed). */
export async function forgetDevice(sessionToken: string): Promise<void> {
  if (!isNativeApp()) return;
  let device: string | null = null;
  try { device = localStorage.getItem(DEVICE_KEY); } catch { /* private mode */ }
  if (!device) return;
  await callApi({ action: 'unregisterDevice', token: sessionToken, device });
  try { localStorage.removeItem(DEVICE_KEY); } catch { /* ignore */ }
}
