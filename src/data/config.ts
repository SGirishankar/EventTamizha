import type { L } from '../i18n/lang';
import type { ItemIconName } from '../components/icons';
import creditsJson from '../../public/photos/credits.json';

/* ------------------------------------------------------------------
 * BUSINESS SETTINGS — edit these before going live.
 * All prices are SAMPLE prices for the demo, in Indian Rupees.
 * ------------------------------------------------------------------ */

export const BUSINESS = {
  name: { ta: 'ஈவென்ட் தமிழா', en: 'Event Tamizha' } as L,
  descriptor: { ta: 'பந்தல் · விளக்கு · அலங்காரம்', en: 'Pandal · Lights · Decor' } as L,
  tagline: { ta: 'மூன்று தலைமுறை அனுபவம்', en: 'Three generations of experience' } as L,
  about: { ta: 'தமிழகத்தின் பாரம்பரிய பந்தல், மின்விளக்கு மற்றும் வாடகைப் பொருட்கள் சேவை.', en: 'Traditional Tamil Nadu pandal, lighting and rental services.' } as L,
  phoneDisplay: '+91 95667 79289',
  phoneHref: 'tel:+919566779289',
  whatsapp: '919566779289',
  email: '', // shown in the footer and contact page once set (Admin → Company)
  address: {
    ta: '12, பெரிய கடை வீதி, ஈரோடு – 638001 (மாதிரி முகவரி)',
    en: '12, Big Bazaar Street, Erode – 638001 (sample address)',
  } as L,
  hours: { ta: 'தினமும் காலை 7 – இரவு 9', en: 'Daily 7 AM – 9 PM' } as L,
};

/* ------------------------------------------------------------------
 * ORDERS — every booking is saved to a Google Sheet and e-mailed.
 * 1. Follow google-apps-script/SETUP.md and deploy the script as a Web app.
 * 2. Paste the Web app URL below (or set VITE_ORDERS_URL when building).
 * Until a URL is set, the Booking page stays in demo mode and sends nothing.
 * ------------------------------------------------------------------ */

export const ORDERS = {
  url: (import.meta.env.VITE_ORDERS_URL as string | undefined) ?? 'https://script.google.com/macros/s/AKfycbwbaVGnvGe9B7uhdVGiqgj0I-orSI73CpE-Z9WCdjG-pJFZUOPirc6ikUD7KtQjpaYKpg/exec',
  notifyEmail: 'giri.kalingiyam@gmail.com', // must match NOTIFY_EMAIL in google-apps-script/Code.gs
};

/* ------------------------------------------------------------------
 * APP DOWNLOAD — the "Install app" button (home screen, menu and footer).
 * Leave both empty: the button installs the site as an app (Android Chrome) or shows the steps (iPhone).
 * After you publish on Google Play, paste the store link into playUrl; or host an .apk file and paste its link into apkUrl.
 * ------------------------------------------------------------------ */
export const APP_DOWNLOAD = {
  playUrl: '', // e.g. 'https://play.google.com/store/apps/details?id=app.netlify.soundservice.twa'
  apkUrl: '', // e.g. 'https://soundservice.netlify.app/event-tamizha.apk'
};

/* ------------------------------------------------------------------
 * PHOTOS — real, freely licensed photographs in /public/photos.
 * Replace any of them with your own work by overwriting the file
 * (or pointing `src` somewhere else) and removing its credit.
 * ------------------------------------------------------------------ */

export type PhotoKey = keyof typeof creditsJson;
export type Credit = { title: string; author: string; license: string; page: string };
export const CREDITS = creditsJson as Record<PhotoKey, Credit>;
export const photo = (k: PhotoKey) => `photos/${k}.webp`;

/** Charges applied on top of the itemised estimate. */
export const CHARGES = {
  transportPerBlock: 200, // transport: Rs 200 for every 10 km (rounded up: 1-10 km = 200, 11-20 km = 400 ...)
  transportBlockKm: 10,
  sqftPerGuest: 10, // seated guest incl. aisles & stage space
};

