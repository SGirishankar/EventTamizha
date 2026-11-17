import { CircleCheck, ExternalLink, Link2, LoaderCircle, LocateFixed, MapPin, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLang, type L } from '../i18n/lang';
import { NO_LOCATION, cleanMapLink, coordsFromLink, mapsUrl, type VenueLocation } from '../state/location';

type Problem = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'insecure' | 'badlink' | 'nocoords';

const PROBLEM: Record<Problem, L> = {
  denied: {
    ta: 'இருப்பிட அனுமதி மறுக்கப்பட்டது. உலாவியின் முகவரிப் பட்டையில் உள்ள பூட்டு ஐகானைத் தொட்டு “Location” அனுமதியை இயக்கி, மீண்டும் முயற்சிக்கவும்.',
    en: 'Location permission is blocked. Tap the lock icon in the address bar, allow “Location”, then try again.',
  },
  unavailable: {
    ta: 'உங்கள் இருப்பிடத்தைக் கண்டறிய முடியவில்லை. தொலைபேசியில் Location (GPS) இயக்கப்பட்டுள்ளதா எனப் பாருங்கள்.',
    en: 'Could not find your position. Check that Location (GPS) is switched on in your phone.',
  },
  timeout: { ta: 'இருப்பிடம் கிடைக்க நேரம் ஆகிறது. மீண்டும் முயற்சிக்கவும்.', en: 'Getting your location took too long. Please try again.' },
  unsupported: { ta: 'இந்த உலாவி இருப்பிடத்தை ஆதரிக்கவில்லை. வரைபட இணைப்பை ஒட்டவும்.', en: 'This browser cannot share location. Paste a map link instead.' },
  insecure: { ta: 'இருப்பிடம் பெற பாதுகாப்பான (https) இணைப்பு தேவை. வரைபட இணைப்பை ஒட்டவும்.', en: 'Location needs a secure (https) page. Paste a map link instead.' },
  badlink: { ta: 'இது சரியான வரைபட இணைப்பு அல்ல (Google Maps இணைப்பை ஒட்டவும்).', en: 'That is not a valid map link (paste a Google Maps link).' },
  nocoords: { ta: 'இந்த இணைப்பில் ஆயத்தொலைவு இல்லை (குறுகிய இணைப்பு). “இருப்பிடத்தை இயக்கு” அழுத்தவும் அல்லது நீண்ட Google Maps இணைப்பை ஒட்டவும்.', en: 'This link has no coordinates (short link). Tap “Enable location”, or paste the long Google Maps link.' },
};

