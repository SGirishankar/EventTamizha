import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLang, type L } from '../i18n/lang';
import { type Category } from '../data/config';
import { useCatalog } from '../state/catalog';
import { useVisibleCategories } from './app';
import { Photo, ProductCard } from './ui';

const SERVICE_CATEGORY: Record<string, Category[]> = { '/pandals': ['decor'], '/lighting': ['lighting'], '/rentals': ['rentals'], '/sound': ['sound'] };

/** The three services as large cards: photo, name, item count, hover lift + zoom. */
export function CategoryStrip() {
  const { t, lang } = useLang();
  const { items } = useCatalog();
  const cats = useVisibleCategories();
  return (
    <ul className={`grid grid-cols-1 gap-4 ${cats.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}`}>
      {cats.map((c) => {
        const n = items.filter((i) => SERVICE_CATEGORY[c.to]?.includes(i.category)).length;
        return (
          <li key={c.to}>
            <Link to={c.to} className="fk-card group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition duration-300">
              <span className="relative block aspect-[16/9] overflow-hidden">
                <Photo k={c.photo} alt="" className="transition duration-700 group-hover:scale-110" />
                <span className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-primary shadow-card"><c.icon size={20} /></span>
              </span>
              <span className="flex flex-1 items-center justify-between gap-3 p-4">
                <span className="min-w-0">
                  <span lang={lang} className="block text-lg font-extrabold text-ink transition group-hover:text-primary">{t(c.title)}</span>
                  <span lang={lang} className="block text-xs text-ink/45">{n} {lang === 'ta' ? 'பொருட்கள்' : 'items'}</span>
                  <span lang={lang} className="mt-1 block truncate text-sm text-ink/60">{t(c.sub)}</span>
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:translate-x-1 group-hover:bg-primary group-hover:text-white"><ChevronRight size={20} /></span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Flipkart-style deal row: promo block on the left, scrollable product cards on the right. */
export function DealRow({ title, sub, to, category, tone = 'from-primary-light via-primary to-primary-dark' }: { title: L; sub: L; to: string; category: Category; tone?: string }) {
  const { t, lang } = useLang();
  const row = useRef<HTMLUListElement>(null);
  const items = useCatalog().items.filter((i) => i.category === category);
  const slide = (dir: number) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: 'smooth' });
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-gold-2/15 md:flex">
      <div className={`noise relative flex shrink-0 items-center justify-between gap-3 bg-gradient-to-br p-4 text-white md:w-56 md:flex-col md:items-start md:justify-center md:p-6 ${tone}`}>
        <div>
          <h3 className="text-lg font-extrabold leading-tight md:text-2xl"><span lang={lang}>{t(title)}</span></h3>
          <p lang={lang} className="mt-1 hidden text-xs text-white/75 md:block">{t(sub)}</p>
        </div>
        <Link to={to} className="shrink-0 rounded-lg bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-primary shadow transition hover:-translate-y-0.5 hover:brightness-105 md:mt-5">
          <span lang={lang}>{t({ ta: 'அனைத்தும்', en: 'View all' })}</span>
        </Link>
      </div>
      <div className="group/row relative min-w-0 flex-1">
        <ul ref={row} className="flex snap-x gap-3 overflow-x-auto scroll-smooth p-3 sm:p-4 [scrollbar-width:none]">
          {items.map((it) => (
            <li key={it.id} className="w-40 shrink-0 snap-start sm:w-44"><ProductCard item={it} compact /></li>
          ))}
        </ul>
        <button type="button" onClick={() => slide(-1)} aria-label="Previous" className="absolute left-1 top-1/2 hidden h-16 w-9 -translate-y-1/2 place-items-center rounded-r-lg bg-white/95 text-ink opacity-0 shadow-card ring-1 ring-ink/10 transition group-hover/row:opacity-100 hover:text-primary md:grid"><ChevronLeft size={20} /></button>
        <button type="button" onClick={() => slide(1)} aria-label="Next" className="absolute right-1 top-1/2 hidden h-16 w-9 -translate-y-1/2 place-items-center rounded-l-lg bg-white/95 text-ink opacity-0 shadow-card ring-1 ring-ink/10 transition group-hover/row:opacity-100 hover:text-primary md:grid"><ChevronRight size={20} /></button>
      </div>
    </section>
  );
}


/** The three shopping rows used on the home page. */
export function ShopRows() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <DealRow title={{ ta: 'மின்விளக்கு அலங்காரம்', en: 'Lighting Decoration' }} sub={{ ta: 'சீரியல், LED, நுழைவு விளக்கு', en: 'Serial, LED and entrance lights' }} to="/lighting" category="lighting" />
      <DealRow title={{ ta: 'பந்தல் அலங்காரம்', en: 'Pandal Decoration' }} sub={{ ta: 'வாழை மரம், கோலம், நுழைவு வளைவு', en: 'Banana trees, kolam, entrance arch' }} to="/pandals" category="decor"
        tone="from-[#0369a1] via-[#0284c7] to-[#075985]" />
      <DealRow title={{ ta: 'வாடகைப் பொருட்கள்', en: 'Rentals' }} sub={{ ta: 'நாற்காலி, ஒலி, ஜெனரேட்டர்', en: 'Chairs, sound and generator' }} to="/rentals" category="rentals"
        tone="from-[#312e81] via-[#3730a3] to-[#1e1b4b]" />
    </div>
  );
}
