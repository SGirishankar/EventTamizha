# Event Tamizha — ஈவென்ட் தமிழா · Tamil Nadu Pandal, Lights & Decor (frontend demo)

React + TypeScript + Vite + Tailwind CSS. No backend — all bookings are demo-only.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/ (upload the WHOLE dist folder, not just index.html)
npm run build:single   # optional: one self-contained index.html (opens from a file, but loads slower)
```

## Customise
- **Business name, phone, WhatsApp, address, prices** → `src/data/config.ts`
  (`BUSINESS`, `PANDALS`, `ITEMS`, `CHARGES`). The phone/WhatsApp numbers are placeholders.
- **Photos** → `public/photos/*.webp` are real, Creative-Commons photos (Wikimedia Commons / Flickr), credited on the
  `/credits` page from `public/photos/credits.json`. To use your own work, overwrite a file with the same name and
  update or remove its entry in `credits.json`. The **Sheet Pandal** card uses a stand-in photo — replace `house-pandal.webp` first.
- **3D pandal studio** → `src/components/Pandal3D.tsx` (three.js, lazy-loaded). Colours, pole height and textures are set at the top of that file.
- **Packages, sample reviews, FAQ, demo calendar availability** → also in `src/data/config.ts`.
- **Translations** → every string is a `{ ta, en }` pair next to where it is used.

## Orders → Google Sheet + e-mail
Bookings are saved to a Google Sheet and e-mailed to the owner through a small Google Apps Script.
Setup (5 minutes): see `google-apps-script/SETUP.md`. Until `ORDERS.url` in `src/data/config.ts`
(or `VITE_ORDERS_URL`) is set, the Booking page stays in demo mode.

## Mobile 3D
On phones the 3D preview lets the page scroll over it; the **Explore 3D** button opens a full-screen view where
touch rotates and pinch zooms. Phones also get a lighter scene (no shadows, fewer lights/stars). If WebGL is
unavailable or the browser drops the GL context, a photo fallback with a reload button is shown.

## Roles
Customer (register on the site), Service Provider (created by the admin) and Admin (created once with `createAdmin` in the
Apps Script). The admin allocates orders to providers; providers accept, decline or complete them; customers follow the
status in My Orders. See `google-apps-script/SETUP.md`.

**Each role sees only its own area.** Admin → `/admin`, Service Provider → `/provider`, Customer → booking, estimate and My Orders.
Admin and Provider accounts are redirected to their dashboard from every customer page (Home, Estimate, Booking, My Orders…),
the customer menu / cart / Book Now buttons are hidden for them, and the server also refuses bookings made from those accounts.
Providers only ever receive the jobs assigned to them.

## Venue location
The Booking page has an optional **Enable location** button (uses the phone's GPS) or a *paste a Google Maps link* box.
The position is saved with the order (sheet columns *Venue latitude / longitude / map link*) and shown as a **Venue on map**
button to the admin, the assigned provider and the customer. GPS needs an https page (or localhost).
**Nearest provider:** each provider taps *Enable location* under *My base location* in their dashboard; the admin then sees
*Providers nearest to the venue* (straight-line km) on every order that has a venue location, and the provider list is sorted by service match, then distance.
**After updating `google-apps-script/Code.gs` paste it into Apps Script again and redeploy a new version.**

## Theme
The royal blue & white look (blue #1D4ED8, navy #0B1F4D, ice blue #BFDBFE, white #F7F9FD) is set in the `@theme` block at the top of `src/index.css`.

## Phone layout
Below 768px wide the site uses an app-style layout: a splash screen (once per visit), a Home screen with greeting,
search, banner and category grid, an Explore list, and bottom tabs (Home, Explore, My Bookings, Estimate, Profile).
Larger screens keep the full website layout.

## Mobile app / "Install app" button

The site is an installable app (PWA): `public/manifest.webmanifest`, `public/sw.js` and `public/icons/`.
The **Install app** button appears on the phone home screen, in the menu and in the footer (`src/components/InstallApp.tsx`).
- Android Chrome: opens the install prompt. iPhone: shows the "Add to Home Screen" steps.
- After publishing on Google Play (or hosting an `.apk`), paste the link into `APP_DOWNLOAD` in `src/data/config.ts`; the button then opens that link.

## Sign-in, profile, cart, photos, alerts (latest update)
- **One sign-in for everyone.** There is no Customer / Provider / Admin picker. Enter mobile number + password; the server
  recognises the role from the number and sends the person to the right screen. New customers use *Create account*.
- **Profile** (`/account`): name, mobile number and a saved location (address + GPS / map link), all editable. A customer
  can change their number (current password required; bookings, notifications and sessions move with it). Admin and
  provider numbers are changed by the admin only.
- **Booking location:** logged-in customers choose *My saved location* or *Choose a different location*, with an optional
  “save as my default” tick. Guests still use the Enable location / map link box.
- **Providers must share a location.** Until a provider saves one, their dashboard shows only a “share your location”
  screen, the server refuses to give them jobs, and the admin cannot assign an order to them (the dropdown greys them out and
  the Providers tab shows *No location*).
- **Cart** (`/cart`): the pandal and every chosen item with its photo, quantity buttons, remove, location and total.
- **Photos:** product photos in the cart; customers can attach up to 3 reference photos to a booking (venue, decoration idea).
  They are saved to Google Drive by the script and shown to the admin, the assigned provider and the customer.
- **Alerts:** the bell checks every 30 s. Allow “Phone alerts” (bell panel or Profile) to get notification-bar alerts and
  tap-to-open. Alerts arrive while the app / browser is running. Alerts with the app fully closed need a push service
  (Firebase Cloud Messaging) which Apps Script cannot provide by itself.
- **After updating the code:** paste the new `google-apps-script/Code.gs` into Apps Script, then *Deploy → Manage deployments →
  Edit → New version*. New sheet columns (*Address*, *Map link*, *Booking photos*) are added automatically.

## Android app (APK) + push
Capacitor wrapper with camera / notification permission and push alerts that arrive with the app closed (Firebase Cloud Messaging, sent from `Code.gs`).
Setup and build steps: **`docs/ANDROID_APK.md`**. After pulling this update, paste the new `Code.gs` into Apps Script and deploy a new version.

## Google Play
Step-by-step publishing guide, store listing text and Data-safety answers: **`docs/PLAY_STORE_GUIDE.md`**.
Legal pages (static, crawlable): `public/terms.html`, `public/privacy.html`, `public/delete-account.html`: fill the yellow `[...]` placeholders first.
`public/.well-known/assetlinks.json` is a template; add the Play app-signing SHA-256 after your first upload.
Customers can delete their account in the app (Profile → Delete my account); Code.gs `deleteAccount_` does the removal.

## Pandal rates and Sound service (admin)
- **Admin → Products → Pandal rates:** change the price per sq ft and the minimum charge of Sheet / Theenolai / Samiyana. Customers,
  estimates, the cart and ready packages use the new rate at once. *Reset* returns to the built-in rate. Needs the updated `Code.gs`.
- **Sound service:** a new category that starts empty. Admin → Products → Add product → choose *Sound service*. The “Sound Service”
  page, menu card and cart/estimate section appear for customers as soon as the first item exists.
- The built-in “Sound system (mic set)” rental still exists because the ready packages include it; remove it under Products if you
  prefer to sell sound only through the new category.
