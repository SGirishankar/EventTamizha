import { Hand, Maximize2, Moon, Pause, Play, RotateCw, Sun, X } from 'lucide-react';
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { Bi, inr, useLang } from '../i18n/lang';
import { CHARGES, PANDALS } from '../data/config';
import { computeEstimate, useEstimate } from '../state/estimate';
import { Photo } from './ui';
import { ErrorBoundary } from './ErrorBoundary';
import { useCatalog } from '../state/catalog';

const Pandal3D = lazy(() => import('./Pandal3D'));

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Fades/slides children in when they scroll into view. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }: { children: ReactNode; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion()) return setShown(true);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } }, { rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-[900ms] ease-[cubic-bezier(.2,.7,.2,1)] ${shown ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-10 opacity-0 blur-[2px]'} ${className}`}>
      {children}
    </Tag>
  );
}

/** Flat 2D hover: lifts the card slightly (the 3D pandal studio is the only 3D element on the site). */
export function Tilt({ children, className = '' }: { children: ReactNode; className?: string; max?: number }) {
  return <div className={`transition-transform duration-300 ease-out hover:-translate-y-1.5 ${className}`}>{children}</div>;
}

/** Counts up to a number when visible. */
export function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduceMotion()) return setN(to);
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / 1400);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref} className="tabular-nums">{n}{suffix}</span>;
}

/** Floating golden sparkles for dark sections. */
export function Sparkles(_props: { count?: number }) {
  return null;
}

/** Parallax offset (px) based on scroll position. */
export function useParallax(_speed = 0.25) {
  return 0;
}

/* ---------------- 3D Pandal Studio ---------------- */

/** `seen` turns true once (to start loading 3D); `visible` follows the element on/off screen (to pause rendering). */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      if (e.isIntersecting) setSeen(true);
    }, { rootMargin: '200px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen, visible] as const;
}

