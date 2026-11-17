import { MessageCircle, PartyPopper, Ruler, Tent, type LucideIcon } from 'lucide-react';
import { useLang, type L } from '../i18n/lang';
import { FAQS, SAMPLE_REVIEWS } from '../data/config';
import { Stars } from './ui';

/* ---------------- How it works / FAQ / Reviews ---------------- */

export function HowItWorks() {
  const { t, lang } = useLang();
  const steps: { i: LucideIcon; v: L; d: L }[] = [
    { i: Tent, v: { ta: 'பந்தலைத் தேர்ந்தெடுங்கள்', en: 'Choose a pandal' }, d: { ta: 'ஷீட், தென்னோலை அல்லது சாமியானா — அல்லது ஒரு பேக்கேஜ்.', en: 'Sheet, Theenolai or Samiyana — or a ready package.' } },
    { i: Ruler, v: { ta: 'அளவு & பொருட்கள்', en: 'Size & items' }, d: { ta: 'நீளம் × அகலம், விளக்கு, நாற்காலி — உடனே விலை.', en: 'Length × breadth, lights, chairs — instant price.' } },
    { i: MessageCircle, v: { ta: 'WhatsApp-ல் அனுப்புங்கள்', en: 'Send on WhatsApp' }, d: { ta: 'சுருக்கத்தை அனுப்புங்கள்; இடத்தைப் பார்த்து இறுதி விலை.', en: 'Send the summary; we confirm after a site visit.' } },
    { i: PartyPopper, v: { ta: 'விழாவைக் கொண்டாடுங்கள்', en: 'Celebrate!' }, d: { ta: 'குறித்த நேரத்தில் அமைத்து, விழா முடிந்ததும் பிரிப்போம்.', en: 'We set up on time and clear up after the function.' } },
  ];
  return (
    <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.v.en} className="card relative p-6">
          <span className="absolute right-5 top-4 text-5xl font-extrabold text-primary/10">{i + 1}</span>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary-light to-primary-dark text-gold-1 shadow-glow ring-1 ring-gold-1/30"><s.i size={24} strokeWidth={1.6} /></span>
          <h3 className="mt-4 text-lg font-extrabold"><span lang={lang}>{t(s.v)}</span></h3>
          <p lang={lang} className="mt-2 text-sm text-ink/65">{t(s.d)}</p>
        </li>
      ))}
    </ol>
  );
}

export function Faq() {
  const { t, lang } = useLang();
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQS.map((f, i) => (
        <details key={f.q.en} className="card group p-0" open={i === 0}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-bold">
            <span>
              <span lang={lang} className="block">{t(f.q)}</span>
            </span>
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary transition group-open:rotate-45">+</span>
          </summary>
          <p lang={lang} className="px-5 pb-5 text-ink/70">{t(f.a)}</p>
        </details>
      ))}
    </div>
  );
}

export function Reviews() {
  const { t, lang } = useLang();
  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {SAMPLE_REVIEWS.map((r) => (
          <figure key={r.name} className="card relative p-6">
            <span className="absolute right-5 top-2 font-serif text-7xl leading-none text-marigold/30" aria-hidden>”</span>
            <Stars n={r.stars} />
            <blockquote lang={lang} className="mt-3 text-ink/80">{t(r.text)}</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-primary to-marigold font-bold text-white">{r.name.replace(/^.*?\.\s*/, '').charAt(0)}</span>
              <span>
                <span lang="ta" className="block font-bold">{r.name}</span>
                <span lang={lang} className="block text-xs text-ink/50">{t(r.event)} · {t(r.town)}</span>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p lang={lang} className="mt-4 text-center text-xs text-ink/45">{t({ ta: '* மாதிரி விமர்சனங்கள் — உண்மையான வாடிக்கையாளர் கருத்துகளால் மாற்றவும்.', en: '* Sample reviews — replace with real customer feedback.' })}</p>
    </>
  );
}