export const FEET_PER_METRE = 3.28084;

/* ------------------------------------------------------------------ */

export type PandalId = 'sheet' | 'theenolai' | 'samiyana';

export type Pandal = {
  id: PandalId;
  photo: PhotoKey;
  name: L;
  desc: L;
  bestFor: L;
  features: L[];
  pricePerSqft: number;
  minCharge: number;
};

export const PANDALS: Pandal[] = [
  {
    id: 'sheet',
    photo: 'house-pandal',
    name: { ta: 'ஷீட் பந்தல்', en: 'Sheet Pandal' },
    desc: {
      ta: 'உறுதியான இரும்புக் கம்பங்களும் தகட்டுக் கூரையும் கொண்ட நடைமுறைப் பந்தல். வெயிலுக்கும் மழைக்கும் நம்பிக்கையான பாதுகாப்பு.',
      en: 'A practical pandal on sturdy steel poles with a roof-sheet top — dependable shade from both sun and rain.',
    },
    bestFor: {
      ta: 'வீட்டு விசேஷம் · திருமணம் · கிராமக் கூட்டம்',
      en: 'House functions · Weddings · Village gatherings',
    },
    features: [
      { ta: 'மழையிலும் பாதுகாப்பு', en: 'Rain-proof' },
      { ta: 'பெரிய அளவுக்கு ஏற்றது', en: 'Great for large areas' },
      { ta: 'விரைவான அமைப்பு', en: 'Quick setup' },
    ],
    pricePerSqft: 14,
    minCharge: 4000,
  },
  {
    id: 'theenolai',
    photo: 'theenolai',
    name: { ta: 'தென்னோலைப் பந்தல்', en: 'Theenolai Pandal' },
    desc: {
      ta: 'பச்சைத் தென்னங்கீற்றுகளால் வேயப்பட்ட இயற்கையான கிராமத்துப் பந்தல். குளிர்ந்த நிழலும் மண்ணின் மணமும் தரும்.',
      en: 'A natural village-style canopy woven from coconut fronds — cool shade with an earthy, traditional feel.',
    },
    bestFor: {
      ta: 'கோவில் திருவிழா · பூஜை · பாரம்பரிய விழாக்கள்',
      en: 'Temple festivals · Poojas · Traditional functions',
    },
    features: [
      { ta: 'இயற்கைக் குளிர்ச்சி', en: 'Naturally cool' },
      { ta: 'பாரம்பரியத் தோற்றம்', en: 'Traditional look' },
      { ta: 'சுற்றுச்சூழல் நட்பு', en: 'Eco-friendly' },
    ],
    pricePerSqft: 18,
    minCharge: 5000,
  },
  {
    id: 'samiyana',
    photo: 'samiyana',
    name: { ta: 'சாமியானா பந்தல்', en: 'Samiyana Pandal' },
    desc: {
      ta: 'வண்ணக் கோடுகள் கொண்ட துணி விதானமும் அலை அலையான தொங்கல் துணியும் கொண்ட கண்கவர் பந்தல்.',
      en: 'A colourful striped fabric canopy with scalloped borders — bright, festive and welcoming.',
    },
    bestFor: {
      ta: 'திருமணம் · கிரகப்பிரவேசம் · காதணி விழா · சமுதாயக் கூட்டம்',
      en: 'Weddings · Housewarming · Ear-piercing · Community events',
    },
    features: [
      { ta: 'வண்ணமயமான தோற்றம்', en: 'Colourful look' },
      { ta: 'எந்த இடத்திலும் அமைக்கலாம்', en: 'Fits any space' },
      { ta: 'புகைப்படங்களுக்கு அழகு', en: 'Photo-friendly' },
    ],
    pricePerSqft: 16,
    minCharge: 4500,
  },
];

/* ------------------------------------------------------------------ */

