import { BadgePercent, Check, Gift, ImagePlus, LoaderCircle, Pencil, Plus, Search, Trash2, TriangleAlert, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { inr, useLang, type L } from '../i18n/lang';
import { PANDALS } from '../data/config';
import { productImageSrc } from '../components/ui';
import { comboBase } from '../components/promos';
import { callApi } from '../state/api';
import { useCatalog } from '../state/catalog';
import { useContent, type Combo, type Offer } from '../state/content';
import { shrink } from './AdminProducts';

const ERR: Record<string, L> = {
  NETWORK: { ta: 'இணைய இணைப்பு இல்லை.', en: 'No internet connection.' },
  BAD_INPUT: { ta: 'தலைப்பு / பெயர் மற்றும் சரியான விலை தேவை.', en: 'A title or name and a valid price are needed.' },
  EMPTY_PACKAGE: { ta: 'காம்போவில் குறைந்தது ஒரு பொருள் அல்லது பந்தல் வேண்டும்.', en: 'Add at least one product or a pandal to the combo.' },
  BAD_IMAGE: { ta: 'JPG, PNG அல்லது WEBP படம் மட்டும்.', en: 'Only JPG, PNG or WEBP photos.' },
  SHARING_BLOCKED: { ta: 'Google Drive பொது இணைப்பை அனுமதிக்கவில்லை.', en: 'Google Drive did not allow a public link for the photo.' },
  BAD_ACTION: { ta: 'சர்வர் ஸ்கிரிப்ட் பழையது — புதிய Code.gs-ஐ “New version” ஆக Deploy செய்யவும்.', en: 'The server script is out of date — deploy the new Code.gs as a “New version”.' },
};
const errText = (c: string): L => ERR[c] ?? { ta: `தவறு (${c})`, en: `Something went wrong (${c})` };

function Err({ e }: { e: L | null }) {
  const { t, lang } = useLang();
  return e ? <p role="alert" lang={lang} className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800"><TriangleAlert size={15} className="shrink-0" /> {t(e)}</p> : null;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-ink/60">{label}</span>{children}</label>;
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} aria-pressed={on} className="flex items-center gap-2 text-sm font-semibold">
      <span className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-primary' : 'bg-slate-300'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${on ? 'left-[22px]' : 'left-0.5'}`} /></span>
      {label}
    </button>
  );
}

function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const { t, lang } = useLang();
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  if (!ask) return <button type="button" onClick={() => setAsk(true)} aria-label="Delete" className="grid h-9 w-9 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 size={16} /></button>;
  return (
    <span className="flex items-center gap-1">
      <button type="button" disabled={busy} onClick={async () => { setBusy(true); await onDelete(); setBusy(false); setAsk(false); }} className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white">
        {busy ? <LoaderCircle size={13} className="animate-spin" /> : <Trash2 size={13} />} <span lang={lang}>{t({ ta: 'நீக்கு', en: 'Delete' })}</span>
      </button>
      <button type="button" onClick={() => setAsk(false)} aria-label="Cancel" className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100"><X size={14} /></button>
    </span>
  );
}

/* ---------------- offers ---------------- */

type OfferForm = { id: string; titleTa: string; titleEn: string; detailsTa: string; detailsEn: string; badge: string; validTill: string; active: boolean };
const NEW_OFFER: OfferForm = { id: '', titleTa: '', titleEn: '', detailsTa: '', detailsEn: '', badge: '', validTill: '', active: true };
const offerForm = (o: Offer): OfferForm => ({ id: o.id, titleTa: o.title.ta, titleEn: o.title.en, detailsTa: o.details.ta, detailsEn: o.details.en, badge: o.badge, validTill: o.validTill, active: o.active });

