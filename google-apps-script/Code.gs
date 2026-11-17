/**
 * Event Tamizha — backend (Google Apps Script)
 *
 *  - Bookings: saved as a row in the "Orders" sheet and e-mailed to NOTIFY_EMAIL.
 *  - Customer accounts: register / login with mobile number + password ("Users" + hidden "Sessions" sheets).
 *  - My Orders: a logged-in customer sees only the bookings placed while logged in to their account.
 *  - Products: the admin adds products (photo saved to Google Drive) or hides built-in ones ("Products" sheet).
 *
 * Setup steps are in SETUP.md (same folder).
 */

const NOTIFY_EMAIL = 'giri.kalingiyam@gmail.com';

// The ADMIN login. Logging in with exactly these details creates (or repairs) the admin account automatically.
const ADMIN_MOBILE = '9566779289';
const ADMIN_NAME = 'Giri';
const ADMIN_PASSWORD = 'giri123';

// WhatsApp alerts to the admin's own number through CallMeBot (free). Leave the key empty to switch them off.
// Get a key: save +34 621 33 17 09 in your phone, send it "I allow callmebot to send me messages" on WhatsApp,
// and paste the apikey it replies with below. See SETUP.md.
const ADMIN_WHATSAPP = '919566779289';
const CALLMEBOT_APIKEY = '';
const SHEET_NAME = 'Orders';
const USERS_SHEET = 'Users';
const SESSIONS_SHEET = 'Sessions';
const TIMEZONE = 'Asia/Kolkata';
const SESSION_DAYS = 30;
const MAX_LOGIN_FAILS = 5;   // wrong passwords allowed per mobile number, per 15 minutes
const MAX_SIGNUPS_PER_HOUR = 30;

const HEADERS = [
  'Ref', 'Received (IST)', 'Status', 'Name', 'Mobile', 'Function', 'Function date', 'Town', 'Venue address',
  'Guests', 'Notes', 'Pandal', 'Size', 'Area (sq ft)', 'Pandal cost (Rs)', 'Extra items', 'Board text',
  'Distance (km)', 'Transport (Rs)', 'Labour (Rs)', 'Total (Rs)', 'Language', 'Account',
  'Provider', 'Provider name', 'Assigned at', 'Provider note',
  'Service done at', 'Completed at', 'Rating', 'Review', 'Reviewed at', 'Provider payout (Rs)', 'Other costs (Rs)',
  'Venue latitude', 'Venue longitude', 'Venue map link', 'Review photos', 'Booking photos',
  'Close reason', 'Closed by', 'Closed at',
];
const COL_STATUS = 3;
const COL_MOBILE = 5;
const COL_ACCOUNT = 23;
const COL_PROVIDER = 24;
const COL_PROVIDER_NAME = 25;
const COL_ASSIGNED_AT = 26;
const COL_PROVIDER_NOTE = 27;
const COL_SERVICE_DONE_AT = 28;
const COL_COMPLETED_AT = 29;
const COL_RATING = 30;
const COL_REVIEW = 31;
const COL_REVIEWED_AT = 32;
const COL_PAYOUT = 33;
const COL_COSTS = 34;
const COL_LAT = 35;
const COL_LNG = 36;
const COL_MAPLINK = 37;
const COL_REVIEW_PHOTOS = 38;   // JSON list of photo links the customer attached to their review
const MAX_REVIEW_PHOTOS = 3;
const COL_BOOKING_PHOTOS = 39;  // JSON list of reference photos the customer attached when booking
const MAX_BOOKING_PHOTOS = 3;
const COL_CLOSE_REASON = 40;    // why a booking was cancelled (by the customer) or rejected (by the admin)
const COL_CLOSED_BY = 41;       // 'Customer' or 'Admin'
const COL_CLOSED_AT = 42;
// A customer may cancel only while the service has not been done yet.
const CANCELLABLE = ['New', 'Assigned', 'Accepted', 'Confirmed'];
const USER_HEADERS = [
  'Mobile', 'Name', 'Salt', 'Password hash', 'Created (IST)', 'Last login (IST)',
  'Role', 'Business', 'Services', 'Towns', 'Active', 'Tier', 'Base latitude', 'Base longitude',
  'Address', 'Map link',   // saved location: customers (default venue) and providers (base)
  'Email',                 // verified by a one-time code (OTP) when the customer creates the account
  'Language',              // 'ta' or 'en': alerts to this person are written in this language
];
const STATUSES = ['New', 'Assigned', 'Accepted', 'Confirmed', 'ServiceDone', 'Done', 'Cancelled', 'Rejected'];
const STATUS_TEXT = { New: 'Received', Assigned: 'Provider assigned', Accepted: 'Accepted by provider', Confirmed: 'Confirmed', ServiceDone: 'Service done – rental items to be collected', Done: 'Completed', Cancelled: 'Cancelled', Rejected: 'Rejected by admin' };
const SERVICES = ['pandal', 'lighting', 'boards', 'rentals'];
const SESSION_HEADERS = ['Token hash', 'Mobile', 'Expires (ms)'];
const PRODUCTS_SHEET = 'Products';
const PRODUCT_HEADERS = [
  'Id', 'Category', 'Name (Tamil)', 'Name (English)', 'Unit (Tamil)', 'Unit (English)', 'Price (Rs)',
  'Image URL', 'Drive file id', 'Status', 'Built-in', 'Updated (IST)',
];
const PRODUCT_CATEGORIES = ['decor', 'lighting', 'rentals', 'sound'];
const PHOTO_FOLDER = 'Event Tamizha product photos';
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const DEVICES_SHEET = 'Devices';
const DEVICE_HEADERS = ['Mobile', 'Device token', 'Platform', 'Updated (IST)'];
const MAX_DEVICES_PER_USER = 5;
const NOTIFY_SHEET = 'Notifications';
const NOTIFY_HEADERS = ['Id', 'Created (IST)', 'To', 'Title', 'Message', 'Ref', 'Read'];
const OFFERS_SHEET = 'Offers';
const OFFER_HEADERS = ['Id', 'Title (Tamil)', 'Title (English)', 'Details (Tamil)', 'Details (English)', 'Badge', 'Valid till', 'Active', 'Updated (IST)'];
const PACKAGES_SHEET = 'Packages';
const PACKAGE_HEADERS = [
  'Id', 'Name (Tamil)', 'Name (English)', 'Details (Tamil)', 'Details (English)', 'Pandal', 'Length (ft)', 'Breadth (ft)',
  'Items', 'Price (Rs)', 'Image URL', 'Drive file id', 'Active', 'Updated (IST)',
];
const PANDAL_IDS = ['sheet', 'theenolai', 'samiyana'];
const SETTINGS_SHEET = 'Settings';
const SETTINGS_HEADERS = ['Key', 'Value', 'Updated (IST)'];
/** Company details the admin can edit (shown in the website footer, contact page and WhatsApp links). */
const SETTING_KEYS = {
  nameTa: 80, nameEn: 80, descriptorTa: 80, descriptorEn: 80, taglineTa: 120, taglineEn: 120,
  aboutTa: 400, aboutEn: 400, phone: 15, whatsapp: 15, email: 120,
  addressTa: 300, addressEn: 300, hoursTa: 120, hoursEn: 120, towns: 2000, payoutPercent: 3,
};

/** Opening the web app URL in a browser shows this — a quick way to check the deployment works. */
function doGet() {
  return json_({ ok: true, service: 'Event Tamizha orders', version: 12, sheet: SHEET_NAME });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let locked = false;
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(d.action || 'order');
    // Pages ask for products, offers, settings and reviews all at once. These only read, so they must not queue
    // behind each other on the lock (that made the site wait for several slow calls one after another).
    if (READ_ONLY_ACTIONS.indexOf(action) < 0) { lock.waitLock(20000); locked = true; }
    let out;
    if (action === 'order') out = placeOrder_(d);
    else if (action === 'setLang') out = setLang_(d);
    else if (action === 'sendOtp') out = sendOtp_(d);
    else if (action === 'sendResetOtp') out = sendResetOtp_(d);
    else if (action === 'resetPassword') out = resetPassword_(d);
    else if (action === 'register') out = register_(d);
    else if (action === 'login') out = login_(d);
    else if (action === 'me') out = me_(d);
    else if (action === 'updateProfile') out = updateProfile_(d);
    else if (action === 'deleteAccount') out = deleteAccount_(d);
    else if (action === 'orders') out = myOrders_(d);
    else if (action === 'logout') out = logout_(d);
    else if (action === 'adminOrders') out = adminOrders_(d);
    else if (action === 'adminAssign') out = adminAssign_(d);
    else if (action === 'adminStatus') out = adminStatus_(d);
    else if (action === 'adminReject') out = adminReject_(d);
    else if (action === 'cancelOrder') out = customerCancel_(d);
    else if (action === 'adminProviders') out = adminProviders_(d);
    else if (action === 'adminSaveProvider') out = adminSaveProvider_(d);
    else if (action === 'providerOrders') out = providerOrders_(d);
    else if (action === 'providerRespond') out = providerRespond_(d);
    else if (action === 'providerSetLocation') out = providerSetLocation_(d);
    else if (action === 'boot') out = boot_();
    else if (action === 'products') out = cached_('pub:products', PUBLIC_TTL, products_);
    else if (action === 'adminAddProduct') out = adminAddProduct_(d);
    else if (action === 'adminSavePandal') out = adminSavePandal_(d);
    else if (action === 'adminDeleteProduct') out = adminDeleteProduct_(d);
    else if (action === 'adminRestoreProduct') out = adminRestoreProduct_(d);
    else if (action === 'settings') out = cached_('pub:settings', PUBLIC_TTL, settings_);
    else if (action === 'notifications') out = notifications_(d);
    else if (action === 'notificationsRead') out = notificationsRead_(d);
    else if (action === 'registerDevice') out = registerDevice_(d);
    else if (action === 'unregisterDevice') out = unregisterDevice_(d);
    else if (action === 'content') out = d.all ? content_(d) : cached_('pub:content', PUBLIC_TTL, function () { return content_(d); });
    else if (action === 'adminSaveOffer') out = adminSaveOffer_(d);
    else if (action === 'adminDeleteOffer') out = adminDeleteRow_(d, OFFERS_SHEET, OFFER_HEADERS);
    else if (action === 'adminSavePackage') out = adminSavePackage_(d);
    else if (action === 'adminDeletePackage') out = adminDeleteRow_(d, PACKAGES_SHEET, PACKAGE_HEADERS);
    else if (action === 'adminEditProduct') out = adminEditProduct_(d);
    else if (action === 'review') out = customerReview_(d);
    else if (action === 'reviews') out = d.service ? publicReviews_(d) : cached_('pub:reviews', PUBLIC_TTL, function () { return publicReviews_(d); });
    else if (action === 'adminCosts') out = adminCosts_(d);
    else if (action === 'adminSaveSettings') out = adminSaveSettings_(d);
    else out = { ok: false, error: 'BAD_ACTION' };
    // Anything the admin saves, or a new review, changes what the public sees: drop the cached copies.
    if ((action.indexOf('admin') === 0 && action !== 'adminOrders' && action !== 'adminProviders') || action === 'review') bustPublicCache_();
    return json_(out);
  } catch (err) {
    return json_({ ok: false, error: 'SERVER', message: String(err && err.message ? err.message : err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

// These only read, so they never wait for the script lock (me and notifications run on every page open).
const READ_ONLY_ACTIONS = ['boot', 'products', 'content', 'settings', 'reviews', 'me', 'notifications'];

/* ------------------------------------------------------------------ public cache */

const PUBLIC_TTL = 300; // seconds a public answer is reused before the sheets are read again
const PUBLIC_KEYS = ['pub:products', 'pub:content', 'pub:settings', 'pub:reviews'];

/** Runs fn once per PUBLIC_TTL and shares the answer between visitors (reading a sheet takes about a second). */
function cached_(key, ttl, fn) {
  const cache = CacheService.getScriptCache();
  try {
    const hit = cache.get(key);
    if (hit) return JSON.parse(hit);
  } catch (e) { /* fall through and read the sheet */ }
  const out = fn();
  try {
    const text = JSON.stringify(out);
    if (out && out.ok && text.length < 90000) cache.put(key, text, ttl); // the cache holds at most 100 KB per key
  } catch (e) { /* too big or cache busy: just skip caching */ }
  return out;
}

function bustPublicCache_() {
  try { CacheService.getScriptCache().removeAll(PUBLIC_KEYS); } catch (e) { /* ignore */ }
}

/** Products, offers and company details in ONE call, so the site loads with a single request instead of three. */
function boot_() {
  const p = cached_('pub:products', PUBLIC_TTL, products_);
  const c = cached_('pub:content', PUBLIC_TTL, function () { return content_({}); });
  const st = cached_('pub:settings', PUBLIC_TTL, settings_);
  return {
    ok: true,
    products: { added: p.added || [], hidden: p.hidden || [], overrides: p.overrides || [], pandals: p.pandals || [] },
    content: { offers: c.offers || [], packages: c.packages || [] },
    settings: st.settings || {},
  };
}

/* ------------------------------------------------------------------ bookings */

function placeOrder_(d) {
  // Bots fill the hidden "website" field; pretend success and drop the order.
  if (d.website) return { ok: true, ref: 'IGNORED' };

  const name = text_(d.name, 120);
  const phone = mobile_(d.phone);
  if (!name) return { ok: false, error: 'BAD_INPUT', message: 'Name is required' };
  if (!phone) return { ok: false, error: 'BAD_INPUT', message: 'Valid 10-digit mobile number is required' };

  const ref = String(d.ref || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 24) || makeRef_();
  const sheet = getSheet_();

  // A retry after a slow network must not create a second row.
  if (refExists_(sheet, ref)) return { ok: true, ref: ref, duplicate: true };

  // Logged-in customers: the booking is linked to their account. An invalid/expired token just means a guest booking.
  const account = d.token ? mobileFromToken_(d.token) : '';

  // Admin and Service Provider accounts do not place customer bookings.
  if (account && roleOfMobile_(account) !== 'Customer') return { ok: false, error: 'FORBIDDEN' };

  sheet.appendRow([
    ref,
    Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss'),
    'New',
    name,
    phone,
    text_(d.event, 80),
    text_(d.date, 20),
    text_(d.town, 80),
    text_(d.address, 500),
    text_(d.guests, 10),
    text_(d.notes, 1000),
    text_(d.pandal, 80),
    text_(d.size, 40),
    num_(d.areaSqft),
    num_(d.pandalCost),
    text_(d.items, 1500),
    text_(d.boardText, 200),
    num_(d.distanceKm),
    num_(d.transport),
    num_(d.labour),
    num_(d.total),
    text_(d.lang, 4),
    account,
  ]);
  const row = sheet.getLastRow();

  // Optional venue location (GPS position and/or a map link).
  const loc = venueLocation_(d);
  if (loc.mapLink) sheet.getRange(row, COL_LAT, 1, 3).setValues([[loc.lat, loc.lng, loc.mapLink]]);

  // Optional reference photos (venue, stage idea...). A photo that cannot be saved never blocks the booking.
  const shots = [];
  const incoming = Array.isArray(d.photos) ? d.photos.slice(0, MAX_BOOKING_PHOTOS) : [];
  for (let i = 0; i < incoming.length; i++) {
    try {
      const ph = savePhoto_(incoming[i], 'booking-' + ref + '-' + (i + 1));
      if (ph && ph.url) shots.push(ph.url);
    } catch (photoErr) { /* skip this photo */ }
  }
  if (shots.length) sheet.getRange(row, COL_BOOKING_PHOTOS).setValue(JSON.stringify(shots));

  // The order is already safe in the sheet; if the e-mail fails, flag the row instead of losing the order.
  try {
    sendEmail_(d, ref, phone, name, sheet.getParent().getUrl(), account, loc.mapLink);
  } catch (mailErr) {
    sheet.getRange(row, COL_STATUS).setValue('New - EMAIL FAILED');
  }
  const line = text_(d.event, 80) + ' · ' + text_(d.date, 20) + ' · ' + text_(d.town, 80) + ' · Rs ' + num_(d.total);
  safe_(function () { whatsappAdmin_('New booking ' + ref + '\n' + name + ' ' + phone + '\n' + line); });
  safe_(function () { notifyT_('ADMIN', 'NEW_BOOKING_ADMIN', { ref: ref, name: name, line: line }, ref); });
  if (account) safe_(function () { notifyT_(account, 'BOOKING_RECEIVED', { ref: ref, line: line }, ref); });
  return { ok: true, ref: ref };
}

/** Latitude / longitude / map link sent with a booking. Anything invalid is dropped (the location is optional). */
function venueLocation_(d) {
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  const hasPoint = d.lat !== null && d.lat !== '' && d.lng !== null && d.lng !== '' && isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  let link = String(d.mapLink || '').trim();
  if (!/^https?:\/\//i.test(link)) link = '';
  link = link.slice(0, 300);
  if (!link && hasPoint) link = 'https://www.google.com/maps?q=' + lat.toFixed(6) + ',' + lng.toFixed(6);
  return { lat: hasPoint ? lat : '', lng: hasPoint ? lng : '', mapLink: link };
}

/** 'Customer' / 'Provider' / 'Admin' for a mobile number (Customer when the account is unknown). */
function roleOfMobile_(mobile) {
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  if (!row) return 'Customer';
  return String(users.getRange(row, 7).getValue() || 'Customer');
}

/* ------------------------------------------------------------------ accounts */

/* ------------------------------------------------------------------ e-mail OTP (free: uses your own Gmail through MailApp) */

const OTP_TTL = 600;            // a code works for 10 minutes
const OTP_MAX_TRIES = 5;        // wrong guesses before the code is thrown away
const OTP_RESEND_SECONDS = 45;  // wait before another code can be sent to the same number
const OTP_MAX_PER_HOUR = 5;     // codes per mobile number per hour

function validEmail_(v) {
  const e = String(v || '').trim().toLowerCase();
  return e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : '';
}

function otpCode_() {
  return String(100000 + (parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 8), 16) % 900000));
}

/** Step 1 of creating an account: e-mails a 6-digit code to the address the customer typed. */
function sendOtp_(d) {
  const name = text_(d.name, 120);
  const mobile = mobile_(d.mobile);
  const email = validEmail_(d.email);
  if (!name || !mobile) return { ok: false, error: 'BAD_INPUT' };
  if (!email) return { ok: false, error: 'BAD_EMAIL' };
  if (findMobileRow_(usersSheet_(), 1, mobile)) return { ok: false, error: 'EXISTS' };

  const cache = CacheService.getScriptCache();
  if (cache.get('otpwait:' + mobile)) return { ok: false, error: 'OTP_WAIT' };
  const sentThisHour = Number(cache.get('otpcount:' + mobile) || 0);
  if (sentThisHour >= OTP_MAX_PER_HOUR) return { ok: false, error: 'TOO_MANY' };
  if (MailApp.getRemainingDailyQuota() < 3) return { ok: false, error: 'TOO_MANY' };

  const code = otpCode_();
  const salt = Utilities.getUuid();
  cache.put('otp:' + mobile, JSON.stringify({ h: hashPassword_(code, salt), s: salt, e: email, t: 0 }), OTP_TTL);
  cache.put('otpwait:' + mobile, '1', OTP_RESEND_SECONDS);
  cache.put('otpcount:' + mobile, String(sentThisHour + 1), 3600);

  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Event Tamizha verification code: ' + code,
      body: 'Hello ' + name + ',\n\nYour Event Tamizha verification code is ' + code + '.\nIt is valid for 10 minutes. Do not share it with anyone.\n\nIf you did not ask for this, please ignore this e-mail.',
      name: 'Event Tamizha',
    });
  } catch (err) {
    cache.remove('otp:' + mobile);
    cache.remove('otpwait:' + mobile);
    return { ok: false, error: 'MAIL_FAIL' };
  }
  return { ok: true, sentTo: email.replace(/^(.).*(@.*)$/, '$1***$2') };
}