export type Category = 'decor' | 'lighting' | 'rentals' | 'sound';
/** Every item category, in display order. “sound” starts empty: the admin adds its items. */
export const ITEM_CATEGORIES: Category[] = ['decor', 'lighting', 'rentals', 'sound'];

export type Item = {
  id: string;
  category: Category;
  name: L;
  unit: L;
  price: number;
  icon: ItemIconName;
  note?: L;
  /** Photo URL for products the admin uploaded. */
  img?: string;
  /** Added by the admin (not part of the built-in list). */
  custom?: boolean;
  /** A built-in item whose details the admin changed. */
  edited?: boolean;
};

const u = {
  each: { ta: 'ஒன்றுக்கு', en: 'each' },
  set: { ta: 'ஒரு செட்', en: 'per set' },
  ft100: { ta: '100 அடிக்கு', en: 'per 100 ft' },
  ft10: { ta: '10 அடிக்கு', en: 'per 10 ft' },
  pair: { ta: 'ஒரு ஜோடி', en: 'per pair' },
  sqft100: { ta: '100 ச.அடிக்கு', en: 'per 100 sq ft' },
  pkg: { ta: 'தொகுப்பு', en: 'package' },
  day: { ta: 'ஒரு நாளுக்கு', en: 'per day' },
  cards100: { ta: '100 அட்டைகளுக்கு', en: 'per 100 cards' },
} satisfies Record<string, L>;

