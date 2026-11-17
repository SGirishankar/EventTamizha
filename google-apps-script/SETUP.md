# Save every booking to Google Sheets and e-mail it

Each booking from the website becomes a new row in a Google Sheet and an e-mail to
**giri.kalingiyam@gmail.com**. It takes about 5 minutes and costs nothing.

## 1. Create the script
1. Go to https://sheets.new (a new Google Sheet). Name it e.g. "Event Tamizha Orders".
2. Menu **Extensions → Apps Script**.
3. Delete the sample code, paste everything from `Code.gs` (this folder), click **Save**.

## 2. Test it (also grants permission)
1. In the function dropdown choose **testOrder** and click **Run**.
2. Google asks for permission: **Review permissions → choose your account → Advanced → Go to project (unsafe) → Allow**.
   (It says "unsafe" only because you wrote the script yourself and it is not published.)
3. Check: an **Orders** tab appears in the sheet with one test row, and an e-mail "New booking EV-TEST-…" arrives
   at giri.kalingiyam@gmail.com (look in Spam the first time). Delete the test row afterwards.

## 3. Publish as a web app
1. **Deploy → New deployment → ⚙ Select type → Web app**.
2. **Execute as: Me** · **Who has access: Anyone**. Click **Deploy**.
3. Copy the **Web app URL** (ends with `/exec`). Opening it in a browser should show `{"ok":true,"service":"Event Tamizha orders",...}`.

## 4. Connect the website
Put the URL in **one** of these places:
- `src/data/config.ts` → `ORDERS.url`, or
- a file named `.env` next to `package.json`: `VITE_ORDERS_URL=https://script.google.com/macros/s/XXXX/exec`

Then rebuild and upload:
```bash
npm install
npm run build        # upload dist/index.html
```
Until a URL is set, the Booking page stays in demo mode and sends nothing.

## Good to know
- If you change `Code.gs` later: **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**
  (the URL stays the same).
- E-mails are sent from the Google account that deployed the script. Free Gmail allows about 100 script e-mails a day.
  If an e-mail ever fails, the order is still saved and the row's **Status** says `New - EMAIL FAILED`.
- To change the receiving address, edit `NOTIFY_EMAIL` at the top of `Code.gs` and deploy a new version.
- The **Status** column starts as `New`; change it by hand (Confirmed, Done, …) to track orders.
- Retrying a slow submission never creates a duplicate row (each booking has its own reference number).

## Customer login and My Orders
Customers can create an account (name + mobile number + password) and log in. Bookings made while logged in show up
under **My Orders** with a live status.
- The script creates two extra tabs by itself: **Users** (name, mobile, password hash — passwords are never stored as plain text)
  and a hidden **Sessions** tab. The **Orders** tab gets an **Account** column.
- **Cancel / reject:** a customer can cancel a booking in **My Orders** until the service is done; the admin can **Reject** a booking
  (with a reason) from the Orders screen. Both set the status, store the reason in the **Close reason / Closed by / Closed at**
  columns, and notify the customer, the allocated provider (if any) and the admin (in-app, e-mail and WhatsApp).
  After updating, paste the new Code.gs and **Deploy → Manage deployments → Edit → New version**.
- **Status:** change the Status cell of a row in **Orders** to `Confirmed`, `Done` or `Cancelled`; the customer sees it after
  tapping Refresh in My Orders.
- **Forgot password:** in Apps Script open `resetPassword`, put the customer's mobile in `MOBILE` and a temporary password in
  `NEW_PASSWORD`, select `resetPassword` and click **Run**, then send them the new password on WhatsApp.
- After 5 wrong passwords a mobile number is locked for 15 minutes. Logins last 30 days.
- Guest bookings (not logged in) still work; they are saved and e-mailed but are not shown in anyone's My Orders.
- There is no SMS/OTP check of the mobile number. For stronger verification an SMS service would have to be added.

**Important when you update `Code.gs`:** paste the new code, save, then **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**.

## Admin, service providers and allocation (version 3 of the script)
**Update steps:** paste the new `Code.gs`, save, then **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**.
Open the `/exec` URL; it should show `"version":3`.

**1. Admin login.** The admin is set at the top of `Code.gs` (`ADMIN_MOBILE`, `ADMIN_NAME`, `ADMIN_PASSWORD`).
After deploying, open **Profile → Admin** on the website and log in with that mobile and password — the admin account is
created automatically on the first login. (Running `createAdmin` in the editor does the same.) Admins cannot register on the website.

**2. Add service providers.** Admin Panel → **Providers** → **Add service provider**: name, mobile (their login ID),
business name, services (Pandal, Lighting, Boards, Rentals), towns, tier (Standard or ★ Premium) and a temporary password.
Tell the provider their mobile and password; they log in through **Service Provider** on the login screen.
To reset a provider's password, edit them and type a new password. To stop a provider, untick **Active**.

