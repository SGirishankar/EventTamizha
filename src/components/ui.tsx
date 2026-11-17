import { ITEM_ICONS } from './icons';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Bi, inr, useLang, type L } from '../i18n/lang';
import { Phone, Sparkles } from 'lucide-react';
import { BUSINESS, CREDITS, photo, type Category, type Item, type PhotoKey } from '../data/config';
import { useCatalog } from '../state/catalog';
import { useEstimate } from '../state/estimate';
import { LOCAL, ONLINE } from '../data/productPhotos';

export const DEMO_NOTE: L = {
  ta: 'விலைகள் மதிப்பீடு மட்டுமே. இறுதி விலையை நிறுவனம் உறுதி செய்யும்.',
  en: 'Prices are estimates only. The final price will be confirmed by the business.',
};

/** A real photograph with lazy loading; alt text is bilingual. */
export function Photo({ k, alt, className = '', eager = false }: { k: PhotoKey; alt: string; className?: string; eager?: boolean }) {
  return (
    <img src={photo(k)} alt={alt} title={`© ${CREDITS[k].author} · ${CREDITS[k].license}`}
      loading={eager ? 'eager' : 'lazy'} decoding="async" className={`h-full w-full object-cover ${className}`} />
  );
}

export function SectionTitle({ v, sub, eyebrow, light = false, center = true }: { v: L; sub?: L; eyebrow?: L; light?: boolean; center?: boolean }) {
  const { t, lang } = useLang();
  return (
    <div className={`mb-8 md:mb-12 ${center ? 'text-center' : ''}`}>
      {eyebrow && <span lang={lang} className={`eyebrow ${light ? '!bg-white/10 !text-white' : ''}`}>{t(eyebrow)}</span>}
      <h2 className={`mt-3 text-2xl font-extrabold sm:text-4xl ${light ? 'text-white' : 'text-ink'}`}>
        <span lang={lang}>{t(v)}</span>
      </h2>
      {sub && (
        <p lang={lang} className={`mt-4 max-w-2xl text-base ${center ? 'mx-auto' : ''} ${light ? 'text-white/75' : 'text-ink/65'}`}>
          {t(sub)}
        </p>
      )}
    </div>
  );
}

/** The Event Tamizha logo (public/logo.webp, transparent background). */
export function BrandMark({ className = 'h-11 w-11' }: { className?: string }) {
  return <img src="logo.webp" alt="Event Tamizha" width={512} height={512} decoding="async" className={`shrink-0 object-contain ${className}`} />;
}

export function LampIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 48" className={className} aria-hidden>
      <path d="M20 2c3 5 3 8 0 11-3-3-3-6 0-11z" fill="#FACC15" />
      <path d="M20 5c1 2 1 4 0 6-1-2-1-4 0-6z" fill="#FFF7D6" />
      <path d="M8 16c4 3 20 3 24 0-3-2-21-2-24 0z" fill="currentColor" />
      <rect x="18.5" y="17" width="3" height="20" fill="currentColor" />
      <ellipse cx="20" cy="25" rx="3.5" ry="2" fill="currentColor" />
      <path d="M10 46c0-6 6-9 10-9s10 3 10 9z" fill="currentColor" />
    </svg>
  );
}

/** Press-and-hold repeats (slow at first, then faster) so big quantities like 200 chairs need no typing. */
function useHoldRepeat(step: () => void) {
  const fn = useRef(step);
  fn.current = step;
  const timer = useRef<number>(0);
  const stop = () => window.clearTimeout(timer.current);
  useEffect(() => stop, []);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      fn.current();
      let delay = 420;
      const tick = () => { fn.current(); delay = Math.max(60, delay * 0.78); timer.current = window.setTimeout(tick, delay); };
      timer.current = window.setTimeout(tick, delay);
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
    // keyboard (Enter / Space) fires click with detail 0
    onClick: (e: React.MouseEvent) => { if (e.detail === 0) fn.current(); },
  };
}

