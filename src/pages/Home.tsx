import { Clock, MapPin, Phone, Sparkles as SparkIcon, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Bi, inr, useLang } from '../i18n/lang';
import { BUSINESS, PANDALS } from '../data/config';
import { GuestHelper, PandalCard } from '../components/pandal';
import { Faq, HowItWorks, Reviews } from '../components/features';
import { Photo, SectionTitle } from '../components/ui';
import { WhatsAppIcon } from '../components/Layout';
import { CategoryStrip, ShopRows } from '../components/shop';
import { OffersAndCombos } from '../components/promos';
import { useEstimate } from '../state/estimate';
import { Counter, PandalStudio, Reveal, Tilt } from '../components/fx';
import { useIsApp } from '../components/app';
import MobileHome from './MobileHome';
import { whatsappLink } from '../state/whatsapp';
import { useCompany } from '../state/company';
import { useCatalog } from '../state/catalog';

function QuickEstimate() {
  useCatalog(); // re-render when the admin changes pandal rates
  const { t, lang } = useLang();
  const { state, update, breakdown } = useEstimate();
  return (
    <div className="fade-up rounded-xl bg-white p-5 ring-1 ring-slate-200 text-ink shadow-deep sm:p-6" style={{ animationDelay: '.2s' }}>
      <p className="flex items-center justify-between font-extrabold">
        <span lang={lang} className="flex items-center gap-2"><Zap size={18} className="text-gold-2" /> {t({ ta: 'உடனடி விலை', en: 'Instant price' })}</span>
        <span className="chip bg-peacock/10 text-peacock">{t({ ta: '10 விநாடி', en: '10 seconds' })}</span>
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {PANDALS.map((p) => (
          <button key={p.id} type="button" onClick={() => update({ pandalId: p.id })} aria-pressed={state.pandalId === p.id}
            className={`overflow-hidden rounded-2xl border-2 text-left transition ${state.pandalId === p.id ? 'border-primary' : 'border-transparent'}`}>
            <span className="block h-14"><Photo k={p.photo} alt="" /></span>
            <span lang="ta" className="block px-1 py-1 text-[10px] font-bold leading-tight [overflow-wrap:anywhere] sm:text-[11px]">{p.name.ta.replace(' பந்தல்', '').replace('ப்', '')}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <label className="flex-1">
          <span lang={lang} className="text-xs font-semibold text-ink/60">{t({ ta: 'நீளம் (அடி)', en: 'Length (ft)' })}</span>
          <input type="number" min={0} value={state.unit === 'ft' ? state.length || '' : ''} onChange={(e) => update({ length: Math.max(0, +e.target.value), unit: 'ft' })} className="w-full text-lg font-bold" />
        </label>
        <span className="pb-3 font-bold text-ink/30">×</span>
        <label className="flex-1">
          <span lang={lang} className="text-xs font-semibold text-ink/60">{t({ ta: 'அகலம் (அடி)', en: 'Breadth (ft)' })}</span>
          <input type="number" min={0} value={state.unit === 'ft' ? state.breadth || '' : ''} onChange={(e) => update({ breadth: Math.max(0, +e.target.value), unit: 'ft' })} className="w-full text-lg font-bold" />
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-turmeric-wash px-4 py-3">
        <span>
          <span lang={lang} className="block text-xs text-ink/55">{Math.round(breakdown.areaSqft).toLocaleString('en-IN')} {t({ ta: 'சதுர அடி · பந்தல்', en: 'sq ft · pandal' })}</span>
          <span className="text-3xl font-bold text-primary">{breakdown.pandal ? inr(breakdown.pandalCost) : '—'}</span>
        </span>
        <Link to="/estimate" className="btn-primary !px-4"><span lang={lang}>{t({ ta: 'தொடர', en: 'Continue' })}</span> →</Link>
      </div>
    </div>
  );
}

function DesktopHome() {
  useCatalog(); // re-render when the admin changes pandal rates
  useCompany();
  const { t, lang } = useLang();
  const { breakdown, state } = useEstimate();

  return (
    <>
      {/* HERO — clean blue, no background photo */}
      <section className="relative isolate overflow-hidden border-b border-slate-200 bg-gradient-to-b from-blue-50/70 to-white text-ink">
        <div className="mx-auto grid grid-cols-1 min-h-[560px] max-w-7xl items-center gap-10 px-4 pb-24 pt-12 sm:px-6 md:pb-32 md:pt-14 lg:grid-cols-[1.2fr_1fr]">
          <div className="fade-up">
            <span lang={lang} className="chip bg-blue-50 text-primary ring-1 ring-blue-100"><SparkIcon size={13} /> {t(BUSINESS.tagline)}</span>
            <h1 className="mt-5">
              <span lang="ta" className="block text-[2.3rem] font-extrabold leading-[1.25] sm:text-5xl xl:text-[3.5rem]">
                உங்கள் விழா,<br /><span className="text-primary">எங்கள் பொறுப்பு</span>
              </span>
              <span className="mt-3 block text-xl font-semibold text-ink/60 sm:text-2xl">Pandal · Lighting · Rentals</span>
            </h1>
            <p lang={lang} className="mt-5 max-w-xl text-base text-ink/65 sm:text-lg">
              {t({ ta: 'பந்தல் அமைப்பு, மின்விளக்கு அலங்காரம், நாற்காலி–மேசை–ஒலி–ஜெனரேட்டர் வாடகை — ஒரே இடத்தில், உடனடி விலையுடன்.', en: 'Pandal setup, lighting decoration and rentals — chairs, tables, sound and generators — in one place, with instant prices.' })}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/pandals" className="btn-primary !px-6 !py-3.5 text-base"><span lang={lang}>{t({ ta: 'பந்தல் முன்பதிவு', en: 'Book a pandal' })}</span> →</Link>
              <Link to="/estimate" className="btn-ghost !px-6 !py-3.5 text-base"><span lang={lang}>{t({ ta: 'விலை மதிப்பீடு', en: 'Get a quote' })}</span></Link>
            </div>
          </div>
          <QuickEstimate />
        </div>
      </section>

      {/* stats */}
      <section className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 sm:px-6 md:-mt-20">
        <ul className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white shadow-deep ring-1 ring-slate-200 md:grid-cols-4">
          {[
            { n: 3, s: '', v: { ta: 'சேவைகள்', en: 'Services' } },
            { n: 3, s: '', v: { ta: 'பந்தல் வகைகள்', en: 'Pandal types' } },
            { n: 28, s: '+', v: { ta: 'வாடகை & விளக்குப் பொருட்கள்', en: 'Rental & lighting items' } },
            { n: 14, s: '+', v: { ta: 'சேவை ஊர்கள்', en: 'Towns served' } },
          ].map((x, i) => (
            <li key={x.v.en} className={`border-slate-200 p-5 text-center sm:p-6 ${i % 2 ? '' : 'border-r'} ${i < 2 ? 'border-b md:border-b-0' : ''} ${i === 1 ? 'md:border-r' : ''}`}>
              <p className="text-4xl font-extrabold text-primary sm:text-5xl"><Counter to={x.n} suffix={x.s} /></p>
              <span className="mt-1 block"><Bi v={x.v} className="text-sm font-semibold text-ink/80" altClassName="!text-[11px]" /></span>
            </li>
          ))}
        </ul>
      </section>

      {/* Offers & combo packages (shown once the admin adds some) */}
      <div className="mx-auto mt-14 max-w-7xl px-4 sm:px-6"><OffersAndCombos /></div>

      {/* Our three services + shop rows */}
      <section id="services" className="mx-auto mt-14 max-w-7xl scroll-mt-40 space-y-6 px-4 sm:px-6">
        <SectionTitle eyebrow={{ ta: 'எங்கள் சேவைகள்', en: 'Our services' }} v={{ ta: 'மூன்று சேவைகள், ஒரே இடம்', en: 'Three Services, One Place' }} />
        <CategoryStrip />
        <ShopRows />
      </section>

      {/* Pandal types */}
      <section className="section">
        <Reveal><SectionTitle eyebrow={{ ta: 'பந்தல் சேவை', en: 'Pandal service' }}
          v={{ ta: 'மூன்று பந்தல் வகைகள்', en: 'Three Pandal Types' }}
          sub={{ ta: 'உங்கள் விழாவுக்கு ஏற்ற பந்தலைத் தேர்ந்தெடுத்து, நீளம் × அகலம் கொடுத்து உடனே மதிப்பீடு பெறுங்கள்.', en: 'Choose the right pandal, enter length × breadth and get an instant estimate.' }} /></Reveal>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PANDALS.map((p, i) => <Reveal key={p.id} delay={i * 120} className="h-full"><Tilt className="h-full"><PandalCard pandal={p} /></Tilt></Reveal>)}
        </div>
        <div className="mx-auto mt-12 grid grid-cols-1 max-w-5xl items-center gap-6 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200 sm:p-8 lg:grid-cols-[1fr_400px]">
          <div>
            <h3 className="text-2xl font-extrabold"><Bi v={{ ta: 'எந்த அளவு பந்தல் தேவை என்று தெரியவில்லையா?', en: 'Not sure what size you need?' }} altClassName="mt-1 !text-sm font-sans text-primary" /></h3>
            <p lang={lang} className="mt-3 text-ink/65">{t({ ta: 'விருந்தினர் எண்ணிக்கையைச் சொல்லுங்கள் — பந்தல் அளவையும் நாற்காலிகளையும் நாங்களே பரிந்துரைக்கிறோம்.', en: 'Tell us how many guests — we suggest the pandal size and number of chairs.' })}</p>
          </div>
          <GuestHelper />
        </div>
      </section>

      {/* 3D pandal studio */}
      <section className="relative overflow-hidden bg-wine-luxe text-white">
        <div className="section relative">
          <Reveal><SectionTitle light eyebrow={{ ta: 'புதிய அனுபவம் · 3D', en: 'New experience · 3D' }}
            v={{ ta: 'உங்கள் பந்தலை 3D-ல் பாருங்கள்', en: 'See Your Pandal in 3D' }}
            sub={{ ta: 'பந்தல் வகை, நீளம், அகலம், நாற்காலிகள் — மாற்றுங்கள், சுழற்றுங்கள், பகல் / இரவு ஒளியில் பாருங்கள். விலை உடனே மாறும்.', en: 'Change the type, size and chairs — rotate it, see it by day or night. The price updates instantly.' }} /></Reveal>
          <Reveal delay={150}><PandalStudio /></Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white">
        <div className="section">
          <Reveal><SectionTitle eyebrow={{ ta: 'எளிய முறை', en: 'Simple process' }} v={{ ta: 'எப்படி முன்பதிவு செய்வது?', en: 'How Booking Works' }} /></Reveal>
          <HowItWorks />
        </div>
      </section>

      {/* Reviews */}
      <section className="section">
        <Reveal><SectionTitle eyebrow={{ ta: 'வாடிக்கையாளர் கருத்து', en: 'Customer voices' }} v={{ ta: 'மக்கள் சொல்வது', en: 'What People Say' }} /></Reveal>
        <Reviews />
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="section">
          <Reveal><SectionTitle eyebrow={{ ta: 'சந்தேகங்கள்', en: 'Questions' }} v={{ ta: 'அடிக்கடி கேட்கப்படும் கேள்விகள்', en: 'Frequently Asked Questions' }} /></Reveal>
          <Faq />
        </div>
      </section>

      {/* Contact & WhatsApp — no photo */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="relative grid grid-cols-1 overflow-hidden rounded-2xl bg-wine-luxe text-white shadow-deep md:grid-cols-[1.3fr_1fr]">
          <div className="relative p-8 sm:p-12">
            <h2 className="text-3xl font-extrabold sm:text-4xl"><span lang={lang}>{t({ ta: 'தொடர்பு மற்றும் WhatsApp விசாரணை', en: 'Contact & WhatsApp Enquiry' })}</span></h2>
            <p lang={lang} className="mt-4 text-white/85">{t({ ta: 'தேதி, இடம், பந்தல் அளவு சொல்லுங்கள் — உங்கள் விழாவுக்கு ஏற்ற திட்டத்தையும் இறுதி விலையையும் தெரிவிக்கிறோம்.', en: 'Tell us your date, venue and pandal size — we will suggest the right plan and confirm the final price.' })}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={whatsappLink(lang, { b: breakdown, s: state })} target="_blank" rel="noreferrer" className="btn-whatsapp !px-6 !py-3.5 text-base">
                <WhatsAppIcon /> <span lang={lang}>{t({ ta: 'WhatsApp-ல் விசாரிக்க', en: 'Enquire on WhatsApp' })}</span>
              </a>
              <a href={BUSINESS.phoneHref} className="btn-primary !px-6 !py-3.5 text-base"><Phone size={17} /> {BUSINESS.phoneDisplay}</a>
            </div>
          </div>
          <ul className="relative grid content-center gap-3 border-t border-white/10 p-8 sm:p-12 md:border-l md:border-t-0">
            {[
              { i: Phone, v: { ta: 'அழைக்க', en: 'Call' }, d: BUSINESS.phoneDisplay },
              { i: Clock, v: { ta: 'நேரம்', en: 'Hours' }, d: t(BUSINESS.hours) },
              { i: MapPin, v: { ta: 'முகவரி', en: 'Address' }, d: t(BUSINESS.address) },
            ].map((x) => (
              <li key={x.v.en} className="flex items-start gap-3 rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-primary"><x.i size={17} /></span>
                <span className="min-w-0"><span lang={lang} className="block text-xs text-sky-200">{t(x.v)}</span><span lang={lang} className="block text-sm font-semibold">{x.d}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

/** Phones get the app-style home screen; larger screens keep the full landing page. */
export default function Home() {
  const isApp = useIsApp();
  return isApp ? <MobileHome /> : <DesktopHome />;
}
