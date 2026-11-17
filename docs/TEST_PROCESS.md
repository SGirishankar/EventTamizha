# Event Tamizha — test process (run in this order)

Use a **test copy** first if you can (File → Make a copy of the Google Sheet, new Apps Script deployment), or use real data and
delete the test rows afterwards. Test on a real Android phone (Chrome) **and** on a laptop. Tick each line.

## 0. Setup (10 min)
1. Paste the new `Code.gs` → **Deploy → Manage deployments → Edit → New version → Deploy**. Run `setupProductPhotos` once and allow access.
2. `npm install` → `npm run build` → open `dist/` through your host (or `npm run dev` on a laptop; location needs https or localhost).
3. Prepare 3 logins: **Admin** (your admin mobile + password), **Provider A** and **Provider B** (create in Admin → Providers; leave their location empty), **Customer** (made in step 2).
4. In the Google Sheet check that the sheets *Orders, Users, Products, Notifications* exist. New columns appear by themselves after the first request: **Users → Address, Map link; Orders → Booking photos**.

## 1. Sign-in and roles
- [ ] Open the app → Account: only **mobile + password** (no role buttons). *Create account* needs the Terms/Privacy tick; without the tick it shows a message.
- [ ] Register a customer → lands on Profile (shows name, number, "No location saved yet").
- [ ] Log out → log in as Admin with the same form → goes to the admin page. Same for Provider A → provider page.
- [ ] Wrong password 5+ times → "Too many wrong attempts" (wait 15 min or ignore).

## 2. Profile (customer)
- [ ] Pencil → change name, address → **Save** → header updates; Sheet *Users* row updated (name, Address).
- [ ] *Enable location* (allow permission) → Save → "Open in Maps" chip appears and opens the right place.
- [ ] Change **mobile number** without password → blocked; with wrong password → "password is wrong"; with correct password → saved. Log out and log in with the **new** number; old number must fail. *My bookings* still list old bookings; notifications still there.
- [ ] Try a number that is already registered → "already belongs to another account".
- [ ] Language row toggles Tamil/English. Phone alerts row: tap → allow → a test notification appears in the phone's notification bar.

## 3. Booking with saved/new location and photos
- [ ] Go Pandals → pick a type → enter size → add lighting/rental items → bell/cart badge counts match **Cart** page.
- [ ] **Cart** page: photo, name, price, + / − / typed quantity, **Remove**, "Empty the cart", total equals the estimate.
- [ ] **Book now**: name, mobile and address already filled; card *My saved location* is selected. Switch to *Choose a different location* → address clears, location box appears; tick *Save as my default* with a GPS point.
- [ ] Add **2–3 photos** (camera and gallery; a 4th is refused). Submit → success screen with reference number.
- [ ] Sheet *Orders*: new row; **Venue lat/lng/map link** filled; **Booking photos** has Drive links; Drive folder "Event Tamizha product photos" has the files.
- [ ] Profile → location now equals the "default" saved above.
- [ ] Customer *My bookings*: order visible with "Photos you added".

## 4. Provider location is compulsory
- [ ] Log in as **Provider A** (no location): only the "Share your location to continue" screen — no jobs. Tap *Enable location* → Save and continue → job list opens.
- [ ] As Admin open the new order: the provider dropdown shows **Provider B "· no location" greyed out**; Provider A shows distance (km). Assign Provider A → OK.
- [ ] Try assigning B by any means → message "has not shared a location".
- [ ] Admin → Providers tab: B shows an amber **No location** badge.
- [ ] Provider A sees the job with the customer's photos and map link; Accept/Decline works.

## 5. Notifications
- [ ] With the app open: place a booking from a second device/browser → admin bell count goes up within ~30 s and a banner appears.
- [ ] Allow phone alerts, minimise the app, create another booking/assign → a notification appears in the notification bar; tapping it opens the app.
- [ ] Open the bell → items listed, count resets to 0.

## 6. Admin: pandal rates and Sound service
- [ ] Admin → Products → **Pandal rates**: set Sheet to e.g. ₹60 / min ₹6500 → Save → "Changed" badge. Reload the **customer** site: pandal card and estimate use ₹60; the Cart/total updated. **Reset** → back to the original rate.
- [ ] Rates reject 0 / empty (message shown).
- [ ] Sound service is **not visible** to customers yet (no card, `/sound` shows "coming soon"). Add a product: category **Sound service**, name, unit, price, photo.
- [ ] Reload customer site: **Sound Service** card appears (Home/Explore/search), `/sound` lists the item with photo; add 1 → appears in Cart and Estimate under "Sound service"; booking message/Sheet items text shows "Sound service: …".
- [ ] Edit and delete the sound item as admin; it disappears for customers.

## 7. Account deletion (do this last, with the test customer)
- [ ] Complete one order first (Admin → set status **Done**), then customer Profile → **Delete my account** → wrong password rejected → correct password deletes and logs out.
- [ ] Log in again with that number → fails. Sheet: the *Users* row is gone; in that Done order name = "Deleted customer", phone/address/map/photos/review cleared, amount kept. Photos removed from Drive.
- [ ] Open `/delete-account.html`, `/privacy.html`, `/terms.html` in a browser without login: all load.

## 8. Android app (APK/AAB from PWABuilder)
- [ ] Installs and opens full-screen (no browser bar; if a bar shows, fix `assetlinks.json`).
- [ ] Sign up/in, edit profile, location prompt works, photo picker (camera + gallery) works, notification permission prompt works.
- [ ] Back button navigates inside the app; closing and reopening keeps you logged in.
- [ ] Rotate / small phone (360 px width): Cart rows, Booking cards, Profile menu not cut off.

## 9. Quick regression
- [ ] Home, Pandals, Lighting, Rentals, Offers, Contact pages load; WhatsApp button works.
- [ ] Reviews: complete an order, customer adds rating + photo; shows on the site.
- [ ] Offers/combos still apply the discount.
- [ ] Admin: orders list, status change, provider create/edit, company settings still work.

## What to send me if something fails
The page, what you tapped, what you expected, a screenshot, and (for server errors) the message shown or the *Executions* log line from Apps Script.