**3. Allocate orders.** Admin Panel → **Orders** → open an order → choose a provider (the list puts providers who offer
the services the order needs first, Premium next) → **Assign**. Use **Send the job on WhatsApp** to message the provider.
The status becomes `Assigned`; the customer sees the provider's name (and a Premium badge) in My Orders.

**4. Provider workflow.** The provider's **My Jobs** page shows assigned jobs with the customer's contact details.
They tap **Accept**, **Decline** (the order goes back to your New list with their reason in the *Provider note* column)
or **Mark completed**. You get an email each time. You can also change any order's Status yourself in the panel or the sheet.

New columns are added automatically: **Orders** gets Provider, Provider name, Assigned at, Provider note; **Users** gets Role,
Business, Services, Towns, Active, Tier.

## Products with photos (version 4 of the script)
The admin can add products with a photo and delete products from **Admin Panel → Products**.

**Update steps (once):**
1. Paste the new `Code.gs` into Apps Script and **Save**.
2. In the function dropdown choose **setupProductPhotos** and click **Run**. Google asks for permission again because the
   script now saves photos to **Google Drive** — allow it. This creates a Drive folder **Event Tamizha product photos** and a
   **Products** tab in the sheet.
3. **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**. The `/exec` URL should show `"version":4`.

**How it works**
- **Add product:** choose the service (Pandal decoration, Lighting or Rentals), type the Tamil and/or English name, the price and
  the unit, pick a photo (it is shrunk to 1000 px on the phone before upload) and tap **Add product**. The photo is saved in the
  Drive folder with "anyone with the link can view" so the website can show it. The product appears on the website at once.
- **Delete:** tap the 🗑 icon and then **Delete**. A product you added is marked *Deleted* in the Products tab and its photo is
  moved to the Drive trash. A built-in product is hidden (a *Built-in = Yes, Deleted* row) and can be brought back with
  **Restore** under *Removed built-in products*.
- If the Google account is a Workspace account that blocks public links, adding a photo shows an error — ask the Workspace
  admin to allow link sharing, or add the product without a photo.

## Company details (version 5 of the script)
**Admin Panel → Company** edits the details shown in the website footer, the top bar, the contact page, the booking page and
every WhatsApp / Call button: company name, short line under the logo, tagline, footer "about" text, phone, WhatsApp number,
e-mail, address, working hours and the list of towns served (one per line, `தமிழ் | English`).
A live footer preview shows the result before you tap **Save changes**.

**Update steps:** paste the new `Code.gs`, **Save**, then **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**
(no new permissions are needed). The `/exec` URL should show `"version":5`. The details are stored in a new **Settings** tab
(Key / Value); leave a key out to use the website's built-in value.

## Notifications, WhatsApp alerts, offers, combos, product editing (version 6 of the script)

**Update steps:** paste the new `Code.gs` and **Save**. Choose **testWhatsApp** later (see below), then
**Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**. The `/exec` URL should show `"version":6`.
New tabs are created automatically: **Notifications**, **Offers**, **Packages**.

### Admin alerts — e-mail + WhatsApp
Every new booking and every provider action (accepted / declined / completed) is e-mailed to `NOTIFY_EMAIL`
(giri.kalingiyam@gmail.com) **and** sent as a WhatsApp message to `ADMIN_WHATSAPP` (9566779289).

WhatsApp messages use the free **CallMeBot** service, which can only message your own number. Switch it on once:
1. Save **+34 621 33 17 09** as a contact in the phone that has WhatsApp on 9566779289.
2. Send it this WhatsApp message: `I allow callmebot to send me messages`
3. It replies with an **apikey** (a number). Paste it into `CALLMEBOT_APIKEY` at the top of `Code.gs` and **Save**.
4. Choose **testWhatsApp** in the function dropdown and click **Run** (allow the new "connect to an external service"
   permission). A test message should arrive on WhatsApp. Then deploy a new version.
If the key is empty, WhatsApp alerts are simply skipped; e-mails still go out.

### 🔔 Notifications for everyone
The bell at the top of the website shows each person's own updates:
- **Admin:** new bookings, provider accepted / declined / completed, and a log of their own assign / status changes.
- **Provider:** new job given to them, job withdrawn, status changed by the admin.
- **Customer (logged-in bookings):** booking received, provider assigned, accepted, completed, status changes.
Providers and customers are told through the bell (sending WhatsApp to other people's numbers needs a paid
WhatsApp Business account). The admin still has the **Send the job on WhatsApp** button when assigning.