export const ITEMS: Item[] = [
  // Additional decoration
  { id: 'banana', category: 'decor', icon: 'TreePalm', name: { ta: 'நுழைவாயில் வாழைமரம்', en: 'Entrance banana trees' }, unit: u.pair, price: 800, note: { ta: 'குலையுடன்', en: 'with bunch' } },
  { id: 'thoranam', category: 'decor', icon: 'Leaf', name: { ta: 'மாவிலைத் தோரணம்', en: 'Mango-leaf thoranam' }, unit: u.ft10, price: 250 },
  { id: 'arch', category: 'decor', icon: 'DoorOpen', name: { ta: 'நுழைவு வளைவு', en: 'Entrance arch' }, unit: u.each, price: 3500 },
  { id: 'kolam', category: 'decor', icon: 'Sparkle', name: { ta: 'வாசல் கோலம்', en: 'Entrance kolam' }, unit: u.each, price: 600 },
  { id: 'drape', category: 'decor', icon: 'Waves', name: { ta: 'உட்கூரைத் துணி அலங்காரம்', en: 'Ceiling fabric draping' }, unit: u.sqft100, price: 450 },
  { id: 'stageflower', category: 'decor', icon: 'Flower2', name: { ta: 'மேடை மலர் அலங்காரம்', en: 'Stage flower decoration' }, unit: u.each, price: 12000 },
  { id: 'vilakku', category: 'decor', icon: 'Flame', name: { ta: 'குத்துவிளக்கு அலங்காரம்', en: 'Brass kuthuvilakku setup' }, unit: u.set, price: 500 },

  // Lighting
  { id: 'serial', category: 'lighting', icon: 'Sparkles', name: { ta: 'வண்ண சீரியல் விளக்குகள்', en: 'Colourful serial lights' }, unit: u.ft100, price: 350 },
  { id: 'warm', category: 'lighting', icon: 'Lightbulb', name: { ta: 'வார்ம் ஒயிட் விளக்குகள்', en: 'Warm-white lights' }, unit: u.ft100, price: 400 },
  { id: 'curtain', category: 'lighting', icon: 'LampCeiling', name: { ta: 'திரைச் சீரியல் விளக்கு', en: 'Curtain serial lights' }, unit: u.set, price: 900 },
  { id: 'led', category: 'lighting', icon: 'Flashlight', name: { ta: 'LED ஃபோகஸ் விளக்குகள்', en: 'LED focus lights' }, unit: u.each, price: 300 },
  { id: 'entrance', category: 'lighting', icon: 'DoorOpen', name: { ta: 'நுழைவாயில் ஒளி அலங்காரம்', en: 'Entrance lighting' }, unit: u.set, price: 2500 },
  { id: 'house', category: 'lighting', icon: 'House', name: { ta: 'வீடு & காம்பவுண்ட் ஒளி அலங்காரம்', en: 'House & compound lighting' }, unit: u.pkg, price: 4500 },
  { id: 'temple', category: 'lighting', icon: 'Landmark', name: { ta: 'கோவில் திருவிழா ஒளி அலங்காரம்', en: 'Temple festival lighting' }, unit: u.pkg, price: 15000 },
  { id: 'stagelight', category: 'lighting', icon: 'Lamp', name: { ta: 'மேடை ஒளி அமைப்பு', en: 'Stage lighting' }, unit: u.set, price: 5000 },


  // Rentals
  { id: 'plastic', category: 'rentals', icon: 'Armchair', name: { ta: 'பிளாஸ்டிக் நாற்காலிகள்', en: 'Plastic chairs' }, unit: u.each, price: 8 },
  { id: 'chaircover', category: 'rentals', icon: 'Layers', name: { ta: 'நாற்காலி உறைகள்', en: 'Chair covers' }, unit: u.each, price: 15 },
  { id: 'vip', category: 'rentals', icon: 'Crown', name: { ta: 'VIP நாற்காலிகள்', en: 'VIP chairs' }, unit: u.each, price: 60 },
  { id: 'dining', category: 'rentals', icon: 'UtensilsCrossed', name: { ta: 'டைனிங் மேசைகள்', en: 'Dining tables' }, unit: u.each, price: 120 },
  { id: 'long', category: 'rentals', icon: 'Utensils', name: { ta: 'நீளமான பந்தி மேசைகள்', en: 'Long pandhi tables' }, unit: u.each, price: 150 },
  { id: 'stage', category: 'rentals', icon: 'Theater', name: { ta: 'மேடை அமைப்பு (16×12 அடி)', en: 'Stage setup (16×12 ft)' }, unit: u.each, price: 6000 },
  { id: 'carpet', category: 'rentals', icon: 'RectangleHorizontal', name: { ta: 'தரைவிரிப்புகள்', en: 'Carpets' }, unit: u.sqft100, price: 300 },
  { id: 'mat', category: 'rentals', icon: 'Grid3x3', name: { ta: 'பாய்கள்', en: 'Floor mats (paai)' }, unit: u.each, price: 25 },
  { id: 'pillar', category: 'rentals', icon: 'Columns3', name: { ta: 'அலங்காரத் தூண்கள்', en: 'Decorative pillars' }, unit: u.each, price: 400 },
  { id: 'fan', category: 'rentals', icon: 'Fan', name: { ta: 'மின்விசிறிகள் (ஸ்டாண்ட்)', en: 'Stand fans' }, unit: u.each, price: 200 },
  { id: 'sound', category: 'rentals', icon: 'Speaker', name: { ta: 'ஒலி அமைப்பு (மைக் செட்)', en: 'Sound system (mic set)' }, unit: u.day, price: 3000, note: { ta: 'கூம்பு ஒலிபெருக்கி / பாக்ஸ்', en: 'cone speakers / box speakers' } },
  { id: 'generator', category: 'rentals', icon: 'Zap', name: { ta: 'ஜெனரேட்டர் (15 kVA)', en: 'Generator (15 kVA)' }, unit: u.day, price: 2500, note: { ta: 'டீசல் தனி', en: 'diesel extra' } },
  { id: 'vessels', category: 'rentals', icon: 'CookingPot', name: { ta: 'சமையல் பாத்திரங்கள்', en: 'Cooking vessels' }, unit: u.set, price: 1500, note: { ta: 'அண்டா, குண்டா, கரண்டி', en: 'large pots, ladles' } },
  { id: 'accessories', category: 'rentals', icon: 'Wrench', name: { ta: 'பந்தல் உபகரணங்கள்', en: 'Pandal accessories' }, unit: u.set, price: 1500, note: { ta: 'பக்கத் திரை, கயிறு, கம்பம்', en: 'side curtains, ropes, poles' } },
];

