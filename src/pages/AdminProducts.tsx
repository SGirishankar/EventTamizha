import { Check, ImagePlus, LoaderCircle, PackagePlus, Pencil, RotateCcw, Search, Trash2, TriangleAlert, X } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { inr, useLang, type L } from '../i18n/lang';
import { CATEGORY_LABEL, ITEM_CATEGORIES, PANDALS, type Category, type Item, type Pandal } from '../data/config';
import { ITEM_ICONS } from '../components/icons';
import { productImageSrc } from '../components/ui';
import { callApi } from '../state/api';
import { useCatalog } from '../state/catalog';

const CATS: Category[] = ITEM_CATEGORIES;
const UNITS: L[] = [
  { ta: 'ஒன்றுக்கு', en: 'each' },
  { ta: 'ஒரு செட்', en: 'per set' },
  { ta: 'ஒரு நாளுக்கு', en: 'per day' },
  { ta: 'ஒரு ஜோடி', en: 'per pair' },
  { ta: '100 அடிக்கு', en: 'per 100 ft' },
  { ta: '10 அடிக்கு', en: 'per 10 ft' },
];

const ERR: Record<string, L> = {
  NETWORK: { ta: 'இணைய இணைப்பு இல்லை.', en: 'No internet connection.' },
  BAD_INPUT: { ta: 'பெயர், வகை, சரியான விலை தேவை.', en: 'A name, a category and a valid price are needed.' },
  BAD_IMAGE: { ta: 'JPG, PNG அல்லது WEBP படம் மட்டும்.', en: 'Only JPG, PNG or WEBP photos.' },
  IMAGE_TOO_BIG: { ta: 'படம் மிகப் பெரியது.', en: 'The photo is too large.' },
  SHARING_BLOCKED: { ta: 'Google Drive பொது இணைப்பை அனுமதிக்கவில்லை. Drive பகிர்வு அமைப்பைச் சரிபார்க்கவும்.', en: 'Google Drive did not allow a public link for the photo. Check the Drive sharing settings.' },
  BAD_ACTION: { ta: 'சர்வர் ஸ்கிரிப்ட் பழையது — புதிய Code.gs-ஐ “New version” ஆக Deploy செய்யவும்.', en: 'The server script is out of date — deploy the new Code.gs as a “New version”.' },
  NOT_FOUND: { ta: 'பொருள் கிடைக்கவில்லை.', en: 'Product not found.' },
};
const errText = (c: string): L => ERR[c] ?? { ta: `தவறு (${c})`, en: `Something went wrong (${c})` };

/** Shrinks a photo to at most 1000px on its longest side and re-encodes it as JPEG (keeps uploads small and fast). */
export function shrink(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const g = c.getContext('2d');
      if (!g) return reject(new Error('canvas'));
      g.fillStyle = '#fff';
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}

function Thumb({ item, className = 'h-14 w-14' }: { item: Item; className?: string }) {
  const src = productImageSrc(item);
  const I = ITEM_ICONS[item.icon];
  return src
    ? <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className={`${className} shrink-0 rounded-xl object-cover ring-1 ring-slate-200`} />
    : <span className={`${className} grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary`}><I size={22} /></span>;
}

type Form = { category: Category; nameTa: string; nameEn: string; price: string; unit: number; unitTa: string; unitEn: string; image: string; removeImage: boolean };
const BLANK: Form = { category: 'rentals', nameTa: '', nameEn: '', price: '', unit: 0, unitTa: '', unitEn: '', image: '', removeImage: false };

const formOf = (i: Item): Form => {
  const u = UNITS.findIndex((x) => x.en === i.unit.en);
  return { category: i.category, nameTa: i.name.ta, nameEn: i.name.en, price: String(i.price), unit: u >= 0 ? u : UNITS.length, unitTa: u >= 0 ? '' : i.unit.ta, unitEn: u >= 0 ? '' : i.unit.en, image: '', removeImage: false };
};

