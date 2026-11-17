import { BUSINESS, CATEGORY_LABEL, type Category } from '../data/config';
import { inr, type Lang } from '../i18n/lang';
import type { Breakdown, EstimateState } from './estimate';

/** Builds a wa.me link with an optional estimate summary in the chosen language. */
export function whatsappLink(lang: Lang, opts?: { b?: Breakdown; s?: EstimateState; extra?: string }) {
  const T = (l: { ta: string; en: string }) => l[lang];
  const lines: string[] = [
    T({ ta: 'வணக்கம்! பந்தல் / அலங்காரம் பற்றி விசாரிக்க விரும்புகிறேன்.', en: 'Hello! I would like to enquire about pandal / decoration.' }),
  ];
  const { b, s } = opts ?? {};
  if (b && s && b.hasAnything) {
    if (b.pandal) {
      lines.push(
        `${T(b.pandal.name)}: ${s.length} × ${s.breadth} ${s.unit === 'ft' ? T({ ta: 'அடி', en: 'ft' }) : T({ ta: 'மீ', en: 'm' })} = ${Math.round(b.areaSqft)} ${T({ ta: 'ச.அடி', en: 'sq ft' })}`,
      );
    }
    (Object.keys(b.lines) as Category[]).forEach((c) => {
      if (b.lines[c].length) {
        lines.push(`${T(CATEGORY_LABEL[c])}: ` + b.lines[c].map((l) => `${T(l.item.name)} × ${l.qty}`).join(', '));
      }
    });
    if (b.combo) lines.push(`🎁 ${T({ ta: 'காம்போ சலுகை', en: 'Combo offer' })}: ${T(b.combo.name)} (− ${inr(b.combo.discount)})`);
    lines.push(`${T({ ta: 'மதிப்பீடு', en: 'Estimate' })}: ${inr(b.total)}`);
  }
  if (opts?.extra) lines.push(opts.extra);
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}