export const CATEGORY_LABEL: Record<Category, L> = {
  decor: { ta: 'கூடுதல் அலங்காரம்', en: 'Additional decoration' },
  lighting: { ta: 'மின்விளக்கு அலங்காரம்', en: 'Lighting decoration' },
  rentals: { ta: 'வாடகைப் பொருட்கள்', en: 'Rental products' },
  sound: { ta: 'ஒலி சேவை', en: 'Sound service' },
};

/* ------------------------------------------------------------------
 * READY PACKAGES — one tap fills the estimate.
 * ------------------------------------------------------------------ */

export type Package = {
  id: string;
  photo: PhotoKey;
  name: L;
  desc: L;
  pandalId: PandalId;
  length: number;
  breadth: number;
  qty: Record<string, number>;
  popular?: boolean;
};

export const PACKAGES: Package[] = [
  {
    id: 'wedding',
    photo: 'hero-wedding-stage',
    name: { ta: 'திருமண முழு பேக்கேஜ்', en: 'Complete Wedding Package' },
    desc: { ta: '300 விருந்தினர் · சாமியானா · மலர் மேடை · முழு விளக்கு · பந்தி', en: '300 guests · Samiyana · flower stage · full lighting · dining' },
    pandalId: 'samiyana', length: 60, breadth: 40, popular: true,
    qty: { banana: 2, thoranam: 6, arch: 1, kolam: 1, stageflower: 1, vilakku: 2, serial: 10, entrance: 1, stagelight: 1, welcome: 1, direction: 2, plastic: 300, vip: 10, long: 20, stage: 1, carpet: 10, fan: 8, sound: 1, generator: 1 },
  },
  {
    id: 'housewarming',
    photo: 'kolam-pongal',
    name: { ta: 'கிரகப்பிரவேச பேக்கேஜ்', en: 'Housewarming Package' },
    desc: { ta: '100 விருந்தினர் · ஷீட் பந்தல் · வாழைமரம் · தோரணம் · வீட்டு விளக்கு', en: '100 guests · sheet pandal · banana trees · thoranam · house lights' },
    pandalId: 'sheet', length: 30, breadth: 30,
    qty: { banana: 1, thoranam: 3, kolam: 1, vilakku: 1, serial: 4, house: 1, nameboard: 1, plastic: 100, dining: 10, fan: 4, vessels: 1 },
  },
  {
    id: 'earpiercing',
    photo: 'wedding-ritual',
    name: { ta: 'காதணி விழா பேக்கேஜ்', en: 'Ear-piercing Ceremony Package' },
    desc: { ta: '150 விருந்தினர் · சாமியானா · நுழைவு விளக்கு · ஒலி அமைப்பு', en: '150 guests · Samiyana · entrance lights · sound system' },
    pandalId: 'samiyana', length: 40, breadth: 40,
    qty: { banana: 1, thoranam: 4, vilakku: 1, serial: 5, entrance: 1, nameboard: 1, plastic: 150, vip: 4, long: 10, fan: 6, sound: 1 },
  },
  {
    id: 'temple',
    photo: 'temple-lights',
    name: { ta: 'கோவில் திருவிழா பேக்கேஜ்', en: 'Temple Festival Package' },
    desc: { ta: 'தென்னோலைப் பந்தல் · கோவில் விளக்கு · வளைவு · அன்னதானம்', en: 'Theenolai pandal · temple lighting · arch · annadhanam' },
    pandalId: 'theenolai', length: 50, breadth: 30,
    qty: { thoranam: 10, arch: 1, kolam: 2, serial: 20, temple: 1, entrance: 1, banner: 2, direction: 4, plastic: 200, long: 15, mat: 50, sound: 1, generator: 1, vessels: 2 },
  },
];

