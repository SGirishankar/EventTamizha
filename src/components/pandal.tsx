import { Check, PartyPopper, Ruler, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bi, inr, useLang } from '../i18n/lang';
import { CHARGES, FEET_PER_METRE, PANDALS, type Pandal } from '../data/config';
import { useEstimate, type Unit } from '../state/estimate';
import { Photo } from './ui';
import { useCatalog } from '../state/catalog';

export function PandalCard({ pandal, onSelect }: { pandal: Pandal; onSelect?: () => void }) {
  useCatalog(); // re-render when the admin changes pandal rates
  const { t, lang } = useLang();
  const { state, update } = useEstimate();
  const navigate = useNavigate();
  const selected = state.pandalId === pandal.id;
  return (
    <article className={`@container card group flex h-full flex-col transition duration-300 ${selected ? '!ring-4 !ring-marigold' : 'hover:-translate-y-1.5 hover:shadow-glow'}`}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Photo k={pandal.photo} alt={`${pandal.name.ta} — ${pandal.name.en}`} className="transition duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/10 to-transparent" />
        <span className="chip absolute right-3 top-3 bg-white/95 text-primary shadow">
          {inr(pandal.pricePerSqft)}<span lang={lang} className="font-normal text-ink/60">/{t({ ta: 'ச.அடி', en: 'sq ft' })}</span>
        </span>
        {selected && (
          <span lang={lang} className="chip absolute left-3 top-3 bg-gold-1 text-wine shadow"><Check size={12} /> {t({ ta: 'தேர்ந்தெடுத்தது', en: 'Selected' })}</span>
        )}
        <h3 className="absolute inset-x-4 bottom-3 text-white">
          <span lang={lang} className="block font-[family-name:var(--font-display)] text-3xl font-extrabold drop-shadow">{t(pandal.name)}</span>
        </h3>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p lang={lang} className="text-[15px] text-ink/80">{t(pandal.desc)}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {pandal.features.map((f) => (
            <li key={f.en} lang={lang} className="chip bg-primary/[0.07] text-primary ring-1 ring-primary/10"><Check size={12} /> {t(f)}</li>
          ))}
        </ul>
        <p lang={lang} className="mt-3 flex gap-1.5 text-xs font-medium text-ink/55"><PartyPopper size={14} className="shrink-0 text-gold-2" />{t(pandal.bestFor)}</p>
        <div className="mt-auto pt-5">
          <p lang={lang} className="text-xs text-ink/50">
            {t({ ta: 'மாதிரி விலை · குறைந்தபட்சம்', en: 'Sample price · minimum' })} {inr(pandal.minCharge)}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 @[19rem]:grid-cols-2">
            <button type="button" className="btn-gold !px-3"
              onClick={() => { update({ pandalId: pandal.id }); onSelect ? onSelect() : navigate('/pandals#calculator'); }}>
              <Ruler size={15} /> <span lang={lang}>{t({ ta: 'அளவு கணக்கிட', en: 'Calculate' })}</span>
            </button>
            <button type="button" className="btn-primary !px-3"
              onClick={() => { update({ pandalId: pandal.id }); navigate('/booking'); }}>
              <span lang={lang}>{t({ ta: 'முன்பதிவு', en: 'Book' })}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

const fmt = (n: number, d = 1) => n.toLocaleString('en-IN', { maximumFractionDigits: d });

/** Suggests a pandal size and chair count from the number of guests. */
export function GuestHelper({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useLang();
  const { update, setQty } = useEstimate();
  const [guests, setGuests] = useState(150);
  const area = guests * CHARGES.sqftPerGuest;
  const breadth = Math.max(10, Math.round(Math.sqrt(area / 1.5) / 5) * 5);
  const length = Math.max(10, Math.ceil(area / breadth / 5) * 5);
  const [done, setDone] = useState(false);

  return (
    <div className={`gold-frame rounded-3xl bg-gradient-to-br from-night to-night-2 p-5 text-white sm:p-6 ${compact ? '' : 'shadow-card'}`}>
      <p className="flex items-center gap-2 font-bold">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-1/15 text-gold-1"><Users size={17} /></span>
        <Bi v={{ ta: 'விருந்தினர் எண்ணிக்கை உதவி', en: 'Guest-count helper' }} inline altClassName="text-xs font-normal text-white/70" />
      </p>
      <label className="mt-4 block">
        <span lang={lang} className="text-sm text-white/80">{t({ ta: 'எத்தனை விருந்தினர்கள்?', en: 'How many guests?' })} <b className="text-lg text-gold-1">{guests}</b></span>
        <input type="range" min={20} max={1000} step={10} value={guests} onChange={(e) => { setGuests(Number(e.target.value)); setDone(false); }}
          className="!mt-2 w-full !border-0 !bg-transparent !p-0 range-gold" aria-label="Guests" />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-2xl bg-white/10 p-3">
          <p lang={lang} className="text-xs text-white/70">{t({ ta: 'பரிந்துரை அளவு', en: 'Suggested size' })}</p>
          <p className="text-lg font-extrabold">{length} × {breadth} <span lang={lang} className="text-xs">{t({ ta: 'அடி', en: 'ft' })}</span></p>
        </div>
        <div className="rounded-2xl bg-white/10 p-3">
          <p lang={lang} className="text-xs text-white/70">{t({ ta: 'நாற்காலிகள்', en: 'Chairs' })}</p>
          <p className="text-lg font-extrabold">{guests}</p>
        </div>
      </div>
      <button type="button" className="btn-gold mt-4 w-full"
        onClick={() => { update({ length, breadth, unit: 'ft' }); setQty('plastic', guests); setDone(true); }}>
        <span lang={lang}>{done ? '✓ ' + t({ ta: 'மதிப்பீட்டில் சேர்க்கப்பட்டது', en: 'Added to estimate' }) : t({ ta: 'இந்த அளவைப் பயன்படுத்து', en: 'Use this size' })}</span>
      </button>
    </div>
  );
}

/** Length × breadth input with unit conversion and pandal cost. */
export function AreaCalculator({ showPicker = true }: { showPicker?: boolean }) {
  useCatalog(); // re-render when the admin changes pandal rates
  const { t, lang } = useLang();
  const { state, update, breakdown } = useEstimate();
  const unitLabel = state.unit === 'ft' ? t({ ta: 'அடி', en: 'ft' }) : t({ ta: 'மீட்டர்', en: 'm' });
  const setUnit = (u: Unit) => {
    if (u === state.unit) return;
    // Convert the entered numbers so the physical size stays the same.
    const f = u === 'm' ? 1 / FEET_PER_METRE : FEET_PER_METRE;
    update({ unit: u, length: +(state.length * f).toFixed(2), breadth: +(state.breadth * f).toFixed(2) });
  };

  return (
    <div className="card p-5 sm:p-8">
      {showPicker && (
        <fieldset className="@container">
          <legend className="mb-3 flex items-center gap-2 font-bold text-ink">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-white">1</span>
            <Bi v={{ ta: 'பந்தல் வகையைத் தேர்ந்தெடுங்கள்', en: 'Choose pandal type' }} inline altClassName="text-xs font-normal" />
          </legend>
          <div className="grid grid-cols-1 gap-3 @lg:grid-cols-3">
            {PANDALS.map((p) => {
              const on = state.pandalId === p.id;
              return (
                <label key={p.id} className={`relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border-2 p-2 pr-3 transition @lg:flex-col @lg:items-stretch @lg:gap-0 @lg:p-0  ${on ? 'border-primary bg-primary/5' : 'border-ink/10 hover:border-marigold'}`}>
                  <input type="radio" name="pandal" className="sr-only" checked={on} onChange={() => update({ pandalId: p.id })} />
                  <span className="h-14 w-16 shrink-0 overflow-hidden rounded-xl @lg:h-20 @lg:w-full @lg:rounded-none"><Photo k={p.photo} alt="" /></span>
                  <span className="min-w-0 [overflow-wrap:anywhere] @lg:px-3 @lg:py-2.5">
                    <span lang={lang} className="block font-bold text-ink">{t(p.name)}</span>
                    <span lang={lang} className="block text-xs text-ink/55">{inr(p.pricePerSqft)}/{t({ ta: 'ச.அடி', en: 'sq ft' })}</span>
                  </span>
                  {on && <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] text-white">✓</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset className={showPicker ? 'mt-7' : ''}>
        <legend className="mb-3 flex items-center gap-2 font-bold text-ink">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-sm text-white">{showPicker ? 2 : 1}</span>
          <Bi v={{ ta: 'பந்தல் அளவை உள்ளிடுங்கள்', en: 'Enter pandal size' }} inline altClassName="text-xs font-normal" />
        </legend>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex w-fit rounded-full bg-ink/5 p-1 text-sm font-bold" role="group" aria-label="Unit">
            {(['ft', 'm'] as Unit[]).map((u) => (
              <button key={u} type="button" onClick={() => setUnit(u)} aria-pressed={state.unit === u}
                className={`rounded-full px-4 py-2 transition ${state.unit === u ? 'bg-primary text-white shadow' : 'text-ink/60'}`}>
                <span lang={lang}>{u === 'ft' ? t({ ta: 'அடி', en: 'Feet' }) : t({ ta: 'மீட்டர்', en: 'Metres' })}</span>
              </button>
            ))}
          </div>
          <label className="block min-w-28 flex-1">
            <span lang={lang} className="mb-1 block text-sm font-semibold text-ink/70">{t({ ta: 'நீளம்', en: 'Length' })} ({unitLabel})</span>
            <input type="number" min={0} step="any" inputMode="decimal" value={state.length || ''} onChange={(e) => update({ length: Math.max(0, Number(e.target.value)) })} className="w-full text-xl font-bold" />
          </label>
          <span className="pb-3 text-2xl font-bold text-ink/30">×</span>
          <label className="block min-w-28 flex-1">
            <span lang={lang} className="mb-1 block text-sm font-semibold text-ink/70">{t({ ta: 'அகலம்', en: 'Breadth' })} ({unitLabel})</span>
            <input type="number" min={0} step="any" inputMode="decimal" value={state.breadth || ''} onChange={(e) => update({ breadth: Math.max(0, Number(e.target.value)) })} className="w-full text-xl font-bold" />
          </label>
        </div>
      </fieldset>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="kolam-dots rounded-3xl bg-turmeric-wash p-5">
          <p lang={lang} className="text-sm font-semibold text-ink/60">{t({ ta: 'மொத்தப் பரப்பளவு', en: 'Total area' })}</p>
          <p className="mt-1 text-sm text-ink/70">
            {fmt(state.length, 2)} × {fmt(state.breadth, 2)} {unitLabel}
            {state.unit === 'm' && <> = {fmt(breakdown.lengthFt)} × {fmt(breakdown.breadthFt)} {t({ ta: 'அடி', en: 'ft' })}</>}
          </p>
          <p className="mt-1 text-4xl font-extrabold text-ink">
            {fmt(breakdown.areaSqft, 0)} <span lang={lang} className="text-base font-bold text-ink/60">{t({ ta: 'சதுர அடி', en: 'sq ft' })}</span>
          </p>
          <p className="text-xs text-ink/50">≈ {fmt(breakdown.areaSqm)} {t({ ta: 'சதுர மீட்டர்', en: 'sq m' })} · {t({ ta: 'சுமார்', en: 'about' })} {Math.floor(breakdown.areaSqft / CHARGES.sqftPerGuest)} {t({ ta: 'பேர் அமரலாம்', en: 'guests seated' })}</p>
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-5 text-white">
          {breakdown.pandal ? (
            <>
              <p lang={lang} className="text-sm text-white/75">{t(breakdown.pandal.name)} · {fmt(breakdown.areaSqft, 0)} × {inr(breakdown.pandal.pricePerSqft)}</p>
              <p className="mt-2 text-4xl font-extrabold">{inr(breakdown.pandalCost)}</p>
              {breakdown.minApplied && <p lang={lang} className="text-xs text-turmeric">{t({ ta: 'குறைந்தபட்சக் கட்டணம் பொருந்தும்', en: 'Minimum charge applied' })}</p>}
              <p lang={lang} className="mt-2 text-xs text-white/70">{t({ ta: 'பந்தல் மட்டும் · போக்குவரத்து தனி', en: 'Pandal only · transport extra' })}</p>
            </>
          ) : (
            <p lang={lang} className="font-semibold">{t({ ta: 'விலையைக் காண பந்தல் வகையைத் தேர்ந்தெடுங்கள்.', en: 'Select a pandal type to see the price.' })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