/** Quantity control: big − / + buttons (hold to repeat), tap the number to type, quick +10 / +50 for bulk items. */
export function QtyControl({ id, label, bulk = false, size = 'md' }: { id: string; label: string; bulk?: boolean; size?: 'md' | 'lg' }) {
  const { lang } = useLang();
  const { state, setQty } = useEstimate();
  const q = state.qty[id] ?? 0;
  const latest = useRef(q);
  latest.current = q;
  const dec = useHoldRepeat(() => setQty(id, latest.current - 1));
  const inc = useHoldRepeat(() => setQty(id, latest.current + 1));
  const btn = `grid shrink-0 touch-manipulation select-none place-items-center rounded-xl text-2xl font-bold leading-none transition active:scale-90 ${size === 'lg' ? 'h-12 w-12' : 'h-11 w-11'}`;
  return (
    <div className="space-y-1.5" role="group" aria-label={label}>
      <div className="flex items-center justify-between gap-1.5">
        <button type="button" {...dec} disabled={q === 0} aria-label={`${label} −`} className={`${btn} bg-slate-100 text-ink hover:bg-slate-200 disabled:opacity-30`}>−</button>
        <input type="text" inputMode="numeric" pattern="[0-9]*" value={q} aria-label={label}
          onFocus={(e) => e.currentTarget.select()}
          onChange={(e) => setQty(id, Number(e.target.value.replace(/\D/g, '')))}
          className={`min-w-0 flex-1 !rounded-xl !px-1 !py-2 text-center text-lg font-extrabold tabular-nums ${q > 0 ? '!border-primary text-primary' : 'text-ink/40'}`} />
        <button type="button" {...inc} aria-label={`${label} +`} className={`${btn} bg-primary text-white hover:bg-primary-dark`}>+</button>
      </div>
      {bulk && (
        <div className="flex gap-1.5">
          {[10, 50].map((n) => (
            <button key={n} type="button" onClick={() => setQty(id, latest.current + n)}
              className="flex-1 touch-manipulation rounded-lg bg-primary/10 py-1.5 text-xs font-bold text-primary transition active:scale-95 hover:bg-primary/20">+{n}</button>
          ))}
          {q > 0 && <button type="button" onClick={() => setQty(id, 0)} lang={lang} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-red-600 active:scale-95">{lang === 'ta' ? 'அழி' : 'Clear'}</button>}
        </div>
      )}
    </div>
  );
}

/** Old name kept so existing pages keep working. */
export function QtyStepper({ id, label }: { id: string; label: string }) {
  return <QtyControl id={id} label={label} size="lg" />;
}

const CAT_TINT: Record<Category, string> = {
  decor: 'from-[#f0f9ff] to-[#dbeafe]',
  lighting: 'from-[#eef2ff] to-[#dbeafe]',
  rentals: 'from-[#f0fdfa] to-[#dbeafe]',
  sound: 'from-[#faf5ff] to-[#dbeafe]',
};

/** Best available photo for a product: admin upload, then online photo, then the site's own photo. */
export const productImageSrc = (item: Item): string | null =>
  item.img || ONLINE[item.id]?.src || (LOCAL[item.id] ? photo(LOCAL[item.id]) : null);

/** Flipkart-style product tile: big icon area that zooms on hover, name, price, ADD button that turns into a stepper. */
export function ProductCard({ item, compact = false, wide = false }: { item: Item; compact?: boolean; wide?: boolean }) {
  const { t, lang } = useLang();
  const { state, setQty } = useEstimate();
  const q = state.qty[item.id] ?? 0;
  const I = ITEM_ICONS[item.icon];
  const [broken, setBroken] = useState(false);
  const src = broken ? null : productImageSrc(item);
  return (
    <article className={`fk-card group relative flex h-full overflow-hidden rounded-2xl bg-white ring-1 transition duration-300 ${wide ? 'flex-row' : 'flex-col'} ${q > 0 ? 'ring-2 ring-primary' : 'ring-ink/[0.08]'}`}>
      {q > 0 && <span className="absolute left-2 top-2 z-10 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-extrabold text-gold-1 shadow">× {q}</span>}
      <div className={`relative grid place-items-center overflow-hidden bg-gradient-to-br ${CAT_TINT[item.category]} ${wide ? 'w-2/5 min-h-36 shrink-0 sm:w-1/3' : compact ? 'h-28' : 'h-32 sm:h-40'}`}>
        {src ? (
          <img src={src} alt={item.name.en} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-110" />
        ) : (
          <>
            <span className="absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-white/40 blur-xl" aria-hidden />
            <I className={`relative text-primary drop-shadow-[0_6px_10px_rgba(29,78,216,.25)] transition duration-500 group-hover:-translate-y-1 group-hover:scale-125 ${compact ? 'h-11 w-11' : 'h-12 w-12 sm:h-16 sm:w-16'}`} strokeWidth={1.5} aria-hidden />
          </>
        )}
      </div>
      <div className={`flex min-w-0 flex-1 flex-col ${wide ? 'justify-center p-4 sm:p-5' : 'p-3 sm:p-3.5'}`}>
        <p lang={lang} className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink transition-colors group-hover:text-primary sm:text-sm">{t(item.name)}</p>
        {item.note && !compact && <p lang={lang} className="mt-1 text-[11px] font-semibold text-peacock">{t(item.note)}</p>}
        <p className="mt-auto pt-2 leading-tight">
          <span className="text-lg font-extrabold text-ink">{inr(item.price)}</span>
          <span lang={lang} className="ml-1 text-[11px] text-ink/50">/ {t(item.unit)}</span>
        </p>
        <div className="mt-2.5">
          {q === 0 ? (
            <button type="button" onClick={() => setQty(item.id, 1)}
              className="w-full touch-manipulation rounded-xl border-2 border-primary/80 py-2.5 text-sm font-extrabold text-primary transition hover:bg-primary hover:text-white active:scale-[.97]">
              <span lang={lang}>{t({ ta: 'சேர்க்க', en: 'Add' })}</span>
            </button>
          ) : (
            <QtyControl id={item.id} label={t(item.name)} bulk={item.category === 'rentals' && item.price <= 100} />
          )}
        </div>
      </div>
    </article>
  );
}

/** Itemised catalogue with quantity selection and running subtotal. */
export function ItemCatalog({ category, withSummary = true }: { category: Category; withSummary?: boolean }) {
  const { t, lang } = useLang();
  const { breakdown } = useEstimate();
  const items = useCatalog().items.filter((i) => i.category === category);
  const lines = breakdown.lines[category];
  return (
    <div className={`grid gap-6 ${withSummary ? 'lg:grid-cols-[1fr_340px]' : ''}`}>
      <div className="@container min-w-0">
      {items.length === 0 && (
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles size={26} /></span>
          <p lang={lang} className="max-w-md text-sm text-ink/65">
            {t({ ta: 'இந்தப் பிரிவில் இன்னும் பொருட்கள் சேர்க்கப்படவில்லை. விரைவில் வரும் — விவரங்களுக்கு எங்களை அழைக்கவும்.', en: 'Nothing has been added here yet. It is coming soon — please call us for details.' })}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <a href={BUSINESS.phoneHref} className="btn-primary !py-2.5"><Phone size={16} /> <span lang={lang}>{t({ ta: 'அழைக்க', en: 'Call us' })}</span></a>
            <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noreferrer" className="btn-whatsapp !py-2.5"><span lang={lang}>WhatsApp</span></a>
          </div>
        </div>
      )}
      {/* One or two items would look lost in a 4-column grid, so they become wide horizontal cards. */}
      <ul className={items.length > 0 && items.length <= 2 ? 'grid grid-cols-1 gap-3 @3xl:grid-cols-2 sm:gap-4' : 'grid grid-cols-2 gap-3 @2xl:grid-cols-3 @4xl:grid-cols-4 sm:gap-4'}>
        {items.map((it) => <li key={it.id}><ProductCard item={it} wide={items.length <= 2} /></li>)}
      </ul>
      </div>
      {withSummary && (
      <aside data-hide-fab className="card h-fit p-6 lg:sticky lg:top-44">
        <h3 className="text-xl font-extrabold text-ink">
          <Bi v={{ ta: 'தேர்ந்தெடுத்தவை', en: 'Your selection' }} altClassName="!text-sm font-sans text-primary" />
        </h3>
        {lines.length === 0 ? (
          <p lang={lang} className="mt-4 rounded-2xl bg-turmeric-wash p-4 text-sm text-ink/70">
            {t({ ta: '+ பொத்தானை அழுத்தி எண்ணிக்கையைத் தேர்ந்தெடுங்கள் — மதிப்பீடு இங்கே தோன்றும்.', en: 'Tap + to choose quantities — your estimate appears here.' })}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10 text-sm">
            {lines.map((l) => (
              <li key={l.item.id} className="flex justify-between gap-3 py-2">
                <span lang={lang}>{t(l.item.name)} × {l.qty}</span>
                <span className="font-semibold tabular-nums">{inr(l.total)}</span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-baseline justify-between rounded-2xl bg-primary/5 px-4 py-3 font-bold text-primary">
          <span lang={lang}>{t({ ta: 'உபமொத்தம்', en: 'Subtotal' })}</span>
          <span className="text-2xl tabular-nums">{inr(breakdown.subtotals[category])}</span>
        </div>
        <Link to="/cart" className="btn-primary mt-4 w-full">
          <span lang={lang}>{t({ ta: 'கூடையைப் பார்க்க', en: 'View cart' })}</span> →
        </Link>
      </aside>
      )}
    </div>
  );
}

export function DemoBadge({ className = '' }: { className?: string }) {
  const { t, lang } = useLang();
  return (
    <p lang={lang} className={`rounded-2xl border border-marigold/40 bg-turmeric-wash px-4 py-3 text-xs text-ink/70 ${className}`}>
      ⓘ {t(DEMO_NOTE)}
    </p>
  );
}

/** Inner-page header: plain white with a thin divider. `k` is kept so existing pages still type-check. */
export function PageHero({ title, sub, children }: { title: L; sub?: L; k?: PhotoKey; children?: ReactNode }) {
  const { t, lang } = useLang();
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        <h1 className="text-2xl font-extrabold text-ink sm:text-4xl"><span lang={lang}>{t(title)}</span></h1>
        {sub && <p lang={lang} className="mt-2 max-w-2xl text-sm text-ink/65 sm:mt-3 sm:text-base">{t(sub)}</p>}
        {children}
      </div>
    </section>
  );
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="text-marigold" aria-label={`${n} / 5`}>
      {'★★★★★'.slice(0, n)}<span className="text-ink/15">{'★★★★★'.slice(n)}</span>
    </span>
  );
}