function useMedia(query: string) {
  const [match, setMatch] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(query).matches);
  useEffect(() => {
    const mq = matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

let glOk: boolean | undefined;
function webglSupported() {
  if (glOk === undefined) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      glOk = Boolean(gl);
      (gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      glOk = false;
    }
  }
  return glOk;
}

export function PandalStudio() {
  useCatalog(); // re-render when the admin changes pandal rates
  const { t, lang } = useLang();
  const { state, update, setQty, breakdown } = useEstimate();
  const [night, setNight] = useState(true);
  const [spin, setSpin] = useState(true);
  const [box, seen, visible] = useInView<HTMLDivElement>();
  const touch = useMedia('(pointer: coarse)');
  const narrow = useMedia('(max-width: 767px)');
  const lite = touch || narrow; // phones & tablets get the lighter scene
  const [full, setFull] = useState(false);
  const [glKey, setGlKey] = useState(0); // bump to rebuild the canvas after a lost WebGL context
  const [lost, setLost] = useState(false);
  // On touch screens the inline 3D view lets the page scroll over it; "Explore" opens a full-screen view that owns the gestures.
  const type = state.pandalId ?? 'samiyana';
  const pandal = PANDALS.find((x) => x.id === type)!;

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFull(false); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [full]);
  const lenFt = breakdown.lengthFt || 40;
  const brFt = breakdown.breadthFt || 30;
  const guests = state.qty.plastic ?? Math.floor((lenFt * brFt) / 12);
  // Price for exactly what is shown, even before the visitor has picked a type.
  const shownTotal = state.pandalId ? breakdown.total : computeEstimate({ ...state, pandalId: type, qty: { ...state.qty, plastic: guests } }).total;

  const fallback = (msg: ReactNode, retry?: boolean) => (
    <div className="relative h-full w-full">
      <Photo k={pandal.photo} alt="" />
      <div className="absolute inset-0 grid place-items-center bg-night/70 p-6 text-center text-white">
        <div>
          <p className="text-sm">{msg}</p>
          {retry && (
            <button type="button" onClick={() => { setLost(false); setGlKey((k) => k + 1); }} className="chip glass mt-3 !py-2 text-white">
              <RotateCw size={14} /> <span lang={lang}>{t({ ta: 'மீண்டும் ஏற்று', en: 'Reload 3D' })}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  /** The 3D view + its overlays. Used inline and in the full-screen portal (never both at once, so only one WebGL context exists). */
  const stage = (isFull: boolean) => {
    const canMove = !touch || isFull;
    return (
      <>
        {!webglSupported() ? fallback(<Bi v={{ ta: 'இந்தச் சாதனத்தில் 3D ஆதரவு இல்லை.', en: '3D is not supported on this device.' }} />)
          : lost ? fallback(<Bi v={{ ta: 'நினைவகம் குறைவு — 3D நிறுத்தப்பட்டது.', en: '3D paused — the device ran low on memory.' }} />, true)
          : (seen || isFull) ? (
            <ErrorBoundary resetKey={String(glKey)} fallback={fallback(<Bi v={{ ta: '3D காட்சியை ஏற்ற முடியவில்லை.', en: 'Could not load the 3D view.' }} />, true)}>
              <Suspense fallback={<StudioLoading />}>
                <Pandal3D key={glKey} type={type} lengthFt={lenFt} breadthFt={brFt} guests={guests} night={night} autoRotate={spin}
                  lite={lite} interactive={canMove} paused={!isFull && !visible} onContextLost={() => setLost(true)} />
              </Suspense>
            </ErrorBoundary>
          ) : <StudioLoading />}

        <div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2 pt-[env(safe-area-inset-top)] max-md:hidden">
          <span className="chip glass text-white"><Hand size={14} /> <span lang={lang}>{canMove ? t({ ta: 'இழுத்துச் சுழற்றுங்கள் · பெரிதாக்குங்கள்', en: 'Drag to rotate · pinch to zoom' }) : t({ ta: '3D பந்தல் காட்சி', en: '3D pandal preview' })}</span></span>
        </div>

        <div className="absolute bottom-2 left-2 flex gap-1.5 pb-[env(safe-area-inset-bottom)] md:bottom-4 md:left-4 md:gap-2">
          <button type="button" onClick={() => setNight((n) => !n)} className="chip glass !px-2.5 !py-1.5 text-[11px] text-white hover:bg-white/20 md:!px-3 md:!py-2.5 md:text-xs">
            {night ? <Moon size={14} /> : <Sun size={14} />} <span lang={lang}>{night ? t({ ta: 'இரவு', en: 'Night' }) : t({ ta: 'பகல்', en: 'Day' })}</span>
          </button>
          <button type="button" onClick={() => setSpin((v) => !v)} className="chip glass !px-2.5 !py-1.5 text-[11px] text-white hover:bg-white/20 md:!px-3 md:!py-2.5 md:text-xs">
            {spin ? <Pause size={14} /> : <Play size={14} />} <span lang={lang}>{t({ ta: 'சுழற்சி', en: 'Spin' })}</span>
          </button>
        </div>

        {isFull ? (
          <button type="button" onClick={() => setFull(false)} aria-label="Close"
            className="chip glass absolute right-4 top-4 !p-3 text-white hover:bg-white/20" style={{ marginTop: 'env(safe-area-inset-top)' }}>
            <X size={18} />
          </button>
        ) : touch && (
          <button type="button" onClick={() => setFull(true)} className="chip glass absolute bottom-2 right-2 !px-2.5 !py-1.5 text-[11px] text-white hover:bg-white/20 md:bottom-4 md:right-4 md:!px-3 md:!py-2.5 md:text-xs">
            <Maximize2 size={14} /> <span lang={lang}>{t({ ta: '3D-ல் பார்க்க', en: 'Explore 3D' })}</span>
          </button>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-6" data-hide-fab>
      {/* Phone: the 3D view stays pinned under the top bar so the sliders below it can be dragged while watching the pandal change. */}
      <div className="sticky top-[var(--appbar-h)] z-20 -mx-4 bg-night px-4 pb-2 pt-2 md:static md:z-auto md:mx-0 md:bg-transparent md:p-0 lg:sticky lg:top-44">
        <div ref={box} className="gold-frame relative h-[clamp(190px,32svh,300px)] overflow-hidden rounded-2xl bg-night md:h-[440px] md:rounded-[2rem] lg:h-[520px]">
          {full ? <Photo k={pandal.photo} alt="" /> : stage(false)}
        </div>
      </div>
      {full && createPortal(
        <div className="fixed inset-0 z-[999] overflow-hidden bg-night" role="dialog" aria-modal="true">
          {stage(true)}
        </div>,
        document.body,
      )}

      <div className="glass-dark gold-frame min-w-0 space-y-4 rounded-2xl p-4 text-white md:space-y-5 md:rounded-[2rem] md:p-6">
        {/* 1 · type */}
        <div>
          <p lang={lang} className="flex items-center gap-2 text-xs font-bold text-white/80 sm:text-sm">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-1 text-[11px] font-extrabold text-night">1</span>
            {t({ ta: 'பந்தல் வகை', en: 'Pandal type' })}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PANDALS.map((p) => {
              const on = type === p.id;
              return (
                <button key={p.id} type="button" onClick={() => update({ pandalId: p.id })} aria-pressed={on}
                  className={`relative min-w-0 overflow-hidden rounded-xl text-left ring-2 transition md:rounded-2xl ${on ? 'ring-gold-1 shadow-[0_0_24px_-4px_rgba(147,197,253,.7)]' : 'opacity-80 ring-white/10 hover:opacity-100 hover:ring-white/30'}`}>
                  <span className="block h-11 md:h-14"><Photo k={p.photo} alt="" /></span>
                  {on && <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-gold-1 text-[10px] font-extrabold text-night">✓</span>}
                  <span className="block bg-white/10 px-1.5 py-1 leading-tight">
                    <span lang="ta" className="block truncate text-[11px] font-bold">{p.name.ta.replace(' பந்தல்', '')}</span>
                    <span className="block truncate text-[10px] text-white/60">{inr(p.pricePerSqft)}/{t({ ta: 'ச.அடி', en: 'sq ft' })}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2 · size */}
        <div>
          <p lang={lang} className="flex items-center gap-2 text-xs font-bold text-white/80 sm:text-sm">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-1 text-[11px] font-extrabold text-night">2</span>
            {t({ ta: 'பந்தல் அளவு', en: 'Pandal size' })}
          </p>
          <div className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Size presets">
            {SIZE_PRESETS.map((p) => {
              const on = Math.round(lenFt) === p.l && Math.round(brFt) === p.b;
              return (
                <button key={p.l} type="button" aria-pressed={on} onClick={() => update({ length: p.l, breadth: p.b, unit: 'ft', pandalId: type })}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-left leading-tight ring-1 transition ${on ? 'bg-gold-1 text-night ring-gold-1' : 'bg-white/10 text-white ring-white/15 hover:bg-white/20'}`}>
                  <span lang={lang} className="block text-xs font-bold">{t(p.v)}</span>
                  <span className={`block text-[10px] ${on ? 'text-night/70' : 'text-white/60'}`}>{p.l} × {p.b} {t({ ta: 'அடி', en: 'ft' })}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-1 xl:grid-cols-2">
            <SizeField label={t({ ta: 'நீளம்', en: 'Length' })} unit={t({ ta: 'அடி', en: 'ft' })} value={lenFt} min={12} max={140} step={1}
              onChange={(v) => update({ length: v, unit: 'ft', pandalId: type })} />
            <SizeField label={t({ ta: 'அகலம்', en: 'Breadth' })} unit={t({ ta: 'அடி', en: 'ft' })} value={brFt} min={12} max={120} step={1}
              onChange={(v) => update({ breadth: v, unit: 'ft', pandalId: type })} />
          </div>
          <p lang={lang} className="mt-2 rounded-xl bg-white/5 px-3 py-2 text-center text-xs text-white/70">
            <b className="text-gold-1">{Math.round(lenFt * brFt).toLocaleString('en-IN')}</b> {t({ ta: 'ச.அடி', en: 'sq ft' })} · {t({ ta: 'சுமார்', en: 'about' })} <b className="text-gold-1">{Math.floor((lenFt * brFt) / CHARGES.sqftPerGuest)}</b> {t({ ta: 'பேர் அமரலாம்', en: 'guests seated' })}
          </p>
        </div>

        {/* 3 · chairs */}
        <div>
          <p lang={lang} className="flex items-center gap-2 text-xs font-bold text-white/80 sm:text-sm">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-1 text-[11px] font-extrabold text-night">3</span>
            {t({ ta: 'நாற்காலிகள்', en: 'Chairs' })}
          </p>
          <div className="mt-2">
            <SizeField label="" unit="" value={guests} min={0} max={1000} step={10}
              onChange={(v) => { update({ pandalId: type }); setQty('plastic', v); }} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white/10 p-3 ring-1 ring-white/10 md:block md:p-4">
          <div className="min-w-0">
            <p lang={lang} className="truncate text-[11px] text-white/60 md:text-xs">{t({ ta: 'மொத்த மதிப்பீடு', en: 'Estimated total' })}</p>
            <p className="text-gradient-gold text-2xl font-bold md:text-4xl">{inr(shownTotal)}</p>
          </div>
          <Link to="/booking" className="btn-primary shrink-0 !px-5 md:hidden"><span lang={lang}>{t({ ta: 'முன்பதிவு', en: 'Book' })}</span></Link>
        </div>
        <div className="hidden grid-cols-2 gap-2 md:grid">
          <Link to="/estimate" className="btn-gold"><span lang={lang}>{t({ ta: 'விவரம்', en: 'Details' })}</span></Link>
          <Link to="/booking" className="btn-primary"><span lang={lang}>{t({ ta: 'முன்பதிவு', en: 'Book' })}</span></Link>
        </div>
      </div>
    </div>
  );
}

const SIZE_PRESETS: { v: { ta: string; en: string }; l: number; b: number }[] = [
  { v: { ta: 'சிறிய', en: 'Small' }, l: 20, b: 15 },
  { v: { ta: 'நடுத்தர', en: 'Medium' }, l: 40, b: 30 },
  { v: { ta: 'பெரிய', en: 'Large' }, l: 60, b: 40 },
  { v: { ta: 'மிகப் பெரிய', en: 'Grand' }, l: 100, b: 60 },
];

/** A value you can change three ways: − / + buttons, typing the number, or dragging the slider. */
function SizeField({ label, unit, value, min, max, step, onChange }: {
  label: string; unit: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const v = Math.round(value);
  const [text, setText] = useState(String(v));
  const [typing, setTyping] = useState(false);
  useEffect(() => { if (!typing) setText(String(v)); }, [v, typing]);
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
  const bump = (d: number) => onChange(clamp(v + d));
  const btn = 'grid h-10 w-10 shrink-0 touch-manipulation place-items-center rounded-xl bg-white/10 text-xl font-bold text-white ring-1 ring-white/15 transition hover:bg-white/20 active:scale-95 disabled:opacity-30';
  return (
    <div className="min-w-0 rounded-2xl bg-white/5 p-2.5 ring-1 ring-white/10">
      {label && <p className="mb-1.5 px-0.5 text-xs font-semibold text-white/70">{label}</p>}
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => bump(-step)} disabled={v <= min} aria-label={`${label} −`}>−</button>
        <label className="relative min-w-0 flex-1">
          <input type="text" inputMode="numeric" value={text} aria-label={label || 'Value'}
            onFocus={(e) => { setTyping(true); e.currentTarget.select(); }}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
              setText(raw);
              if (raw !== '') onChange(clamp(Number(raw)));
            }}
            onBlur={() => { setTyping(false); setText(String(clamp(Number(text) || min))); }}
            className="!h-10 w-full !rounded-xl !border-white/15 !bg-white/10 !px-2 text-center text-lg font-extrabold text-gold-1" />
          {unit && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-white/45">{unit}</span>}
        </label>
        <button type="button" className={btn} onClick={() => bump(step)} disabled={v >= max} aria-label={`${label} +`}>+</button>
      </div>
      <input type="range" min={min} max={max} step={step} value={Math.min(max, Math.max(min, v))} onChange={(e) => onChange(Number(e.target.value))}
        className="range-gold mt-3 w-full" aria-label={label || 'Value'} />
    </div>
  );
}

function StudioLoading() {
  return (
    <div className="grid h-full place-items-center text-white/60">
      <div className="text-center">
        <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-gold-1 border-t-transparent" />
        <Bi v={{ ta: '3D பந்தல் தயாராகிறது…', en: 'Preparing 3D pandal…' }} className="mt-3 text-sm" altClassName="!text-xs" />
      </div>
    </div>
  );
}
