import { ITEM_ICONS } from '../components/icons';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inr, useLang } from '../i18n/lang';
import { CATEGORY_LABEL, ITEMS, ITEM_CATEGORIES, type Category } from '../data/config';
import { AreaCalculator, GuestHelper } from '../components/pandal';
import { EstimateSummary } from '../components/summary';
import { ItemCatalog, PageHero } from '../components/ui';
import { WhatsAppIcon } from '../components/Layout';
import { useEstimate } from '../state/estimate';
import { useContent } from '../state/content';
import { whatsappLink } from '../state/whatsapp';

const TABS: Category[] = ITEM_CATEGORIES;

export default function EstimatePage() {
  const { t, lang } = useLang();
  const { state, update, breakdown, reset, applyCombo } = useEstimate();
  const { combos } = useContent();
  const [tab, setTab] = useState<Category>('decor');
  const icon = (c: Category) => ITEMS.find((i) => i.category === c)?.icon ?? 'Speaker';

  return (
    <>
      <PageHero k="lit-pandal" title={{ ta: 'விலை மதிப்பீடு', en: 'Get an Estimate' }}
        sub={{ ta: 'பந்தல், விளக்கு, வாடகைப் பொருட்கள் — அனைத்தையும் தேர்ந்தெடுத்து ஒரே இடத்தில் மொத்த மதிப்பீட்டைப் பாருங்கள்.', en: 'Choose pandal, lighting and rentals — see the full estimate in one place.' }} />
      <div className="section grid grid-cols-1 gap-8 !pt-10 lg:grid-cols-[1fr_420px]">
        <div className="min-w-0 space-y-8">
          {combos.length > 0 && (
            <div className="card p-5">
              <p lang={lang} className="mb-3 text-sm font-bold text-ink/70">🎁 {t({ ta: 'ஒரு காம்போவில் இருந்து தொடங்குங்கள்', en: 'Start from a combo' })}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {combos.map((c) => (
                  <button key={c.id} type="button" onClick={() => applyCombo(c)} aria-pressed={state.packageId === c.id}
                    className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-semibold transition ${state.packageId === c.id ? 'border-primary bg-primary text-white' : 'border-ink/10 hover:border-primary/50'}`}>
                    <span lang={lang}>{t(c.name)}</span> · {inr(c.price)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <AreaCalculator />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="card p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-bold">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-white">3</span>
                <span lang={lang}>{t({ ta: 'தூரம் (போக்குவரத்துக்கு)', en: 'Distance (transport)' })}</span>
              </h2>
              <p className="mt-4 text-3xl font-extrabold text-primary">{state.distanceKm} <span lang={lang} className="text-base text-ink/50">{t({ ta: 'கி.மீ', en: 'km' })}</span></p>
              <input type="range" min={0} max={300} step={5} value={state.distanceKm} onChange={(e) => update({ distanceKm: Number(e.target.value) })} className="mt-2 w-full !border-0 !bg-transparent !p-0 accent-primary" aria-label="Distance km" />
              <p lang={lang} className="text-xs text-ink/50">{t({ ta: 'எங்கள் கிடங்கிலிருந்து விழா நடைபெறும் இடம் வரை', en: 'From our godown to your venue' })}</p>
            </div>
            <GuestHelper compact />
          </div>

          <div>
            <h2 className="mb-4 flex items-center gap-2 font-bold">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-white">4</span>
              <span lang={lang}>{t({ ta: 'கூடுதல் பொருட்களைச் சேர்க்க', en: 'Add more items' })}</span>
            </h2>
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1" role="tablist">
              {TABS.map((c) => (
                <button key={c} role="tab" type="button" aria-selected={tab === c} onClick={() => setTab(c)}
                  className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition ${tab === c ? 'bg-primary text-white shadow-glow' : 'bg-white text-ink/70 ring-1 ring-ink/10 hover:ring-marigold'}`}>
                  {(() => { const I = ITEM_ICONS[icon(c)]; return <I size={16} aria-hidden />; })()}
                  <span lang={lang}>{t(CATEGORY_LABEL[c])}</span>
                  {breakdown.lines[c].length > 0 && <span className={`rounded-full px-2 text-xs ${tab === c ? 'bg-white text-primary' : 'bg-marigold text-ink'}`}>{breakdown.lines[c].length}</span>}
                </button>
              ))}
            </div>
            <ItemCatalog category={tab} withSummary={false} />
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 text-2xl font-extrabold"><span lang={lang}>{t({ ta: 'மதிப்பீட்டுச் சுருக்கம்', en: 'Estimate summary' })}</span></h2>
            <EstimateSummary />
            <div className="mt-5 grid gap-2">
              <Link to="/booking" className="btn-primary !py-3"><span lang={lang}>{t({ ta: 'முன்பதிவு செய்யுங்கள்', en: 'Book Now' })}</span> →</Link>
              <a href={whatsappLink(lang, { b: breakdown, s: state })} target="_blank" rel="noreferrer" className="btn-whatsapp !py-3">
                <WhatsAppIcon /> <span lang={lang}>{t({ ta: 'WhatsApp-ல் அனுப்ப', en: 'Send on WhatsApp' })}</span>
              </a>
              <button type="button" onClick={reset} className="mt-1 text-sm text-ink/45 underline hover:text-primary">
                <span lang={lang}>{t({ ta: 'அனைத்தையும் அழிக்க', en: 'Clear all' })}</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