/** Checks the code for this number + e-mail. Returns { ok: true } or { ok: false, error }. */
function verifyOtp_(mobile, email, code, kind) {
  const cache = CacheService.getScriptCache();
  const k = (kind || 'otp') + ':' + mobile;
  const raw = cache.get(k);
  if (!raw) return { ok: false, error: 'OTP_EXPIRED' };
  const o = JSON.parse(raw);
  if (o.e !== email || o.t >= OTP_MAX_TRIES) { cache.remove(k); return { ok: false, error: 'OTP_EXPIRED' }; }
  if (hashPassword_(String(code || '').replace(/\D/g, ''), o.s) !== o.h) {
    o.t += 1;
    if (o.t >= OTP_MAX_TRIES) cache.remove(k);
    else cache.put(k, JSON.stringify(o), OTP_TTL);
    return { ok: false, error: 'OTP_BAD' };
  }
  cache.remove(k);
  return { ok: true };
}

/** Forgot password, step 1: e-mails a code to the address saved on the customer's account. Only customers; providers ask the admin. */
function sendResetOtp_(d) {
  const mobile = mobile_(d.mobile);
  if (!mobile) return { ok: false, error: 'BAD_INPUT' };
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  const r = row ? users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0] : null;
  const email = r ? validEmail_(r[16]) : '';
  // Same answer for "no such account" and "no e-mail saved", so nobody can probe which numbers are registered.
  if (!r || String(r[6] || 'Customer') !== 'Customer' || !email) return { ok: false, error: 'NO_RESET' };

  const cache = CacheService.getScriptCache();
  if (cache.get('rstwait:' + mobile)) return { ok: false, error: 'OTP_WAIT' };
  const sentThisHour = Number(cache.get('rstcount:' + mobile) || 0);
  if (sentThisHour >= OTP_MAX_PER_HOUR || MailApp.getRemainingDailyQuota() < 3) return { ok: false, error: 'TOO_MANY' };

  const code = otpCode_();
  const salt = Utilities.getUuid();
  cache.put('rst:' + mobile, JSON.stringify({ h: hashPassword_(code, salt), s: salt, e: email, t: 0 }), OTP_TTL);
  cache.put('rstwait:' + mobile, '1', OTP_RESEND_SECONDS);
  cache.put('rstcount:' + mobile, String(sentThisHour + 1), 3600);
  try {
    MailApp.sendEmail({
      to: email,
      subject: 'Event Tamizha password reset code: ' + code,
      body: 'Hello ' + String(r[1] || '') + ',\n\nYour Event Tamizha password reset code is ' + code + '.\nIt is valid for 10 minutes. Do not share it with anyone.\n\nIf you did not ask for this, ignore this e-mail — your password has not changed.',
      name: 'Event Tamizha',
    });
  } catch (err) {
    cache.remove('rst:' + mobile);
    cache.remove('rstwait:' + mobile);
    return { ok: false, error: 'MAIL_FAIL' };
  }
  return { ok: true, sentTo: email.replace(/^(.).*(@.*)$/, '$1***$2') };
}

/** Forgot password, step 2: checks the code, saves the new password, signs the customer out everywhere else and in here. */
function resetPassword_(d) {
  const mobile = mobile_(d.mobile);
  const password = String(d.password || '');
  if (!mobile || password.length < 6 || password.length > 64) return { ok: false, error: 'BAD_INPUT' };
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  const r = row ? users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0] : null;
  const email = r ? validEmail_(r[16]) : '';
  if (!r || String(r[6] || 'Customer') !== 'Customer' || !email) return { ok: false, error: 'NO_RESET' };

  const v = verifyOtp_(mobile, email, d.otp, 'rst');
  if (!v.ok) return v;

  const salt = Utilities.getUuid();
  users.getRange(row, 3, 1, 2).setValues([[salt, hashPassword_(password, salt)]]);
  dropSessions_(mobile);
  CacheService.getScriptCache().remove('fail:' + mobile);   // a locked-out customer can log in again
  users.getRange(row, 6).setValue(nowText_());
  return { ok: true, token: newSession_(mobile), user: userObj_(users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0]) };
}

/** Signs this mobile number out on every device (used after a password reset). */
function dropSessions_(mobile) {
  const sh = sessionsSheet_();
  const last = sh.getLastRow();
  if (last < 2) return;
  const vals = sh.getRange(2, 2, last - 1, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) if (digits_(vals[i][0]) === mobile) sh.deleteRow(i + 2);
}

/** Step 2: creates the account, but only with the right code from the e-mail. */
function register_(d) {
  const name = text_(d.name, 120);
  const mobile = mobile_(d.mobile);
  const email = validEmail_(d.email);
  const password = String(d.password || '');
  if (!name || !mobile || password.length < 6 || password.length > 64) return { ok: false, error: 'BAD_INPUT' };
  if (!email) return { ok: false, error: 'BAD_EMAIL' };

  const users = usersSheet_();
  if (findMobileRow_(users, 1, mobile)) return { ok: false, error: 'EXISTS' };

  const v = verifyOtp_(mobile, email, d.otp);
  if (!v.ok) return v;

  const cache = CacheService.getScriptCache();
  const salt = Utilities.getUuid();
  const now = nowText_();
  users.appendRow([mobile, name, salt, hashPassword_(password, salt), now, now, 'Customer', '', '', '', 'Yes', '', '', '', '', '', email]);

  return { ok: true, token: newSession_(mobile), user: { name: name, mobile: mobile, role: 'Customer', business: '', services: [], tier: '' } };
}

function login_(d) {
  const mobile = mobile_(d.mobile);
  const password = String(d.password || '');
  if (!mobile || !password) return { ok: false, error: 'BAD_INPUT' };

  const cache = CacheService.getScriptCache();
  const key = 'fail:' + mobile;
  const fails = Number(cache.get(key) || 0);
  if (fails >= MAX_LOGIN_FAILS) return { ok: false, error: 'LOCKED' };

  const users = usersSheet_();
  if (mobile === ADMIN_MOBILE && password === ADMIN_PASSWORD) ensureAdmin_(users);
  const row = findMobileRow_(users, 1, mobile);
  // Same answer for "no such user" and "wrong password" so nobody can probe which numbers are registered.
  if (!row) { cache.put(key, String(fails + 1), 900); return { ok: false, error: 'BAD_LOGIN' }; }
  const r = users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0];
  if (hashPassword_(password, String(r[2])) !== String(r[3])) {
    cache.put(key, String(fails + 1), 900);
    return { ok: false, error: 'BAD_LOGIN' };
  }

  const u = userObj_(r);
  if (u.role === 'Provider' && !u.active) return { ok: false, error: 'DISABLED' };

  cache.remove(key);
  users.getRange(row, 6).setValue(nowText_());
  return { ok: true, token: newSession_(mobile), user: u };
}

function me_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  if (!row) return { ok: false, error: 'INVALID_SESSION' };
  const u = userObj_(users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0]);
  if (u.role === 'Provider' && !u.active) return { ok: false, error: 'INVALID_SESSION' };
  return { ok: true, user: u };
}

function logout_(d) {
  const sh = sessionsSheet_();
  const row = findTokenRow_(sh, sha_(String(d.token || '')));
  if (row) sh.deleteRow(row);
  return { ok: true };
}

/**
 * All bookings of this customer, newest first.
 * Includes OLD bookings made as a guest (before the account existed) that carry the same mobile number:
 * they are linked to the account the first time the customer opens My Orders, so reviews and
 * notifications work for them too.
 */