function AddProduct({ token, onAdded, edit, onCancel }: { token: string; onAdded: () => void; edit?: Item; onCancel?: () => void }) {
  const { t, lang } = useLang();
  const [f, setF] = useState<Form>(() => (edit ? formOf(edit) : BLANK));
  const current = edit && !f.removeImage ? productImageSrc(edit) : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setF((x) => ({ ...x, [k]: v })); setDone(false); };
  const custom = f.unit === UNITS.length;

  const pick = async (file?: File) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) return setError(ERR.BAD_IMAGE);
    try { const img = await shrink(file); setF((x) => ({ ...x, image: img, removeImage: false })); setDone(false); setError(null); } catch { setError(ERR.BAD_IMAGE); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const price = Number(f.price);
    if ((!f.nameTa.trim() && !f.nameEn.trim()) || !(price > 0)) return setError(ERR.BAD_INPUT);
    const unit = custom ? { ta: f.unitTa.trim() || f.unitEn.trim(), en: f.unitEn.trim() || f.unitTa.trim() } : UNITS[f.unit];
    setBusy(true);
    setError(null);
    const body = { token, category: f.category, nameTa: f.nameTa.trim(), nameEn: f.nameEn.trim(), price, unitTa: unit.ta, unitEn: unit.en, image: f.image };
    const r = edit
      ? await callApi({ action: 'adminEditProduct', ...body, id: edit.id, builtIn: !edit.custom, currentImg: edit.img ?? '', removeImage: f.removeImage })
      : await callApi({ action: 'adminAddProduct', ...body });
    setBusy(false);
    if (!r.ok) return setError(errText(r.error));
    if (fileRef.current) fileRef.current.value = '';
    onAdded();
    if (edit) return onCancel?.();
    setF({ ...BLANK, category: f.category });
    setDone(true);
  };

  const lbl = 'mb-1 block text-sm font-semibold text-ink/70';
  return (
    <form onSubmit={submit} noValidate className={`card space-y-4 p-5 sm:p-6 ${edit ? '!ring-2 !ring-primary' : ''}`}>
      <h3 lang={lang} className="flex items-center gap-3 text-lg font-extrabold">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-white shadow-glow"><PackagePlus size={18} /></span>
        {edit ? t({ ta: 'பொருளைத் திருத்து', en: 'Edit product' }) : t({ ta: 'புதிய பொருள் சேர்க்க', en: 'Add a product' })}
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[11rem_1fr]">
        {/* photo */}
        <div>
          <span lang={lang} className={lbl}>{t({ ta: 'படம்', en: 'Photo' })}</span>
          <button type="button" onClick={() => fileRef.current?.click()}
            className="group relative grid aspect-square w-full max-w-[11rem] place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-primary transition hover:border-primary hover:bg-primary/10">
            {f.image || current
              ? <img src={f.image || current!} alt="" referrerPolicy="no-referrer" className="absolute inset-0 h-full w-full object-cover" />
              : <span className="flex flex-col items-center gap-1 text-center text-xs font-semibold"><ImagePlus size={28} /><span lang={lang}>{t({ ta: 'படம் தேர்வு', en: 'Choose photo' })}</span></span>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
          {(f.image || current) && (
            <button type="button" onClick={() => { setF((x) => ({ ...x, image: '', removeImage: !x.image })); setDone(false); if (fileRef.current) fileRef.current.value = ''; }} className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-red-600">
              <X size={13} /> <span lang={lang}>{t({ ta: 'படத்தை நீக்கு', en: 'Remove photo' })}</span>
            </button>
          )}
        </div>

        {/* details */}
        <div className="space-y-3">
          <div>
            <span lang={lang} className={lbl}>{t({ ta: 'சேவை', en: 'Service' })}</span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATS.map((c) => (
                <button key={c} type="button" onClick={() => set('category', c)} aria-pressed={f.category === c}
                  className={`rounded-xl px-2 py-2.5 text-xs font-bold transition sm:text-sm ${f.category === c ? 'bg-primary text-white shadow-glow' : 'bg-slate-100 text-ink/70 hover:bg-primary/10'}`}>
                  <span lang={lang}>{t(CATEGORY_LABEL[c])}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block"><span className={lbl}>பெயர் (தமிழ்)</span><input className="w-full" value={f.nameTa} maxLength={120} onChange={(e) => set('nameTa', e.target.value)} placeholder="பிளாஸ்டிக் நாற்காலி" /></label>
            <label className="block"><span className={lbl}>Name (English)</span><input className="w-full" value={f.nameEn} maxLength={120} onChange={(e) => set('nameEn', e.target.value)} placeholder="Plastic chair" /></label>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block"><span lang={lang} className={lbl}>{t({ ta: 'விலை (₹)', en: 'Price (₹)' })}</span>
              <input className="w-full" type="number" inputMode="numeric" min={1} value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="500" /></label>
            <label className="block"><span lang={lang} className={lbl}>{t({ ta: 'அலகு', en: 'Unit' })}</span>
              <select className="w-full" value={f.unit} onChange={(e) => set('unit', Number(e.target.value))}>
                {UNITS.map((u, i) => <option key={u.en} value={i}>{t(u)}</option>)}
                <option value={UNITS.length}>{t({ ta: 'வேறு…', en: 'Other…' })}</option>
              </select></label>
          </div>
          {custom && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="w-full" value={f.unitTa} maxLength={60} onChange={(e) => set('unitTa', e.target.value)} placeholder="அலகு (தமிழ்)" aria-label="Unit (Tamil)" />
              <input className="w-full" value={f.unitEn} maxLength={60} onChange={(e) => set('unitEn', e.target.value)} placeholder="Unit (English)" aria-label="Unit (English)" />
            </div>
          )}
        </div>
      </div>

      {error && <p role="alert" lang={lang} className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800"><TriangleAlert size={15} /> {t(error)}</p>}
      {done && <p role="status" lang={lang} className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><Check size={15} /> {t({ ta: 'பொருள் சேர்க்கப்பட்டது — இணையதளத்தில் இப்போது தெரியும்.', en: 'Product added — it now shows on the website.' })}</p>}
      <button type="submit" disabled={busy} className="btn-primary w-full !py-3 sm:w-auto">
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <PackagePlus size={16} />}
        <span lang={lang}>{busy ? t({ ta: 'சேமிக்கிறது…', en: 'Saving…' }) : edit ? t({ ta: 'மாற்றங்களைச் சேமி', en: 'Save changes' }) : t({ ta: 'பொருளைச் சேர்', en: 'Add product' })}</span>
      </button>
      {edit && <button type="button" onClick={onCancel} className="btn-ghost !py-3 sm:ml-2"><span lang={lang}>{t({ ta: 'ரத்து', en: 'Cancel' })}</span></button>}
    </form>
  );
}

function ProductRow({ item, token, onChanged, onEdit }: { item: Item; token: string; onChanged: () => void; onEdit: () => void }) {
  const { t, lang } = useLang();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const del = async () => {
    setBusy(true);
    setError(null);
    const r = await callApi({ action: 'adminDeleteProduct', token, id: item.id, builtIn: !item.custom, name: item.name.en, category: item.category });
    setBusy(false);
    if (!r.ok) { setConfirm(false); return setError(errText(r.error)); }
    onChanged();
  };
  const reset = async () => {
    setBusy(true);
    setError(null);
    const r = await callApi({ action: 'adminRestoreProduct', token, id: item.id });
    setBusy(false);
    if (!r.ok) return setError(errText(r.error));
    onChanged();
  };
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-white p-2.5 ring-1 ring-slate-200">
      <Thumb item={item} />
      <div className="min-w-0 flex-1">
        <p lang={lang} className="truncate text-sm font-bold">{t(item.name)}</p>
        <p className="truncate text-xs text-ink/50">{inr(item.price)} / {t(item.unit)}
          <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${item.custom ? 'bg-emerald-100 text-emerald-700' : item.edited ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-ink/50'}`}>{item.custom ? t({ ta: 'நீங்கள் சேர்த்தது', en: 'Added' }) : item.edited ? t({ ta: 'திருத்தப்பட்டது', en: 'Edited' }) : t({ ta: 'அடிப்படை', en: 'Built-in' })}</span>
        </p>
        {error && <p lang={lang} className="mt-0.5 text-xs font-semibold text-amber-700">{t(error)}</p>}
      </div>
      {confirm ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={() => void del()} disabled={busy} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-700">
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} />} <span lang={lang}>{t({ ta: 'நீக்கு', en: 'Delete' })}</span>
          </button>
          <button type="button" onClick={() => setConfirm(false)} disabled={busy} aria-label="Cancel" className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-ink/60 hover:bg-slate-200"><X size={15} /></button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center">
          {item.edited && (
            <button type="button" onClick={() => void reset()} disabled={busy} title={t({ ta: 'அசல் விவரங்களுக்கு மாற்று', en: 'Reset to original' })} aria-label={`Reset ${item.name.en}`} className="grid h-9 w-9 place-items-center rounded-lg text-ink/50 transition hover:bg-slate-100">
              {busy ? <LoaderCircle size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            </button>
          )}
          <button type="button" onClick={onEdit} aria-label={`Edit ${item.name.en}`} className="grid h-9 w-9 place-items-center rounded-lg text-primary transition hover:bg-primary/10"><Pencil size={16} /></button>
          <button type="button" onClick={() => setConfirm(true)} aria-label={`Delete ${item.name.en}`} className="grid h-9 w-9 place-items-center rounded-lg text-red-600 transition hover:bg-red-50"><Trash2 size={17} /></button>
        </div>
      )}
    </li>
  );
}

