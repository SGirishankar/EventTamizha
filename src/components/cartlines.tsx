import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { inr, useLang } from '../i18n/lang';
import { CATEGORY_LABEL, ITEM_CATEGORIES, type Category, type Item } from '../data/config';
import { ITEM_ICONS } from './icons';
import { productImageSrc } from './ui';
import { useEstimate } from '../state/estimate';

const CAT_PAGE: Record<Category, string> = { decor: '/pandals', lighting: '/lighting', rentals: '/rentals', sound: '/sound' };

/** Product photo with the item's icon as the fallback when there is no photo (or it fails to load). */
export function Thumb({ item, small = false }: { item: Item; small?: boolean }) {
  const [broken, setBroken] = useState(false);
  const src = broken ? null : productImageSrc(item);
  const I = ITEM_ICONS[item.icon];
  const size = small ? 'h-14 w-14' : 'h-16 w-16 sm:h-24 sm:w-24';
  return src
    ? <img src={src} alt={item.name.en} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} className={`${size} shrink-0 rounded-xl object-cover ring-1 ring-slate-200`} />
    : <span className={`${size} grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] text-primary ring-1 ring-primary/10`}><I size={small ? 24 : 30} strokeWidth={1.5} /></span>;
}

export function Stepper({ value, label, onChange }: { value: number; label: string; onChange: (n: number) => void }) {
  const btn = 'grid h-9 w-9 touch-manipulation place-items-center rounded-lg transition active:scale-90';
  return (
    <div className="inline-flex items-center gap-1.5" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} aria-label={`${label} −`} className={`${btn} bg-slate-100 text-ink hover:bg-slate-200`}><Minus size={16} /></button>
      <input type="text" inputMode="numeric" pattern="[0-9]*" value={value} aria-label={label} onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => onChange(Number(e.target.value.replace(/\D/g, '')))}
        className="h-9 w-14 !rounded-lg !px-1 !py-0 text-center font-extrabold tabular-nums text-primary" />
      <button type="button" onClick={() => onChange(value + 1)} aria-label={`${label} +`} className={`${btn} bg-primary text-white hover:bg-primary-dark`}><Plus size={16} /></button>
    </div>
  );
}

/** Every item the customer chose (all categories), with photo, quantity buttons and remove: shown on the booking page. */
export function SelectedItems() {
  const { t, lang } = useLang();
  const { breakdown: b, setQty } = useEstimate();
  const cats = ITEM_CATEGORIES.filter((c) => b.lines[c].length > 0);
  if (cats.length === 0) return null;
  return (
    <div className="card space-y-4 p-5 sm:p-6">
      <h2 lang={lang} className="text-lg font-bold">{t({ ta: 'நீங்கள் தேர்ந்தெடுத்த பொருட்கள்', en: 'Your selected items' })}</h2>
      {cats.map((c) => (
        <section key={c}>
          <h3 lang={lang} className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">{t(CATEGORY_LABEL[c])}</h3>
          <ul className="space-y-2.5">
            {b.lines[c].map((l) => (
              <li key={l.item.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5 ring-1 ring-slate-200">
                <Thumb item={l.item} small />
                <div className="min-w-0 flex-1">
                  <p lang={lang} className="line-clamp-2 text-sm font-bold">{t(l.item.name)}</p>
                  <p className="text-xs text-ink/60">{inr(l.item.price)} / <span lang={lang}>{t(l.item.unit)}</span></p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <Stepper value={l.qty} label={t(l.item.name)} onChange={(n) => setQty(l.item.id, n)} />
                    <button type="button" onClick={() => setQty(l.item.id, 0)} className="inline-flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 size={14} /> <span lang={lang}>{t({ ta: 'நீக்கு', en: 'Remove' })}</span></button>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-extrabold tabular-nums">{inr(l.total)}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="flex flex-wrap gap-4 text-sm font-bold text-primary underline">
        <Link to="/cart"><span lang={lang}>{t({ ta: 'கூடையைப் பார்க்க', en: 'View cart' })}</span></Link>
        {ITEM_CATEGORIES.map((c) => <Link key={c} to={CAT_PAGE[c]}><span lang={lang}>+ {t(CATEGORY_LABEL[c])}</span></Link>)}
      </div>
    </div>
  );
}