function myOrders_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  if (roleOfMobile_(mobile) !== 'Customer') return { ok: false, error: 'FORBIDDEN' };
  const rows = orderRows_();
  const pmap = providerMap_();
  const sheet = getSheet_();
  const orders = [];
  for (let i = rows.length - 1; i >= 0 && orders.length < 1000; i--) {
    const account = digits_(rows[i][COL_ACCOUNT - 1]);
    const isMine = account === mobile;
    const isOldGuest = !account && digits_(rows[i][COL_MOBILE - 1]).slice(-10) === mobile;
    if (!isMine && !isOldGuest) continue;
    if (isOldGuest) {
      sheet.getRange(i + 2, COL_ACCOUNT).setValue(mobile); // link the old booking to this account
      rows[i][COL_ACCOUNT - 1] = mobile;
    }
    orders.push(orderObj_(rows[i], false, pmap));
  }
  return { ok: true, orders: orders };
}

/* ------------------------------------------------------------------ roles: admin & providers */

function userObj_(r) {
  return {
    mobile: digits_(r[0]),
    name: String(r[1]),
    role: String(r[6] || 'Customer'),
    business: String(r[7] || ''),
    services: String(r[8] || '').split(',').filter(function (x) { return x; }),
    towns: String(r[9] || ''),
    active: String(r[10]) !== 'No',
    tier: String(r[11] || 'Standard'),
    lat: r[12] === '' || r[12] === undefined ? null : num_(r[12]),
    lng: r[13] === '' || r[13] === undefined ? null : num_(r[13]),
    address: String(r[14] || ''),
    mapLink: String(r[15] || ''),
  };
}

/** The logged-in user if the token is valid and the account has the given role, otherwise null. */
function requireRole_(d, role) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return null;
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  if (!row) return null;
  const u = userObj_(users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0]);
  if (u.role !== role) return null;
  if (role === 'Provider' && !u.active) return null;
  return u;
}

/** mobile -> provider details, for every provider account. */
function providerMap_() {
  const users = usersSheet_();
  const last = users.getLastRow();
  const map = {};
  if (last < 2) return map;
  users.getRange(2, 1, last - 1, USER_HEADERS.length).getValues().forEach(function (r) {
    const u = userObj_(r);
    if (u.role === 'Provider') map[u.mobile] = u;
  });
  return map;
}

function orderRows_() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  return last < 2 ? [] : sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
}

function findOrderRow_(sheet, ref) {
  const last = sheet.getLastRow();
  if (last < 2 || !ref) return 0;
  const vals = sheet.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]) === String(ref)) return i + 2;
  return 0;
}

/** One order as a plain object. detail=true adds the customer's contact and provider fields (admin / provider screens). */
function orderObj_(r, detail, pmap) {
  const pm = digits_(r[COL_PROVIDER - 1]);
  const o = {
    ref: String(r[0]),
    received: cell_(r[1], 'yyyy-MM-dd HH:mm').slice(0, 16),
    status: String(r[2]).split(' - ')[0],
    event: String(r[5]),
    date: cell_(r[6], 'yyyy-MM-dd'),
    town: String(r[7]),
    address: String(r[8]),
    guests: String(r[9]),
    notes: String(r[10]),
    pandal: String(r[11]),
    size: String(r[12]),
    items: String(r[15]),
    boardText: String(r[16]),
    total: num_(r[20]),
    mapLink: String(r[COL_MAPLINK - 1] || ''),
    lat: String(r[COL_LAT - 1]) === '' ? null : num_(r[COL_LAT - 1]),
    lng: String(r[COL_LNG - 1]) === '' ? null : num_(r[COL_LNG - 1]),
    provider: String(r[COL_PROVIDER_NAME - 1] || ''),
    premium: !!(pm && pmap && pmap[pm] && pmap[pm].tier === 'Premium'),
  };
  o.rating = num_(r[COL_RATING - 1]);
  o.review = String(r[COL_REVIEW - 1] || '');
  o.reviewPhotos = parsePhotos_(r[COL_REVIEW_PHOTOS - 1]);
  o.photos = parsePhotos_(r[COL_BOOKING_PHOTOS - 1]);
  o.serviceDoneAt = cell_(r[COL_SERVICE_DONE_AT - 1], 'yyyy-MM-dd HH:mm').slice(0, 16);
  o.completedAt = cell_(r[COL_COMPLETED_AT - 1], 'yyyy-MM-dd HH:mm').slice(0, 16);
  o.hasRentals = hasRentals_(r);
  o.closeReason = String(r[COL_CLOSE_REASON - 1] || '');
  o.closedBy = String(r[COL_CLOSED_BY - 1] || '');
  o.closedAt = cell_(r[COL_CLOSED_AT - 1], 'yyyy-MM-dd HH:mm').slice(0, 16);
  if (detail) {
    o.name = String(r[3]);
    o.payout = String(r[COL_PAYOUT - 1]) === '' ? null : num_(r[COL_PAYOUT - 1]);
    o.costs = num_(r[COL_COSTS - 1]);
    o.phone = digits_(r[4]);
    o.account = digits_(r[COL_ACCOUNT - 1]);
    o.providerMobile = pm;
    o.assignedAt = cell_(r[COL_ASSIGNED_AT - 1], 'yyyy-MM-dd HH:mm').slice(0, 16);
    o.providerNote = String(r[COL_PROVIDER_NOTE - 1] || '');
    o.areaSqft = num_(r[13]);
    o.pandalCost = num_(r[14]);
    o.transport = num_(r[18]);
    o.labour = num_(r[19]);
  }
  return o;
}

function providerPublic_(u, rows) {
  let open = 0;
  let total = 0;
  let done = 0;
  let ratingSum = 0;
  let ratings = 0;
  let revenue = 0;
  rows.forEach(function (r) {
    if (digits_(r[COL_PROVIDER - 1]) !== u.mobile) return;
    total++;
    const st = String(r[2]).split(' - ')[0];
    if (st !== 'Done' && st !== 'Cancelled' && st !== 'Rejected') open++;
    if (st === 'Done') { done++; revenue += num_(r[20]); }
    const rating = num_(r[COL_RATING - 1]);
    if (rating > 0) { ratingSum += rating; ratings++; }
  });
  return {
    mobile: u.mobile, name: u.name, business: u.business, services: u.services, towns: u.towns,
    active: u.active, tier: u.tier, lat: u.lat, lng: u.lng, openJobs: open, totalJobs: total,
    doneJobs: done, ratingAvg: ratings ? Math.round((ratingSum / ratings) * 10) / 10 : 0, ratingCount: ratings, revenue: revenue,
  };
}

/** True when the order includes rental products (they have to be collected back after the function). */
function hasRentals_(r) {
  return /Rental products:|Sound service:/i.test(String(r[15] || ''));
}

function adminOrders_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const rows = orderRows_();
  const pmap = providerMap_();
  const orders = [];
  for (let i = rows.length - 1; i >= 0 && orders.length < 5000; i--) orders.push(orderObj_(rows[i], true, pmap));
  const providers = Object.keys(pmap).map(function (k) { return providerPublic_(pmap[k], rows); });
  return { ok: true, orders: orders, providers: providers };
}

/** Give an order to a provider (provider = mobile) or take it back (provider = ''). */
function adminAssign_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const sheet = getSheet_();
  const row = findOrderRow_(sheet, d.ref);
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  const pm = mobile_(d.provider);
  const o = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const before = digits_(o[COL_PROVIDER - 1]);
  if (!pm) {
    sheet.getRange(row, COL_PROVIDER, 1, 4).setValues([['', '', '', '']]);
    sheet.getRange(row, COL_STATUS).setValue('New');
    if (before) safe_(function () { notifyT_(before, 'JOB_TAKEN_BACK', { ref: o[0], line: orderLine_(o) }, o[0]); });
    safe_(function () { notifyT_('ADMIN', 'UNASSIGNED_ADMIN', { ref: o[0] }, o[0]); });
    return { ok: true };
  }
  const p = providerMap_()[pm];
  if (!p || !p.active) return { ok: false, error: 'BAD_PROVIDER' };
  if (p.lat === null || p.lng === null) return { ok: false, error: 'PROVIDER_NO_LOCATION' };
  sheet.getRange(row, COL_PROVIDER, 1, 4).setValues([[pm, p.business || p.name, nowText_(), '']]);
  sheet.getRange(row, COL_STATUS).setValue('Assigned');
  if (before && before !== pm) safe_(function () { notifyT_(before, 'JOB_REASSIGNED', { ref: o[0] }, o[0]); });
  safe_(function () { notifyT_(pm, 'NEW_JOB', { ref: o[0], line: orderLine_(o), name: o[3], phone: digits_(o[4]) }, o[0]); });
  safe_(function () { notifyT_(digits_(o[COL_ACCOUNT - 1]), 'PROVIDER_ASSIGNED', { ref: o[0], provider: p.business || p.name }, o[0]); });
  safe_(function () { notifyT_('ADMIN', 'ASSIGNED_ADMIN', { ref: o[0], provider: p.business || p.name }, o[0]); });
  return { ok: true };
}

function adminStatus_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  if (STATUSES.indexOf(String(d.status)) < 0) return { ok: false, error: 'BAD_INPUT' };
  const sheet = getSheet_();
  const row = findOrderRow_(sheet, d.ref);
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  sheet.getRange(row, COL_STATUS).setValue(String(d.status));
  if (d.status === 'Done' && !sheet.getRange(row, COL_COMPLETED_AT).getValue()) sheet.getRange(row, COL_COMPLETED_AT).setValue(nowText_());
  if (d.status === 'ServiceDone' && !sheet.getRange(row, COL_SERVICE_DONE_AT).getValue()) sheet.getRange(row, COL_SERVICE_DONE_AT).setValue(nowText_());
  const o = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const msg = 'Booking ' + o[0] + ' (' + orderLine_(o) + ') is now: ' + (STATUS_TEXT[d.status] || d.status) + '.';
  const label = STATUS_TEXT[d.status] || d.status;
  safe_(function () { notifyT_(digits_(o[COL_ACCOUNT - 1]), d.status === 'Done' ? 'STATUS_DONE_CUSTOMER' : 'STATUS_CUSTOMER', { ref: o[0], line: orderLine_(o), status: d.status }, o[0]); });
  safe_(function () { notifyT_(digits_(o[COL_PROVIDER - 1]), 'STATUS_PROVIDER', { ref: o[0], line: orderLine_(o), status: d.status }, o[0]); });
  safe_(function () { notifyT_('ADMIN', 'STATUS_ADMIN', { ref: o[0], line: orderLine_(o), status: d.status }, o[0]); });
  return { ok: true };
}

/* ------------------------------------------------------------------ cancel (customer) & reject (admin) */

/**
 * Closes a booking as Cancelled (by the customer) or Rejected (by the admin) and tells everybody involved:
 * the customer, the allocated provider (if any) and the admin (in-app, e-mail and WhatsApp).
 */
function closeOrder_(sheet, row, newStatus, by, reason) {
  const r = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const ref = String(r[0]);
  const providerMobile = digits_(r[COL_PROVIDER - 1]);
  const providerName = String(r[COL_PROVIDER_NAME - 1] || '');
  const customer = digits_(r[COL_ACCOUNT - 1]);
  sheet.getRange(row, COL_STATUS).setValue(newStatus);
  sheet.getRange(row, COL_CLOSE_REASON, 1, 3).setValues([[reason, by, nowText_()]]);
  // The provider stays on the row so the job shows in their history as closed.

  const verb = newStatus === 'Cancelled' ? 'cancelled by the customer' : 'rejected by the admin';
  const why = reason ? '\nReason: ' + reason : '';
  const line = orderLine_(r);
  const adminText = 'Booking ' + ref + ' (' + line + ') was ' + verb + '.' + why +
    '\nCustomer: ' + r[3] + ' ' + digits_(r[4]) +
    (providerMobile ? '\nProvider: ' + providerName + ' (' + providerMobile + ') has been told.' : '\nNo provider was allocated.');

  if (by === 'Customer') {
    safe_(function () { MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: 'Booking ' + ref + ' CANCELLED by customer', body: adminText, name: 'Event Tamizha Website' }); });
    safe_(function () { whatsappAdmin_('CANCELLED ' + ref + '\n' + adminText); });
    safe_(function () { notifyT_('ADMIN', 'CANCELLED_ADMIN', { ref: ref, line: line, name: r[3], phone: digits_(r[4]), reason: reason }, ref); });
    safe_(function () { notifyT_(customer, 'CANCELLED_CUSTOMER', { ref: ref }, ref); });
  } else {
    safe_(function () { notifyT_('ADMIN', 'REJECTED_ADMIN', { ref: ref, line: line, name: r[3], phone: digits_(r[4]), reason: reason }, ref); });
    safe_(function () { notifyT_(customer, 'REJECTED_CUSTOMER', { ref: ref, reason: reason }, ref); });
  }
  if (providerMobile) {
    safe_(function () { notifyT_(providerMobile, newStatus === 'Cancelled' ? 'JOB_CANCELLED_PROVIDER' : 'JOB_REJECTED_PROVIDER', { ref: ref, line: line, reason: reason }, ref); });
  }
  return { ok: true };
}

/** A customer cancels their own booking, any time before the service is done. */
function customerCancel_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  if (roleOfMobile_(mobile) !== 'Customer') return { ok: false, error: 'FORBIDDEN' };
  const sheet = getSheet_();
  const row = findOrderRow_(sheet, d.ref);
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  const r = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  const account = digits_(r[COL_ACCOUNT - 1]);
  const isOldGuest = !account && digits_(r[COL_MOBILE - 1]).slice(-10) === mobile;
  if (account !== mobile && !isOldGuest) return { ok: false, error: 'FORBIDDEN' };
  const status = String(r[2]).split(' - ')[0];
  if (CANCELLABLE.indexOf(status) < 0) return { ok: false, error: 'BAD_STATE' };
  return closeOrder_(sheet, row, 'Cancelled', 'Customer', text_(d.reason, 300));
}

/** The admin rejects a booking (cannot serve it). A reason is required and is shown to the customer. */
function adminReject_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const reason = text_(d.reason, 300);
  if (!reason) return { ok: false, error: 'BAD_INPUT' };
  const sheet = getSheet_();
  const row = findOrderRow_(sheet, d.ref);
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  const status = String(sheet.getRange(row, COL_STATUS).getValue()).split(' - ')[0];
  if (CANCELLABLE.indexOf(status) < 0) return { ok: false, error: 'BAD_STATE' };
  return closeOrder_(sheet, row, 'Rejected', 'Admin', reason);
}

