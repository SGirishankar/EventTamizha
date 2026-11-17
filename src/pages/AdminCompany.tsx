import { Building2, Check, Clock, LoaderCircle, Mail, MapPin, Phone, RotateCcw, Save, TriangleAlert } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useLang, type L } from '../i18n/lang';
import { WhatsAppIcon } from '../components/Layout';
import { callApi } from '../state/api';
import { DEFAULT_COMPANY, useCompany, type CompanySettings } from '../state/company';

const ERR: Record<string, L> = {
  NETWORK: { ta: 'இணைய இணைப்பு இல்லை.', en: 'No internet connection.' },
  BAD_PHONE: { ta: 'சரியான 10 இலக்க கைபேசி எண்ணை உள்ளிடவும்.', en: 'Enter a valid 10-digit mobile number.' },
  BAD_EMAIL: { ta: 'மின்னஞ்சல் முகவரி சரியில்லை.', en: 'The e-mail address is not valid.' },
  BAD_ACTION: { ta: 'சர்வர் ஸ்கிரிப்ட் பழையது — புதிய Code.gs-ஐ “New version” ஆக Deploy செய்யவும்.', en: 'The server script is out of date — deploy the new Code.gs as a “New version”.' },
};
const errText = (c: string): L => ERR[c] ?? { ta: `தவறு (${c})`, en: `Something went wrong (${c})` };

function Section({ icon: I, title, children }: { icon: typeof Building2; title: L; children: ReactNode }) {
  const { t, lang } = useLang();
  return (
    <fieldset className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
      <legend className="sr-only">{t(title)}</legend>
      <p lang={lang} className="mb-3 flex items-center gap-2 font-extrabold"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><I size={16} /></span>{t(title)}</p>
      <div className="space-y-3">{children}</div>
    </fieldset>
  );
}