function OfferEditor({ token, initial, onSaved, onCancel }: { token: string; initial: OfferForm; onSaved: () => void; onCancel: () => void }) {
  const { t, lang } = useLang();
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const set = (k: keyof OfferForm) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.titleTa.trim() && !f.titleEn.trim()) return setError(ERR.BAD_INPUT);
    setBusy(true);
    setError(null);
    const r = await callApi({ action: 'adminSaveOffer', token, ...f });
    setBusy(false);
    if (!r.ok) return setError(errText(r.error));
    onSaved();
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-3 rounded-2xl bg-white p-4 ring-2 ring-primary sm:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="தலைப்பு (தமிழ்)"><input className="w-full" value={f.titleTa} onChange={set('titleTa')} placeholder="முகூர்த்த சிறப்புச் சலுகை" /></Field>
        <Field label="Title (English)"><input className="w-full" value={f.titleEn} onChange={set('titleEn')} placeholder="Muhurtham special" /></Field>
        <Field label="விவரம் (தமிழ்)"><textarea rows={2} className="w-full" value={f.detailsTa} onChange={set('detailsTa')} placeholder="நவம்பர் முன்பதிவுகளுக்கு விளக்கு 10% தள்ளுபடி" /></Field>
        <Field label="Details (English)"><textarea rows={2} className="w-full" value={f.detailsEn} onChange={set('detailsEn')} placeholder="10% off lighting for November bookings" /></Field>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label={t({ ta: 'பேட்ஜ் (எ.கா. 10% OFF)', en: 'Badge (e.g. 10% OFF)' })}><input className="w-full" maxLength={30} value={f.badge} onChange={set('badge')} placeholder="10% OFF" /></Field>
        <Field label={t({ ta: 'கடைசி நாள் (விருப்பம்)', en: 'Valid till (optional)' })}><input className="w-full" type="date" value={f.validTill} onChange={set('validTill')} /></Field>
        <div className="flex items-end pb-2"><Toggle on={f.active} onChange={(v) => setF((x) => ({ ...x, active: v }))} label={t({ ta: 'இணையதளத்தில் காட்டு', en: 'Show on website' })} /></div>
      </div>
      <Err e={error} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary !py-2.5">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />} <span lang={lang}>{t({ ta: 'சேமி', en: 'Save offer' })}</span></button>
        <button type="button" onClick={onCancel} className="btn-ghost !py-2.5"><span lang={lang}>{t({ ta: 'ரத்து', en: 'Cancel' })}</span></button>
      </div>
    </form>
  );
}

/* ---------------- combos ---------------- */

type ComboForm = { id: string; nameTa: string; nameEn: string; detailsTa: string; detailsEn: string; pandalId: string; length: string; breadth: string; items: Record<string, number>; price: string; image: string; removeImage: boolean; currentImg: string; active: boolean };
const NEW_COMBO: ComboForm = { id: '', nameTa: '', nameEn: '', detailsTa: '', detailsEn: '', pandalId: '', length: '40', breadth: '20', items: {}, price: '', image: '', removeImage: false, currentImg: '', active: true };
const comboForm = (c: Combo): ComboForm => ({ id: c.id, nameTa: c.name.ta, nameEn: c.name.en, detailsTa: c.details.ta, detailsEn: c.details.en, pandalId: c.pandalId, length: String(c.length || 40), breadth: String(c.breadth || 20), items: { ...c.items }, price: String(c.price), image: '', removeImage: false, currentImg: c.img, active: c.active });