function adminProviders_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const rows = orderRows_();
  const pmap = providerMap_();
  return { ok: true, providers: Object.keys(pmap).map(function (k) { return providerPublic_(pmap[k], rows); }) };
}

/** Create a provider login, or update one (blank password = keep the old password). */
function adminSaveProvider_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const mobile = mobile_(d.mobile);
  const name = text_(d.name, 120);
  const business = text_(d.business, 120);
  const towns = text_(d.towns, 200);
  const tier = d.tier === 'Premium' ? 'Premium' : 'Standard';
  const active = d.active === false || d.active === 'No' ? 'No' : 'Yes';
  const services = (Array.isArray(d.services) ? d.services : []).filter(function (x) { return SERVICES.indexOf(x) >= 0; }).join(',');
  const password = String(d.password || '');
  if (!mobile || !name) return { ok: false, error: 'BAD_INPUT' };
  if (password && (password.length < 6 || password.length > 64)) return { ok: false, error: 'BAD_INPUT' };

  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  if (!row) {
    if (!password) return { ok: false, error: 'BAD_INPUT' };
    const salt = Utilities.getUuid();
    const now = nowText_();
    users.appendRow([mobile, name, salt, hashPassword_(password, salt), now, '', 'Provider', business, services, towns, active, tier]);
    return { ok: true, created: true };
  }
  const cur = userObj_(users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0]);
  if (cur.role !== 'Provider') return { ok: false, error: 'EXISTS' }; // never convert customers or admins
  users.getRange(row, 2).setValue(name);
  users.getRange(row, 7, 1, 6).setValues([['Provider', business, services, towns, active, tier]]);
  if (password) {
    const salt = Utilities.getUuid();
    users.getRange(row, 3, 1, 2).setValues([[salt, hashPassword_(password, salt)]]);
    const sh = sessionsSheet_();
    for (let r = sh.getLastRow(); r >= 2; r--) if (digits_(sh.getRange(r, 2).getValue()) === mobile) sh.deleteRow(r);
  }
  return { ok: true, created: false };
}

/**
 * Profile: the signed-in user edits their name, saved location (address + GPS / map link) and, for customers, their mobile number.
 * Providers must always keep a location with coordinates (the admin allocates jobs by distance).
 * Changing the mobile number needs the current password; the customer's bookings, notifications and open sessions move with it.
 */
function updateProfile_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  if (!row) return { ok: false, error: 'INVALID_SESSION' };
  const raw = users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0];
  const cur = userObj_(raw);

  const name = text_(d.name, 120) || cur.name;
  const address = text_(d.address, 300);
  const loc = venueLocation_(d);
  if (cur.role === 'Provider' && loc.lat === '') return { ok: false, error: 'LOCATION_REQUIRED' };

  let newMobile = mobile;
  if (d.newMobile) {
    const wanted = mobile_(d.newMobile);
    if (!wanted) return { ok: false, error: 'BAD_INPUT' };
    if (wanted !== mobile) {
      if (cur.role !== 'Customer') return { ok: false, error: 'FORBIDDEN' }; // admin / provider numbers are managed by the admin
      const cache = CacheService.getScriptCache();
      const key = 'fail:' + mobile;
      const fails = Number(cache.get(key) || 0);
      if (fails >= MAX_LOGIN_FAILS) return { ok: false, error: 'LOCKED' };
      if (hashPassword_(String(d.password || ''), String(raw[2])) !== String(raw[3])) {
        cache.put(key, String(fails + 1), 900);
        return { ok: false, error: 'BAD_LOGIN' };
      }
      cache.remove(key);
      if (findMobileRow_(users, 1, wanted)) return { ok: false, error: 'EXISTS' };
      newMobile = wanted;
    }
  }

  users.getRange(row, 2).setValue(name);
  users.getRange(row, 13, 1, 4).setValues([[loc.lat, loc.lng, address, loc.mapLink]]);
  if (newMobile !== mobile) {
    users.getRange(row, 1).setValue(newMobile);
    const orders = getSheet_();
    renameMobile_(orders, COL_ACCOUNT, mobile, newMobile);
    renameMobile_(simpleSheet_(NOTIFY_SHEET, NOTIFY_HEADERS, false), 3, mobile, newMobile);
    renameMobile_(sessionsSheet_(), 2, mobile, newMobile);   // keeps this phone (and other phones) logged in
    renameMobile_(simpleSheet_(DEVICES_SHEET, DEVICE_HEADERS, true), 1, mobile, newMobile);
  }
  return { ok: true, user: userObj_(users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0]) };
}

/**
 * Google Play requires in-app account deletion. A customer deletes their own account with their password:
 * the login, sessions and notifications are removed; finished / cancelled bookings are anonymised (name, phone, address,
 * map position, photos and review text are wiped, the amounts stay for the business's accounts); bookings still in progress
 * are only unlinked from the account and keep their contact details until the service is finished.
 */
function deleteAccount_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  if (!row) return { ok: false, error: 'INVALID_SESSION' };
  const raw = users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0];
  if (userObj_(raw).role !== 'Customer') return { ok: false, error: 'FORBIDDEN' }; // providers and the admin are managed by the admin

  const cache = CacheService.getScriptCache();
  const key = 'fail:' + mobile;
  const fails = Number(cache.get(key) || 0);
  if (fails >= MAX_LOGIN_FAILS) return { ok: false, error: 'LOCKED' };
  if (hashPassword_(String(d.password || ''), String(raw[2])) !== String(raw[3])) {
    cache.put(key, String(fails + 1), 900);
    return { ok: false, error: 'BAD_LOGIN' };
  }
  cache.remove(key);

  const sheet = getSheet_();
  const rows = orderRows_();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (digits_(r[COL_ACCOUNT - 1]) !== mobile) continue;
    const n = i + 2;
    sheet.getRange(n, COL_ACCOUNT).setValue('');
    const st = String(r[2]).split(' - ')[0];
    if (st !== 'Done' && st !== 'Cancelled' && st !== 'Rejected') continue;
    sheet.getRange(n, 4, 1, 2).setValues([['Deleted customer', '']]);
    sheet.getRange(n, 9).setValue('');
    sheet.getRange(n, 11).setValue('');
    sheet.getRange(n, COL_LAT, 1, 3).setValues([['', '', '']]);
    sheet.getRange(n, COL_REVIEW).setValue('');
    [COL_REVIEW_PHOTOS, COL_BOOKING_PHOTOS].forEach(function (col) {
      parsePhotos_(r[col - 1]).forEach(function (u) { trashFile_(photoIdOf_(u)); });
      sheet.getRange(n, col).setValue('');
    });
  }

  const notes = simpleSheet_(NOTIFY_SHEET, NOTIFY_HEADERS, false);
  for (let r = notes.getLastRow(); r >= 2; r--) if (digits_(notes.getRange(r, 3).getValue()) === mobile) notes.deleteRow(r);
  const devices = simpleSheet_(DEVICES_SHEET, DEVICE_HEADERS, true);
  for (let r = devices.getLastRow(); r >= 2; r--) if (digits_(devices.getRange(r, 1).getValue()) === mobile) devices.deleteRow(r);
  const sessions = sessionsSheet_();
  for (let r = sessions.getLastRow(); r >= 2; r--) if (digits_(sessions.getRange(r, 2).getValue()) === mobile) sessions.deleteRow(r);
  users.deleteRow(row);
  return { ok: true };
}

/** Replaces one mobile number with another in a whole column (rows 2..last). */
function renameMobile_(sheet, col, from, to) {
  const last = sheet.getLastRow();
  if (last < 2) return;
  const range = sheet.getRange(2, col, last - 1, 1);
  const vals = range.getValues();
  let changed = false;
  const out = vals.map(function (r) {
    if (digits_(r[0]) === from) { changed = true; return [to]; }
    return [r[0]];
  });
  if (changed) range.setValues(out);
}

/** A provider saves their base (home / shop) location so the admin can see who is nearest to a venue. */
function providerSetLocation_(d) {
  const me = requireRole_(d, 'Provider');
  if (!me) return { ok: false, error: 'FORBIDDEN' };
  const lat = Number(d.lat);
  const lng = Number(d.lng);
  if (d.lat === null || d.lat === '' || d.lng === null || d.lng === '' || !isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return { ok: false, error: 'BAD_INPUT' };
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, me.mobile);
  if (!row) return { ok: false, error: 'FORBIDDEN' };
  users.getRange(row, 13, 1, 2).setValues([[lat, lng]]);
  return { ok: true, lat: lat, lng: lng };
}

function providerOrders_(d) {
  const me = requireRole_(d, 'Provider');
  if (!me) return { ok: false, error: 'FORBIDDEN' };
  // A provider must share a base location before receiving jobs: the admin allocates by distance.
  if (me.lat === null || me.lng === null) return { ok: false, error: 'LOCATION_REQUIRED' };
  const rows = orderRows_();
  const orders = [];
  for (let i = rows.length - 1; i >= 0 && orders.length < 2000; i--) {
    if (digits_(rows[i][COL_PROVIDER - 1]) !== me.mobile) continue;
    const o = orderObj_(rows[i], true, null);
    delete o.account;
    orders.push(o);
  }
  return { ok: true, orders: orders };
}

/** A provider accepts, declines or completes a job assigned to them. */
function providerRespond_(d) {
  const me = requireRole_(d, 'Provider');
  if (!me) return { ok: false, error: 'FORBIDDEN' };
  const sheet = getSheet_();
  const row = findOrderRow_(sheet, d.ref);
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  const r = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  if (digits_(r[COL_PROVIDER - 1]) !== me.mobile) return { ok: false, error: 'FORBIDDEN' };
  const status = String(r[2]).split(' - ')[0];
  const note = text_(d.note, 300);
  const who = me.business || me.name;
  let what;

  if (d.response === 'accept' && status === 'Assigned') {
    sheet.getRange(row, COL_STATUS).setValue('Accepted');
    sheet.getRange(row, COL_PROVIDER_NOTE).setValue(note);
    what = 'accepted';
  } else if (d.response === 'decline' && (status === 'Assigned' || status === 'Accepted')) {
    // Back to the admin's queue; the reason stays visible in the Provider note column.
    sheet.getRange(row, COL_PROVIDER, 1, 4).setValues([['', '', '', 'Declined by ' + who + (note ? ': ' + note : '')]]);
    sheet.getRange(row, COL_STATUS).setValue('New');
    what = 'declined';
  } else if ((d.response === 'serviceDone' || d.response === 'done') && (status === 'Accepted' || status === 'Assigned' || status === 'Confirmed')) {
    const rentals = hasRentals_(r);
    sheet.getRange(row, COL_STATUS).setValue(rentals ? 'ServiceDone' : 'Done');
    sheet.getRange(row, COL_SERVICE_DONE_AT).setValue(nowText_());
    if (!rentals) sheet.getRange(row, COL_COMPLETED_AT).setValue(nowText_());
    if (note) sheet.getRange(row, COL_PROVIDER_NOTE).setValue(note);
    what = rentals ? 'finished the service (rental items still to be collected) for' : 'completed';
  } else if (d.response === 'returned' && status === 'ServiceDone') {
    sheet.getRange(row, COL_STATUS).setValue('Done');
    sheet.getRange(row, COL_COMPLETED_AT).setValue(nowText_());
    if (note) sheet.getRange(row, COL_PROVIDER_NOTE).setValue(note);
    what = 'collected the rental items and completed';
  } else {
    return { ok: false, error: 'BAD_STATE' };
  }

  const text = who + ' (' + me.mobile + ') ' + what + ' order ' + d.ref + ' · ' + orderLine_(r) + (note ? '\nNote: ' + note : '');
  safe_(function () {
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: 'Provider ' + what + ' order ' + d.ref + ' - ' + who, body: text, name: 'Event Tamizha Website' });
  });
  safe_(function () { whatsappAdmin_(text); });
  const whatKey = what === 'accepted' ? 'accepted' : what === 'declined' ? 'declined' : what.indexOf('finished the service') === 0 ? 'serviceDone' : what.indexOf('collected') === 0 ? 'returned' : 'done';
  safe_(function () { notifyT_('ADMIN', 'PROV_ACTION_ADMIN', { who: who, ref: d.ref, line: orderLine_(r), action: whatKey, note: note }, d.ref); });
  safe_(function () { notifyT_(me.mobile, 'PROV_ACTION_SELF', { ref: d.ref, line: orderLine_(r), action: whatKey }, d.ref); });
  const customer = digits_(r[COL_ACCOUNT - 1]);
  const forCustomer = what === 'accepted' ? who + ' has accepted your booking ' + d.ref + '.'
    : what === 'declined' ? 'We are arranging another provider for your booking ' + d.ref + '.'
    : what.indexOf('finished the service') === 0 ? 'The service for booking ' + d.ref + ' is done. Our team will collect the rental items soon.'
    : 'Your booking ' + d.ref + ' is completed. Thank you for choosing us! Please rate the service in My Orders.';
  safe_(function () { notifyT_(customer, 'CUST_' + (whatKey === 'returned' ? 'DONE' : whatKey.toUpperCase()), { ref: d.ref, who: who }, d.ref); });
  return { ok: true };
}

/* ------------------------------------------------------------------ reviews & costs */

