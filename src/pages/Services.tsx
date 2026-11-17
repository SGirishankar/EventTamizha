import { Link } from 'react-router-dom';
import { Mic, Music2, Speaker, UserCheck } from 'lucide-react';
import { useLang, type L } from '../i18n/lang';
import { BUSINESS, PANDALS, type Category, type PhotoKey } from '../data/config';
import { AreaCalculator, GuestHelper, PandalCard } from '../components/pandal';
import { PandalStudio, Reveal, Tilt } from '../components/fx';
import { DemoBadge, ItemCatalog, PageHero, SectionTitle } from '../components/ui';
import { ServiceReviews } from '../components/reviews';
import { useCatalog } from '../state/catalog';

export function PandalsPage() {
  useCatalog(); // re-render when the admin changes pandal rates
  const { t, lang } = useLang();
  // On phones the 3D designer comes first (it already has type, size, chairs and price); the descriptive cards follow.
  return (
    <div className="flex flex-col">
      <PageHero k="samiyana" title={{ ta: 'பந்தல் வகைகள்', en: 'Pandal Types' }}
        sub={{ ta: 'ஷீட், தென்னோலை, சாமியானா — மூன்று பாரம்பரிய பந்தல்கள். ஒன்றைத் தேர்ந்தெடுத்து அளவைக் கொடுங்கள்.', en: 'Sheet, Theenolai and Samiyana — three traditional pandals. Pick one and enter your size.' }} />

      {/* overflow-x-clip (not hidden) so the pinned 3D preview can stick on phones */}
      <section className="noise relative overflow-x-clip bg-wine-luxe text-white max-md:order-1">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-4 sm:px-6 md:py-20">
          <div className="hidden md:block">
            <SectionTitle light eyebrow={{ ta: '3D', en: '3D' }} v={{ ta: 'உங்கள் பந்தலை 3D-ல் பாருங்கள்', en: 'See Your Pandal in 3D' }}
              sub={{ ta: 'வகை, அளவு, நாற்காலிகளை மாற்றி, சுழற்றிப் பாருங்கள்.', en: 'Change the type, size and chairs — then rotate and explore.' }} />
          </div>
          <PandalStudio />
        </div>
      </section>

      <section className="section max-md:order-2 max-md:!py-6">
        <h2 lang={lang} className="mb-4 text-lg font-extrabold md:hidden">{t({ ta: 'பந்தல் வகைகள் விவரம்', en: 'About each pandal' })}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {PANDALS.map((p, i) => (
            <Reveal key={p.id} delay={i * 120} className="h-full">
              <Tilt className="h-full rounded-3xl"><PandalCard pandal={p} onSelect={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })} /></Tilt>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="calculator" className="kolam-dots scroll-mt-28 bg-turmeric-wash max-md:order-3">
        <div className="section max-md:!py-6">
          <SectionTitle eyebrow={{ ta: 'கணிப்பான்', en: 'Calculator' }} v={{ ta: 'பந்தல் பரப்பளவு கணிப்பான்', en: 'Pandal Area Calculator' }}
            sub={{ ta: 'நீளம் × அகலம் = சதுர அடி. மீட்டரில் கொடுத்தாலும் தானாக அடியாக மாற்றிக் கணக்கிடப்படும்.', en: 'Length × breadth = square feet. Metres are converted to feet automatically.' }} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
            <AreaCalculator />
            <div className="space-y-4">
              <GuestHelper />
              <DemoBadge />
              <div className="grid grid-cols-2 gap-2">
                <Link to="/estimate" className="btn-gold"><span lang={lang}>{t({ ta: 'முழு மதிப்பீடு', en: 'Full estimate' })}</span></Link>
                <Link to="/booking" className="btn-primary"><span lang={lang}>{t({ ta: 'முன்பதிவு', en: 'Book Now' })}</span></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section max-md:order-4 max-md:!py-6">
        <SectionTitle eyebrow={{ ta: 'அழகு சேர்க்க', en: 'Finishing touches' }} v={{ ta: 'கூடுதல் அலங்காரம்', en: 'Additional Decoration' }}
          sub={{ ta: 'நுழைவாயில் வாழைமரம், மாவிலைத் தோரணம், கோலம், குத்துவிளக்கு — பந்தலுக்கு முழுமையான பாரம்பரியத் தோற்றம்.', en: 'Entrance banana trees, mango-leaf thoranam, kolam and brass lamps — the complete traditional look.' }} />
        <ItemCatalog category="decor" />
        <ServiceReviews service="pandal" />
      </section>
    </div>
  );
}

function CatalogPage({ category, hero, title, sub, children }: { category: Category; hero: PhotoKey; title: L; sub: L; strip?: { k: PhotoKey; v: L }[]; children?: React.ReactNode }) {
  return (
    <>
      <PageHero k={hero} title={title} sub={sub} />
      <section className="section">
        {children}
        <ItemCatalog category={category} />
        {category !== 'sound' && <ServiceReviews service={category === 'lighting' ? 'lighting' : 'rentals'} />}
        <DemoBadge className="mt-6" />
      </section>
    </>
  );
}

export const LightingPage = () => (
  <CatalogPage category="lighting" hero="lit-pandal"
    title={{ ta: 'மின்விளக்கு அலங்காரம்', en: 'Lighting Decoration' }}
    sub={{ ta: 'வண்ண சீரியல் விளக்கு, வார்ம் ஒயிட், LED, நுழைவாயில், வீடு, கோவில், மேடை — எல்லாவிதமான ஒளி அலங்காரங்களும்.', en: 'Serial lights, warm-white, LED, entrance, house, temple and stage lighting.' }}
    strip={[
      { k: 'temple-lights', v: { ta: 'திருவிழா விளக்கு', en: 'Festival lights' } },
      { k: 'gopuram-night', v: { ta: 'கோபுர விளக்கு', en: 'Gopuram lights' } },
      { k: 'theppam-lights', v: { ta: 'தெப்பத் திருவிழா', en: 'Theppam festival' } },
      { k: 'lights-setup', v: { ta: 'விளக்கு அமைக்கும் பணி', en: 'Lights being set up' } },
      { k: 'town-lights', v: { ta: 'ஊர் முழுக்க ஒளி', en: 'A town aglow' } },
    ]} />
);

export const RentalsPage = () => (
  <CatalogPage category="rentals" hero="annadanam-crowd"
    title={{ ta: 'வாடகைப் பொருட்கள்', en: 'Rental Products' }}
    sub={{ ta: 'நாற்காலி, பந்தி மேசை, மேடை, தரைவிரிப்பு, பாய், மின்விசிறி, ஒலி அமைப்பு, ஜெனரேட்டர் — விழாவுக்குத் தேவையான அனைத்தும்.', en: 'Chairs, dining tables, stages, carpets, mats, fans, sound and generators — everything for your function.' }}
    strip={[
      { k: 'annadanam-canopy', v: { ta: 'பந்தலின் கீழ் பந்தி', en: 'Dining under a pandal' } },
      { k: 'wedding-lunch', v: { ta: 'பந்தி மேசை', en: 'Pandhi table' } },
      { k: 'samiyana', v: { ta: 'நாற்காலி அமைப்பு', en: 'Chair layout' } },
      { k: 'banana-leaf-meal', v: { ta: 'வாழை இலை விருந்து', en: 'Banana-leaf feast' } },
    ]} />
);

const SOUND_POINTS: { icon: typeof Mic; v: { ta: string; en: string } }[] = [
  { icon: Mic, v: { ta: 'மைக் செட்', en: 'Mic sets' } },
  { icon: Speaker, v: { ta: 'ஸ்பீக்கர்கள்', en: 'Speakers' } },
  { icon: Music2, v: { ta: 'DJ & இசை', en: 'DJ & music' } },
  { icon: UserCheck, v: { ta: 'இயக்குபவருடன்', en: 'With operator' } },
];

/** Shown above the sound items: what is offered, and a quick way to ask for something that is not listed. */
function SoundIntro() {
  const { t, lang } = useLang();
  return (
    <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-night to-night-2 p-5 text-white sm:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p lang={lang} className="text-lg font-extrabold sm:text-xl">{t({ ta: 'உங்கள் விழாவுக்கு ஏற்ற ஒலி அமைப்பு', en: 'The right sound for your function' })}</p>
          <p lang={lang} className="mt-1 max-w-xl text-sm text-white/70">{t({ ta: 'கீழே உள்ளதைத் தேர்ந்தெடுக்கலாம்; வேறு தேவை இருந்தால் எங்களிடம் கேளுங்கள்.', en: 'Pick from the list below — or ask us if you need something different.' })}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {SOUND_POINTS.map(({ icon: I, v }) => (
              <li key={v.en} lang={lang} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/15"><I size={14} className="text-gold-1" /> {t(v)}</li>
            ))}
          </ul>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <a href={BUSINESS.phoneHref} className="btn-gold !py-2.5"><span lang={lang}>{t({ ta: 'அழைக்க', en: 'Call us' })}</span></a>
          <a href={`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(t({ ta: 'வணக்கம்! ஒலி சேவை பற்றி விசாரிக்க விரும்புகிறேன்.', en: 'Hello! I would like to enquire about sound service.' }))}`}
            target="_blank" rel="noreferrer" className="btn-whatsapp !py-2.5"><span lang={lang}>WhatsApp</span></a>
        </div>
      </div>
    </div>
  );
}

export const SoundPage = () => (
  <CatalogPage category="sound" hero="lit-pandal"
    title={{ ta: 'ஒலி சேவை', en: 'Sound Service' }}
    sub={{ ta: 'மைக் செட், ஸ்பீக்கர், DJ — உங்கள் விழாவுக்கு ஏற்ற ஒலி அமைப்பு.', en: 'Mic sets, speakers and DJ — the right sound for your function.' }}>
    <SoundIntro />
  </CatalogPage>
);