/* ------------------------------------------------------------------ */

export const EVENT_TYPES: L[] = [
  { ta: 'திருமணம்', en: 'Wedding' },
  { ta: 'நிச்சயதார்த்தம்', en: 'Engagement' },
  { ta: 'திருமண வரவேற்பு', en: 'Wedding reception' },
  { ta: 'கிரகப்பிரவேசம்', en: 'Housewarming' },
  { ta: 'காதணி விழா', en: 'Ear-piercing ceremony' },
  { ta: 'மஞ்சள் நீராட்டு விழா', en: 'Puberty ceremony' },
  { ta: 'வளைகாப்பு', en: 'Baby shower (Valaikappu)' },
  { ta: 'பிறந்தநாள் விழா', en: 'Birthday' },
  { ta: 'மணிவிழா', en: '60th birthday (Manivizha)' },
  { ta: 'கோவில் திருவிழா', en: 'Temple festival' },
  { ta: 'கும்பாபிஷேகம்', en: 'Kumbabishekam' },
  { ta: 'கிராமத் திருவிழா', en: 'Village festival' },
  { ta: 'சமுதாயக் கூட்டம்', en: 'Community gathering' },
  { ta: 'மற்றவை', en: 'Other' },
];

export const TOWNS: L[] = [
  { ta: 'கோயம்புத்தூர்', en: 'Coimbatore' },
  { ta: 'ஈரோடு', en: 'Erode' },
  { ta: 'சேலம்', en: 'Salem' },
  { ta: 'மதுரை', en: 'Madurai' },
  { ta: 'திருப்பூர்', en: 'Tiruppur' },
  { ta: 'சென்னை', en: 'Chennai' },
  { ta: 'திருச்சி', en: 'Tiruchirappalli' },
  { ta: 'நாமக்கல்', en: 'Namakkal' },
  { ta: 'கரூர்', en: 'Karur' },
  { ta: 'திண்டுக்கல்', en: 'Dindigul' },
  { ta: 'தஞ்சாவூர்', en: 'Thanjavur' },
  { ta: 'திருநெல்வேலி', en: 'Tirunelveli' },
  { ta: 'பொள்ளாச்சி', en: 'Pollachi' },
  { ta: 'வேலூர்', en: 'Vellore' },
];

/* ------------------------------------------------------------------
 * SAMPLE CONTENT — placeholders, clearly labelled on the site.
 * Replace with real customer reviews and your own policies.
 * ------------------------------------------------------------------ */

export const SAMPLE_REVIEWS: { name: string; town: L; event: L; text: L; stars: number }[] = [
  {
    name: 'செ. ராஜேஷ்', town: { ta: 'ஈரோடு', en: 'Erode' }, event: { ta: 'திருமணம்', en: 'Wedding' }, stars: 5,
    text: { ta: 'பந்தலும் விளக்கு அலங்காரமும் மிக அழகாக இருந்தது. குறித்த நேரத்தில் அமைத்துக் கொடுத்தார்கள்.', en: 'The pandal and lighting looked beautiful, and everything was set up on time.' },
  },
  {
    name: 'க. மீனா', town: { ta: 'சேலம்', en: 'Salem' }, event: { ta: 'கிரகப்பிரவேசம்', en: 'Housewarming' }, stars: 5,
    text: { ta: 'வாழைமரம், தோரணம், கோலம் எல்லாம் பாரம்பரிய முறையில் இருந்தது. விருந்தினர்கள் பாராட்டினார்கள்.', en: 'Banana trees, thoranam and kolam were all done the traditional way. Our guests loved it.' },
  },
  {
    name: 'ஊர் கமிட்டி', town: { ta: 'கரூர்', en: 'Karur' }, event: { ta: 'கோவில் திருவிழா', en: 'Temple festival' }, stars: 4,
    text: { ta: 'கோபுர விளக்கு அலங்காரம் ஊர் முழுக்கப் பேசப்பட்டது. விலையும் நியாயமாக இருந்தது.', en: 'The gopuram lighting was the talk of the village, and the price was fair.' },
  },
];