/** A customer rates a completed booking (1–5 stars) and may leave a comment. They can update it later. */
function customerReview_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  const sheet = getSheet_();
  const row = findOrderRow_(sheet, d.ref);
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  const o = sheet.getRange(row, 1, 1, HEADERS.length).getValues()[0];
  if (digits_(o[COL_ACCOUNT - 1]) !== mobile) return { ok: false, error: 'FORBIDDEN' };
  if (String(o[2]).split(' - ')[0] !== 'Done') return { ok: false, error: 'NOT_COMPLETED' };
  const rating = Math.round(num_(d.rating));
  if (rating < 1 || rating > 5) return { ok: false, error: 'BAD_INPUT' };
  const review = text_(d.review, 1000);

  // Photos: keep the ones the customer left in place, drop the removed ones, add up to MAX_REVIEW_PHOTOS in total.
  const before = parsePhotos_(o[COL_REVIEW_PHOTOS - 1]);
  const wanted = Array.isArray(d.keepPhotos) ? d.keepPhotos.map(String) : before;
  const kept = before.filter(function (u) { return wanted.indexOf(u) >= 0; }).slice(0, MAX_REVIEW_PHOTOS);
  before.forEach(function (u) { if (kept.indexOf(u) < 0) trashFile_(photoIdOf_(u)); });
  const fresh = Array.isArray(d.photos) ? d.photos.slice(0, MAX_REVIEW_PHOTOS - kept.length) : [];
  const saved = kept.slice();
  for (let i = 0; i < fresh.length; i++) {
    const ph = savePhoto_(fresh[i], 'review-' + o[0] + '-' + (saved.length + 1));
    if (ph.error) return { ok: false, error: ph.error };
    saved.push(ph.url);
  }
  sheet.getRange(row, COL_RATING, 1, 3).setValues([[rating, review, nowText_()]]);
  sheet.getRange(row, COL_REVIEW_PHOTOS).setValue(saved.length ? JSON.stringify(saved) : '');
  const stars = '★★★★★'.slice(0, rating) + '☆☆☆☆☆'.slice(rating);
  const text = o[3] + ' rated booking ' + o[0] + ' ' + stars + (review ? '\n"' + review + '"' : '');
  safe_(function () { MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: 'New review ' + stars + ' for ' + o[0], body: text, name: 'Event Tamizha Website' }); });
  safe_(function () { notifyT_('ADMIN', 'REVIEW_ADMIN', { name: o[3], ref: o[0], stars: stars, review: review }, o[0]); });
  safe_(function () { notifyT_(digits_(o[COL_PROVIDER - 1]), 'REVIEW_PROVIDER', { name: o[3], ref: o[0], stars: stars, review: review }, o[0]); });
  return { ok: true, photos: saved };
}

function parsePhotos_(cell) {
  try {
    const v = JSON.parse(String(cell || '[]'));
    return Array.isArray(v) ? v.map(String).filter(function (u) { return /^https:\/\/drive\.google\.com\//.test(u); }) : [];
  } catch (e) { return []; }
}

function photoIdOf_(url) {
  const m = /[?&]id=([\w-]+)/.exec(String(url));
  return m ? m[1] : '';
}

/** Which services an order used: pandal (type or decoration), lighting, rentals. */
function servicesOf_(r) {
  const it = String(r[15] || '');
  const n = [];
  if (String(r[11] || '') || /Additional decoration/i.test(it)) n.push('pandal');
  if (/Lighting decoration/i.test(it)) n.push('lighting');
  if (/Rental products|Sound service/i.test(it)) n.push('rentals');
  return n;
}

/** Public: recent customer reviews (first name only) with their photos, for the service pages. No login needed. */
function publicReviews_(d) {
  const want = String(d.service || '');
  const rows = orderRows_();
  const out = [];
  for (let i = rows.length - 1; i >= 0 && out.length < 60; i--) {
    const r = rows[i];
    const rating = num_(r[COL_RATING - 1]);
    if (rating < 1 || String(r[2]).split(' - ')[0] !== 'Done') continue;
    const services = servicesOf_(r);
    if (want && services.indexOf(want) < 0) continue;
    out.push({
      name: String(r[3] || '').trim().split(/\s+/)[0] || 'Customer',
      rating: rating,
      review: String(r[COL_REVIEW - 1] || ''),
      photos: parsePhotos_(r[COL_REVIEW_PHOTOS - 1]),
      date: cell_(r[COL_REVIEWED_AT - 1], 'yyyy-MM-dd').slice(0, 10),
      town: String(r[7] || ''),
      services: services,
    });
  }
  return { ok: true, reviews: out };
}

/** Admin records what the provider is paid and any other costs for an order (for the profit report). */
function adminCosts_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const sheet = getSheet_();
  const row = findOrderRow_(sheet, d.ref);
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  const payout = d.payout === '' || d.payout === null || d.payout === undefined ? '' : Math.max(0, Math.round(num_(d.payout)));
  const costs = Math.max(0, Math.round(num_(d.costs)));
  sheet.getRange(row, COL_PAYOUT, 1, 2).setValues([[payout, costs]]);
  return { ok: true };
}

/* ------------------------------------------------------------------ products */

function productsSheet_() {
  return simpleSheet_(PRODUCTS_SHEET, PRODUCT_HEADERS, false);
}

function productRows_() {
  const sh = productsSheet_();
  const last = sh.getLastRow();
  return last < 2 ? [] : sh.getRange(2, 1, last - 1, PRODUCT_HEADERS.length).getValues();
}

function findProductRow_(sh, id) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const ids = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}

/** Public: products added by the admin, and the ids of built-in products the admin removed. */
function products_() {
  const added = [];
  const hidden = [];
  const overrides = [];
  const pandals = [];
  productRows_().forEach(function (r) {
    const id = String(r[0]);
    if (!id) return;
    const builtIn = String(r[10]) === 'Yes';
    const deleted = String(r[9]) === 'Deleted';
    if (String(r[1]) === 'pandal') {   // admin-set pandal rate: price = per sq ft, unit (EN) column = minimum charge
      if (!deleted && PANDAL_IDS.indexOf(id) >= 0) pandals.push({ id: id, pricePerSqft: num_(r[6]), minCharge: num_(r[5]) });
      return;
    }
    if (builtIn) {
      if (deleted) hidden.push(id);
      else overrides.push(productObj_(r));
      return;
    }
    if (deleted || PRODUCT_CATEGORIES.indexOf(String(r[1])) < 0) return;
    added.push(productObj_(r));
  });
  return { ok: true, added: added, hidden: hidden, overrides: overrides, pandals: pandals };
}

function productObj_(r) {
  return {
    id: String(r[0]), category: String(r[1]),
    name: { ta: String(r[2] || r[3]), en: String(r[3] || r[2]) },
    unit: { ta: String(r[4] || r[5]), en: String(r[5] || r[4]) },
    price: num_(r[6]), img: String(r[7] || ''),
  };
}

/** Saves a data-URL photo to the Drive folder with a public view link. Returns { url, fileId } or { error }. */
function savePhoto_(dataUrl, label) {
  const m = /^data:(image\/(jpeg|png|webp));base64,(.+)$/.exec(String(dataUrl || ''));
  if (!m) return { error: 'BAD_IMAGE' };
  const bytes = Utilities.base64Decode(m[3]);
  if (bytes.length > MAX_PHOTO_BYTES) return { error: 'IMAGE_TOO_BIG' };
  const blob = Utilities.newBlob(bytes, m[1], String(label || 'photo').replace(/[^\w\- ]+/g, '').slice(0, 40) + '.' + (m[2] === 'jpeg' ? 'jpg' : m[2]));
  const file = photoFolder_().createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    file.setTrashed(true);
    return { error: 'SHARING_BLOCKED' };
  }
  return { url: 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w800', fileId: file.getId() };
}

function trashFile_(id) {
  if (id) { try { DriveApp.getFileById(String(id)).setTrashed(true); } catch (e) { /* already gone */ } }
}

/** Edit a product: an admin-added one in place, or a built-in one by saving an override row (Built-in = Yes). */
function adminEditProduct_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const id = text_(d.id, 40);
  const category = String(d.category || '');
  const nameTa = text_(d.nameTa, 120);
  const nameEn = text_(d.nameEn, 120);
  const unitTa = text_(d.unitTa, 60);
  const unitEn = text_(d.unitEn, 60);
  const price = Math.round(num_(d.price));
  if (!id || PRODUCT_CATEGORIES.indexOf(category) < 0 || (!nameTa && !nameEn) || !(price > 0) || price > 10000000) return { ok: false, error: 'BAD_INPUT' };

  const sh = productsSheet_();
  const row = findProductRow_(sh, id);
  const old = row ? sh.getRange(row, 1, 1, PRODUCT_HEADERS.length).getValues()[0] : null;
  if (!row && d.builtIn !== true) return { ok: false, error: 'NOT_FOUND' };

  let url = old ? String(old[7] || '') : String(d.currentImg || '');
  let fileId = old ? String(old[8] || '') : '';
  if (d.image) {
    const ph = savePhoto_(d.image, nameEn || nameTa);
    if (ph.error) return { ok: false, error: ph.error };
    if (fileId) trashFile_(fileId);
    url = ph.url;
    fileId = ph.fileId;
  } else if (d.removeImage) {
    if (fileId) trashFile_(fileId);
    url = '';
    fileId = '';
  }
  const builtIn = old ? String(old[10]) : 'Yes';
  const values = [id, category, nameTa, nameEn, unitTa, unitEn, price, url, fileId, 'Active', builtIn, nowText_()];
  if (row) sh.getRange(row, 1, 1, PRODUCT_HEADERS.length).setValues([values]);
  else sh.appendRow(values);
  return { ok: true };
}

/** The Drive folder that holds uploaded product photos (created on first use). */
function photoFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PHOTO_FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* folder was deleted: make a new one */ }
  }
  const folder = DriveApp.createFolder(PHOTO_FOLDER);
  props.setProperty('PHOTO_FOLDER_ID', folder.getId());
  return folder;
}

function adminAddProduct_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const category = String(d.category || '');
  const nameTa = text_(d.nameTa, 120);
  const nameEn = text_(d.nameEn, 120);
  const unitTa = text_(d.unitTa, 60);
  const unitEn = text_(d.unitEn, 60);
  const price = Math.round(num_(d.price));
  if (PRODUCT_CATEGORIES.indexOf(category) < 0 || (!nameTa && !nameEn) || !(price > 0) || price > 10000000) return { ok: false, error: 'BAD_INPUT' };

  let url = '';
  let fileId = '';
  if (d.image) {
    const ph = savePhoto_(d.image, nameEn || nameTa);
    if (ph.error) return { ok: false, error: ph.error };
    url = ph.url;
    fileId = ph.fileId;
  }

  const id = newId_('p');
  productsSheet_().appendRow([id, category, nameTa, nameEn, unitTa, unitEn, price, url, fileId, 'Active', 'No', nowText_()]);
  return { ok: true, product: { id: id, category: category, name: { ta: nameTa || nameEn, en: nameEn || nameTa }, unit: { ta: unitTa || unitEn, en: unitEn || unitTa }, price: price, img: url } };
}

/** The admin changes a pandal type's rate: price per sq ft and the minimum charge. Reset with adminRestoreProduct (same id). */
function adminSavePandal_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const id = text_(d.id, 40);
  const rate = Math.round(num_(d.pricePerSqft));
  const min = Math.round(num_(d.minCharge));
  if (PANDAL_IDS.indexOf(id) < 0 || !(rate > 0) || rate > 100000 || !(min >= 0) || min > 10000000) return { ok: false, error: 'BAD_INPUT' };
  const sh = productsSheet_();
  const row = findProductRow_(sh, id);
  const values = [id, 'pandal', '', '', '', String(min), rate, '', '', 'Active', 'Yes', nowText_()];
  if (row) sh.getRange(row, 1, 1, PRODUCT_HEADERS.length).setValues([values]);
  else sh.appendRow(values);
  return { ok: true };
}

/** Admin-added products are marked Deleted (photo moved to Drive trash); built-in ones are hidden. */
function adminDeleteProduct_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const id = text_(d.id, 40);
  if (!id) return { ok: false, error: 'BAD_INPUT' };
  const sh = productsSheet_();
  const row = findProductRow_(sh, id);
  if (row) {
    const r = sh.getRange(row, 1, 1, PRODUCT_HEADERS.length).getValues()[0];
    sh.getRange(row, 10).setValue('Deleted');
    sh.getRange(row, 12).setValue(nowText_());
    trashFile_(r[8]);
    return { ok: true };
  }
  if (d.builtIn !== true) return { ok: false, error: 'NOT_FOUND' };
  sh.appendRow([id, text_(d.category, 20), '', text_(d.name, 120), '', '', '', '', '', 'Deleted', 'Yes', nowText_()]);
  return { ok: true };
}

/** Brings back a built-in product the admin had removed, or resets an edited built-in product to its original. */
function adminRestoreProduct_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const sh = productsSheet_();
  const row = findProductRow_(sh, text_(d.id, 40));
  if (!row || String(sh.getRange(row, 11).getValue()) !== 'Yes') return { ok: false, error: 'NOT_FOUND' };
  trashFile_(sh.getRange(row, 9).getValue());
  sh.deleteRow(row);
  return { ok: true };
}

/** Run once from the editor after updating the script: grants Drive access for product photos. */
function setupProductPhotos() {
  const folder = photoFolder_();
  productsSheet_();
  Logger.log('Product photo folder: ' + folder.getUrl());
}

/* ------------------------------------------------------------------ notifications & alerts */

/** Unique id: time + random part, so two saves in the same millisecond never collide. */
function newId_(prefix) {
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36).padStart(3, '0');
}

/** Runs fn and ignores any error: alerts must never undo or block the main action. */
function safe_(fn) {
  try { fn(); } catch (e) { Logger.log('alert failed: ' + e); }
}

/** "Wedding · 2026-11-15 · Erode · Rs 25000" from an Orders row. */
function orderLine_(o) {
  return [o[5], cell_(o[6], 'yyyy-MM-dd'), o[7]].filter(function (x) { return x; }).join(' · ') + ' · Rs ' + num_(o[20]);
}

/** In-app notification. `to` is a mobile number or 'ADMIN' (every admin sees it). */
/* ------------------------------------------------------------------ friendly alert texts (Tamil / English) */

