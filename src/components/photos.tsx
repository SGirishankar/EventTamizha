import { Camera, ImagePlus, X } from 'lucide-react';
import { useState } from 'react';
import { useLang, type L } from '../i18n/lang';
import { isNativeApp } from '../native/push';
import { shrink } from '../pages/AdminProducts';

/** Android app: opens the real camera (asks for camera permission the first time) or the phone gallery, and returns image files. */
async function pickNative(source: 'camera' | 'gallery', room: number): Promise<File[]> {
  const { Camera: CameraPlugin, CameraResultType, CameraSource } = await import('@capacitor/camera');
  const toFile = async (url: string, i: number) => {
    const blob = await (await fetch(url)).blob();
    return new File([blob], `photo-${Date.now()}-${i}.jpg`, { type: blob.type || 'image/jpeg' });
  };
  try {
    if (source === 'camera') {
      const p = await CameraPlugin.getPhoto({ source: CameraSource.Camera, resultType: CameraResultType.DataUrl, quality: 80, width: 1600, correctOrientation: true });
      return p.dataUrl ? [await toFile(p.dataUrl, 0)] : [];
    }
    const r = await CameraPlugin.pickImages({ quality: 80, width: 1600, limit: room, correctOrientation: true });
    return Promise.all(r.photos.slice(0, room).map((ph, i) => toFile(ph.webPath, i)));
  } catch (e) {
    if (/cancel/i.test(String((e as Error)?.message ?? e))) return []; // the person closed the camera / gallery
    throw e;
  }
}

/** Pick up to `max` photos (camera or gallery). They are shrunk in the browser and handed back as data URLs, ready to upload. */
export function PhotoPicker({ value, onChange, max = 3, title, hint }: { value: string[]; onChange: (v: string[]) => void; max?: number; title?: L; hint?: L }) {
  const { t, lang } = useLang();
  const [failed, setFailed] = useState(false);

  const native = isNativeApp();

  const addNative = async (source: 'camera' | 'gallery') => {
    setFailed(false);
    try { await add(await pickNative(source, Math.max(1, max - value.length))); } catch { setFailed(true); }
  };

  const add = async (files: FileList | File[] | null) => {
    setFailed(false);
    const room = Math.max(0, max - value.length);
    const picked = Array.from(files ?? []).slice(0, room);
    if (!picked.length) return;
    try {
      const out = await Promise.all(picked.map((f) => shrink(f)));
      onChange([...value, ...out]);
    } catch {
      setFailed(true);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p lang={lang} className="flex items-center gap-2 text-sm font-bold text-ink/80">
        <Camera size={16} className="text-primary" />
        {t(title ?? { ta: 'படங்கள் சேர்க்க', en: 'Add photos' })}
        <span className="text-xs font-normal text-ink/45">({t({ ta: 'விருப்பம்', en: 'optional' })} · {value.length}/{max})</span>
      </p>
      <p lang={lang} className="mt-1 text-xs text-ink/55">
        {t(hint ?? { ta: 'விழா நடக்கும் இடம் அல்லது நீங்கள் விரும்பும் அலங்காரத்தின் படங்களைச் சேர்க்கலாம் — எங்கள் குழுவுக்கு எளிதாகப் புரியும்.', en: 'Add pictures of the venue or the decoration you like — it helps our team plan.' })}
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        {value.map((src, i) => (
          <span key={i} className="relative">
            <img src={src} alt="" className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove photo"
              className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white shadow"><X size={13} /></button>
          </span>
        ))}
        {value.length < max && !native && (
          <label className="grid h-20 w-20 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-primary/40 bg-white text-primary transition hover:bg-primary/5">
            <span className="flex flex-col items-center gap-0.5 text-[11px] font-bold"><Camera size={22} /><span lang={lang}>{t({ ta: 'படம்', en: 'Photo' })}</span></span>
            <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void add(e.target.files); e.target.value = ''; }} />
          </label>
        )}
        {value.length < max && native && (
          <>
            <button type="button" onClick={() => void addNative('camera')} className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-primary/40 bg-white text-primary transition active:bg-primary/5">
              <span className="flex flex-col items-center gap-0.5 text-[11px] font-bold"><Camera size={22} /><span lang={lang}>{t({ ta: 'கேமரா', en: 'Camera' })}</span></span>
            </button>
            <button type="button" onClick={() => void addNative('gallery')} className="grid h-20 w-20 place-items-center rounded-xl border-2 border-dashed border-primary/40 bg-white text-primary transition active:bg-primary/5">
              <span className="flex flex-col items-center gap-0.5 text-[11px] font-bold"><ImagePlus size={22} /><span lang={lang}>{t({ ta: 'கேலரி', en: 'Gallery' })}</span></span>
            </button>
          </>
        )}
      </div>
      {failed && <p role="alert" lang={lang} className="mt-2 text-xs font-semibold text-amber-700">{t({ ta: 'படத்தைச் சேர்க்க முடியவில்லை.', en: 'Could not add that photo.' })}</p>}
    </div>
  );
}

/** Photos the customer attached to a booking, shown to the customer, the admin and the provider. Tap one to open it bigger. */
export function PhotoStrip({ urls, title }: { urls?: string[]; title?: L }) {
  const { t, lang } = useLang();
  if (!urls || urls.length === 0) return null;
  return (
    <div>
      <p lang={lang} className="mb-1.5 text-sm font-semibold text-ink/55">{t(title ?? { ta: 'வாடிக்கையாளர் படங்கள்', en: 'Customer photos' })}</p>
      <div className="flex flex-wrap gap-2">
        {urls.map((u) => (
          <a key={u} href={u.replace('sz=w800', 'sz=w1600')} target="_blank" rel="noreferrer">
            <img src={u} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200 transition hover:scale-105" />
          </a>
        ))}
      </div>
    </div>
  );
}
