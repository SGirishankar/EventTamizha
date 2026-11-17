# Publishing Event Tamizha on Google Play — step by step

Event Tamizha is a web app (PWA). The simplest, supported way to put it on Google Play is a **Trusted Web Activity (TWA)**:
a thin Android app that opens your HTTPS website full-screen. Every website update then reaches users instantly,
without a new Play release. Google Play accepts **AAB** files (not APK). An APK is only for testing on your own phone.

> Rules checked on 25 Oct 2026 (re-check on the Play Console help pages before you submit; they change every year):
> new apps and updates must target **Android 16 (API 36)** since 31 Aug 2026; a **personal** developer account created after
> 13 Nov 2023 must run a **closed test with at least 12 testers for 14 continuous days** before it can apply for production;
> an **organization** account is exempt.

---
## Part A — Prepare the website (1–2 hours)

1. **Fill the legal placeholders.** Open `public/terms.html` and `public/privacy.html` and replace the yellow
   `[ ... ]` parts (registered address, court city). Put the same real address/e-mail in `src/data/config.ts` (`BUSINESS`;
   it still contains a *sample* address) or in Admin → Company. Have a lawyer glance over the two pages.
2. **Change the admin password.** `google-apps-script/Code.gs` has `ADMIN_PASSWORD = 'giri123'`. Set a strong one,
   redeploy the script as a *New version* (log in once, then you may blank the constant if you wish).
3. **Redeploy the Apps Script** (Deploy → Manage deployments → Edit → New version). The new version adds
   account deletion, profile, location and photo support. Run `setupProductPhotos` once so Drive photo permission is granted.
4. **Build:** `npm install` then `npm run build` (use the normal build, not `build:single`).
5. **Host `dist/` on HTTPS at a domain root.** Easy free options: Netlify, Cloudflare Pages, Firebase Hosting
   (e.g. `https://eventtamizha.netlify.app`, or better your own domain). Do **not** use a sub-folder URL (GitHub Pages project site).
6. Open these in Chrome and confirm they load: `/privacy.html`, `/terms.html`, `/delete-account.html`,
   `/manifest.webmanifest`, `/.well-known/assetlinks.json`.
7. Run Chrome DevTools → Lighthouse → "Progressive Web App": the app must be installable.

## Part B — Create the Android app (AAB)

> **Using the Capacitor + Firebase app?** Follow `docs/ANDROID_APK.md` to build the APK/AAB instead of the PWABuilder / Bubblewrap options below. The rest of this guide (store listing, Data safety, privacy policy, testing) still applies.

### Option 1 (easiest, no installs): PWABuilder
1. Go to **pwabuilder.com**, enter your website URL, **Start**.
2. **Package for stores → Android → Google Play.** Set:
   - Package ID: `in.eventtamizha.app` (cannot change after publishing — choose carefully; must match `assetlinks.json`)
   - App name: `Event Tamizha`, version `1` / version name `1.0.0`
   - **Target API / SDK: 36** (if the tool shows an older default, pick the newest or use Option 2)
   - Enable **notification delegation** and **location delegation** if offered (so the web alerts and "Enable location" work in the app)
   - Signing key: choose **"Create new"** and **download the zip**. It contains the `.aab`, an `.apk` for testing,
     and your **signing key + passwords. Back this up safely; losing it can block future updates.**
3. Install the `.apk` on your phone to test: login, cart, booking, location, photo upload, notifications.

### Option 2: Bubblewrap CLI (more control)
`npm i -g @bubblewrap/cli`, then `bubblewrap init --manifest=https://YOUR-DOMAIN/manifest.webmanifest`,
`bubblewrap build`. Use the latest version so it targets API 36.

## Part C — Link the app to your website (so the browser bar disappears)
1. Create the **Play Console developer account** (Part D) and upload the AAB once to **Internal testing**.
2. Play Console → your app → **Test and release → App integrity (App signing)** → copy the **SHA-256 certificate
   fingerprint of the *app signing key*** (Google re-signs your app; this is the one that matters).
3. Put it in `public/.well-known/assetlinks.json` (replace `REPLACE_WITH_...`, keep the package name identical). Rebuild + redeploy.
   Add the upload-key fingerprint too if you also test the APK from PWABuilder.
4. Check at `https://YOUR-DOMAIN/.well-known/assetlinks.json`. If wrong, the app opens with a Chrome address bar on top.

## Part D — Google Play Console
1. Register at **play.google.com/console** — one-time **US$25** fee, identity verification (ID + address; allow a few days).
   *Personal* account = needs the 12-tester/14-day test. *Organization* account (needs a D-U-N-S number, can take weeks) is exempt.
2. **Create app:** name *Event Tamizha*, default language (e.g. English (India) or Tamil), **App**, **Free**, accept the declarations.
3. **Set up your app** (Dashboard checklist) — answers for this app:
   | Section | What to enter |
   |---|---|
   | Privacy policy | `https://YOUR-DOMAIN/privacy.html` |
   | App access | Select "All or some functionality is restricted". Give reviewers a **test customer login** (create one yourself: e.g. mobile `9000000001`, password) and say: "Browsing works without login; log in to book and see My Orders." |
   | Ads | **No, my app does not contain ads** |
   | Content rating | Start the questionnaire, category *Utility / Reference or similar*, answer **No** to violence, sexual content, gambling, drugs, user-to-user chat. Result is normally "Everyone". |
   | Target audience | **18 and over** (matches the Terms). Not designed for children. |
   | Data safety | See table below |
   | Government / news / health / financial features | **No** to all (no payments are processed in the app; estimates only) |
   | Account deletion | In-app path: *Profile → Delete my account*. Web link: `https://YOUR-DOMAIN/delete-account.html` |
   | App category / contact | Category *Lifestyle* or *Business*; public e-mail `giri.kalingiyam@gmail.com`; phone/website as you wish |