const STATUS_TA = { New: 'பெறப்பட்டது', Assigned: 'வழங்குநர் ஒதுக்கப்பட்டார்', Accepted: 'வழங்குநர் ஏற்றுக்கொண்டார்', Confirmed: 'உறுதிசெய்யப்பட்டது', ServiceDone: 'சேவை முடிந்தது – வாடகைப் பொருட்கள் எடுக்கப்பட வேண்டும்', Done: 'முடிந்தது', Cancelled: 'ரத்து செய்யப்பட்டது', Rejected: 'நிராகரிக்கப்பட்டது' };
const ACTION_TEXT = {
  accepted: { ta: 'பணி ஏற்கப்பட்டது', en: 'job accepted' },
  declined: { ta: 'பணி மறுக்கப்பட்டது', en: 'job declined' },
  serviceDone: { ta: 'சேவை முடிந்தது (வாடகைப் பொருட்கள் எடுக்கப்பட வேண்டும்)', en: 'service finished (rental items still to be collected)' },
  returned: { ta: 'பொருட்கள் எடுக்கப்பட்டன; பணி முடிந்தது', en: 'rental items collected, job completed' },
  done: { ta: 'பணி முடிந்தது', en: 'job completed' },
};
/** [title, message] per language. {placeholders} are filled from the values given to notifyT_. */
const NT = {
  NEW_BOOKING_ADMIN: { ta: ["🆕 புதிய முன்பதிவு {ref}", "{name} முன்பதிவு செய்துள்ளார் — {line}. உறுதிப்படுத்த அவரை அழைக்கவும்."], en: ["🆕 New booking {ref}", "{name} has booked: {line}. Please call to confirm."] },
  BOOKING_RECEIVED: { ta: ["✅ முன்பதிவு பெறப்பட்டது", "நன்றி! உங்கள் முன்பதிவு ({ref}) கிடைத்தது — {line}. விரைவில் உங்களை அழைப்போம்."], en: ["✅ Booking received", "Thank you! We got your booking ({ref}): {line}. We will call you soon."] },
  JOB_TAKEN_BACK: { ta: ["ℹ️ பணி திரும்பப் பெறப்பட்டது", "{ref} பணியை நிர்வாகி திரும்பப் பெற்றார் ({line}). நீங்கள் செல்ல வேண்டாம்."], en: ["ℹ️ Job taken back", "The admin took job {ref} back ({line}). You do not need to go."] },
  UNASSIGNED_ADMIN: { ta: ["↩️ ஒதுக்கீடு நீக்கப்பட்டது", "{ref} முன்பதிவிலிருந்து வழங்குநரை நீக்கிவிட்டீர்கள். புதிய வழங்குநரை ஒதுக்கவும்."], en: ["↩️ Provider removed", "You removed the provider from {ref}. Please assign a new one."] },
  JOB_REASSIGNED: { ta: ["ℹ️ பணி மாற்றப்பட்டது", "{ref} பணி வேறொரு வழங்குநருக்கு வழங்கப்பட்டது. நீங்கள் செல்ல வேண்டாம்."], en: ["ℹ️ Job given to someone else", "Job {ref} was given to another provider. You do not need to go."] },
  NEW_JOB: { ta: ["🛠️ புதிய பணி {ref}", "{line}. வாடிக்கையாளர்: {name} ({phone}). “என் பணிகள்” பகுதியில் ஏற்கவும் அல்லது மறுக்கவும்."], en: ["🛠️ New job {ref}", "{line}. Customer: {name} ({phone}). Please accept or decline it in My Jobs."] },
  PROVIDER_ASSIGNED: { ta: ["👷 வழங்குநர் ஒதுக்கப்பட்டார்", "உங்கள் முன்பதிவு {ref}-ஐ {provider} கவனித்துக்கொள்வார்."], en: ["👷 Your provider is set", "{provider} will take care of your booking {ref}."] },
  ASSIGNED_ADMIN: { ta: ["✅ ஒதுக்கப்பட்டது", "{ref} முன்பதிவு {provider}-க்கு வழங்கப்பட்டது."], en: ["✅ Assigned", "Booking {ref} was given to {provider}."] },
  STATUS_CUSTOMER: { ta: ["📣 முன்பதிவு நிலை: {label}", "உங்கள் முன்பதிவு {ref} ({line}) இப்போது: {label}."], en: ["📣 Booking update: {label}", "Your booking {ref} ({line}) is now: {label}."] },
  STATUS_DONE_CUSTOMER: { ta: ["🎉 உங்கள் முன்பதிவு முடிந்தது", "நன்றி! {ref} முடிந்தது. “என் முன்பதிவுகள்” பகுதியில் சேவையை மதிப்பிடுங்கள் ⭐"], en: ["🎉 Your booking is complete", "Thank you! {ref} is done. Please rate the service in My Orders ⭐"] },
  STATUS_PROVIDER: { ta: ["📣 பணி நிலை: {label}", "பணி {ref} ({line}) இப்போது: {label}."], en: ["📣 Job update: {label}", "Job {ref} ({line}) is now: {label}."] },
  STATUS_ADMIN: { ta: ["📣 நிலை மாற்றம்: {label}", "முன்பதிவு {ref} ({line}) இப்போது: {label}."], en: ["📣 Status changed: {label}", "Booking {ref} ({line}) is now: {label}."] },
  CANCELLED_ADMIN: { ta: ["❌ முன்பதிவு ரத்து {ref}", "{name} ({phone}) தனது முன்பதிவை ரத்து செய்தார் — {line}.{reasonLine}"], en: ["❌ Booking cancelled {ref}", "{name} ({phone}) cancelled the booking: {line}.{reasonLine}"] },
  CANCELLED_CUSTOMER: { ta: ["❌ முன்பதிவு ரத்து செய்யப்பட்டது", "உங்கள் முன்பதிவு {ref} ரத்து செய்யப்பட்டது. மீண்டும் முன்பதிவு செய்ய எப்போது வேண்டுமானாலும் வாருங்கள்."], en: ["❌ Booking cancelled", "Your booking {ref} has been cancelled. You are always welcome to book again."] },
  REJECTED_ADMIN: { ta: ["🚫 முன்பதிவு நிராகரிக்கப்பட்டது {ref}", "{name} ({phone}) — {line} நிராகரிக்கப்பட்டது.{reasonLine}"], en: ["🚫 Booking rejected {ref}", "{name} ({phone}): {line} was rejected.{reasonLine}"] },
  REJECTED_CUSTOMER: { ta: ["😔 முன்பதிவை ஏற்க முடியவில்லை", "மன்னிக்கவும், உங்கள் முன்பதிவு {ref}-ஐ எங்களால் ஏற்க முடியவில்லை.{reasonLine}"], en: ["😔 We could not take your booking", "Sorry, we could not take your booking {ref}.{reasonLine}"] },
  JOB_CANCELLED_PROVIDER: { ta: ["⛔ பணி ரத்து {ref}", "பணி {ref} ({line}) வாடிக்கையாளரால் ரத்து செய்யப்பட்டது. இடத்துக்குச் செல்ல வேண்டாம்."], en: ["⛔ Job cancelled {ref}", "Job {ref} ({line}) was cancelled by the customer. Please do not go to the venue."] },
  JOB_REJECTED_PROVIDER: { ta: ["⛔ பணி நிறுத்தம் {ref}", "பணி {ref} ({line}) நிர்வாகியால் நிராகரிக்கப்பட்டது. இடத்துக்குச் செல்ல வேண்டாம்.{reasonLine}"], en: ["⛔ Job stopped {ref}", "Job {ref} ({line}) was rejected by the admin. Please do not go to the venue.{reasonLine}"] },
  PROV_ACTION_ADMIN: { ta: ["🔔 {who}: {actionText}", "{who} — {ref} ({line}): {actionText}.{noteLine}"], en: ["🔔 {who}: {actionText}", "{who} — {ref} ({line}): {actionText}.{noteLine}"] },
  PROV_ACTION_SELF: { ta: ["✔️ பணி புதுப்பிக்கப்பட்டது", "பணி {ref} ({line}): {actionText}."], en: ["✔️ Job updated", "Job {ref} ({line}): {actionText}."] },
  CUST_ACCEPTED: { ta: ["👍 வழங்குநர் ஏற்றுக்கொண்டார்", "{who} உங்கள் முன்பதிவு {ref}-ஐ ஏற்றுக்கொண்டார்."], en: ["👍 Provider accepted", "{who} accepted your booking {ref}."] },
  CUST_DECLINED: { ta: ["🔄 வேறு வழங்குநரை ஏற்பாடு செய்கிறோம்", "உங்கள் முன்பதிவு {ref}-க்கு வேறு வழங்குநரை ஏற்பாடு செய்கிறோம். கவலை வேண்டாம்."], en: ["🔄 Arranging another provider", "We are arranging another provider for your booking {ref}. No need to worry."] },
  CUST_SERVICEDONE: { ta: ["🧰 சேவை முடிந்தது", "முன்பதிவு {ref}-ன் சேவை முடிந்தது. வாடகைப் பொருட்களை எங்கள் குழு விரைவில் எடுத்துச் செல்லும்."], en: ["🧰 Service finished", "The service for booking {ref} is done. Our team will collect the rental items soon."] },
  CUST_DONE: { ta: ["🎉 உங்கள் முன்பதிவு முடிந்தது", "{ref} முடிந்தது. எங்களைத் தேர்ந்தெடுத்ததற்கு நன்றி! “என் முன்பதிவுகள்” பகுதியில் சேவையை மதிப்பிடுங்கள் ⭐"], en: ["🎉 Your booking is complete", "{ref} is completed. Thank you for choosing us! Please rate the service in My Orders ⭐"] },
  REVIEW_ADMIN: { ta: ["⭐ புதிய மதிப்பீடு {stars}", "{name} முன்பதிவு {ref}-க்கு {stars} மதிப்பீடு அளித்தார்.{reviewLine}"], en: ["⭐ New review {stars}", "{name} rated booking {ref} {stars}.{reviewLine}"] },
  REVIEW_PROVIDER: { ta: ["⭐ உங்களுக்குப் புதிய மதிப்பீடு {stars}", "{name} பணி {ref}-க்கு {stars} அளித்தார்.{reviewLine}"], en: ["⭐ You got a review {stars}", "{name} rated job {ref} {stars}.{reviewLine}"] },
};

/** Which language this person uses ('ta' or 'en'). 'ADMIN' = the admin account. Tamil until the app tells us otherwise. */
function langOf_(to) {
  try {
    const users = usersSheet_();
    const mobile = String(to) === 'ADMIN' ? ADMIN_MOBILE : digits_(to);
    const row = findMobileRow_(users, 1, mobile);
    return row && String(users.getRange(row, 18).getValue()) === 'en' ? 'en' : 'ta';
  } catch (e) { return 'ta'; }
}

/** The app calls this after sign-in and whenever the person changes language. */
function setLang_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  if (!row) return { ok: false, error: 'INVALID_SESSION' };
  const lang = d.lang === 'en' ? 'en' : 'ta';
  if (String(users.getRange(row, 18).getValue()) !== lang) users.getRange(row, 18).setValue(lang);
  return { ok: true };
}

/** Sends a friendly alert (in-app list + phone push) written in the receiver's language. */
function notifyT_(to, key, v, ref) {
  if (!to || !NT[key]) return;
  const lang = langOf_(to);
  const vars = {};
  Object.keys(v || {}).forEach(function (k) { vars[k] = v[k]; });
  if (vars.status) vars.label = (lang === 'ta' ? STATUS_TA[vars.status] : STATUS_TEXT[vars.status]) || vars.status;
  if (vars.action) vars.actionText = ACTION_TEXT[vars.action][lang];
  vars.reasonLine = vars.reason ? (lang === 'ta' ? ' காரணம்: ' : ' Reason: ') + vars.reason : '';
  vars.noteLine = vars.note ? (lang === 'ta' ? ' குறிப்பு: ' : ' Note: ') + vars.note : '';
  vars.reviewLine = vars.review ? '\n“' + vars.review + '”' : '';
  const fill = function (str) { return String(str).replace(/\{(\w+)\}/g, function (m, k) { return vars[k] == null ? '' : String(vars[k]); }); };
  const t = NT[key][lang];
  notify_(to, fill(t[0]), fill(t[1]), ref);
}

function notify_(to, title, message, ref) {
  if (!to) return;
  simpleSheet_(NOTIFY_SHEET, NOTIFY_HEADERS, false).appendRow([newId_('n'), nowText_(), String(to), text_(title, 120), text_(message, 600), String(ref || ''), 'No']);
  safe_(function () { pushTo_(to, title, message, ref); });   // phone push (works with the app closed)
}

/* ------------------------------------------------------------------ phone push (Firebase Cloud Messaging) */

/**
 * The Android app registers its Firebase device token here after sign-in. One token belongs to one mobile number:
 * if someone else signs in on the same phone, the token moves to them.
 */
function registerDevice_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  const device = String(d.device || '').trim();
  if (device.length < 20 || device.length > 4096 || /\s/.test(device)) return { ok: false, error: 'BAD_INPUT' };
  const sh = simpleSheet_(DEVICES_SHEET, DEVICE_HEADERS, true);
  removeDevices_(function (r) { return String(r[1]) === device; });   // same phone, maybe another account before
  // keep only the newest few phones per person: drop the oldest rows of this number first
  const last = sh.getLastRow();
  const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, DEVICE_HEADERS.length).getValues();
  const mineRows = [];
  rows.forEach(function (r, i) { if (digits_(r[0]) === mobile) mineRows.push(i + 2); });
  const extra = mineRows.length - (MAX_DEVICES_PER_USER - 1);
  for (let k = extra - 1; k >= 0; k--) sh.deleteRow(mineRows[k]);   // bottom-up so row numbers stay valid
  sh.appendRow([mobile, device, text_(d.platform || 'android', 20), nowText_()]);
  return { ok: true };
}