### Offers & combo packages
**Admin Panel → Offers & Combos.**
- **Offers:** title, details (Tamil / English), a badge such as `10% OFF`, an optional last date and a *Show on website*
  switch. Active offers appear on the home page and on the new **Offers** page.
- **Combo packages:** pick products and quantities (and optionally a pandal type and size), set the combo price and an
  optional photo. The site shows the normal price struck through and the saving. When a customer taps **Add combo**, the
  products are added to their estimate and the saving appears as a *Combo offer* line — as long as they keep everything in the
  combo. The combo name and saving are included in the booking and the WhatsApp message.

### Editing products
**Admin Panel → Products → ✏** edits the name, price, unit and photo of any product. Built-in products show *Edited*
and have a ↺ button to go back to the original.

## Order progress, returns, reviews and profit (version 7 of the script)

**Update steps:** paste the new `Code.gs`, **Save**, then **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**
(no new permissions). The `/exec` URL should show `"version":7`. The **Orders** tab gets seven new columns automatically:
Service done at, Completed at, Rating, Review, Reviewed at, Provider payout (Rs), Other costs (Rs).

**Order steps**
Received → Provider assigned → Accepted → Service done → (Items collected, for orders with rental products) → Completed.
- Customers see these steps in **My Orders**, with the name of the provider assigned to them.
- Providers use **My Jobs**: *Accept* → *Service done (collect items later)* → *Rental items collected*.
  An order without rental products goes straight to *Completed* with **Mark as completed**.
  Orders waiting for items to be collected are listed under **Collect items**.
- The admin can still set any status, including the new *Service done · items to be collected*.

**Ratings and reviews**
When an order is completed, the customer can give 1–5 stars and a comment in **My Orders** (they can edit it later).
The admin gets an e-mail and a notification; the provider is notified too. Ratings appear on the order, on the provider's
completed job, and in the provider ranking.

**Profit & ranking (Admin Panel)**
- In each order, **Costs and profit**: enter the provider payout and any other costs. If no payout is entered, the
  *default provider share* (70% unless you change it) is used.
- **Profit & ranking** tab: revenue, provider payouts, other costs, net profit and margin for this month, the last 3 months,
  this year or all time; a 6-month chart; profit by provider; value of bookings still in progress.
- **Provider ranking**: ranked by customer ratings and jobs completed (also shown on the Providers tab).
Only completed orders count towards revenue and profit.

## Updating for customer review photos

The review feature now stores up to 3 photos per review in the same Drive folder used for product photos, and the website
shows them under each service (Pandals, Lighting, Rentals).

1. Open the Apps Script project, replace the code with the new `Code.gs`, and save.
2. **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy.** (The web-app URL stays the same.)
3. The Orders sheet gets a new last column, "Review photos", automatically the first time a review is saved.

## E-mail OTP for new accounts (free) — script version 12
Creating a customer account now needs a 6-digit code that is e-mailed through your own Gmail (`MailApp`), so it costs nothing
(about 100 e-mails a day on a free Gmail, 1,500 on Google Workspace). Nothing to configure:
1. Paste the new `Code.gs` into Apps Script, **Deploy → Manage deployments → Edit → New version**.
2. The first time, Google asks you to authorise sending e-mail — accept (the script already sends booking e-mails).
3. In the Users sheet a new column **Email** is filled for new customers.

Limits built in: a code lasts 10 minutes, 5 wrong tries cancel it, a number can ask for a new code every 45 seconds and 5 times an hour.

## Dates and times in the admin pages
Date / time columns of the Orders sheet are now stored as plain text and read back in the spreadsheet's own time zone.
On the first request after deploying, existing rows are converted once automatically. Also set **File → Settings → Time zone**
of the spreadsheet to *(GMT+05:30) India Standard Time* so what you see in the sheet matches the website.

## Forgot password (e-mail OTP)
On the login form, **Forgot your password?** asks for the mobile number, e-mails a 6-digit code to the address saved on the account,
then lets the customer choose a new password (they are signed in, and signed out of other devices). Deploy the new `Code.gs` as a New version.
- Works for customers who created their account **after** the e-mail OTP update (their e-mail is saved). Older accounts have no e-mail:
  add it in the **Email** column (column Q) of the Users sheet, or they message you on WhatsApp.
- Providers and the admin do not use this; the admin resets a provider's password from the Providers tab.

## Friendly alerts in Tamil / English
Every alert (the in-app bell and the phone banner / lock screen) is written in the language the person uses in the app, with a clear
next step. The app tells the script the language after sign-in (new **Language** column in the Users sheet). Deploy `Code.gs` as a New version.
Push needs the script property `FCM_SERVICE_ACCOUNT`; see `docs/ANDROID_APK.md` ("Lock-screen + banner alerts checklist").
