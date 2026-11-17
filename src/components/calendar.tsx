import { CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../i18n/lang';
import { DEMO_BUSY_DAYS, MUHURTHAM, muhurthamOn } from '../data/config';

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

type Props = {
  value?: string;
  onPick?: (d: string) => void;
  /** Number of bookings per ISO date (admin view). */
  counts?: Record<string, number>;
  /** Show the demo "limited" days (customer booking view). */
  demoBusy?: boolean;
  allowPast?: boolean;
};

/**
 * Month calendar with Tamil subha muhurtham days:
 * valarpirai = solid blue with ★, theipirai = soft blue with ☆, picked date = navy, today = dot underneath.
 * Below the grid the month's muhurtham days are listed as large tap targets (easy on phones).
 */
export function MuhurthamCalendar({ value = '', onPick, counts, demoBusy = false, allowPast = false }: Props) {
  const { t, lang } = useLang();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = iso(today);
  const [month, setMonth] = useState(() => {
    const d = value ? new Date(value) : today;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = first.getDay();
  const canPrev = allowPast || first > today;
  const locale = lang === 'ta' ? 'ta-IN' : 'en-IN';
  const week = Array.from({ length: 7 }, (_, i) => new Date(2026, 1, i + 1).toLocaleDateString(locale, { weekday: 'narrow' }));
  const prefix = iso(first).slice(0, 7);
  const monthMuhurtham = MUHURTHAM.filter((m) => m.date.startsWith(prefix) && (allowPast || m.date >= todayIso));
  const go = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const navBtn = 'grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-ink transition hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-ink';

  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      {/* header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2.5 sm:px-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays size={18} /></span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-base font-extrabold text-ink">{first.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</p>
          <p lang={lang} className="text-[11px] font-semibold text-primary">★ {monthMuhurtham.length} {t({ ta: 'முகூர்த்த நாட்கள்', en: 'muhurtham days' })}</p>
        </div>
        <button type="button" disabled={!canPrev} onClick={() => go(-1)} className={navBtn} aria-label="Previous month"><ChevronLeft size={18} /></button>
        <button type="button" onClick={() => go(1)} className={navBtn} aria-label="Next month"><ChevronRight size={18} /></button>
      </div>

      <div className="px-2 pb-3 pt-2 sm:px-4">
        {/* grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {week.map((w, i) => <span key={i} className={`pb-1.5 text-[11px] font-bold ${i === 0 ? 'text-red-500/80' : 'text-ink/40'}`}>{w}</span>)}
          {Array.from({ length: offset }, (_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: days }, (_, i) => {
            const d = new Date(month.getFullYear(), month.getMonth(), i + 1);
            const key = iso(d);
            const past = !allowPast && d < today;
            const m = muhurthamOn(key);
            const busy = demoBusy && DEMO_BUSY_DAYS.includes(i + 1);
            const sel = key === value;
            const n = counts?.[key] ?? 0;
            const tone = sel
              ? 'bg-night text-white shadow-deep'
              : past
                ? 'text-ink/20'
                : m?.pirai === 'V'
                  ? 'bg-primary text-white shadow-glow hover:brightness-110'
                  : m
                    ? 'bg-primary/10 font-bold text-primary hover:bg-primary/20'
                    : 'text-ink/75 hover:bg-slate-100';
            const title = m ? `${m.tamil} · ${m.pirai === 'V' ? 'வளர்பிறை முகூர்த்தம்' : 'தேய்பிறை முகூர்த்தம்'}` : undefined;
            return (
              <div key={key} className="flex min-w-0 justify-center">
                <button type="button" disabled={past || !onPick} onClick={() => onPick?.(key)} title={title} aria-pressed={sel}
                  className={`relative grid aspect-square w-full max-w-11 place-items-center rounded-full text-sm font-semibold transition disabled:cursor-default ${tone}`}>
                  {i + 1}
                  {m && !past && <span className={`absolute -right-0.5 -top-0.5 text-[10px] leading-none ${sel ? 'text-sky-300' : m.pirai === 'V' ? 'text-amber-400' : 'text-primary'}`}>{m.pirai === 'V' ? '★' : '☆'}</span>}
                  {key === todayIso && !sel && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-red-500" />}
                  {busy && !past && !sel && !m && <span className="absolute bottom-0.5 left-1/2 h-1 w-3 -translate-x-1/2 rounded-full bg-amber-400" />}
                  {n > 0 && <span className="absolute -bottom-1 -right-1 grid h-4 min-w-4 place-items-center rounded-full bg-peacock px-1 text-[9px] font-bold text-white ring-2 ring-white">{n}</span>}
                </button>
              </div>
            );
          })}
        </div>

        {/* legend — one scrollable line */}
        <div className="mt-2 flex gap-3 overflow-x-auto whitespace-nowrap border-t border-slate-100 px-1 pt-2.5 text-[11px] text-ink/60 [scrollbar-width:none]">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary" /> <span lang={lang}>{t({ ta: 'வளர்பிறை', en: 'Valarpirai' })}</span></span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary/15" /> <span lang={lang}>{t({ ta: 'தேய்பிறை', en: 'Theipirai' })}</span></span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500" /> <span lang={lang}>{t({ ta: 'இன்று', en: 'Today' })}</span></span>
          {demoBusy && <span className="flex items-center gap-1.5"><span className="h-1 w-3 rounded-full bg-amber-400" /> <span lang={lang}>{t({ ta: 'குறைந்த இடம்', en: 'Limited' })}</span></span>}
          {counts && <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-peacock" /> <span lang={lang}>{t({ ta: 'முன்பதிவுகள்', en: 'Bookings' })}</span></span>}
        </div>

        {/* this month's muhurtham days: one swipe row instead of a long list */}
        {onPick && monthMuhurtham.length > 0 && (
          <div className="-mx-2 mt-3 sm:mx-0">
            <p lang={lang} className="mb-1.5 px-2 text-xs font-bold text-ink/60 sm:px-0">{t({ ta: 'முகூர்த்த நாட்கள் — தேர்ந்தெடுக்க தொடவும்', en: 'Muhurtham days — tap to pick' })}</p>
            <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-2 pb-1 sm:px-0">
              {monthMuhurtham.map((m) => {
                const d = new Date(`${m.date}T00:00:00`);
                const on = m.date === value;
                return (
                  <li key={m.date} className="shrink-0 snap-start">
                    <button type="button" onClick={() => onPick(m.date)} aria-pressed={on}
                      className={`flex min-w-[5.25rem] flex-col items-center rounded-xl px-3 py-2 text-center leading-tight transition ${on ? 'bg-night text-white' : m.pirai === 'V' ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-slate-50 text-ink/75 ring-1 ring-slate-200'}`}>
                      <span className="text-lg font-extrabold">{d.getDate()}</span>
                      <span lang={lang} className="text-[11px] font-semibold">{d.toLocaleDateString(locale, { month: 'short' })} · {d.toLocaleDateString(locale, { weekday: 'short' })}</span>
                      <span className="text-[10px]">{m.pirai === 'V' ? '★' : '☆'} {on ? <Check size={10} className="inline" /> : null}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p lang={lang} className="mt-2.5 px-1 text-[10px] text-ink/40">{t({ ta: 'முகூர்த்த நாட்களை உங்கள் குடும்ப ஜோதிடரிடம் உறுதி செய்யவும்.', en: 'Please confirm muhurtham with your family priest.' })}</p>
      </div>
    </div>
  );
}