/** Called on sign-out so this phone stops getting that person's alerts. */
function unregisterDevice_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return { ok: false, error: 'INVALID_SESSION' };
  const device = String(d.device || '').trim();
  if (device) removeDevices_(function (r) { return String(r[1]) === device && digits_(r[0]) === mobile; });
  return { ok: true };
}

function removeDevices_(match) {
  const sh = simpleSheet_(DEVICES_SHEET, DEVICE_HEADERS, true);
  const last = sh.getLastRow();
  if (last < 2) return;
  const rows = sh.getRange(2, 1, last - 1, DEVICE_HEADERS.length).getValues();
  for (let i = rows.length - 1; i >= 0; i--) if (match(rows[i])) sh.deleteRow(i + 2);
}

/** Device tokens for a mobile number, or for every admin when `to` is 'ADMIN'. */
function deviceTokensFor_(to) {
  const sh = simpleSheet_(DEVICES_SHEET, DEVICE_HEADERS, true);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, DEVICE_HEADERS.length).getValues();
  let wanted;
  if (String(to) === 'ADMIN') {
    const admins = {};
    const users = usersSheet_();
    const ul = users.getLastRow();
    if (ul >= 2) users.getRange(2, 1, ul - 1, USER_HEADERS.length).getValues().forEach(function (u) { if (String(u[6]) === 'Admin') admins[digits_(u[0])] = true; });
    wanted = function (m) { return !!admins[m]; };
  } else {
    const one = digits_(to);
    wanted = function (m) { return m === one; };
  }
  return rows.filter(function (r) { return wanted(digits_(r[0])); }).map(function (r) { return String(r[1]); });
}

/** The Firebase service-account key, kept in Project Settings → Script properties as FCM_SERVICE_ACCOUNT (the whole JSON file). */
function fcmAccount_() {
  const raw = PropertiesService.getScriptProperties().getProperty('FCM_SERVICE_ACCOUNT');
  if (!raw) return null;
  const a = JSON.parse(raw);
  return a && a.client_email && a.private_key && a.project_id ? a : null;
}

/** Short-lived Google access token for the FCM API (signed with the service-account key, cached for ~55 minutes). */
function fcmAccessToken_(acc) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('fcm_at');
  if (hit) return hit;
  const b64 = function (x) { return Utilities.base64EncodeWebSafe(x).replace(/=+$/, ''); };
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64(JSON.stringify({ iss: acc.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const sig = b64(Utilities.computeRsaSha256Signature(head + '.' + claim, acc.private_key));
  const res = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post', muteHttpExceptions: true,
    payload: { grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + claim + '.' + sig },
  });
  const out = JSON.parse(res.getContentText() || '{}');
  if (!out.access_token) throw new Error('FCM sign-in failed: ' + res.getContentText().slice(0, 200));
  cache.put('fcm_at', out.access_token, Math.min(3300, Math.max(60, Number(out.expires_in || 3600) - 300)));
  return out.access_token;
}

/** Sends a push to the phones of `to` (a mobile number or 'ADMIN'). Does nothing until FCM_SERVICE_ACCOUNT is set. Dead tokens are removed. */
function pushTo_(to, title, message, ref) {
  const acc = fcmAccount_();
  if (!acc) return;
  const tokens = deviceTokensFor_(to);
  if (!tokens.length) return;
  const auth = fcmAccessToken_(acc);
  const url = 'https://fcm.googleapis.com/v1/projects/' + encodeURIComponent(acc.project_id) + '/messages:send';
  const reqs = tokens.map(function (t) {
    return {
      url: url, method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { Authorization: 'Bearer ' + auth },
      payload: JSON.stringify({ message: {
        token: t,
        notification: { title: text_(title, 120), body: text_(message, 300) },
        data: { ref: String(ref || '') },
        // HIGH priority + channel 'event360' (importance max) = banner at the top; visibility PUBLIC = full text on the lock screen.
        android: { priority: 'HIGH', ttl: '86400s', notification: { channel_id: 'event360', sound: 'default', notification_priority: 'PRIORITY_MAX', visibility: 'PUBLIC', default_vibrate_timings: true, default_light_settings: true, icon: 'ic_stat_event360', color: '#1D4ED8' } },
      } }),
    };
  });
  const resp = UrlFetchApp.fetchAll(reqs);
  const dead = {};
  resp.forEach(function (r, i) {
    const code = r.getResponseCode();
    if (code === 200) return;
    const body = r.getContentText();
    if (code === 404 || /UNREGISTERED|registration-token-not-registered|INVALID_ARGUMENT/.test(body)) dead[tokens[i]] = true;
    else Logger.log('push failed ' + code + ': ' + body.slice(0, 200));
  });
  if (Object.keys(dead).length) removeDevices_(function (row) { return !!dead[String(row[1])]; });
}

/** Run from the editor after saving FCM_SERVICE_ACCOUNT and signing in once on the Android app as the admin. */
function testPush() {
  if (!fcmAccount_()) throw new Error('Add the script property FCM_SERVICE_ACCOUNT first (see SETUP.md, "Phone push").');
  if (!deviceTokensFor_('ADMIN').length) throw new Error('No admin phone is registered yet. Open the Android app, sign in as admin and allow notifications.');
  pushTo_('ADMIN', 'Event Tamizha', 'Test push ✅ — if you see this with the app closed, alerts work.', '');
  Logger.log('Sent. Check the admin phone.');
}

/** WhatsApp message to the admin's own number through CallMeBot (does nothing until CALLMEBOT_APIKEY is set). */
function whatsappAdmin_(text) {
  if (!CALLMEBOT_APIKEY) return;
  UrlFetchApp.fetch('https://api.callmebot.com/whatsapp.php?phone=' + ADMIN_WHATSAPP + '&text=' + encodeURIComponent('Event Tamizha\n' + String(text).slice(0, 900)) + '&apikey=' + encodeURIComponent(CALLMEBOT_APIKEY), { muteHttpExceptions: true });
}

function notifyRowsFor_(d) {
  const mobile = mobileFromToken_(d.token);
  if (!mobile) return null;
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  const role = row ? String(users.getRange(row, 7).getValue() || 'Customer') : 'Customer';
  return function (r) { return digits_(r[2]) === mobile || (role === 'Admin' && String(r[2]) === 'ADMIN'); };
}

/** The signed-in user's latest notifications (newest first) and the unread count. */
function notifications_(d) {
  const mine = notifyRowsFor_(d);
  if (!mine) return { ok: false, error: 'INVALID_SESSION' };
  const sh = simpleSheet_(NOTIFY_SHEET, NOTIFY_HEADERS, false);
  const last = sh.getLastRow();
  const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, NOTIFY_HEADERS.length).getValues().filter(mine);
  const unread = rows.filter(function (r) { return String(r[6]) !== 'Yes'; }).length;
  const list = rows.slice(-40).reverse().map(function (r) {
    return { id: String(r[0]), at: cell_(r[1], 'yyyy-MM-dd HH:mm').slice(0, 16), title: String(r[3]), message: String(r[4]), ref: String(r[5]), read: String(r[6]) === 'Yes' };
  });
  return { ok: true, unread: unread, notifications: list };
}

function notificationsRead_(d) {
  const mine = notifyRowsFor_(d);
  if (!mine) return { ok: false, error: 'INVALID_SESSION' };
  const sh = simpleSheet_(NOTIFY_SHEET, NOTIFY_HEADERS, false);
  const last = sh.getLastRow();
  if (last < 2) return { ok: true };
  const range = sh.getRange(2, 1, last - 1, NOTIFY_HEADERS.length);
  const rows = range.getValues();
  const read = rows.map(function (r) { return [mine(r) ? 'Yes' : r[6]]; });
  sh.getRange(2, 7, read.length, 1).setValues(read);
  return { ok: true };
}

/** Send a test WhatsApp alert: run from the editor after setting CALLMEBOT_APIKEY. */
function testWhatsApp() {
  if (!CALLMEBOT_APIKEY) throw new Error('Set CALLMEBOT_APIKEY at the top of the script first.');
  whatsappAdmin_('Test alert from the Event Tamizha website ✅');
  Logger.log('Sent. Check WhatsApp on ' + ADMIN_WHATSAPP);
}

/* ------------------------------------------------------------------ offers & combo packages */

function rowsOf_(name, headers) {
  const sh = simpleSheet_(name, headers, false);
  const last = sh.getLastRow();
  return last < 2 ? [] : sh.getRange(2, 1, last - 1, headers.length).getValues();
}

function offerObj_(r) {
  return {
    id: String(r[0]), title: { ta: String(r[1] || r[2]), en: String(r[2] || r[1]) }, details: { ta: String(r[3] || r[4]), en: String(r[4] || r[3]) },
    badge: String(r[5] || ''), validTill: cell_(r[6], 'yyyy-MM-dd'), active: String(r[7]) !== 'No',
  };
}

function packageObj_(r) {
  let items = {};
  try { items = JSON.parse(String(r[8] || '{}')); } catch (e) { items = {}; }
  return {
    id: String(r[0]), name: { ta: String(r[1] || r[2]), en: String(r[2] || r[1]) }, details: { ta: String(r[3] || r[4]), en: String(r[4] || r[3]) },
    pandalId: String(r[5] || ''), length: num_(r[6]), breadth: num_(r[7]), items: items, price: num_(r[9]), img: String(r[10] || ''),
    active: String(r[12]) !== 'No',
  };
}

/** Public: active, unexpired offers and active combo packages. With an admin token and all: true, everything. */
function content_(d) {
  const all = d && d.all && requireRole_(d, 'Admin');
  const today = Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd');
  const offers = rowsOf_(OFFERS_SHEET, OFFER_HEADERS).filter(function (r) { return r[0]; }).map(offerObj_)
    .filter(function (o) { return all || (o.active && (!o.validTill || o.validTill >= today)); });
  const packages = rowsOf_(PACKAGES_SHEET, PACKAGE_HEADERS).filter(function (r) { return r[0]; }).map(packageObj_)
    .filter(function (p) { return all || p.active; });
  return { ok: true, offers: offers, packages: packages };
}

function upsert_(name, headers, id, values) {
  const sh = simpleSheet_(name, headers, false);
  const row = id ? findProductRow_(sh, id) : 0;
  if (row) sh.getRange(row, 1, 1, headers.length).setValues([values]);
  else sh.appendRow(values);
}

function adminSaveOffer_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const titleTa = text_(d.titleTa, 120);
  const titleEn = text_(d.titleEn, 120);
  if (!titleTa && !titleEn) return { ok: false, error: 'BAD_INPUT' };
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(String(d.validTill || '')) ? "'" + d.validTill : '';
  const id = text_(d.id, 40) || newId_('o');
  upsert_(OFFERS_SHEET, OFFER_HEADERS, id, [id, titleTa, titleEn, text_(d.detailsTa, 400), text_(d.detailsEn, 400), text_(d.badge, 30), valid, d.active === false ? 'No' : 'Yes', nowText_()]);
  return { ok: true, id: id };
}

function adminSavePackage_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const nameTa = text_(d.nameTa, 120);
  const nameEn = text_(d.nameEn, 120);
  const price = Math.round(num_(d.price));
  if ((!nameTa && !nameEn) || !(price > 0) || price > 100000000) return { ok: false, error: 'BAD_INPUT' };
  const items = {};
  const src = d.items && typeof d.items === 'object' ? d.items : {};
  Object.keys(src).slice(0, 60).forEach(function (k) {
    const q = Math.floor(num_(src[k]));
    if (/^[a-z0-9]{1,40}$/i.test(k) && q > 0 && q <= 9999) items[k] = q;
  });
  const pandal = PANDAL_IDS.indexOf(String(d.pandalId)) >= 0 ? String(d.pandalId) : '';
  if (!pandal && !Object.keys(items).length) return { ok: false, error: 'EMPTY_PACKAGE' };

  const id = text_(d.id, 40) || newId_('k');
  const sh = simpleSheet_(PACKAGES_SHEET, PACKAGE_HEADERS, false);
  const row = findProductRow_(sh, id);
  const old = row ? sh.getRange(row, 1, 1, PACKAGE_HEADERS.length).getValues()[0] : null;
  let url = old ? String(old[10] || '') : '';
  let fileId = old ? String(old[11] || '') : '';
  if (d.image) {
    const ph = savePhoto_(d.image, nameEn || nameTa);
    if (ph.error) return { ok: false, error: ph.error };
    trashFile_(fileId);
    url = ph.url;
    fileId = ph.fileId;
  } else if (d.removeImage) {
    trashFile_(fileId);
    url = '';
    fileId = '';
  }
  const values = [id, nameTa, nameEn, text_(d.detailsTa, 400), text_(d.detailsEn, 400), pandal,
    pandal ? Math.max(0, num_(d.length)) : '', pandal ? Math.max(0, num_(d.breadth)) : '', JSON.stringify(items), price, url, fileId,
    d.active === false ? 'No' : 'Yes', nowText_()];
  if (row) sh.getRange(row, 1, 1, PACKAGE_HEADERS.length).setValues([values]);
  else sh.appendRow(values);
  return { ok: true, id: id };
}

/** Deletes an offer or a package row (and a package's photo). */
function adminDeleteRow_(d, name, headers) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const sh = simpleSheet_(name, headers, false);
  const row = findProductRow_(sh, text_(d.id, 40));
  if (!row) return { ok: false, error: 'NOT_FOUND' };
  if (name === PACKAGES_SHEET) trashFile_(sh.getRange(row, 12).getValue());
  sh.deleteRow(row);
  return { ok: true };
}

/* ------------------------------------------------------------------ company details */

function settingsSheet_() {
  return simpleSheet_(SETTINGS_SHEET, SETTINGS_HEADERS, false);
}

/** Public: the saved company details (missing keys mean "use the website's default"). */
function settings_() {
  const sh = settingsSheet_();
  const last = sh.getLastRow();
  const out = {};
  if (last >= 2) {
    sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
      const k = String(r[0]);
      if (SETTING_KEYS[k]) out[k] = String(r[1]).replace(/^'/, '');
    });
  }
  return { ok: true, settings: out };
}

