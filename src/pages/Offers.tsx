import { BadgePercent, Gift } from 'lucide-react';
import { useLang } from '../i18n/lang';
import { PageHero } from '../components/ui';
import { ComboGrid, OfferStrip } from '../components/promos';
import { useContent } from '../state/content';
import { Link } from 'react-router-dom';
import { WhatsAppIcon } from '../components/Layout';
import { whatsappLink } from '../state/whatsapp';

export default function OffersPage() {
  const { t, lang } = useLang();
  const { offers, combos } = useContent();
  return (
    <>
      <PageHero title={{ ta: 'சலுகைகள் & காம்போ', en: 'Offers & Combos' }}
        sub={{ ta: 'சிறப்புச் சலுகைகள் மற்றும் குறைந்த விலையில் காம்போ தொகுப்புகள்.', en: 'Special offers and money-saving combo packages.' }} />
      <section className="section space-y-10">
        {offers.length > 0 && (
          <div>
            <h2 lang={lang} className="mb-4 flex items-center gap-2 text-2xl font-extrabold"><BadgePercent className="text-rose-500" /> {t({ ta: 'சலுகைகள்', en: 'Offers' })}</h2>
            <OfferStrip />
          </div>
        )}
        {combos.length > 0 && (
          <div>
            <h2 lang={lang} className="mb-4 flex items-center gap-2 text-2xl font-extrabold"><Gift className="text-primary" /> {t({ ta: 'காம்போ தொகுப்புகள்', en: 'Combo packages' })}</h2>
            <ComboGrid />
          </div>
        )}
        {!offers.length && !combos.length && (
          <div className="relative mx-auto max-w-xl overflow-hidden rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200 sm:p-10">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgb(251_191_36/.25),transparent_65%)]" aria-hidden />
            <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow-lg"><BadgePercent size={30} /></span>
            <h2 lang={lang} className="relative mt-4 text-xl font-extrabold">{t({ ta: 'புதிய சலுகைகள் விரைவில்!', en: 'New offers are coming soon' })}</h2>
            <p lang={lang} className="relative mx-auto mt-2 max-w-sm text-sm text-ink/60">{t({ ta: 'முகூர்த்த நாட்களுக்கான சிறப்புச் சலுகைகளுக்கு WhatsApp-ல் கேளுங்கள், அல்லது எங்கள் சேவைகளைப் பாருங்கள்.', en: 'Ask us on WhatsApp about special prices for muhurtham days, or browse our services.' })}</p>
            <div className="relative mt-6 flex flex-wrap justify-center gap-2">
              <Link to="/explore" className="btn-primary !py-2.5"><span lang={lang}>{t({ ta: 'சேவைகளைப் பார்க்க', en: 'Browse services' })}</span></Link>
              <a href={whatsappLink(lang, { extra: lang === 'ta' ? 'சலுகைகள் பற்றி அறிய விரும்புகிறேன்.' : 'I would like to know about your offers.' })} target="_blank" rel="noreferrer" className="btn-whatsapp !py-2.5"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