function ComboEditor({ token, initial, onSaved, onCancel }: { token: string; initial: ComboForm; onSaved: () => void; onCancel: () => void }) {
  const { t, lang } = useLang();
  const { items } = useCatalog();
  const [f, setF] = useState(initial);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof ComboForm) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setQty = (id: string, n: number) => setF((x) => {
    const next = { ...x.items };
    if (n > 0) next[id] = n; else delete next[id];
    return { ...x, items: next };
  });
  const preview: Combo = { id: f.id, name: { ta: f.nameTa, en: f.nameEn }, details: { ta: '', en: '' }, pandalId: (f.pandalId || '') as Combo['pandalId'], length: Number(f.length) || 0, breadth: Number(f.breadth) || 0, items: f.items, price: Number(f.price) || 0, img: '', active: true };
  const base = comboBase(preview, items);
  const price = Number(f.price) || 0;
  const needle = q.trim().toLowerCase();
  const matches = needle ? items.filter((i) => !f.items[i.id] && (i.name.ta.toLowerCase().includes(needle) || i.name.en.toLowerCase().includes(needle))).slice(0, 6) : [];
  const shown = f.image || (!f.removeImage && f.currentImg);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if ((!f.nameTa.trim() && !f.nameEn.trim()) || !(price > 0)) return setError(ERR.BAD_INPUT);
    if (!f.pandalId && !Object.keys(f.items).length) return setError(ERR.EMPTY_PACKAGE);
    setBusy(true);
    setError(null);
    const r = await callApi({ action: 'adminSavePackage', token, id: f.id, nameTa: f.nameTa.trim(), nameEn: f.nameEn.trim(), detailsTa: f.detailsTa, detailsEn: f.detailsEn, pandalId: f.pandalId, length: Number(f.length) || 0, breadth: Number(f.breadth) || 0, items: f.items, price, image: f.image, removeImage: f.removeImage, active: f.active });
    setBusy(false);
    if (!r.ok) return setError(errText(r.error));
    onSaved();
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 rounded-2xl bg-white p-4 ring-2 ring-primary sm:p-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[9rem_1fr]">
        <div>
          <span className="mb-1 block text-xs font-semibold text-ink/60">{t({ ta: 'படம் (விருப்பம்)', en: 'Photo (optional)' })}</span>
          <button type="button" onClick={() => fileRef.current?.click()} className="relative grid aspect-square w-full max-w-[9rem] place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary hover:border-primary">
            {shown ? <img src={shown} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" /> : <ImagePlus size={26} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const img = await shrink(file); setF((x) => ({ ...x, image: img, removeImage: false })); } catch { setError(ERR.BAD_IMAGE); } }} />
          {shown && <button type="button" onClick={() => { setF((x) => ({ ...x, image: '', removeImage: true })); if (fileRef.current) fileRef.current.value = ''; }} className="mt-1 text-xs font-semibold text-red-600">{t({ ta: 'படத்தை நீக்கு', en: 'Remove photo' })}</button>}
          <p className="mt-1 text-[10px] text-ink/40">{t({ ta: 'படம் இல்லையெனில் பொருட்களின் படங்கள் காட்டப்படும்.', en: 'Without a photo, the product photos are shown.' })}</p>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="காம்போ பெயர் (தமிழ்)"><input className="w-full" value={f.nameTa} onChange={set('nameTa')} placeholder="திருமண காம்போ" /></Field>
            <Field label="Combo name (English)"><input className="w-full" value={f.nameEn} onChange={set('nameEn')} placeholder="Wedding combo" /></Field>
            <Field label="விவரம் (தமிழ்)"><input className="w-full" value={f.detailsTa} onChange={set('detailsTa')} /></Field>
            <Field label="Details (English)"><input className="w-full" value={f.detailsEn} onChange={set('detailsEn')} /></Field>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label={t({ ta: 'பந்தல் (விருப்பம்)', en: 'Pandal (optional)' })}>
              <select className="w-full" value={f.pandalId} onChange={set('pandalId')}>
                <option value="">{t({ ta: '— பந்தல் இல்லை —', en: '— No pandal —' })}</option>
                {PANDALS.map((p) => <option key={p.id} value={p.id}>{t(p.name)}</option>)}
              </select>
            </Field>
            {f.pandalId && <Field label={t({ ta: 'நீளம் (அடி)', en: 'Length (ft)' })}><input className="w-full" type="number" min={1} value={f.length} onChange={set('length')} /></Field>}
            {f.pandalId && <Field label={t({ ta: 'அகலம் (அடி)', en: 'Breadth (ft)' })}><input className="w-full" type="number" min={1} value={f.breadth} onChange={set('breadth')} /></Field>}
          </div>
        </div>
      </div>

      {/* items */}
      <div>
        <p lang={lang} className="mb-2 text-sm font-bold">{t({ ta: 'காம்போவில் உள்ள பொருட்கள்', en: 'Products in this combo' })}</p>
        <label className="relative block">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
          <input className="w-full !py-2 !pl-9 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t({ ta: 'பொருள் தேடிச் சேர்க்க…', en: 'Search a product to add…' })} />
        </label>
        {matches.length > 0 && (
          <ul className="mt-1.5 overflow-hidden rounded-xl ring-1 ring-slate-200">
            {matches.map((i) => (
              <li key={i.id}><button type="button" onClick={() => { setQty(i.id, 1); setQ(''); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"><Plus size={14} className="text-primary" /> <span lang={lang} className="flex-1 truncate">{t(i.name)}</span><span className="text-xs text-ink/50">{inr(i.price)}</span></button></li>
            ))}
          </ul>
        )}
        <ul className="mt-2 space-y-1.5">
          {Object.entries(f.items).map(([id, n]) => {
            const it = items.find((i) => i.id === id);
            if (!it) return null;
            const src = productImageSrc(it);
            return (
              <li key={id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                {src ? <img src={src} alt="" referrerPolicy="no-referrer" className="h-9 w-9 rounded-lg object-cover" /> : <span className="h-9 w-9 rounded-lg bg-primary/10" />}
                <span lang={lang} className="min-w-0 flex-1 truncate text-sm font-semibold">{t(it.name)}<span className="block text-[11px] font-normal text-ink/45">{inr(it.price)} / {t(it.unit)}</span></span>
                <span className="flex items-center rounded-lg bg-white ring-1 ring-slate-200">
                  <button type="button" onClick={() => setQty(id, n - 1)} className="h-8 w-8 font-bold" aria-label="−">−</button>
                  <input type="number" min={1} value={n} onChange={(e) => setQty(id, Math.max(1, Math.floor(Number(e.target.value) || 1)))} className="!w-14 !rounded-none !border-0 !px-1 !py-1 text-center text-sm font-bold" aria-label="Quantity" />
                  <button type="button" onClick={() => setQty(id, n + 1)} className="h-8 w-8 font-bold" aria-label="+">+</button>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* price */}
      <div className="grid grid-cols-1 items-end gap-3 rounded-xl bg-primary/5 p-3 sm:grid-cols-3">
        <div><p className="text-xs text-ink/50">{t({ ta: 'வழக்கமான விலை', en: 'Normal price' })}</p><p className="text-xl font-extrabold">{inr(base)}</p></div>
        <Field label={t({ ta: 'காம்போ விலை (₹)', en: 'Combo price (₹)' })}><input className="w-full" type="number" min={1} value={f.price} onChange={set('price')} placeholder={String(Math.round(base * 0.9) || '')} /></Field>
        <p className={`pb-2 text-sm font-bold ${price > 0 && price < base ? 'text-emerald-600' : 'text-ink/40'}`}>{price > 0 && price < base ? `${t({ ta: 'வாடிக்கையாளர் சேமிப்பு', en: 'Customer saves' })} ${inr(base - price)}` : t({ ta: 'வழக்கமான விலையை விடக் குறைவாக வைக்கவும்', en: 'Set it below the normal price' })}</p>
      </div>

      <Toggle on={f.active} onChange={(v) => setF((x) => ({ ...x, active: v }))} label={t({ ta: 'இணையதளத்தில் காட்டு', en: 'Show on website' })} />
      <Err e={error} />
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary !py-2.5">{busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />} <span lang={lang}>{t({ ta: 'காம்போவைச் சேமி', en: 'Save combo' })}</span></button>
        <button type="button" onClick={onCancel} className="btn-ghost !py-2.5"><span lang={lang}>{t({ ta: 'ரத்து', en: 'Cancel' })}</span></button>
      </div>
    </form>
  );
}

/** Admin → Offers & Combos. */
export default function AdminPromos({ token }: { token: string }) {
  const { t, lang } = useLang();
  const { items } = useCatalog();
  const { reload: reloadPublic } = useContent();
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [error, setError] = useState<L | null>(null);
  const [offerEdit, setOfferEdit] = useState<OfferForm | null>(null);
  const [comboEdit, setComboEdit] = useState<ComboForm | null>(null);

  const load = useCallback(async () => {
    const r = await callApi<{ offers: Offer[]; packages: Combo[] }>({ action: 'content', all: true, token });
    if (!r.ok) { setOffers([]); return setError(errText(r.error)); }
    setError(null);
    setOffers(r.offers);
    setCombos(r.packages);
  }, [token]);
  useEffect(() => { void load(); }, [load]);
  const saved = () => { setOfferEdit(null); setComboEdit(null); void load(); void reloadPublic(); };
  const del = (action: string, id: string) => async () => {
    const r = await callApi({ action, token, id });
    if (!r.ok) return setError(errText(r.error));
    saved();
  };

  const head = (icon: ReactNode, title: L, onAdd: () => void) => (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 lang={lang} className="flex items-center gap-2 text-lg font-extrabold">{icon} {t(title)}</h2>
      <button type="button" onClick={onAdd} className="btn-primary !px-3.5 !py-2 text-xs"><Plus size={15} /> <span lang={lang}>{t({ ta: 'புதியது', en: 'New' })}</span></button>
    </div>
  );

  return (
    <div className="space-y-8">
      <Err e={error} />

      <section>
        {head(<BadgePercent size={20} className="text-rose-500" />, { ta: 'சலுகைகள்', en: 'Offers' }, () => setOfferEdit(NEW_OFFER))}
        {offerEdit && <div className="mb-3"><OfferEditor key={offerEdit.id || 'new'} token={token} initial={offerEdit} onSaved={saved} onCancel={() => setOfferEdit(null)} /></div>}
        {offers === null ? <div className="h-16 animate-pulse rounded-2xl bg-slate-100" /> : offers.length === 0 ? (
          <p lang={lang} className="rounded-2xl bg-white p-5 text-sm text-ink/55 ring-1 ring-slate-200">{t({ ta: 'இன்னும் சலுகைகள் இல்லை. “புதியது” அழுத்திச் சேர்க்கவும்.', en: 'No offers yet. Tap “New” to add one.' })}</p>
        ) : (
          <ul className="space-y-2">
            {offers.map((o) => (
              <li key={o.id} className={`flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200 ${o.active ? '' : 'opacity-60'}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-white"><BadgePercent size={19} /></span>
                <span className="min-w-0 flex-1">
                  <span lang={lang} className="block truncate text-sm font-bold">{o.badge && <span className="mr-1 rounded bg-rose-500 px-1.5 text-[10px] text-white">{o.badge}</span>}{t(o.title)}</span>
                  <span lang={lang} className="block truncate text-xs text-ink/50">{o.active ? t({ ta: 'காட்டப்படுகிறது', en: 'Showing' }) : t({ ta: 'நிறுத்தப்பட்டது', en: 'Hidden' })}{o.validTill ? ` · ${t({ ta: 'கடைசி நாள்', en: 'till' })} ${o.validTill}` : ''}</span>
                </span>
                <button type="button" onClick={() => setOfferEdit(offerForm(o))} aria-label="Edit" className="grid h-9 w-9 place-items-center rounded-lg text-primary hover:bg-primary/10"><Pencil size={16} /></button>
                <DeleteButton onDelete={del('adminDeleteOffer', o.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        {head(<Gift size={20} className="text-primary" />, { ta: 'காம்போ தொகுப்புகள்', en: 'Combo packages' }, () => setComboEdit(NEW_COMBO))}
        {comboEdit && <div className="mb-3"><ComboEditor key={comboEdit.id || 'new'} token={token} initial={comboEdit} onSaved={saved} onCancel={() => setComboEdit(null)} /></div>}
        {offers !== null && combos.length === 0 ? (
          <p lang={lang} className="rounded-2xl bg-white p-5 text-sm text-ink/55 ring-1 ring-slate-200">{t({ ta: 'இன்னும் காம்போ இல்லை. பொருட்களைத் தேர்ந்தெடுத்து சிறப்பு விலை வையுங்கள்.', en: 'No combos yet. Pick products and set a special price.' })}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {combos.map((c) => {
              const base = comboBase(c, items);
              return (
                <li key={c.id} className={`flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200 ${c.active ? '' : 'opacity-60'}`}>
                  {c.img ? <img src={c.img} alt="" referrerPolicy="no-referrer" className="h-12 w-12 shrink-0 rounded-xl object-cover" /> : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Gift size={20} /></span>}
                  <span className="min-w-0 flex-1">
                    <span lang={lang} className="block truncate text-sm font-bold">{t(c.name)}</span>
                    <span className="block truncate text-xs text-ink/50">{Object.keys(c.items).length} {t({ ta: 'பொருட்கள்', en: 'items' })}{c.pandalId ? ' + pandal' : ''} · <b className="text-ink">{inr(c.price)}</b>{base > c.price ? <span className="text-emerald-600"> · −{inr(base - c.price)}</span> : null}</span>
                  </span>
                  <button type="button" onClick={() => setComboEdit(comboForm(c))} aria-label="Edit" className="grid h-9 w-9 place-items-center rounded-lg text-primary hover:bg-primary/10"><Pencil size={16} /></button>
                  <DeleteButton onDelete={del('adminDeletePackage', c.id)} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