/** "Enable location" for the venue: one tap to use the phone's GPS, or paste a Google Maps link. Fully optional. */
export function LocationPicker({ value, onChange, title, hint, optional = true, needCoords = false }: {
  value: VenueLocation;
  onChange: (v: VenueLocation) => void;
  title?: L;
  hint?: L;
  /** show the “optional” tag (default). */
  optional?: boolean;
  /** only accept a position with coordinates (GPS, or a link that contains them). Used for provider base locations. */
  needCoords?: boolean;
}) {
  const { t, lang } = useLang();
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [link, setLink] = useState('');

  // Show a hint up-front when the browser has already blocked location for this site.
  useEffect(() => {
    let live = true;
    try {
      void navigator.permissions?.query({ name: 'geolocation' as PermissionName }).then((p) => {
        if (!live) return;
        setBlocked(p.state === 'denied');
        p.onchange = () => live && setBlocked(p.state === 'denied');
      }).catch(() => undefined);
    } catch {
      /* Permissions API not available: nothing to show */
    }
    return () => { live = false; };
  }, []);

  const enable = () => {
    setProblem(null);
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return setProblem('unsupported');
    if (!window.isSecureContext) return setProblem('insecure');
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        onChange({ lat, lng, accuracy: Math.round(accuracy), mapLink: mapsUrl(lat, lng), source: 'gps' });
      },
      (err) => {
        setBusy(false);
        setProblem(err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const applyLink = () => {
    if (!link.trim()) return;
    const ok = cleanMapLink(link);
    if (!ok) return setProblem('badlink');
    setProblem(null);
    const c = coordsFromLink(ok);
    if (needCoords && !c) return setProblem('nocoords');
    onChange({ lat: c?.lat ?? null, lng: c?.lng ?? null, accuracy: null, mapLink: ok, source: 'link' });
    setLink('');
  };

  const has = Boolean(value.mapLink);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p lang={lang} className="flex items-center gap-2 text-sm font-bold text-ink/80">
        <MapPin size={16} className="text-primary" />
        {t(title ?? { ta: 'விழா இடத்தின் இருப்பிடம்', en: 'Venue location' })}
        {optional && <span className="text-xs font-normal text-ink/45">({t({ ta: 'விருப்பம்', en: 'optional' })})</span>}
      </p>
      <p lang={lang} className="mt-1 text-xs text-ink/55">
        {t(hint ?? { ta: 'நீங்கள் விழா நடக்கும் இடத்தில் இருந்தால் “இருப்பிடத்தை இயக்கு” அழுத்துங்கள் — எங்கள் குழு எளிதாக வழி கண்டுபிடிக்கும்.', en: 'If you are at the venue, tap “Enable location” — our team can then find the place easily.' })}
      </p>

      {has ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 ring-1 ring-emerald-200">
          <CircleCheck size={18} className="shrink-0 text-peacock" />
          <div className="min-w-0 flex-1 text-sm">
            <p lang={lang} className="font-bold text-ink">{t({ ta: 'இருப்பிடம் சேர்க்கப்பட்டது', en: 'Location added' })}</p>
            {value.lat !== null && value.lng !== null && (
              <p className="text-xs text-ink/60">
                {value.lat.toFixed(5)}, {value.lng.toFixed(5)}{value.accuracy !== null && ` · ±${value.accuracy} m`}
              </p>
            )}
          </div>
          <a href={value.mapLink} target="_blank" rel="noreferrer" className="chip bg-primary text-gold-1">
            <ExternalLink size={12} /> <span lang={lang}>{t({ ta: 'வரைபடத்தில் பார்க்க', en: 'Open in Maps' })}</span>
          </a>
          <button type="button" onClick={() => { onChange(NO_LOCATION); setProblem(null); }} className="chip bg-red-50 text-red-700" aria-label={t({ ta: 'இருப்பிடத்தை நீக்கு', en: 'Remove location' })}>
            <X size={12} /> <span lang={lang}>{t({ ta: 'நீக்கு', en: 'Remove' })}</span>
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <button type="button" onClick={enable} disabled={busy} className="btn-primary w-full !py-2.5 disabled:opacity-70 sm:w-auto">
            {busy ? <LoaderCircle size={17} className="animate-spin" /> : <LocateFixed size={17} />}
            <span lang={lang}>{busy ? t({ ta: 'இருப்பிடம் தேடுகிறது…', en: 'Finding your location…' }) : t({ ta: 'இருப்பிடத்தை இயக்கு (என் இருப்பிடம்)', en: 'Enable location (use my current location)' })}</span>
          </button>
          {blocked && !problem && (
            <p lang={lang} className="flex items-start gap-2 text-xs font-semibold text-amber-800">
              <TriangleAlert size={14} className="mt-0.5 shrink-0" /> {t(PROBLEM.denied)}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-ink/40">
            <span className="h-px flex-1 bg-ink/10" /> <span lang={lang}>{t({ ta: 'அல்லது', en: 'or' })}</span> <span className="h-px flex-1 bg-ink/10" />
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Link2 size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
              <input
                className="w-full !pl-9"
                value={link}
                onChange={(e) => { setLink(e.target.value); if (problem === 'badlink') setProblem(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyLink(); } }}
                placeholder={t({ ta: 'Google Maps இணைப்பை ஒட்டவும்', en: 'Paste a Google Maps link' })}
                inputMode="url"
                aria-label={t({ ta: 'வரைபட இணைப்பு', en: 'Map link' })}
              />
            </div>
            <button type="button" onClick={applyLink} disabled={!link.trim()} className="btn-ghost !px-4 disabled:opacity-50"><span lang={lang}>{t({ ta: 'சேர்', en: 'Add' })}</span></button>
          </div>
        </div>
      )}

      {problem && (
        <p role="alert" lang={lang} className="mt-3 flex items-start gap-2 text-xs font-semibold text-amber-800">
          <TriangleAlert size={14} className="mt-0.5 shrink-0" /> {t(PROBLEM[problem])}
        </p>
      )}
    </div>
  );
}
