import { LoaderCircle, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import { useLang, type L } from '../i18n/lang';
import { callApi } from '../state/api';

/**
 * "Cancel booking" (customer) / "Reject booking" (admin): asks for a reason, confirms, then calls the backend.
 * The backend tells the customer, the allocated provider (if any) and the admin.
 */
export function CloseOrder({ mode, token, orderRef, hasProvider, onDone }: {
  mode: 'cancel' | 'reject'; token: string; orderRef: string; hasProvider: boolean; onDone: () => void;
}) {
  const { t, lang } = useLang();
  const [ask, setAsk] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const reject = mode === 'reject';

  const label: L = reject ? { ta: 'முன்பதிவை நிராகரி', en: 'Reject booking' } : { ta: 'முன்பதிவை ரத்து செய்', en: 'Cancel booking' };

  const submit = async () => {
    if (reject && !reason.trim()) return setError({ ta: 'நிராகரிப்புக்கான காரணத்தை எழுதவும்.', en: 'Please write the reason for rejecting.' });
    setBusy(true);
    setError(null);
    const r = await callApi(reject
      ? { action: 'adminReject', token, ref: orderRef, reason: reason.trim() }
      : { action: 'cancelOrder', token, ref: orderRef, reason: reason.trim() });
    setBusy(false);
    if (r.ok) { setAsk(false); onDone(); return; }
    setError(r.error === 'BAD_STATE'
      ? { ta: 'சேவை தொடங்கிய / முடிந்த பிறகு ரத்து செய்ய முடியாது.', en: 'This booking can no longer be changed (the service is already done or it is closed).' }
      : r.error === 'NETWORK' ? { ta: 'இணைய இணைப்பு இல்லை.', en: 'No internet connection.' }
      : { ta: 'செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', en: 'Could not do that. Please try again.' });
  };

  if (!ask) {
    return (
      <button type="button" onClick={() => setAsk(true)} className="btn-ghost !py-2.5 !text-red-700">
        <X size={16} /> <span lang={lang}>{t(label)}</span>
      </button>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
      <p lang={lang} className="text-sm font-bold text-red-800">
        {reject
          ? t({ ta: 'இந்த முன்பதிவை நிராகரிக்கவா? வாடிக்கையாளருக்கும் ஒதுக்கப்பட்ட வழங்குநருக்கும் தெரிவிக்கப்படும்.', en: 'Reject this booking? The customer and the allocated provider will be told.' })
          : t({ ta: 'இந்த முன்பதிவை ரத்து செய்யவா?', en: 'Cancel this booking?' })}
      </p>
      {!reject && hasProvider && (
        <p lang={lang} className="text-xs text-red-800/80">{t({ ta: 'சேவை வழங்குநருக்கும் நிறுவனத்துக்கும் உடனே தெரிவிக்கப்படும்.', en: 'Your service provider and our team will be notified right away.' })}</p>
      )}
      <textarea rows={2} maxLength={300} className="w-full text-sm" value={reason} onChange={(e) => setReason(e.target.value)}
        placeholder={reject ? t({ ta: 'நிராகரிப்புக் காரணம் (தேவை)', en: 'Reason for rejecting (required)' }) : t({ ta: 'ரத்துக்கான காரணம் (விருப்பம்)', en: 'Reason for cancelling (optional)' })} />
      {error && <p role="alert" lang={lang} className="flex items-center gap-2 text-sm font-semibold text-amber-800"><TriangleAlert size={15} /> {t(error)}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={busy} onClick={() => void submit()} className="btn-primary !bg-red-700 !py-2.5">
          {busy && <LoaderCircle size={16} className="animate-spin" />}
          <span lang={lang}>{reject ? t({ ta: 'ஆம், நிராகரி', en: 'Yes, reject' }) : t({ ta: 'ஆம், ரத்து செய்', en: 'Yes, cancel it' })}</span>
        </button>
        <button type="button" disabled={busy} onClick={() => { setAsk(false); setError(null); }} className="btn-ghost !py-2.5">
          <span lang={lang}>{t({ ta: 'வேண்டாம்', en: 'No, keep it' })}</span>
        </button>
      </div>
    </div>
  );
}
