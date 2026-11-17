import { ShoppingCart, Trash2, MapPin, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { inr, useLang } from '../i18n/lang';
import { CATEGORY_LABEL, ITEM_CATEGORIES, type Category } from '../data/config';
import { Stepper, Thumb } from '../components/cartlines';
import { EstimateSummary } from '../components/summary';
import { Photo } from '../components/ui';
import { useAuth } from '../state/auth';
import { useEstimate } from '../state/estimate';

const CATS: Category[] = ITEM_CATEGORIES;
const CAT_PAGE: Record<Category, string> = { decor: '/pandals', lighting: '/lighting', rentals: '/rentals', sound: '/sound' };

/** The cart: everything chosen so far (pandal + items) with photos, quantities, remove buttons, location and the total. */
export default function CartPage() {
  const { t, lang } = useLang();
  const { user } = useAuth();
  const { state, breakdown: b, update, setQty, reset } = useEstimate();
  const count = (state.pandalId ? 1 : 0) + CATS.reduce((n, c) => n + b.lines[c].length, 0);
  const pandal = b.pandal && b.areaSqft > 0 ? b.pandal : null;
  const hasPlace = Boolean(user && (user.address || user.mapLink || (user.lat != null && user.lng != null)));

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 sm:pt-10 md:pb-12">
      <h1 className="flex items-center gap-3 text-3xl font-extrabold text-ink">
        <ShoppingCart className="text-primary" size={28} />
        <span lang={lang}>{t({ ta: 'என் கூடை', en: 'My cart' })}</span>
        {count > 0 && <span className="rounded-full bg-primary px-2.5 py-0.5 text-sm text-white">{count}</span>}
      </h1>

      {count === 0 ? (
        <div className="card mt-6 p-8 text-center">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary"><ShoppingCart size={34} /></span>
          <p lang={lang} className="mt-4 text-lg font-bold">{t({ ta: 'உங்கள் கூடை காலியாக உள்ளது', en: 'Your cart is empty' })}</p>
          <p lang={lang} className="mt-1 text-sm text-ink/60">{t({ ta: 'பந்தல், விளக்கு, வாடகைப் பொருட்களைச் சேர்த்துப் பாருங்கள்.', en: 'Add a pandal, lights or rental items to get started.' })}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {CATS.map((c) => <Link key={c} to={CAT_PAGE[c]} className="btn-ghost !py-2.5"><span lang={lang}>{t(CATEGORY_LABEL[c])}</span></Link>)}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-6">
            {pandal && (
              <section>
                <h2 lang={lang} className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">{t({ ta: 'பந்தல்', en: 'Pandal' })}</h2>
                <article className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
                  <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200 sm:h-24 sm:w-24"><Photo k={pandal.photo} alt={pandal.name.en} /></span>
                  <div className="min-w-0 flex-1">
                    <p lang={lang} className="line-clamp-2 font-bold">{t(pandal.name)}</p>
                    <p className="mt-1 text-xs text-ink/60">{state.length} × {state.breadth} {state.unit === 'ft' ? t({ ta: 'அடி', en: 'ft' }) : t({ ta: 'மீ', en: 'm' })} · {Math.round(b.areaSqft).toLocaleString('en-IN')} {t({ ta: 'ச.அடி', en: 'sq ft' })}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <Link to="/estimate" className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Pencil size={13} /> <span lang={lang}>{t({ ta: 'அளவு மாற்று', en: 'Change size' })}</span></Link>
                      <button type="button" onClick={() => update({ pandalId: null })} className="inline-flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 size={13} /> <span lang={lang}>{t({ ta: 'நீக்கு', en: 'Remove' })}</span></button>
                    </div>
                  </div>
                  <p className="shrink-0 text-base font-extrabold tabular-nums text-ink sm:text-lg">{inr(b.pandalCost)}</p>
                </article>
              </section>
            )}

            {CATS.filter((c) => b.lines[c].length > 0).map((c) => (
              <section key={c}>
                <h2 lang={lang} className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">{t(CATEGORY_LABEL[c])}</h2>
                <ul className="space-y-3">
                  {b.lines[c].map((l) => (
                    <li key={l.item.id} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
                      <Thumb item={l.item} />
                      <div className="min-w-0 flex-1">
                        <p lang={lang} className="line-clamp-2 font-bold">{t(l.item.name)}</p>
                        <p className="mt-0.5 text-xs text-ink/60">{inr(l.item.price)} / {t(l.item.unit)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <Stepper value={l.qty} label={t(l.item.name)} onChange={(n) => setQty(l.item.id, n)} />
                          <button type="button" onClick={() => setQty(l.item.id, 0)} aria-label={`${t({ ta: 'நீக்கு', en: 'Remove' })} ${l.item.name.en}`} className="inline-flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 size={14} /> <span lang={lang}>{t({ ta: 'நீக்கு', en: 'Remove' })}</span></button>
                        </div>
                      </div>
                      <p className="shrink-0 text-base font-extrabold tabular-nums text-ink sm:text-lg">{inr(l.total)}</p>
                    </li>
                  ))}
                </ul>
                <Link to={CAT_PAGE[c]} className="mt-2 inline-block text-sm font-bold text-primary underline"><span lang={lang}>{t({ ta: '+ மேலும் சேர்க்க', en: '+ Add more' })}</span></Link>
              </section>
            ))}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:h-fit">
            <div className="card p-4 sm:p-5">
              <p lang={lang} className="flex items-center gap-2 text-sm font-bold"><MapPin size={16} className="text-primary" /> {t({ ta: 'விழா இடம்', en: 'Function location' })}</p>
              {hasPlace ? (
                <p className="mt-1 text-sm text-ink/70">{user?.address || t({ ta: 'வரைபட இருப்பிடம் சேமிக்கப்பட்டது', en: 'Map location saved' })}</p>
              ) : (
                <p lang={lang} className="mt-1 text-xs text-ink/55">{user ? t({ ta: 'சுயவிவரத்தில் இருப்பிடத்தைச் சேமிக்கலாம்.', en: 'You can save a location in your profile.' }) : t({ ta: 'முன்பதிவில் இடத்தைத் தேர்ந்தெடுக்கலாம்.', en: 'You choose the place when you book.' })}</p>
              )}
              <p lang={lang} className="mt-1 text-xs text-ink/45">{t({ ta: 'முன்பதிவின்போது சேமித்த இடத்தை அல்லது புதிய இடத்தைத் தேர்ந்தெடுக்கலாம்.', en: 'At booking you can use this place or pick a new one.' })}</p>
              <Link to="/account" state={user ? undefined : { next: '/cart' }} className="mt-2 inline-block text-xs font-bold text-primary underline">
                <span lang={lang}>{user ? t({ ta: 'சுயவிவரத்தைத் திருத்த', en: 'Edit profile' }) : t({ ta: 'உள்நுழையவும் / பதிவு செய்யவும்', en: 'Log in / sign up' })}</span>
              </Link>
            </div>
            <div className="card p-4 sm:p-5">
              <h2 lang={lang} className="mb-3 text-xl font-extrabold">{t({ ta: 'மதிப்பீட்டுச் சுருக்கம்', en: 'Order summary' })}</h2>
              <EstimateSummary compact />
              <div className="mt-4 grid gap-2">
                <Link to="/booking" className="btn-primary !py-3"><span lang={lang}>{t({ ta: 'முன்பதிவு செய்யுங்கள்', en: 'Book now' })}</span> →</Link>
                <Link to="/estimate" className="btn-ghost !py-2.5"><span lang={lang}>{t({ ta: 'தூரம் / அளவு மாற்ற', en: 'Edit distance & size' })}</span></Link>
                <button type="button" onClick={reset} className="mt-1 text-sm text-ink/45 underline hover:text-red-600"><span lang={lang}>{t({ ta: 'கூடையை காலி செய்', en: 'Empty the cart' })}</span></button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
