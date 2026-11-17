import { Camera, ChevronLeft, ChevronRight, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLang } from '../i18n/lang';
import { callApi } from '../state/api';

export type PublicReview = { name: string; rating: number; review: string; photos: string[]; date: string; town: string; services: string[] };

let cache: { at: number; list: PublicReview[] } | null = null;
let inflight: Promise<PublicReview[]> | null = null;

/** Loads customer reviews once and shares them between pages (refreshed every 5 minutes). */
function loadReviews(): Promise<PublicReview[]> {
  if (cache && Date.now() - cache.at < 300000) return Promise.resolve(cache.list);
  if (inflight) return inflight;
  inflight = callApi<{ reviews: PublicReview[] }>({ action: 'reviews' }).then((r) => {
    const list = r.ok && Array.isArray(r.reviews) ? r.reviews : [];
    if (r.ok) cache = { at: Date.now(), list };
    inflight = null;
    return list;
  });
  return inflight;
}

export function Stars5({ n, size = 16 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${n} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={size} className={i <= Math.round(n) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />)}
    </span>
  );
}

function Lightbox({ photos, start, onClose }: { photos: string[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % photos.length);
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + photos.length) % photos.length);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', key);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', key); };
  }, [photos.length, onClose]);
  return (
    <div className="fixed inset-0 z-[999] grid place-items-center bg-black/90 p-3" role="dialog" aria-modal="true" onClick={onClose}>
      <img src={photos[i]} alt="" referrerPolicy="no-referrer" onClick={(e) => e.stopPropagation()} className="max-h-[85svh] max-w-full rounded-xl object-contain" />
      <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white"><X size={22} /></button>
      {photos.length > 1 && (
        <>
          <button type="button" onClick={(e) => { e.stopPropagation(); setI((i - 1 + photos.length) % photos.length); }} aria-label="Previous" className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"><ChevronLeft size={24} /></button>
          <button type="button" onClick={(e) => { e.stopPropagation(); setI((i + 1) % photos.length); }} aria-label="Next" className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white"><ChevronRight size={24} /></button>
        </>
      )}
    </div>
  );
}

/** Customer reviews (stars, comment, photos) shown under a service page. Renders nothing until there is a review. */
export function ServiceReviews({ service }: { service: 'pandal' | 'lighting' | 'rentals' }) {
  const { t, lang } = useLang();
  const [all, setAll] = useState<PublicReview[] | null>(null);
  const [box, setBox] = useState<{ photos: string[]; i: number } | null>(null);
  useEffect(() => {
    let live = true;
    const go = window.setTimeout(() => { void loadReviews().then((l) => live && setAll(l)); }, 1500);
    return () => { live = false; window.clearTimeout(go); };
  }, []);
  const list = (all ?? []).filter((r) => r.services.includes(service));
  if (list.length === 0) return null;
  const avg = list.reduce((a, r) => a + r.rating, 0) / list.length;
  return (
    <section className="mt-10 min-w-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 lang={lang} className="text-xl font-extrabold">{t({ ta: 'வாடிக்கையாளர் மதிப்பீடுகள்', en: 'Customer reviews' })}</h2>
        <p className="flex items-center gap-2 text-sm font-bold text-ink/70">
          <Stars5 n={avg} /> {avg.toFixed(1)} <span className="font-normal text-ink/45">({list.length})</span>
        </p>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {list.map((r, k) => (
          <li key={k} className="w-[17.5rem] shrink-0 snap-start rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-2">
              <Stars5 n={r.rating} size={15} />
              <span className="truncate text-[11px] text-ink/45">{r.date}</span>
            </div>
            {r.review && <p className="mt-2 line-clamp-4 text-sm text-ink/80">{r.review}</p>}
            {r.photos.length > 0 && (
              <div className="mt-3 flex gap-2">
                {r.photos.map((u, i) => (
                  <button key={u} type="button" onClick={() => setBox({ photos: r.photos, i })} aria-label={`Photo ${i + 1}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-1 ring-slate-200">
                    <img src={u} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-ink/55">
              <Camera size={12} className={r.photos.length ? 'text-primary' : 'opacity-0'} /> {r.name}{r.town ? ` · ${r.town}` : ''}
            </p>
          </li>
        ))}
      </ul>
      {box && <Lightbox photos={box.photos} start={box.i} onClose={() => setBox(null)} />}
    </section>
  );
}
