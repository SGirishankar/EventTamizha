import { inr, useLang } from '../i18n/lang';
import { CATEGORY_LABEL, CHARGES, ITEM_CATEGORIES } from '../data/config';
import { useEstimate } from '../state/estimate';
import { DEMO_NOTE } from './ui';

const CATS = ITEM_CATEGORIES;

/** Itemised estimate breakdown, used on the estimate and booking pages and in print. */
export function EstimateSummary({ compact = false }: { compact?: boolean }) {
  const { t, lang } = useLang();
  const { breakdown: b, state } = useEstimate();
  const unit = state.unit === 'ft' ? t({ ta: 'அடி', en: 'ft' }) : t({ ta: 'மீ', en: 'm' });
  const Row = ({ label, value, sub, strong }: { label: string; value: number; sub?: string; strong?: boolean }) => (
    <div className={`flex justify-between gap-4 py-1.5 ${strong ? 'font-bold text-ink' : 'text-ink/80'}`}>
      <span lang={lang}>{label}{sub && <span className="block text-xs font-normal text-ink/45">{sub}</span>}</span>
      <span className="shrink-0 tabular-nums">{inr(value)}</span>
    </div>
  );
  const Head = ({ children }: { children: string }) => (
    <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primary">{children}</p>
  );

  return (
    <div lang={lang} className="text-sm">
      <div className="border-b border-dashed border-ink/15 pb-2">
        <Head>{t({ ta: 'பந்தல்', en: 'Pandal' })}</Head>
        {b.pandal && b.areaSqft > 0 ? (
          <Row
            label={t(b.pandal.name)}
            sub={`${state.length} × ${state.breadth} ${unit} = ${Math.round(b.areaSqft).toLocaleString('en-IN')} ${t({ ta: 'ச.அடி', en: 'sq ft' })} × ${inr(b.pandal.pricePerSqft)}${b.minApplied ? ` (${t({ ta: 'குறைந்தபட்சம்', en: 'minimum' })})` : ''}`}
            value={b.pandalCost}
            strong
          />
        ) : (
          <p className="py-1.5 text-ink/45">{t({ ta: 'பந்தல் தேர்ந்தெடுக்கப்படவில்லை', en: 'No pandal selected' })}</p>
        )}
      </div>

      {CATS.map((c) => (
        <div key={c} className="border-b border-dashed border-ink/15 py-2">
          <Head>{t(CATEGORY_LABEL[c])}</Head>
          {b.lines[c].length === 0 ? (
            <p className="py-1 text-ink/35">—</p>
          ) : (
            <>
              {!compact && b.lines[c].map((l) => (
                <Row key={l.item.id} label={`${t(l.item.name)} × ${l.qty}`} sub={`${inr(l.item.price)} / ${t(l.item.unit)}`} value={l.total} />
              ))}
              <Row label={compact ? `${b.lines[c].length} ${t({ ta: 'பொருட்கள்', en: 'items' })}` : t({ ta: 'உபமொத்தம்', en: 'Subtotal' })} value={b.subtotals[c]} strong />
            </>
          )}
        </div>
      ))}

      <div className="py-2">
        <Row label={`${t({ ta: 'போக்குவரத்து', en: 'Transportation' })}`}
          sub={t({ ta: `${state.distanceKm} கி.மீ · ஒவ்வொரு ${CHARGES.transportBlockKm} கி.மீட்டருக்கும் ${inr(CHARGES.transportPerBlock)}`, en: `${state.distanceKm} km · ${inr(CHARGES.transportPerBlock)} per ${CHARGES.transportBlockKm} km` })}
          value={b.transport} />
      </div>

      {b.combo && (
        <div className="my-2 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
          <span>🎁 {t({ ta: 'காம்போ சலுகை', en: 'Combo offer' })} · {t(b.combo.name)}</span>
          <span className="tabular-nums">− {inr(b.combo.discount)}</span>
        </div>
      )}
      <div className="mt-2 flex items-end justify-between rounded-2xl bg-gradient-to-r from-primary to-primary-light px-5 py-4 text-white shadow-glow">
        <span>
          <span className="block text-xs text-white/80">{t({ ta: 'மொத்த மதிப்பீடு (தோராயம்)', en: 'Estimated total (approx.)' })}</span>
          <span className="text-[11px] text-white/65">{t({ ta: 'GST தனி (பொருந்தினால்)', en: 'GST extra if applicable' })}</span>
        </span>
        <span className="text-3xl font-extrabold tabular-nums">{inr(b.total)}</span>
      </div>
      <p className="mt-3 text-xs text-ink/50">ⓘ {t(DEMO_NOTE)}</p>
    </div>
  );
}
