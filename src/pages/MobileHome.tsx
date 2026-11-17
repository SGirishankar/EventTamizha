import { Phone, Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/lang';
import { BUSINESS } from '../data/config';
import { useVisibleCategories } from '../components/app';
import { WhatsAppIcon } from '../components/Layout';
import { InstallButton } from '../components/InstallApp';
import { ShopRows } from '../components/shop';
import { OffersAndCombos } from '../components/promos';
import { useAuth } from '../state/auth';
import { whatsappLink } from '../state/whatsapp';
import { useCompany } from '../state/company';

/** Home screen for phones, laid out like the Namma Vizha app mock-up. */
export default function MobileHome() {
  useCompany();
  const categories = useVisibleCategories();
  const { t, lang } = useLang();
  const { user } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const go = (e: FormEvent) => { e.preventDefault(); nav(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : '/explore'); };

  return (
    <div className="px-4 pb-6 pt-4">
      <div lang={lang}>
        <h1 className="text-2xl font-extrabold text-ink">{user ? t({ ta: `வணக்கம், ${user.name}!`, en: `Hello, ${user.name}!` }) : t({ ta: 'வணக்கம்!', en: 'Hello!' })}</h1>
        <p className="mt-0.5 text-sm text-ink/60">{t({ ta: 'ஈவென்ட் தமிழாவுக்கு வரவேற்கிறோம்', en: 'Welcome to Event Tamizha' })}</p>
      </div>

      <form onSubmit={go} className="relative mt-4">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/40" />
        <input className="w-full !rounded-xl !py-3 !pl-11" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t({ ta: 'பந்தல், விளக்கு, நாற்காலி தேடுக…', en: 'Search pandal, lights, chairs…' })} aria-label="Search" />
      </form>

      <Link to="/explore" className="relative mt-5 block overflow-hidden rounded-xl bg-blue-50 text-ink ring-1 ring-blue-100">
        <div className="relative max-w-[78%] px-5 py-6">
          <p lang={lang} className="text-xl font-extrabold leading-snug">{t({ ta: 'உங்கள் விழாவை சிறப்பாக்குங்கள்', en: 'Make Your Function Special' })}</p>
          <p lang={lang} className="mt-1.5 text-xs leading-relaxed text-ink/60">{t({ ta: 'பந்தல், மின்விளக்கு, வாடகைப் பொருட்கள் — ஒரே இடத்தில்.', en: 'Pandal, lighting & rentals — all in one place.' })}</p>
          <span lang={lang} className="btn-primary mt-4 !px-5 !py-2 text-xs">{t({ ta: 'பார்க்க', en: 'Explore Now' })}</span>
        </div>
      </Link>

      <div className="mt-4"><InstallButton variant="banner" /></div>

      <div className="mb-3 mt-7 flex items-end justify-between">
        <h2 lang={lang} className="text-lg font-extrabold !font-sans">{t({ ta: 'பிரபல பிரிவுகள்', en: 'Popular Categories' })}</h2>
        <Link to="/explore" lang={lang} className="text-sm font-semibold text-primary">{t({ ta: 'அனைத்தும்', en: 'See All' })}</Link>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {categories.slice(0, 6).map((c) => (
          <Link key={c.to} to={c.to} className="flex flex-col items-center gap-2 rounded-xl bg-white px-1.5 py-3.5 text-center ring-1 ring-slate-200 transition active:scale-95">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-turmeric-wash text-primary"><c.icon size={26} strokeWidth={1.8} /></span>
            <span lang={lang} className="line-clamp-2 min-h-[2.1rem] text-[11px] font-semibold leading-tight text-ink/80">{t(c.title)}</span>
          </Link>
        ))}
      </div>

      <div className="mt-7"><OffersAndCombos /></div>
      <div className="mt-7"><ShopRows /></div>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <a href={BUSINESS.phoneHref} className="btn-ghost !py-3.5"><Phone size={16} /> <span lang={lang}>{t({ ta: 'அழைக்க', en: 'Call us' })}</span></a>
        <a href={whatsappLink(lang)} target="_blank" rel="noreferrer" className="btn-whatsapp !py-3.5"><WhatsAppIcon className="h-4 w-4" /> WhatsApp</a>
      </div>
    </div>
  );
}