/** Admin → Company: edit the business details shown in the footer, contact page and WhatsApp links. */
export default function AdminCompany({ token }: { token: string }) {
  const { t, lang } = useLang();
  const { settings, save } = useCompany();
  const [f, setF] = useState<CompanySettings>(settings);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<L | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => setF(settings), [settings]);
  const set = (k: keyof CompanySettings) => (e: { target: { value: string } }) => { setF((x) => ({ ...x, [k]: e.target.value })); setDone(false); };
  const changed = (Object.keys(f) as (keyof CompanySettings)[]).some((k) => f[k] !== settings[k]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const ten = (s: string) => /^[6-9]\d{9}$/.test(s.replace(/\D/g, '').slice(-10));
    if (!ten(f.phone) || (f.whatsapp && !ten(f.whatsapp))) return setError(ERR.BAD_PHONE);
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return setError(ERR.BAD_EMAIL);
    setBusy(true);
    setError(null);
    const r = await callApi<{ settings: Partial<CompanySettings> }>({ action: 'adminSaveSettings', token, settings: f });
    setBusy(false);
    if (!r.ok) return setError(errText(r.error));
    save({ ...DEFAULT_COMPANY, ...r.settings });
    setDone(true);
  };

  const pair = (label: string, ta: keyof CompanySettings, en: keyof CompanySettings, multi = false, ph?: [string, string]) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {([[ta, `${label} (தமிழ்)`, ph?.[0]], [en, `${label} (English)`, ph?.[1]]] as const).map(([k, l, p]) => (
        <label key={k} className="block">
          <span className="mb-1 block text-xs font-semibold text-ink/60">{l}</span>
          {multi ? <textarea rows={2} className="w-full resize-y" value={f[k]} onChange={set(k)} placeholder={p} />
            : <input className="w-full" value={f[k]} onChange={set(k)} placeholder={p} />}
        </label>
      ))}
    </div>
  );

  const phone = f.phone.replace(/\D/g, '').slice(-10);
  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <Section icon={Building2} title={{ ta: 'நிறுவனப் பெயர்', en: 'Company name' }}>
          {pair('Name', 'nameTa', 'nameEn')}
          {pair('Short line under logo', 'descriptorTa', 'descriptorEn')}
          {pair('Tagline', 'taglineTa', 'taglineEn')}
          {pair('Footer about text', 'aboutTa', 'aboutEn', true)}
        </Section>

        <Section icon={Phone} title={{ ta: 'தொடர்பு', en: 'Contact' }}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink/60">{t({ ta: 'கைபேசி', en: 'Phone' })}</span>
              <input className="w-full" type="tel" inputMode="numeric" value={f.phone} onChange={set('phone')} placeholder="9566779289" /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink/60">WhatsApp</span>
              <input className="w-full" type="tel" inputMode="numeric" value={f.whatsapp} onChange={set('whatsapp')} placeholder={t({ ta: 'காலியெனில் கைபேசி எண்', en: 'Blank = same as phone' })} /></label>
            <label className="block"><span className="mb-1 block text-xs font-semibold text-ink/60">{t({ ta: 'மின்னஞ்சல்', en: 'E-mail' })}</span>
              <input className="w-full" type="email" value={f.email} onChange={set('email')} placeholder="info@example.com" /></label>
          </div>
        </Section>

        <Section icon={MapPin} title={{ ta: 'முகவரி & நேரம்', en: 'Address & hours' }}>
          {pair('Address', 'addressTa', 'addressEn', true)}
          {pair('Working hours', 'hoursTa', 'hoursEn', false, ['தினமும் காலை 7 – இரவு 9', 'Daily 7 AM – 9 PM'])}
        </Section>

        <Section icon={MapPin} title={{ ta: 'சேவைப் பகுதிகள்', en: 'Areas served' }}>
          <label className="block">
            <span lang={lang} className="mb-1 block text-xs font-semibold text-ink/60">{t({ ta: 'ஒரு வரிக்கு ஒரு ஊர்: தமிழ் | English', en: 'One town per line: Tamil | English' })}</span>
            <textarea rows={6} className="w-full resize-y font-mono text-sm" value={f.towns} onChange={set('towns')} placeholder={'ஈரோடு | Erode\nசேலம் | Salem'} />
          </label>
        </Section>
      </div>

      {/* live preview + save */}
      <div className="space-y-4 xl:sticky xl:top-44 xl:self-start">
        <div className="overflow-hidden rounded-2xl bg-night text-white/85 shadow-deep">
          <p lang={lang} className="border-b border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-sky-200">{t({ ta: 'அடிக்குறிப்பு முன்னோட்டம்', en: 'Footer preview' })}</p>
          <div className="space-y-2.5 p-4 text-sm">
            <p className="text-lg font-extrabold text-white">{lang === 'ta' ? f.nameTa || f.nameEn : f.nameEn || f.nameTa}</p>
            <p lang={lang} className="text-xs text-sky-200">{lang === 'ta' ? f.descriptorTa : f.descriptorEn}</p>
            <p lang={lang} className="text-xs">{lang === 'ta' ? f.aboutTa : f.aboutEn}</p>
            <p className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-sky-300" /><span lang={lang}>{lang === 'ta' ? f.addressTa : f.addressEn}</span></p>
            <p className="flex items-center gap-2"><Phone size={15} className="text-sky-300" /> {phone.length === 10 ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : '—'}</p>
            <p className="flex items-center gap-2"><WhatsAppIcon className="h-4 w-4 text-[#25D366]" /> {(f.whatsapp || f.phone).replace(/\D/g, '').slice(-10) || '—'}</p>
            {f.email && <p className="flex items-center gap-2 break-all"><Mail size={15} className="shrink-0 text-sky-300" /> {f.email}</p>}
            <p className="flex items-center gap-2"><Clock size={15} className="text-sky-300" /> <span lang={lang}>{lang === 'ta' ? f.hoursTa : f.hoursEn}</span></p>
          </div>
        </div>

        {error && <p role="alert" lang={lang} className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800"><TriangleAlert size={15} className="shrink-0" /> {t(error)}</p>}
        {done && !changed && <p role="status" lang={lang} className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800"><Check size={15} /> {t({ ta: 'சேமிக்கப்பட்டது — இணையதளம் முழுவதும் புதுப்பிக்கப்பட்டது.', en: 'Saved — updated across the website.' })}</p>}
        <button type="submit" disabled={busy || !changed} className="btn-primary w-full !py-3">
          {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
          <span lang={lang}>{t({ ta: 'மாற்றங்களைச் சேமி', en: 'Save changes' })}</span>
        </button>
        <button type="button" onClick={() => { setF(DEFAULT_COMPANY); setDone(false); }} className="btn-ghost w-full !py-2.5 text-xs">
          <RotateCcw size={14} /> <span lang={lang}>{t({ ta: 'இயல்புநிலை விவரங்களை நிரப்பு', en: 'Fill in the original details' })}</span>
        </button>
      </div>
    </form>
  );
}
