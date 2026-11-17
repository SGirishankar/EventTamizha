# Android app (APK) with camera + push notifications

The app is the same website wrapped with **Capacitor**. It asks for **notification** and **camera** permission,
and new bookings / jobs / status changes arrive on the phone **even when the app is closed** (Firebase push, sent by your Google Script).

Package name: `in.eventtamizha.app` (same as `public/.well-known/assetlinks.json`).

## What you need once
- A laptop with **Node 20+**, **Android Studio** (it brings the Android SDK and JDK 17+) and a Google account.
- A real Android phone (push does not work on most emulators without Google Play).

## 1. Firebase (free) — 10 minutes
1. https://console.firebase.google.com → **Add project** (any name, Analytics off is fine).
2. Project overview → **Add app → Android**. Package name: `in.eventtamizha.app`. Register app.
3. Download **google-services.json**. You will put it in `android/app/` in step 3.
4. Firebase → ⚙ **Project settings → Service accounts → Generate new private key** → a `.json` file downloads. Keep it private.

## 2. Google Script (so it can send push)
1. Paste the new `google-apps-script/Code.gs` into Apps Script, then **Deploy → Manage deployments → Edit → New version → Deploy**.
2. Apps Script → ⚙ **Project Settings → Script properties → Add script property**:
   name `FCM_SERVICE_ACCOUNT`, value = the **entire contents** of the service-account `.json` from step 1.4.
3. A hidden sheet **Devices** is created automatically the first time a phone signs in.

## 3. Build the app (on your laptop, in this project folder)
```bash
npm install
npm run android:setup        # builds the site, creates android/, adds camera/notification/location permissions
```
Copy `google-services.json` into **`android/app/`**, then:
```bash
npm run android:sync         # (every time you change the website code)
npm run android:open         # opens Android Studio
```
In Android Studio: plug the phone in (USB debugging on) → press **Run ▶** to install and test.
For an installable file: **Build → Build Bundle(s) / APK(s) → Build APK(s)** (debug APK, good for testing and sharing).
For Google Play: **Build → Generate Signed Bundle / APK → Android App Bundle**, see `docs/PLAY_STORE_GUIDE.md`.

## 4. Test push
1. Install the app, **sign in as Admin**, tap **Allow** on “Allow Event Tamizha to send you notifications?”.
2. In Apps Script run **`testPush`** → the phone shows a notification (close the app first to prove it works while closed).
3. Place a booking from another device → the admin phone gets “New booking …”. Tapping it opens the admin page.

## Permissions the app asks for
| Permission | When | Why |
|---|---|---|
| Notifications (Android 13+) | right after sign-in | new bookings, jobs, status updates |
| Camera | first time you tap **Camera** on a booking / review photo | reference photos |
| Photos | **Gallery** uses the Android photo picker, no permission needed | reference photos |
| Location | when you tap **Enable location** | venue / provider base location |

If notifications were denied: Android Settings → Apps → Event Tamizha → Notifications. The bell inside the app also shows this hint.

## Things to know
- **Update your privacy policy** (`public/privacy.html`) and the Play *Data safety* form: the app now stores a **device token** (for push) linked to the mobile number.
- Signing out removes that phone from the account, so it stops getting that person's alerts.
- Phones without Google Play services cannot get push; the in-app bell (checks every 30 s) still works there.
- `package-lock.json` is from before these packages were added; `npm install` refreshes it.
- After `npm run android:sync`, if the app looks old, uninstall it once and run again.

## Lock-screen + banner alerts checklist
After pulling this update run `npm install` (adds `@capacitor/local-notifications`), then `npm run android:sync`, and install the new APK.
1. `android/app/google-services.json` is present (the sync script warns if it is not).
2. Apps Script → Project Settings → Script properties has `FCM_SERVICE_ACCOUNT` (the whole service-account JSON). Run `testPush` once.
3. Open the app and sign in: a friendly “Never miss an update” sheet asks to allow notifications. Tap **Allow**, then **Allow** in the phone's own box.
4. Close the app and run `testPush` again: the alert appears as a banner at the top and on the lock screen.
If you tapped “Don't allow” earlier: phone Settings → Apps → Event Tamizha → Notifications → turn on. Uninstalling and reinstalling also asks again.
