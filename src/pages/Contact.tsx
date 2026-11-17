import { Clock, Mail, MapPin, MapPinned, Navigation, Phone, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Bi, useLang } from '../i18n/lang';
import { BUSINESS, CREDITS, TOWNS, photo, type PhotoKey } from '../data/config';
import { ONLINE } from '../data/productPhotos';
import { DemoBadge, PageHero } from '../components/ui';
import { WhatsAppIcon } from '../components/Layout';
import { whatsappLink } from '../state/whatsapp';
import { useCompany } from '../state/company';

export default function ContactPage() {
  useCompany();
  const { t, lang } = useLang();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [link, setLink] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setLink(whatsappLink(lang, { extra: `${t({ ta: 'பெயர்', en: 'Name' })}: ${name}\n${msg}` }));
  };

  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.address.en)}`;
  const info = [
    { icon: MapPin, v: { ta: 'முகவரி', en: 'Address' }, body: <><span lang={lang}>{t(BUSINESS.address)}</span><a href={maps} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs font-bold text-primary hover:underline"><Navigation size={12} /> {t({ ta: 'வரைபடத்தில் திறக்க', en: 'Open in Maps' })}</a></> },
    { icon: Clock, v: { ta: 'நேரம்', en: 'Working hours' }, body: <span lang={lang}>{t(BUSINESS.hours)}</span> },
    ...(BUSINESS.email ? [{ icon: Mail, v: { ta: 'மின்னஞ்சல்', en: 'E-mail' }, body: <a href={`mailto:${BUSINESS.email}`} className="break-all font-semibold text-primary hover:underline">{BUSINESS.email}</a> }] : []),
  ];

  return (
    <>
      <PageHero k="welcome-procession" title={{ ta: 'தொடர்புக்கு', en: 'Contact Us' }}
        sub={{ ta: 'விழா தேதியை உறுதி செய்ய முன்கூட்டியே தொடர்பு கொள்ளுங்கள் — முகூர்த்த நாட்களில் முன்பதிவு விரைவில் நிறைந்துவிடும்.', en: 'Contact us early to secure your date — bookings fill up fast on auspicious muhurtham days.' }} />
      <section className="section grid grid-cols-1 gap-6 !pt-6 sm:!pt-10 lg:grid-cols-[1fr_1.1fr] lg:gap-8">
        <div className="space-y-4">
          {/* quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <a href={BUSINESS.phoneHref} className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-light to-primary-dark p-4 text-white shadow-glow transition hover:-translate-y-0.5 sm:p-5">
              <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" aria-hidden />
              <Phone size={26} className="transition group-hover:rotate-12" />
              <p lang={lang} className="mt-3 text-xs font-semibold text-white/80">{t({ ta: 'இப்போதே அழைக்க', en: 'Call now' })}</p>
              <p className="text-base font-extrabold tracking-tight sm:text-lg">{BUSINESS.phoneDisplay}</p>
            </a>
            <a href={whatsappLink(lang)} target="_blank" rel="noreferrer" className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] p-4 text-white shadow-[0_14px_32px_-12px_rgba(18,140,126,.6)] transition hover:-translate-y-0.5 sm:p-5">
              <span className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" aria-hidden />
              <WhatsAppIcon className="h-[26px] w-[26px] transition group-hover:scale-110" />
              <p lang={lang} className="mt-3 text-xs font-semibold text-white/85">WhatsApp</p>
              <p lang={lang} className="text-base font-extrabold tracking-tight sm:text-lg">{t({ ta: 'செய்தி அனுப்ப', en: 'Send a message' })}</p>
            </a>
          </div>

          {/* details */}
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            {info.map((x) => (
              <li key={x.v.en} className="flex gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><x.icon size={19} /></span>
                <div className="min-w-0 text-sm">
                  <p lang={lang} className="text-xs font-bold uppercase tracking-wider text-ink/45">{t(x.v)}</p>
                  <div className="mt-0.5 text-ink/85">{x.body}</div>
                </div>
              </li>
            ))}
          </ul>

          {/* areas */}
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-extrabold"><MapPinned size={18} className="text-primary" /> <Bi v={{ ta: 'சேவைப் பகுதிகள்', en: 'Areas we serve' }} inline altClassName="text-xs font-normal" /></h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {TOWNS.map((x) => (
                <li key={x.en} className="rounded-full bg-primary/5 px-3 py-1 text-sm ring-1 ring-primary/10"><span lang="ta" className="font-semibold text-ink">{x.ta}</span> <span className="text-xs text-ink/45">{x.en}</span></li>
              ))}
            </ul>
            <p lang={lang} className="mt-3 text-xs text-ink/50">{t({ ta: 'மற்ற ஊர்களுக்கும் போக்குவரத்துக் கட்டணத்துடன் சேவை உண்டு.', en: 'Other towns are served with a transport charge.' })}</p>
          </div>
        </div>

        <form onSubmit={submit} className="card space-y-4 self-start p-5 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white"><Send size={20} /></span>
            <h2 className="text-xl font-extrabold sm:text-2xl"><Bi v={{ ta: 'WhatsApp விசாரணை', en: 'WhatsApp Enquiry' }} altClassName="font-sans !text-xs text-primary" /></h2>
          </div>
          <label className="block">
            <span lang={lang} className="mb-1.5 block text-sm font-semibold text-ink/70">{t({ ta: 'உங்கள் பெயர்', en: 'Your name' })}</span>
            <input required className="w-full" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span lang={lang} className="mb-1.5 block text-sm font-semibold text-ink/70">{t({ ta: 'உங்கள் தேவை', en: 'Your requirement' })}</span>
            <textarea required rows={5} className="w-full" value={msg} onChange={(e) => setMsg(e.target.value)}
              placeholder={t({ ta: 'எ.கா. 15-ஆம் தேதி கிரகப்பிரவேசம், 30×20 அடி சாமியானா, 100 நாற்காலி, வீட்டு விளக்கு', en: 'e.g. Housewarming on the 15th, 30×20 ft samiyana, 100 chairs, house lighting' })} />
          </label>
          <DemoBadge />
          <button type="submit" className="btn-primary w-full !py-3"><span lang={lang}>{t({ ta: 'செய்தியைத் தயாரிக்க', en: 'Prepare message' })}</span></button>
          {link && (
            <div className="rounded-2xl bg-[#25D366]/10 p-4 text-sm" role="status">
              <p lang={lang} className="text-[#128C7E]">{t({ ta: 'செய்தி தயார். இன்னும் எதுவும் அனுப்பப்படவில்லை — WhatsApp-ல் திறந்து நீங்களே அனுப்புங்கள்.', en: 'Message ready. Nothing has been sent yet — open WhatsApp and send it yourself.' })}</p>
              <a href={link} target="_blank" rel="noreferrer" className="btn-whatsapp mt-3"><WhatsAppIcon /> <span lang={lang}>{t({ ta: 'WhatsApp-ல் திறக்க', en: 'Open in WhatsApp' })}</span></a>
            </div>
          )}
        </form>
      </section>
    </>
  );
}

export function CreditsPage() {
  const { t, lang } = useLang();
  return (
    <section className="section max-w-5xl">
      <h1 className="text-4xl font-extrabold"><Bi v={{ ta: 'புகைப்பட நன்றி', en: 'Photo Credits' }} altClassName="!text-base font-sans text-primary" /></h1>
      <p lang={lang} className="mt-4 text-ink/70">
        {t({ ta: 'இந்த இணையதளத்தில் உள்ள புகைப்படங்கள் Wikimedia Commons மற்றும் Flickr-இல் இருந்து Creative Commons உரிமத்தின் கீழ் பயன்படுத்தப்பட்டவை. புகைப்படக் கலைஞர்களுக்கு நன்றி.', en: 'Photographs on this site are used under Creative Commons licences from Wikimedia Commons and Flickr. Thanks to the photographers.' })}
      </p>
      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {(Object.keys(CREDITS) as PhotoKey[]).map((k) => (
          <li key={k} className="card flex items-center gap-4 p-3">
            <img src={photo(k)} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 text-sm">
              <a href={CREDITS[k].page} target="_blank" rel="noreferrer" className="block font-semibold text-primary underline [overflow-wrap:anywhere]">{CREDITS[k].title}</a>
              <p className="text-ink/60 [overflow-wrap:anywhere]">© {CREDITS[k].author}</p>
              <p className="text-xs text-ink/45">{CREDITS[k].license}</p>
            </div>
          </li>
        ))}
        {Object.entries(ONLINE).map(([id, p]) => (
          <li key={id} className="card flex items-center gap-4 p-3">
            <img src={p.src} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-16 w-20 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 text-sm">
              <a href={p.page} target="_blank" rel="noreferrer" className="block font-semibold text-primary underline [overflow-wrap:anywhere]">{decodeURIComponent(p.page.split('File:')[1] ?? id).replace(/_/g, ' ')}</a>
              <p className="text-ink/60 [overflow-wrap:anywhere]">© {p.author}</p>
              <p className="text-xs text-ink/45">{p.license} · Wikimedia Commons</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
