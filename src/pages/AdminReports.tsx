import { Award, Check, IndianRupee, LoaderCircle, Percent, Star, TrendingUp, Trophy, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { inr, useLang, type L } from '../i18n/lang';
import { callApi } from '../state/api';
import { DEFAULT_COMPANY, useCompany } from '../state/company';
import type { AOrder, Prov } from './Admin';

/** Default provider share (%) from Admin → Profit settings. */
function usePayoutPercent() {
  const { settings } = useCompany();
  const n = Number(settings.payoutPercent);
  return Number.isFinite(n) && n >= 0 && n <= 100 ? n : 70;
}

/** What the provider is paid for an order: the amount entered, or the default share when nothing was entered. */
export const payoutOf = (o: AOrder, pct: number) =>
  o.payout != null ? o.payout : o.providerMobile ? Math.round((o.total * pct) / 100) : 0;
export const profitOf = (o: AOrder, pct: number) => o.total - payoutOf(o, pct) - (o.costs ?? 0);

/* ---------------- per-order costs (inside the admin order card) ---------------- */

export function CostsBox({ o, token, onChanged }: { o: AOrder; token: string; onChanged: () => void }) {
  const { t, lang } = useLang();
  const pct = usePayoutPercent();
  const [payout, setPayout] = useState(o.payout != null ? String(o.payout) : '');
  const [costs, setCosts] = useState(o.costs ? String(o.costs) : '');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => { setPayout(o.payout != null ? String(o.payout) : ''); setCosts(o.costs ? String(o.costs) : ''); }, [o.payout, o.costs]);

  const preview: AOrder = { ...o, payout: payout === '' ? null : Number(payout) || 0, costs: Number(costs) || 0 };
  const profit = profitOf(preview, pct);
  const changed = payout !== (o.payout != null ? String(o.payout) : '') || (Number(costs) || 0) !== (o.costs ?? 0);
  const save = async () => {
    setBusy(true);
    setError(false);
    const r = await callApi({ action: 'adminCosts', token, ref: o.ref, payout: payout === '' ? '' : Number(payout) || 0, costs: Number(costs) || 0 });
    setBusy(false);
    if (!r.ok) return setError(true);
    setSaved(true);
    onChanged();
  };
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-ink/10">
      <p lang={lang} className="mb-2 flex items-center gap-2 text-sm font-bold"><Wallet size={16} className="text-primary" /> {t({ ta: 'செலவு & லாபம்', en: 'Costs and profit' })}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block">
          <span lang={lang} className="mb-1 block text-xs font-semibold text-ink/55">{t({ ta: 'வழங்குநருக்குக் கொடுப்பது (₹)', en: 'Provider payout (₹)' })}</span>
          <input className="w-full" type="number" min={0} value={payout} onChange={(e) => { setPayout(e.target.value); setSaved(false); }}
            placeholder={o.providerMobile ? `${pct}% = ${Math.round((o.total * pct) / 100)}` : '0'} />
        </label>
        <label className="block">
          <span lang={lang} className="mb-1 block text-xs font-semibold text-ink/55">{t({ ta: 'பிற செலவுகள் (₹)', en: 'Other costs (₹)' })}</span>
          <input className="w-full" type="number" min={0} value={costs} onChange={(e) => { setCosts(e.target.value); setSaved(false); }} placeholder={t({ ta: 'வாகனம், கூலி…', en: 'Transport, labour…' })} />
        </label>
        <button type="button" onClick={() => void save()} disabled={busy || !changed} className="btn-primary self-end !py-2.5">
          {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Check size={15} />} <span lang={lang}>{saved && !changed ? t({ ta: 'சேமிக்கப்பட்டது', en: 'Saved' }) : t({ ta: 'சேமி', en: 'Save' })}</span>
        </button>
      </div>
      <p className="mt-2 text-sm">
        <span lang={lang} className="text-ink/55">{t({ ta: 'லாபம்', en: 'Profit' })}: </span>
        <b className={profit >= 0 ? 'text-emerald-700' : 'text-red-600'}>{inr(profit)}</b>
        <span className="text-ink/40"> = {inr(o.total)} − {inr(payoutOf(preview, pct))} − {inr(preview.costs ?? 0)}</span>
        {payout === '' && o.providerMobile && <span lang={lang} className="ml-1 text-xs text-ink/40">({t({ ta: `இயல்பு ${pct}%`, en: `default ${pct}%` })})</span>}
      </p>
      {error && <p lang={lang} className="mt-1 text-xs font-semibold text-amber-700">{t({ ta: 'சேமிக்க முடியவில்லை.', en: 'Could not save.' })}</p>}
    </div>
  );
}

/* ---------------- provider ranking ---------------- */

