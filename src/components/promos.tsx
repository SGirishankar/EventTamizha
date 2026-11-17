import { BadgePercent, CalendarClock, Gift, ShoppingBag, Tent } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { inr, useLang } from '../i18n/lang';
import { PANDALS, type Item } from '../data/config';
import { useCatalog } from '../state/catalog';
import { useContent, type Combo } from '../state/content';
import { useEstimate } from '../state/estimate';
import { productImageSrc } from './ui';

/** Normal price of everything in a combo (items + pandal at the combo size). */
export function comboBase(c: Combo, items: Item[]) {
  const byId = new Map(items.map((i) => [i.id, i]));
  const itemsBase = Object.entries(c.items).reduce((a, [id, q]) => a + (byId.get(id)?.price ?? 0) * q, 0);
  const p = c.pandalId ? PANDALS.find((x) => x.id === c.pandalId) : undefined;
  const area = c.length * c.breadth;
  return itemsBase + (p && area > 0 ? Math.max(area * p.pricePerSqft, p.minCharge) : 0);
}

const fmtDate = (d: string, lang: string) => new Date(`${d}T00:00:00`).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export function OfferStrip() {
  const { t, lang } = useLang();
  const { offers } = useContent();
  if (!offers.length) return null;
  return (
    <ul className="flex snap-x gap-3 overflow-x-auto pb-1 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
      {offers.map((o) => (
        <li key={o.id} className="w-[85%] shrink-0 snap-start md:w-auto">
          <article className="relative h-full overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-[1.5px] shadow-card">
            <div className="flex h-full gap-3 rounded-[0.9rem] bg-white p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white shadow"><BadgePercent size={24} /></span>
              <div className="min-w-0 flex-1">
                {o.badge && <span className="mb-1 inline-block rounded-md bg-rose-500 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white">{o.badge}</span>}
                <h3 lang={lang} className="text-base font-extrabold leading-snug text-ink">{t(o.title)}</h3>
                {(o.details.ta || o.details.en) && <p lang={lang} className="mt-0.5 text-sm text-ink/65">{t(o.details)}</p>}
                {o.validTill && <p lang={lang} className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-orange-600"><CalendarClock size={12} /> {t({ ta: 'கடைசி நாள்', en: 'Valid till' })} {fmtDate(o.validTill, lang)}</p>}
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}

export function ComboCard({ c }: { c: Combo }) {
  const { t, lang } = useLang();
  const { items } = useCatalog();
  const { applyCombo, state } = useEstimate();
  const nav = useNavigate();
  const base = comboBase(c, items);
  const save = Math.max(0, base - c.price);
  const list = Object.entries(c.items).map(([id, q]) => ({ item: items.find((i) => i.id === id), q })).filter((x) => x.item) as { item: Item; q: number }[];
  const pics = list.map((x) => productImageSrc(x.item)).filter(Boolean).slice(0, 4) as string[];
  const pandal = c.pandalId ? PANDALS.find((p) => p.id === c.pandalId) : undefined;
  const active = state.packageId === c.id;
  return (
    <article className={`fk-card group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 transition duration-300 ${active ? 'ring-2 ring-primary' : 'ring-slate-200'}`}>
      <div className="relative aspect-[16/9] overflow-hidden bg-primary/5">
        {c.img ? (
          <img src={c.img} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : pics.length ? (
          <div className={`grid h-full ${pics.length > 1 ? 'grid-cols-2' : ''} gap-0.5`}>
            {pics.map((src) => <img key={src} src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />)}
          </div>
        ) : (
          <span className="grid h-full place-items-center text-primary"><Gift size={40} /></span>
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-[11px] font-extrabold text-white shadow"><Gift size={13} /> {t({ ta: 'காம்போ', en: 'COMBO' })}</span>
        {save > 0 && <span className="absolute right-3 top-3 rounded-lg bg-emerald-500 px-2 py-1 text-[11px] font-extrabold text-white shadow">{t({ ta: 'சேமிப்பு', en: 'Save' })} {inr(save)}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 lang={lang} className="text-lg font-extrabold leading-snug text-ink transition group-hover:text-primary">{t(c.name)}</h3>
        {(c.details.ta || c.details.en) && <p lang={lang} className="mt-0.5 text-sm text-ink/60">{t(c.details)}</p>}
        <ul className="mt-3 space-y-1 text-[13px] text-ink/75">
          {pandal && <li lang={lang} className="flex items-center gap-1.5"><Tent size={14} className="shrink-0 text-primary" /> {t(pandal.name)} · {c.length}×{c.breadth} {t({ ta: 'அடி', en: 'ft' })}</li>}
          {list.slice(0, 5).map((x) => <li key={x.item.id} lang={lang} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /> {t(x.item.name)} × {x.q}</li>)}
          {list.length > 5 && <li className="text-xs text-ink/45">+{list.length - 5} {t({ ta: 'மேலும்', en: 'more' })}</li>}
        </ul>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <p className="leading-tight">
            {save > 0 && <span className="block text-xs text-ink/40 line-through">{inr(base)}</span>}
            <span className="text-2xl font-extrabold text-ink">{inr(c.price)}</span>
          </p>
          <button type="button" onClick={() => { applyCombo(c); nav('/estimate'); }} className="btn-primary !px-4 !py-2.5">
            <ShoppingBag size={16} /> <span lang={lang}>{active ? t({ ta: 'சேர்க்கப்பட்டது', en: 'Added' }) : t({ ta: 'காம்போ சேர்', en: 'Add combo' })}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export function ComboGrid({ limit }: { limit?: number }) {
  const { combos } = useContent();
  if (!combos.length) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {combos.slice(0, limit ?? combos.length).map((c) => <ComboCard key={c.id} c={c} />)}
    </div>
  );
}

/** Home-page block: offers strip + combo packages. Renders nothing until the admin adds some. */
export function OffersAndCombos() {
  const { t, lang } = useLang();
  const { offers, combos } = useContent();
  if (!offers.length && !combos.length) return null;
  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <h2 lang={lang} className="flex items-center gap-2 text-2xl font-extrabold sm:text-3xl"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white"><BadgePercent size={20} /></span>{t({ ta: 'சலுகைகள் & காம்போ', en: 'Offers & Combos' })}</h2>
        <Link to="/offers" lang={lang} className="text-sm font-bold text-primary hover:underline">{t({ ta: 'அனைத்தும்', en: 'View all' })} →</Link>
      </div>
      <OfferStrip />
      <ComboGrid limit={3} />
    </section>
  );
}