export const FAQS: { q: L; a: L }[] = [
  {
    q: { ta: 'எத்தனை நாட்களுக்கு முன் முன்பதிவு செய்ய வேண்டும்?', en: 'How early should I book?' },
    a: { ta: 'முகூர்த்த நாட்களில் தேவை அதிகம். குறைந்தது 2–4 வாரங்களுக்கு முன் முன்பதிவு செய்வது நல்லது.', en: 'Demand is high on muhurtham days. Booking 2–4 weeks ahead is best.' },
  },
  {
    q: { ta: 'இணையதளத்தில் காட்டும் விலை இறுதியானதா?', en: 'Is the website price final?' },
    a: { ta: 'இல்லை. இது தோராயமான மதிப்பீடு. இடத்தைப் பார்த்த பிறகு இறுதி விலையை உறுதி செய்வோம்.', en: 'No. It is an approximate estimate — we confirm the final price after seeing the venue.' },
  },
  {
    q: { ta: 'பந்தல் அமைக்க எவ்வளவு நேரம் ஆகும்?', en: 'How long does setup take?' },
    a: { ta: 'சாதாரண வீட்டு விசேஷத்திற்கு சில மணி நேரம்; பெரிய திருமணப் பந்தலுக்கு முந்தைய நாளே அமைப்போம்.', en: 'A few hours for a house function; large wedding pandals are set up the day before.' },
  },
  {
    q: { ta: 'மழை பெய்தால் என்ன செய்வீர்கள்?', en: 'What if it rains?' },
    a: { ta: 'மழைக்காலத்தில் ஷீட் பந்தல் மற்றும் பக்கத் திரைகளைப் பரிந்துரைக்கிறோம்.', en: 'In the rainy season we recommend a sheet pandal with side curtains.' },
  },
  {
    q: { ta: 'வெளியூர்களுக்கும் வருவீர்களா?', en: 'Do you serve other towns?' },
    a: { ta: 'ஆம். தமிழகம் முழுவதும் சேவை உண்டு; தூரத்திற்கு ஏற்பப் போக்குவரத்துக் கட்டணம் சேர்க்கப்படும்.', en: 'Yes, across Tamil Nadu — transport is charged by distance.' },
  },
];

/** Demo availability: day-of-month numbers that show as "almost full". */
export const DEMO_BUSY_DAYS = [3, 7, 8, 14, 15, 21, 22, 27];

/* ------------------------------------------------------------------
 * MUHURTHAM — Tamil subha muhurtham days shown in the calendars.
 * V = valarpirai (waxing moon, preferred for weddings), T = theipirai.
 * Source: Tamil panchangam lists for 2026 (calendar.goldenchennai.com, parikaram.in).
 * Add 2027 dates here once the new panchangam is out. Families should confirm with their own priest.
 * ------------------------------------------------------------------ */
export type Muhurtham = { date: string; pirai: 'V' | 'T'; tamil: string };