/** Ranking score: rating (pulled towards 4★ while there are few reviews) plus completed jobs. */
const scoreOf = (p: Prov) => {
  const n = p.ratingCount ?? 0;
  const avg = n ? ((p.ratingAvg ?? 0) * n + 4 * 2) / (n + 2) : 0;
  return avg * 20 + Math.min(p.doneJobs ?? 0, 30);
};

export function ProviderRanking({ providers, limit }: { providers: Prov[]; limit?: number }) {
  const { t, lang } = useLang();
  const ranked = [...providers].filter((p) => p.active).sort((a, b) => scoreOf(b) - scoreOf(a) || (b.doneJobs ?? 0) - (a.doneJobs ?? 0)).slice(0, limit ?? 99);
  const medal = ['bg-gradient-to-br from-amber-300 to-amber-500', 'bg-gradient-to-br from-slate-300 to-slate-400', 'bg-gradient-to-br from-orange-300 to-orange-500'];
  if (!ranked.length) return <p lang={lang} className="rounded-2xl bg-white p-5 text-sm text-ink/55 ring-1 ring-slate-200">{t({ ta: 'செயலில் உள்ள வழங்குநர்கள் இல்லை.', en: 'No active providers yet.' })}</p>;
  return (
    <ol className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      {ranked.map((p, i) => (
        <li key={p.mobile} className="flex items-center gap-3 px-4 py-3">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-extrabold ${i < 3 ? `${medal[i]} text-white shadow` : 'bg-slate-100 text-ink/50'}`}>{i + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{p.tier === 'Premium' ? '★ ' : ''}{p.business || p.name}</span>
            <span lang={lang} className="block text-xs text-ink/50">
              {(p.ratingCount ?? 0) > 0
                ? <><span className="text-amber-500">★ {p.ratingAvg?.toFixed(1)}</span> · {p.ratingCount} {t({ ta: 'மதிப்பீடுகள்', en: p.ratingCount === 1 ? 'review' : 'reviews' })}</>
                : t({ ta: 'இன்னும் மதிப்பீடு இல்லை', en: 'No reviews yet' })}
              {' · '}{p.doneJobs ?? 0} {t({ ta: 'முடிந்த பணிகள்', en: (p.doneJobs ?? 0) === 1 ? 'job completed' : 'jobs completed' })}
            </span>
          </span>
          <span className="shrink-0 text-right">
            <span className="block text-sm font-extrabold">{inr(p.revenue ?? 0)}</span>
            <span lang={lang} className="block text-[10px] text-ink/40">{t({ ta: 'மொத்த வணிகம்', en: 'business done' })}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ---------------- profit report ---------------- */

type Period = 'month' | 'quarter' | 'year' | 'all';
const PERIODS: { id: Period; v: L }[] = [
  { id: 'month', v: { ta: 'இந்த மாதம்', en: 'This month' } },
  { id: 'quarter', v: { ta: '3 மாதங்கள்', en: 'Last 3 months' } },
  { id: 'year', v: { ta: 'இந்த ஆண்டு', en: 'This year' } },
  { id: 'all', v: { ta: 'அனைத்தும்', en: 'All time' } },
];

export default function AdminReports({ orders, providers, token }: { orders: AOrder[]; providers: Prov[]; token: string }) {
  const { t, lang } = useLang();
  const pct = usePayoutPercent();
  const { settings, save } = useCompany();
  const [period, setPeriod] = useState<Period>('month');
  const [pctInput, setPctInput] = useState(String(pct));
  const [pctBusy, setPctBusy] = useState(false);
  const [pctMsg, setPctMsg] = useState<L | null>(null);
  useEffect(() => setPctInput(String(pct)), [pct]);

  const now = new Date();
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const from = period === 'month' ? `${ym(now)}-01` : period === 'quarter' ? `${ym(new Date(now.getFullYear(), now.getMonth() - 2, 1))}-01` : period === 'year' ? `${now.getFullYear()}-01-01` : '';
  const inPeriod = (o: AOrder) => !from || o.date >= from;

  const r = useMemo(() => {
    const done = orders.filter((o) => o.status === 'Done' && inPeriod(o));
    const open = orders.filter((o) => !['Done', 'Cancelled', 'Rejected'].includes(o.status) && inPeriod(o));
    const revenue = done.reduce((a, o) => a + o.total, 0);
    const payouts = done.reduce((a, o) => a + payoutOf(o, pct), 0);
    const costs = done.reduce((a, o) => a + (o.costs ?? 0), 0);
    const profit = revenue - payouts - costs;
    const missing = done.filter((o) => o.payout == null && o.providerMobile).length;
    // last 6 months
    const months = Array.from({ length: 6 }, (_, i) => ym(new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)));
    const byMonth = months.map((m) => {
      const list = orders.filter((o) => o.status === 'Done' && o.date.slice(0, 7) === m);
      const rev = list.reduce((a, o) => a + o.total, 0);
      return { m, rev, profit: list.reduce((a, o) => a + profitOf(o, pct), 0), n: list.length };
    });
    const byProv = providers.map((p) => {
      const list = done.filter((o) => o.providerMobile === p.mobile);
      return { p, n: list.length, rev: list.reduce((a, o) => a + o.total, 0), pay: list.reduce((a, o) => a + payoutOf(o, pct), 0), profit: list.reduce((a, o) => a + profitOf(o, pct), 0) };
    }).filter((x) => x.n > 0).sort((a, b) => b.profit - a.profit);
    return { done, open, revenue, payouts, costs, profit, missing, byMonth, byProv, pipeline: open.reduce((a, o) => a + o.total, 0) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, providers, pct, period]);

  const maxRev = Math.max(1, ...r.byMonth.map((m) => m.rev));
  const margin = r.revenue ? Math.round((r.profit / r.revenue) * 100) : 0;
  const savePct = async () => {
    const n = Math.round(Number(pctInput));
    if (!(n >= 0 && n <= 100)) return setPctMsg({ ta: '0 முதல் 100 வரை எண் தேவை.', en: 'Enter a number from 0 to 100.' });
    setPctBusy(true);
    setPctMsg(null);
    const res = await callApi<{ settings: Partial<typeof DEFAULT_COMPANY> }>({ action: 'adminSaveSettings', token, settings: { payoutPercent: String(n) } });
    setPctBusy(false);
    if (!res.ok) return setPctMsg(res.error === 'BAD_ACTION' ? { ta: 'சர்வர் ஸ்கிரிப்ட் பழையது.', en: 'The server script is out of date.' } : { ta: 'சேமிக்க முடியவில்லை.', en: 'Could not save.' });
    save({ ...settings, ...res.settings, payoutPercent: String(n) });
    setPctMsg({ ta: 'சேமிக்கப்பட்டது.', en: 'Saved.' });
  };

  const kpis: { label: L; value: string; icon: typeof Wallet; tone: string; hint?: L }[] = [
    { label: { ta: 'வருவாய் (முடிந்தவை)', en: 'Revenue (completed)' }, value: inr(r.revenue), icon: IndianRupee, tone: 'bg-sky-100 text-sky-700', hint: { ta: `${r.done.length} முன்பதிவுகள்`, en: `${r.done.length} bookings` } },
    { label: { ta: 'வழங்குநர் கட்டணம்', en: 'Provider payouts' }, value: inr(r.payouts), icon: Wallet, tone: 'bg-indigo-100 text-indigo-700' },
    { label: { ta: 'பிற செலவுகள்', en: 'Other costs' }, value: inr(r.costs), icon: Wallet, tone: 'bg-orange-100 text-orange-700' },
    { label: { ta: 'நிகர லாபம்', en: 'Net profit' }, value: inr(r.profit), icon: TrendingUp, tone: r.profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700', hint: { ta: `லாப விகிதம் ${margin}%`, en: `${margin}% margin` } },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 lang={lang} className="flex items-center gap-2 text-lg font-extrabold"><TrendingUp size={20} className="text-primary" /> {t({ ta: 'லாபக் கணக்கு', en: 'Profit report' })}</h2>
        <div className="flex gap-1 overflow-x-auto rounded-full bg-white p-1 ring-1 ring-slate-200">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" onClick={() => setPeriod(p.id)} aria-pressed={period === p.id}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${period === p.id ? 'bg-primary text-white' : 'text-ink/60 hover:text-primary'}`}>
              <span lang={lang}>{t(p.v)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label.en} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${k.tone}`}><k.icon size={19} /></span>
            <p className="mt-3 text-2xl font-extrabold tracking-tight">{k.value}</p>
            <p lang={lang} className="text-xs font-semibold text-ink/55">{t(k.label)}</p>
            {k.hint && <p lang={lang} className="text-[11px] text-ink/40">{t(k.hint)}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <p lang={lang} className="rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
          <b>{inr(r.pipeline)}</b> {t({ ta: `நடப்பில் உள்ள ${r.open.length} முன்பதிவுகளின் மதிப்பு (இன்னும் லாபத்தில் சேர்க்கப்படவில்லை).`, en: `in ${r.open.length} bookings still in progress (not counted in profit yet).` })}
        </p>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
          <Percent size={16} className="text-primary" />
          <span lang={lang}>{t({ ta: 'இயல்பு வழங்குநர் பங்கு', en: 'Default provider share' })}</span>
          <input className="!w-20 !py-1.5 text-center" type="number" min={0} max={100} value={pctInput} onChange={(e) => setPctInput(e.target.value)} aria-label="Default provider share %" />
          <span>%</span>
          <button type="button" onClick={() => void savePct()} disabled={pctBusy || pctInput === String(pct)} className="btn-ghost !px-3 !py-1.5 text-xs">{pctBusy ? <LoaderCircle size={13} className="animate-spin" /> : null}<span lang={lang}>{t({ ta: 'சேமி', en: 'Save' })}</span></button>
          {pctMsg && <span lang={lang} className="text-xs text-ink/50">{t(pctMsg)}</span>}
          {r.missing > 0 && <span lang={lang} className="w-full text-xs text-ink/45">{t({ ta: `${r.missing} முன்பதிவுகளுக்குக் கட்டணம் உள்ளிடப்படவில்லை — இயல்புப் பங்கு பயன்படுத்தப்பட்டது.`, en: `${r.missing} completed booking${r.missing === 1 ? ' has' : 's have'} no payout entered — the default share is used.` })}</span>}
        </div>
      </div>

      {/* last 6 months */}
      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
        <p lang={lang} className="mb-4 text-sm font-bold">{t({ ta: 'கடந்த 6 மாதங்கள் (முடிந்த முன்பதிவுகள்)', en: 'Last 6 months (completed bookings)' })}</p>
        <div className="flex h-44 items-end gap-2 sm:gap-4">
          {r.byMonth.map((m) => (
            <div key={m.m} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${m.m}: ${inr(m.rev)} revenue, ${inr(m.profit)} profit, ${m.n} bookings`}>
              <span className="text-[10px] font-bold text-ink/60">{m.rev ? inr(m.profit) : ''}</span>
              <div className="relative flex w-full max-w-12 flex-1 items-end">
                <span className="absolute bottom-0 w-full rounded-t-lg bg-primary/15" style={{ height: `${(m.rev / maxRev) * 100}%` }} />
                <span className="absolute bottom-0 w-full rounded-t-lg bg-primary" style={{ height: `${(Math.max(0, m.profit) / maxRev) * 100}%` }} />
              </div>
              <span className="text-[11px] font-semibold text-ink/50">{new Date(`${m.m}-01T00:00:00`).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN', { month: 'short' })}</span>
            </div>
          ))}
        </div>
        <p lang={lang} className="mt-3 flex gap-4 text-[11px] text-ink/55">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-primary/15" /> {t({ ta: 'வருவாய்', en: 'Revenue' })}</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-primary" /> {t({ ta: 'லாபம்', en: 'Profit' })}</span>
        </p>
      </div>

      {/* by provider */}
      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <p lang={lang} className="border-b border-slate-100 px-4 py-3 text-sm font-bold">{t({ ta: 'வழங்குநர் வாரியாக லாபம்', en: 'Profit by provider' })}</p>
        {r.byProv.length === 0 ? (
          <p lang={lang} className="px-4 py-6 text-sm text-ink/50">{t({ ta: 'இந்தக் காலத்தில் முடிந்த முன்பதிவுகள் இல்லை.', en: 'No completed bookings in this period.' })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-ink/55">
                <tr><th className="px-4 py-2 font-semibold">{t({ ta: 'வழங்குநர்', en: 'Provider' })}</th><th className="px-3 py-2 text-right font-semibold">{t({ ta: 'பணிகள்', en: 'Jobs' })}</th><th className="px-3 py-2 text-right font-semibold">{t({ ta: 'வருவாய்', en: 'Revenue' })}</th><th className="px-3 py-2 text-right font-semibold">{t({ ta: 'கட்டணம்', en: 'Payout' })}</th><th className="px-4 py-2 text-right font-semibold">{t({ ta: 'லாபம்', en: 'Profit' })}</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.byProv.map((x) => (
                  <tr key={x.p.mobile}>
                    <td className="px-4 py-2.5 font-semibold">{x.p.business || x.p.name}</td>
                    <td className="px-3 py-2.5 text-right">{x.n}</td>
                    <td className="px-3 py-2.5 text-right">{inr(x.rev)}</td>
                    <td className="px-3 py-2.5 text-right text-ink/60">{inr(x.pay)}</td>
                    <td className={`px-4 py-2.5 text-right font-bold ${x.profit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{inr(x.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ranking */}
      <div>
        <h2 lang={lang} className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Trophy size={20} className="text-amber-500" /> {t({ ta: 'வழங்குநர் தரவரிசை', en: 'Provider ranking' })}</h2>
        <ProviderRanking providers={providers} />
        <p lang={lang} className="mt-2 flex items-center gap-1 text-[11px] text-ink/45"><Award size={12} /><Star size={12} className="fill-amber-400 text-amber-400" /> {t({ ta: 'வாடிக்கையாளர் மதிப்பீடுகள் மற்றும் முடிந்த பணிகளின் அடிப்படையில் தரவரிசை.', en: 'Ranked by customer ratings and the number of jobs completed.' })}</p>
      </div>
    </div>
  );
}