function adminSaveSettings_(d) {
  if (!requireRole_(d, 'Admin')) return { ok: false, error: 'FORBIDDEN' };
  const v = d.settings || {};
  const clean = {};
  Object.keys(SETTING_KEYS).forEach(function (k) {
    if (v[k] === undefined) return;
    clean[k] = text_(v[k], SETTING_KEYS[k]);
  });
  if (clean.phone !== undefined && clean.phone && !mobile_(clean.phone)) return { ok: false, error: 'BAD_PHONE' };
  if (clean.whatsapp !== undefined && clean.whatsapp && !mobile_(clean.whatsapp)) return { ok: false, error: 'BAD_PHONE' };
  if (clean.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return { ok: false, error: 'BAD_EMAIL' };
  if (clean.phone) clean.phone = mobile_(clean.phone);
  if (clean.whatsapp) clean.whatsapp = mobile_(clean.whatsapp);

  const sh = settingsSheet_();
  const last = sh.getLastRow();
  const rows = last >= 2 ? sh.getRange(2, 1, last - 1, 1).getValues().map(function (r) { return String(r[0]); }) : [];
  const now = nowText_();
  Object.keys(clean).forEach(function (k) {
    const i = rows.indexOf(k);
    if (i >= 0) sh.getRange(i + 2, 2, 1, 2).setValues([[clean[k], now]]);
    else { sh.appendRow([k, clean[k], now]); rows.push(k); }
  });
  return settings_();
}

/**
 * Make (or fix) the ADMIN login: edit the three values, select createAdmin in the editor and click Run.
 * Admins cannot sign up on the website, so nobody else can take this mobile number.
 */
function createAdmin() {
  ensureAdmin_(usersSheet_());
  Logger.log('Admin ready: ' + ADMIN_MOBILE);
}

/** Makes sure the ADMIN_* account exists with the Admin role and ADMIN_PASSWORD. */
function ensureAdmin_(users) {
  const MOBILE = ADMIN_MOBILE;
  const NAME = ADMIN_NAME;
  const PASSWORD = ADMIN_PASSWORD;
  const mobile = mobile_(MOBILE);
  if (!mobile) throw new Error('ADMIN_MOBILE must be a valid 10-digit number');
  if (PASSWORD.length < 6) throw new Error('ADMIN_PASSWORD must have at least 6 characters');
  const row = findMobileRow_(users, 1, mobile);
  if (row) {
    const cur = users.getRange(row, 1, 1, USER_HEADERS.length).getValues()[0];
    if (String(cur[6]) === 'Admin' && hashPassword_(PASSWORD, String(cur[2])) === String(cur[3])) return; // already set up
  }
  const salt = Utilities.getUuid();
  const hash = hashPassword_(PASSWORD, salt);
  if (row) {
    users.getRange(row, 3, 1, 2).setValues([[salt, hash]]);
    users.getRange(row, 7, 1, 6).setValues([['Admin', '', '', '', 'Yes', '']]);
  } else {
    const now = nowText_();
    users.appendRow([mobile, NAME, salt, hash, now, '', 'Admin', '', '', '', 'Yes', '']);
  }
}

/**
 * Forgot-password help: edit MOBILE and NEW_PASSWORD below, select resetPassword in the editor and Run.
 * Tell the customer the new password on WhatsApp; they can log in with it.
 */
function resetPassword() {
  const MOBILE = '9876543210';
  const NEW_PASSWORD = 'ChangeMe123';
  const mobile = mobile_(MOBILE);
  const users = usersSheet_();
  const row = findMobileRow_(users, 1, mobile);
  if (!row) throw new Error('No account for ' + MOBILE);
  const salt = Utilities.getUuid();
  users.getRange(row, 3, 1, 2).setValues([[salt, hashPassword_(NEW_PASSWORD, salt)]]);
  const sh = sessionsSheet_();
  for (let r = sh.getLastRow(); r >= 2; r--) {
    if (digits_(sh.getRange(r, 2).getValue()) === mobile) sh.deleteRow(r);
  }
  Logger.log('Password reset for ' + mobile);
}

/* ------------------------------------------------------------------ sessions & passwords */

function newSession_(mobile) {
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  const sh = sessionsSheet_();
  purgeSessions_(sh);
  sh.appendRow([sha_(token), mobile, Date.now() + SESSION_DAYS * 86400000]);
  return token;
}

function mobileFromToken_(token) {
  token = String(token || '');
  if (token.length < 32) return '';
  const sh = sessionsSheet_();
  const row = findTokenRow_(sh, sha_(token));
  if (!row) return '';
  const r = sh.getRange(row, 1, 1, 3).getValues()[0];
  return Number(r[2]) > Date.now() ? digits_(r[1]) : '';
}

function findTokenRow_(sh, tokenHash) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const vals = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (String(vals[i][0]) === tokenHash) return i + 2;
  return 0;
}

function purgeSessions_(sh) {
  const last = sh.getLastRow();
  if (last < 300) return;
  const vals = sh.getRange(2, 3, last - 1, 1).getValues();
  const now = Date.now();
  let removed = 0;
  for (let i = vals.length - 1; i >= 0 && removed < 100; i--) {
    if (Number(vals[i][0]) < now) { sh.deleteRow(i + 2); removed++; }
  }
}

/** Salted, repeated SHA-256. Only the hash is stored — never the password. */
function hashPassword_(password, salt) {
  let h = salt + '|' + password;
  for (let i = 0; i < 300; i++) h = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt));
  return 'h:' + h;
}

function sha_(s) {
  return 'h:' + hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s));
}

function hex_(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

/* ------------------------------------------------------------------ sheets */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#7A1F2B').setFontColor('#FFFFFF');
    sheet.getRange(2, COL_MOBILE, sheet.getMaxRows() - 1, 1).setNumberFormat('@'); // keep mobile numbers as text
  } else {
    addMissingHeaders_(sheet, HEADERS, true); // sheet made by an older version: add the new columns
  }
  ensureTextDates_(sheet);
  return sheet;
}

function usersSheet_() {
  return simpleSheet_(USERS_SHEET, USER_HEADERS, false);
}

function sessionsSheet_() {
  return simpleSheet_(SESSIONS_SHEET, SESSION_HEADERS, true);
}

function simpleSheet_(name, headers, hidden) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    if (hidden) sh.hideSheet();
  } else {
    addMissingHeaders_(sh, headers, false);
  }
  return sh;
}

/** Writes any header cell that is still empty (columns added by newer versions of this script). */
function addMissingHeaders_(sheet, headers, styled) {
  const have = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  for (let i = 0; i < headers.length; i++) {
    if (have[i] === '' || have[i] === undefined) {
      const c = sheet.getRange(1, i + 1).setValue(headers[i]).setFontWeight('bold');
      if (styled) c.setBackground('#7A1F2B').setFontColor('#FFFFFF');
    }
  }
}

function findMobileRow_(sh, col, mobile) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (let i = 0; i < vals.length; i++) if (digits_(vals[i][0]) === mobile) return i + 2;
  return 0;
}

function refExists_(sheet, ref) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  return sheet.getRange(2, 1, last - 1, 1).getValues().some(function (r) { return r[0] === ref; });
}

/* ------------------------------------------------------------------ small helpers */

function nowText_() {
  return Utilities.formatDate(new Date(), TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
}

function makeRef_() {
  return 'EV-' + Utilities.formatDate(new Date(), TIMEZONE, 'yyMMdd') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

function digits_(v) {
  return String(v == null ? '' : v).replace(/[^0-9]/g, '');
}

/** A valid Indian mobile number (last 10 digits, starting 6-9), or '' if invalid. */
function mobile_(v) {
  const m = digits_(v).slice(-10);
  return /^[6-9][0-9]{9}$/.test(m) ? m : '';
}

/** Sheets turns date-looking text into real dates; read them back as text. */
function cell_(v, fmt) {
  // A date typed/pasted into a sheet becomes a real Date in the SPREADSHEET's time zone, so it must be read back in that
  // same zone (using India time here moved dates by a day and times by hours when the sheet was set to another zone).
  if (Object.prototype.toString.call(v) === '[object Date]') return Utilities.formatDate(v, sheetTz_(), fmt);
  return String(v == null ? '' : v);
}

let SHEET_TZ_CACHE = '';
function sheetTz_() {
  if (!SHEET_TZ_CACHE) {
    try { SHEET_TZ_CACHE = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || TIMEZONE; } catch (e) { SHEET_TZ_CACHE = TIMEZONE; }
  }
  return SHEET_TZ_CACHE;
}

/** Orders-sheet columns that hold dates / times. They are stored as plain text so Google Sheets never re-interprets them. */
const ORDER_TEXT_COLS = [[2, 'yyyy-MM-dd HH:mm:ss'], [7, 'yyyy-MM-dd'], [COL_ASSIGNED_AT, 'yyyy-MM-dd HH:mm:ss'], [COL_SERVICE_DONE_AT, 'yyyy-MM-dd HH:mm:ss'],
  [COL_COMPLETED_AT, 'yyyy-MM-dd HH:mm:ss'], [COL_REVIEWED_AT, 'yyyy-MM-dd HH:mm:ss'], [COL_CLOSED_AT, 'yyyy-MM-dd HH:mm:ss']];

/** Runs once: turns existing date cells into text (keeping the right day and time) and makes those columns text for new rows. */
function ensureTextDates_(sheet) {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('orderDatesText')) return;
  const rows = Math.max(1, sheet.getMaxRows() - 1);
  const last = sheet.getLastRow();
  ORDER_TEXT_COLS.forEach(function (c) {
    const range = sheet.getRange(2, c[0], rows, 1);
    let vals = null;
    if (last >= 2) vals = sheet.getRange(2, c[0], last - 1, 1).getValues().map(function (r) { return [cell_(r[0], c[1])]; });
    range.setNumberFormat('@');
    if (vals) sheet.getRange(2, c[0], vals.length, 1).setValues(vals);
  });
  props.setProperty('orderDatesText', '1');
}

/** Text going into a cell. A leading = + - @ would make Sheets run it as a formula, so it is defused. */
function text_(v, max) {
  let s = String(v == null ? '' : v).trim().slice(0, max);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return s;
}

function num_(v) {
  const n = Number(v);
  return isFinite(n) ? n : 0;
}

function esc_(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inr_(n) {
  const x = String(Math.round(Number(n) || 0));
  const head = x.slice(0, -3);
  return 'Rs. ' + (head ? head.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' : '') + x.slice(-3);
}

function sendEmail_(d, ref, phone, name, sheetUrl, account, mapLink) {
  const rows = [
    ['Reference', ref],
    ['Name', name],
    ['Mobile', phone],
    ['Account', account ? 'Logged in (' + account + ')' : 'Guest'],
    ['Function', d.event],
    ['Function date', d.date],
    ['Town', d.town],
    ['Venue address', d.address || '-'],
    ['Venue map', mapLink || '-'],
    ['Expected guests', d.guests || '-'],
    ['Notes', d.notes || '-'],
    ['Pandal', d.pandal ? d.pandal + ' (' + d.size + ', ' + d.areaSqft + ' sq ft) = ' + inr_(d.pandalCost) : '-'],
    ['Extra items', d.items || '-'],
    ['Board text', d.boardText || '-'],
    ['Transport', inr_(d.transport) + ' (' + num_(d.distanceKm) + ' km)'],
    ['ESTIMATED TOTAL', inr_(d.total)],
  ];

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:640px">' +
    '<h2 style="color:#7A1F2B;margin:0 0 4px">New booking request</h2>' +
    '<p style="margin:0 0 14px;color:#555">Received from the Event Tamizha website.</p>' +
    '<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">' +
    rows.map(function (r, i) {
      return '<tr style="background:' + (i % 2 ? '#ffffff' : '#fbf3e4') + '">' +
        '<td style="font-weight:bold;width:34%;vertical-align:top">' + esc_(r[0]) + '</td>' +
        '<td style="white-space:pre-wrap">' + esc_(r[1]) + '</td></tr>';
    }).join('') +
    '</table>' +
    '<p style="margin-top:16px">' +
    '<a href="tel:+91' + phone + '" style="background:#7A1F2B;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Call ' + phone + '</a> ' +
    '<a href="https://wa.me/91' + phone + '" style="background:#25D366;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">WhatsApp</a> ' +
    '<a href="' + esc_(sheetUrl) + '" style="color:#7A1F2B;padding:10px 6px">Open sheet</a></p>' +
    '<p style="color:#888;font-size:12px">Prices are website estimates; confirm the final price with the customer. ' +
    'Change the Status column in the sheet (Confirmed / Done / Cancelled) and the customer sees it in My Orders.</p>' +
    '</div>';

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'New booking ' + ref + ' - ' + name + ' - ' + (d.event || 'Function') + ' - ' + (d.date || ''),
    body: rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n'),
    htmlBody: html,
    name: 'Event Tamizha Website',
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Run this ONCE from the editor (select testOrder, click Run) to grant permissions
 * and confirm that a row appears in the sheet and an e-mail reaches NOTIFY_EMAIL.
 */
function testOrder() {
  const res = doPost({
    postData: {
      contents: JSON.stringify({
        ref: 'EV-TEST-' + Math.random().toString(36).slice(2, 6).toUpperCase(),
        lang: 'en', name: 'Test Customer', phone: '9876543210', event: 'Wedding', date: '2026-12-05',
        town: 'Coimbatore', address: 'Test hall', guests: '300', notes: 'This is a test order - ignore.',
        pandal: 'Samiyana Pandal', size: '40 x 20 ft', areaSqft: 800, pandalCost: 12000,
        items: 'Lighting: Serial lights x 2 = Rs.1000', boardText: 'Test | Board', distanceKm: 10,
        transport: 1500, labour: 2000, total: 16500, website: '',
      }),
    },
  });
  Logger.log(res.getContent());
}