export const MUHURTHAM: Muhurtham[] = [
  { date: '2026-01-28', pirai: 'V', tamil: 'தை 14' },
  { date: '2026-02-06', pirai: 'T', tamil: 'தை 23' },
  { date: '2026-02-08', pirai: 'T', tamil: 'தை 25' },
  { date: '2026-02-15', pirai: 'T', tamil: 'மாசி 3' },
  { date: '2026-02-16', pirai: 'T', tamil: 'மாசி 4' },
  { date: '2026-02-20', pirai: 'V', tamil: 'மாசி 8' },
  { date: '2026-03-05', pirai: 'T', tamil: 'மாசி 21' },
  { date: '2026-03-06', pirai: 'T', tamil: 'மாசி 22' },
  { date: '2026-03-08', pirai: 'T', tamil: 'மாசி 24' },
  { date: '2026-03-15', pirai: 'T', tamil: 'பங்குனி 1' },
  { date: '2026-03-16', pirai: 'T', tamil: 'பங்குனி 2' },
  { date: '2026-03-25', pirai: 'V', tamil: 'பங்குனி 11' },
  { date: '2026-04-06', pirai: 'T', tamil: 'பங்குனி 23' },
  { date: '2026-04-12', pirai: 'T', tamil: 'பங்குனி 29' },
  { date: '2026-04-13', pirai: 'T', tamil: 'பங்குனி 30' },
  { date: '2026-04-16', pirai: 'T', tamil: 'சித்திரை 3' },
  { date: '2026-04-20', pirai: 'V', tamil: 'சித்திரை 7' },
  { date: '2026-04-23', pirai: 'V', tamil: 'சித்திரை 10' },
  { date: '2026-04-30', pirai: 'V', tamil: 'சித்திரை 17' },
  { date: '2026-05-08', pirai: 'T', tamil: 'சித்திரை 25' },
  { date: '2026-05-13', pirai: 'T', tamil: 'சித்திரை 30' },
  { date: '2026-05-14', pirai: 'T', tamil: 'சித்திரை 31' },
  { date: '2026-05-18', pirai: 'V', tamil: 'வைகாசி 4' },
  { date: '2026-05-28', pirai: 'V', tamil: 'வைகாசி 14' },
  { date: '2026-06-04', pirai: 'T', tamil: 'வைகாசி 21' },
  { date: '2026-06-07', pirai: 'T', tamil: 'வைகாசி 24' },
  { date: '2026-06-18', pirai: 'V', tamil: 'ஆனி 4' },
  { date: '2026-06-24', pirai: 'V', tamil: 'ஆனி 10' },
  { date: '2026-07-02', pirai: 'T', tamil: 'ஆனி 18' },
  { date: '2026-07-05', pirai: 'T', tamil: 'ஆனி 21' },
  { date: '2026-08-28', pirai: 'V', tamil: 'ஆவணி 11' },
  { date: '2026-08-31', pirai: 'T', tamil: 'ஆவணி 14' },
  { date: '2026-09-13', pirai: 'V', tamil: 'ஆவணி 27' },
  { date: '2026-10-25', pirai: 'V', tamil: 'ஐப்பசி 8' },
  { date: '2026-10-30', pirai: 'T', tamil: 'ஐப்பசி 13' },
  { date: '2026-11-01', pirai: 'T', tamil: 'ஐப்பசி 15' },
  { date: '2026-11-11', pirai: 'V', tamil: 'ஐப்பசி 25' },
  { date: '2026-11-15', pirai: 'V', tamil: 'ஐப்பசி 29' },
  { date: '2026-11-16', pirai: 'V', tamil: 'ஐப்பசி 30' },
  { date: '2026-11-18', pirai: 'V', tamil: 'கார்த்திகை 2' },
  { date: '2026-11-20', pirai: 'V', tamil: 'கார்த்திகை 4' },
  { date: '2026-11-29', pirai: 'T', tamil: 'கார்த்திகை 13' },
  { date: '2026-12-04', pirai: 'T', tamil: 'கார்த்திகை 18' },
  { date: '2026-12-06', pirai: 'T', tamil: 'கார்த்திகை 20' },
  { date: '2026-12-10', pirai: 'V', tamil: 'கார்த்திகை 24' },
  { date: '2026-12-13', pirai: 'V', tamil: 'கார்த்திகை 27' },
  { date: '2026-12-14', pirai: 'V', tamil: 'கார்த்திகை 28' },
];

export const muhurthamOn = (isoDate: string) => MUHURTHAM.find((m) => m.date === isoDate);