/** One pandal type: price per square foot and the minimum charge. */
function RateRow({ pandal, token, changed, onSaved }: { pandal: Pandal; token: string; changed: boolean; onSaved: () => void }) {
  const { t, lang } = useLang();
  const [rate, setRate] = useState(String(pandal.pricePerSqft));
  const [min, setMin] = useState(String(pandal.minCharge));
  const [busy, setBusy] = useState<'save' | 'reset' | null>(null);
  const [msg, setMsg] = useState<L | null>(null);
  const [bad, setBad] = useState(false);

  const save = async () => {
    const r = Math.round(Number(rate));
    const m = Math.round(Number(min));
    if (!(r > 0) || !(m >= 0)) { setBad(true); return setMsg({ ta: 'சரியான தொகைகளை உள்ளிடவும்.', en: 'Enter valid amounts.' }); }
    setBad(false); setMsg(null); setBusy('save');
    const res = await callApi({ action: 'adminSavePandal', token, id: pandal.id, pricePerSqft: r, minCharge: m });
    setBusy(null);
    if (!res.ok) { setBad(true); return setMsg(errText(res.error)); }
    setMsg({ ta: 'சேமிக்கப்பட்டது ✓', en: 'Saved ✓' });
    onSaved();
  };
  const reset = async () => {
    setBad(false); setMsg(null); setBusy('reset');
    const res = await callApi({ action: 'adminRestoreProduct', token, id: pandal.id });
    setBusy(null);
    if (!res.ok) { setBad(true); return setMsg(errText(res.error)); }
    setMsg({ ta: 'அசல் விலைக்கு மாற்றப்பட்டது ✓', en: 'Back to the built-in rate ✓' });
    onSaved();
  };
  const input = 'w-full !py-2 text-sm tabular-nums';
  return (
    <li className="rounded-2xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
      <p lang={lang} className="font-bold">{t(pandal.name)}{changed && <span className="chip ml-2 bg-amber-100 text-amber-800">{t({ ta: 'மாற்றப்பட்டது', en: 'Changed' })}</span>}</p>
      <label className="mt-2 block">
        <span lang={lang} className="mb-1 block text-xs font-semibold text-ink/65">{t({ ta: 'ஒரு சதுர அடிக்கு (₹)', en: 'Rate per sq ft (₹)' })}</span>
        <input className={input} type="text" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value.replace(/\D/g, ''))} />
      </label>
      <label className="mt-2 block">
        <span lang={lang} className="mb-1 block text-xs font-semibold text-ink/65">{t({ ta: 'குறைந்தபட்சக் கட்டணம் (₹)', en: 'Minimum charge (₹)' })}</span>
        <input className={input} type="text" inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} />
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void save()} disabled={busy !== null} className="btn-primary !px-4 !py-2 text-xs">
          {busy === 'save' ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />} <span lang={lang}>{t({ ta: 'சேமி', en: 'Save' })}</span>
        </button>
        {changed && (
          <button type="button" onClick={() => void reset()} disabled={busy !== null} className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary ring-1 ring-primary/30 hover:bg-primary/5">
            {busy === 'reset' ? <LoaderCircle size={14} className="animate-spin" /> : <RotateCcw size={14} />} <span lang={lang}>{t({ ta: 'அசல் விலை', en: 'Reset' })}</span>
          </button>
        )}
      </div>
      {msg && <p role="status" lang={lang} className={`mt-2 text-xs font-semibold ${bad ? 'text-amber-800' : 'text-emerald-700'}`}>{t(msg)}</p>}
    </li>
  );
}