4. **Data safety form** (answer honestly; be conservative):
   | Data | Collected | Shared | Purpose | Optional |
   |---|---|---|---|---|
   | Name | Yes | Yes (assigned provider) | App functionality, account management | No |
   | Phone number | Yes | Yes (assigned provider) | App functionality, account management | No |
   | Address | Yes | Yes (assigned provider) | App functionality | Yes |
   | Approximate/precise location | Yes | Yes (assigned provider) | App functionality | Yes |
   | Photos | Yes | Yes (assigned provider) | App functionality | Yes |
   | User IDs (mobile number as login) | Yes | No | Account management | No |
   | App activity / bookings | Yes | Yes (provider) | App functionality | No |
   | **Device or other IDs** (Firebase push token) | Yes | No (Google Firebase only delivers it for us as a service provider) | App functionality (push notifications) | Yes (only if the user allows notifications) |
   Also: **Data is encrypted in transit: Yes. Users can request data deletion: Yes** (in-app + web link). No data is sold.
   Since the Android app (Capacitor + Firebase) was added, also answer: *Does your app collect data?* Yes; *Device or other IDs* as above; photos and camera are only used when the user taps the photo buttons.
   If you are unsure whether sending details to your own provider counts as "sharing", declaring it as shared is the safer choice.
5. **Store listing** (copy/paste, edit as you like):
   - **App name (≤30):** `Event Tamizha – Pandal & Decor`
   - **Short description (≤80):** `Book pandal, lights, decor & rentals across Tamil Nadu. Get an instant estimate.`
   - **Full description (≤4000):**
     > Event Tamizha brings traditional Tamil Nadu pandal, lighting, decoration and rental services to your phone.
     > Choose a pandal (Sheet, Theenolai, Samiyana), add serial lights, boards, chairs, sound and generators, and see an instant price estimate.
     > Send a booking request, share the venue location on the map, attach reference photos, and follow your booking status live.
     >
     > • Instant estimate by size, items and distance
     > • Cart with product photos
     > • Save your location, or choose a new one for each booking
     > • Booking tracking and notifications
     > • Tamil and English
     > • Delete your account any time from Profile
     >
     > Prices are estimates; the final price is confirmed by Event Tamizha.
     (Tamil translation can be added under *Translations*.)
   - **Graphics:** App icon **512×512 PNG** (`public/icons/icon-512.png`), **feature graphic 1024×500**, at least **2 phone screenshots**
     (take 4–8 from the real app: Home, Pandals, Cart, Booking, Profile; 16:9 or 9:16, min 320 px, max 3840 px).
6. **Closed testing** (required for new personal accounts): *Test and release → Testing → Closed testing → Create track →
   Create release → upload the `.aab`.* Create a tester list (Google Group or e-mails), **add 12+ people**, send them the opt-in link.
   They must **opt in and stay opted in for 14 days in a row** (ask them to open the app now and then). Fix any bugs and upload a new
   version code if needed (the 14-day clock keeps running for opted-in testers).
7. **Apply for production:** Dashboard → *Apply for production access* → answer the questionnaire (how you recruited testers, what feedback you got).
   Review usually takes up to ~7 days.
8. **Production release:** *Production → Create new release →* the same AAB → release notes → **Review → Start rollout**.
   First review: from a few hours to several days.

## Part E — After launch
- **Website changes** (prices, pages, features) go live for the app instantly after you redeploy the site. No new Play release.
- A **new Play release** is only needed when you change the app package: name/icon/manifest, or when Google raises the target API
  each year (each 31 August). Increase `versionCode` every time.
- Keep the signing key backup, and keep `terms.html` / `privacy.html` / `delete-account.html` online forever (Play checks them).
- Answer reviews, keep the contact e-mail working, and update the Data safety form if you ever add analytics, ads or payments.

## Pre-submission checklist
- [ ] Placeholders in `terms.html` / `privacy.html` filled; real address in config
- [ ] Admin password changed; Apps Script redeployed
- [ ] HTTPS site live at a domain root; the 3 legal pages and `assetlinks.json` open
- [ ] AAB built with **target API 36**, package ID matches `assetlinks.json`
- [ ] SHA-256 of the **Play app-signing key** added to `assetlinks.json` (no address bar in the app)
- [ ] Tested on a real phone: sign-up (with consent tick), login, edit profile, saved vs new location, cart, booking with photos, notifications, delete account
- [ ] Test login given to reviewers in *App access*
- [ ] Data safety, content rating, target audience, privacy policy URL, deletion URL completed
- [ ] 512 icon, 1024×500 feature graphic, ≥2 screenshots uploaded
- [ ] Closed test: 12+ testers opted in 14 days → production access applied
