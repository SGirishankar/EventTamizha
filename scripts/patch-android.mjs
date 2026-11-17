// Adds the permissions the app needs to the Android project that `npx cap add android` created.
// Safe to run again and again (it only adds what is missing). Used by `npm run android:setup` / `android:sync`.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const manifest = 'android/app/src/main/AndroidManifest.xml';
if (!existsSync(manifest)) {
  console.error('android/ folder not found. Run `npm run android:setup` first.');
  process.exit(1);
}

let xml = readFileSync(manifest, 'utf8');
const lines = [
  ['uses-permission', 'android.permission.INTERNET', '<uses-permission android:name="android.permission.INTERNET" />'],
  ['uses-permission', 'android.permission.CAMERA', '<uses-permission android:name="android.permission.CAMERA" />'],
  ['uses-permission', 'android.permission.POST_NOTIFICATIONS', '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />'],
  ['uses-permission', 'android.permission.VIBRATE', '<uses-permission android:name="android.permission.VIBRATE" />'],
  ['uses-permission', 'android.permission.ACCESS_COARSE_LOCATION', '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />'],
  ['uses-permission', 'android.permission.ACCESS_FINE_LOCATION', '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />'],
  ['uses-feature', 'android.hardware.camera', '<uses-feature android:name="android.hardware.camera" android:required="false" />'],
  ['uses-feature', 'android.hardware.location.gps', '<uses-feature android:name="android.hardware.location.gps" android:required="false" />'],
];

const missing = lines.filter(([, name]) => !xml.includes(`"${name}"`)).map(([, , tag]) => `    ${tag}`);
if (missing.length) {
  xml = xml.replace(/(\s*)<application/, `\n${missing.join('\n')}\n$1<application`);
  writeFileSync(manifest, xml);
  console.log(`Added ${missing.length} permission line(s) to AndroidManifest.xml`);
} else {
  console.log('AndroidManifest.xml already has every permission.');
}

// Notification look + behaviour: a status-bar icon, the brand colour, and the high-importance channel Firebase must use for pushes
// that arrive while the app is closed (without these Android shows a grey dot and may file the alert quietly, with no banner).
const res = 'android/app/src/main/res';
mkdirSync(`${res}/drawable`, { recursive: true });
mkdirSync(`${res}/values`, { recursive: true });
writeFileSync(`${res}/drawable/ic_stat_event360.xml`, `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
  <path android:fillColor="#FFFFFFFF" android:pathData="M12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2zM18,16v-5c0,-3.07 -1.63,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.64,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2z"/>
</vector>
`);
writeFileSync(`${res}/values/event360_colors.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="event360_notification">#1D4ED8</color>
</resources>
`);
xml = readFileSync(manifest, 'utf8');
const meta = [
  ['com.google.firebase.messaging.default_notification_channel_id', 'android:value="event360"'],
  ['com.google.firebase.messaging.default_notification_icon', 'android:resource="@drawable/ic_stat_event360"'],
  ['com.google.firebase.messaging.default_notification_color', 'android:resource="@color/event360_notification"'],
].filter(([name]) => !xml.includes(name)).map(([name, val]) => `        <meta-data android:name="${name}" ${val} />`);
if (meta.length) {
  xml = xml.replace(/<\/application>/, `${meta.join('\n')}\n    </application>`);
  writeFileSync(manifest, xml);
  console.log(`Added ${meta.length} notification setting(s) to AndroidManifest.xml`);
}

if (!existsSync('android/app/google-services.json')) {
  console.warn('\n! android/app/google-services.json is missing. Push notifications will NOT work until you download it from the Firebase console and put it there (see docs/ANDROID_APK.md, step 1).');
}