/** Admin → Products: the rate of each pandal type (changes apply to the website, estimates and cart at once). */
function PandalRates({ token }: { token: string }) {
  const { t, lang } = useLang();
  const { changedPandals, reload } = useCatalog();
  return (
    <section className="card p-4 sm:p-5">
      <h2 lang={lang} className="text-lg font-extrabold">{t({ ta: 'பந்தல் விலைகள்', en: 'Pandal rates' })}</h2>
      <p lang={lang} className="mt-1 text-sm text-ink/60">{t({ ta: 'ஒவ்வொரு பந்தல் வகைக்கும் சதுர அடி விலையையும் குறைந்தபட்சக் கட்டணத்தையும் மாற்றலாம். புதிய விலை உடனே வாடிக்கையாளர்களுக்குத் தெரியும்.', en: 'Change the price per square foot and the minimum charge of each pandal type. Customers see the new rates straight away.' })}</p>
      <ul className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        {PANDALS.map((p) => <RateRow key={`${p.id}-${p.pricePerSqft}-${p.minCharge}`} pandal={p} token={token} changed={changedPandals.includes(p.id)} onSaved={() => void reload()} />)}
      </ul>
    </section>
  );
}

/** Admin → Products: add products with a photo, delete existing ones, restore removed built-in ones. */
export default function AdminProducts({ token }: { token: string }) {
  const { t, lang } = useLang();
  const { items, hiddenItems, reload } = useCatalog();
  const [cat, setCat] = useState<Category | 'all'>('all');
  const [q, setQ] = useState('');
  const [restoring, setRestoring] = useState<string | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const needle = q.trim().toLowerCase();
  const shown = items.filter((i) => (cat === 'all' || i.category === cat) && (!needle || i.name.ta.toLowerCase().includes(needle) || i.name.en.toLowerCase().includes(needle)));

  const restore = async (id: string) => {
    setRestoring(id);
    const r = await callApi({ action: 'adminRestoreProduct', token, id });
    setRestoring(null);
    if (r.ok) void reload();
  };

  return (
    <div className="space-y-6">
      <PandalRates token={token} />
      {editing
        ? <AddProduct key={editing.id} token={token} edit={editing} onAdded={() => void reload()} onCancel={() => setEditing(null)} />
        : <AddProduct token={token} onAdded={() => void reload()} />}

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 lang={lang} className="text-lg font-extrabold">{t({ ta: 'தற்போதைய பொருட்கள்', en: 'Current products' })} <span className="text-sm text-ink/45">{items.length}</span></h2>
          <label className="relative block w-full sm:w-64">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input className="w-full !py-2 !pl-9 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t({ ta: 'பொருள் தேடு…', en: 'Search products…' })} />
          </label>
        </div>
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {(['all', ...CATS] as const).map((c) => (
            <button key={c} type="button" onClick={() => setCat(c)} aria-pressed={cat === c}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${cat === c ? 'bg-primary text-white' : 'bg-white text-ink/65 ring-1 ring-slate-200 hover:ring-primary/40'}`}>
              <span lang={lang}>{c === 'all' ? t({ ta: 'அனைத்தும்', en: 'All' }) : t(CATEGORY_LABEL[c])}</span>
              <span className="ml-1 opacity-70">{c === 'all' ? items.length : items.filter((i) => i.category === c).length}</span>
            </button>
          ))}
        </div>
        <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {shown.map((i) => <ProductRow key={i.id} item={i} token={token} onChanged={() => void reload()} onEdit={() => { setEditing(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />)}
        </ul>
        {shown.length === 0 && <p lang={lang} className="card p-6 text-center text-sm text-ink/55">{t({ ta: 'பொருட்கள் இல்லை.', en: 'No products.' })}</p>}
      </div>

      {hiddenItems.length > 0 && (
        <div>
          <h2 lang={lang} className="mb-2 text-base font-extrabold text-ink/70">{t({ ta: 'நீக்கப்பட்ட அடிப்படைப் பொருட்கள்', en: 'Removed built-in products' })}</h2>
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {hiddenItems.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-2.5 opacity-80 ring-1 ring-slate-200">
                <Thumb item={i} className="h-11 w-11 grayscale" />
                <p lang={lang} className="min-w-0 flex-1 truncate text-sm font-semibold">{t(i.name)}</p>
                <button type="button" onClick={() => void restore(i.id)} disabled={restoring === i.id} className="flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-xs font-bold text-primary ring-1 ring-primary/30 hover:bg-primary/5">
                  {restoring === i.id ? <LoaderCircle size={14} className="animate-spin" /> : <RotateCcw size={14} />} <span lang={lang}>{t({ ta: 'மீட்டெடு', en: 'Restore' })}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
