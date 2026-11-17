import { ChevronRight, Search } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useLang } from '../i18n/lang';
import { useVisibleCategories } from '../components/app';
import { Photo } from '../components/ui';
import { ShopRows } from '../components/shop';
import { OffersAndCombos } from '../components/promos';

/** Category list in the app style: thumbnail, title, short description, chevron. */
export default function ExplorePage() {
  const { t, lang } = useLang();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim().toLowerCase();
  const categories = useVisibleCategories();
  const rows = categories.filter((c) => !q || [c.title.ta, c.title.en, c.sub.ta, c.sub.en].some((x) => x.toLowerCase().includes(q)));

  return (
    <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:py-12">
      <h1 className="hidden text-3xl font-extrabold md:block"><span lang={lang}>{t({ ta: 'பிரிவுகள்', en: 'Categories' })}</span></h1>
      <label className="relative mt-2 block md:mt-5">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
        <input className="w-full !rounded-2xl !py-3.5 !pl-11" value={params.get('q') ?? ''} onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder={t({ ta: 'சேவைகளைத் தேடுக…', en: 'Search services, packages…' })} />
      </label>
      <ul className="mt-4 space-y-3">
        {rows.map((c) => (
          <li key={c.to}>
            <Link to={c.to} className="fk-card group flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-gold-2/15 transition duration-300 active:scale-[.99]">
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"><Photo k={c.photo} alt="" className="transition duration-500 group-hover:scale-110" /></span>
              <span className="min-w-0 flex-1">
                <span lang={lang} className="block truncate font-bold text-ink">{t(c.title)}</span>
                <span lang={lang} className="mt-0.5 block truncate text-xs text-ink/55">{t(c.sub)}</span>
              </span>
              <ChevronRight size={20} className="shrink-0 text-ink/35" />
            </Link>
          </li>
        ))}
        {rows.length === 0 && <li lang={lang} className="card p-8 text-center text-ink/55">{t({ ta: 'எதுவும் கிடைக்கவில்லை.', en: 'Nothing found.' })}</li>}
      </ul>
      <div className="mt-8 space-y-6">
        <OffersAndCombos />
        <ShopRows />
      </div>
    </section>
  );
}
