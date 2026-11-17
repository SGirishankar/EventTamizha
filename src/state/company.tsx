import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BUSINESS, TOWNS } from '../data/config';
import type { L } from '../i18n/lang';
import { callApi, loadBoot } from './api';

/** Company details the admin can edit (Admin → Company). Stored in the "Settings" sheet. */
export type CompanySettings = {
  nameTa: string; nameEn: string; descriptorTa: string; descriptorEn: string; taglineTa: string; taglineEn: string;
  aboutTa: string; aboutEn: string; phone: string; whatsapp: string; email: string;
  addressTa: string; addressEn: string; hoursTa: string; hoursEn: string; towns: string;
  /** Default share of the order value paid to the provider, in % (used in the profit report when no payout is entered). */
  payoutPercent: string;
};

const KEY = 'event360-company-v1';
const digits = (s: string) => s.replace(/\D/g, '').slice(-10);
const townsText = (ts: L[]) => ts.map((x) => `${x.ta} | ${x.en}`).join('\n');
const parseTowns = (s: string): L[] =>
  s.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => {
    const [ta, en] = l.split('|').map((x) => x.trim());
    return { ta: ta || en || '', en: en || ta || '' };
  }).filter((x) => x.ta);

/** The details built into the website — used until the admin saves their own. */
export const DEFAULT_COMPANY: CompanySettings = {
  nameTa: BUSINESS.name.ta, nameEn: BUSINESS.name.en,
  descriptorTa: BUSINESS.descriptor.ta, descriptorEn: BUSINESS.descriptor.en,
  taglineTa: BUSINESS.tagline.ta, taglineEn: BUSINESS.tagline.en,
  aboutTa: BUSINESS.about.ta, aboutEn: BUSINESS.about.en,
  phone: digits(BUSINESS.phoneHref), whatsapp: digits(BUSINESS.whatsapp), email: BUSINESS.email,
  addressTa: BUSINESS.address.ta, addressEn: BUSINESS.address.en,
  hoursTa: BUSINESS.hours.ta, hoursEn: BUSINESS.hours.en,
  towns: townsText(TOWNS),
  payoutPercent: '70',
};

/**
 * Copies settings into the shared BUSINESS / TOWNS objects, so plain helpers (e.g. WhatsApp links) see them too.
 * Components re-render through useCompany().
 */
function apply(s: CompanySettings) {
  BUSINESS.name = { ta: s.nameTa || s.nameEn, en: s.nameEn || s.nameTa };
  BUSINESS.descriptor = { ta: s.descriptorTa || s.descriptorEn, en: s.descriptorEn || s.descriptorTa };
  BUSINESS.tagline = { ta: s.taglineTa || s.taglineEn, en: s.taglineEn || s.taglineTa };
  BUSINESS.about = { ta: s.aboutTa || s.aboutEn, en: s.aboutEn || s.aboutTa };
  BUSINESS.address = { ta: s.addressTa || s.addressEn, en: s.addressEn || s.addressTa };
  BUSINESS.hours = { ta: s.hoursTa || s.hoursEn, en: s.hoursEn || s.hoursTa };
  BUSINESS.email = s.email;
  const p = digits(s.phone);
  if (p.length === 10) {
    BUSINESS.phoneDisplay = `+91 ${p.slice(0, 5)} ${p.slice(5)}`;
    BUSINESS.phoneHref = `tel:+91${p}`;
  }
  const w = digits(s.whatsapp || s.phone);
  if (w.length === 10) BUSINESS.whatsapp = `91${w}`;
  const towns = parseTowns(s.towns);
  if (towns.length) TOWNS.splice(0, TOWNS.length, ...towns);
}

function loadCache(): CompanySettings {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null') as Partial<CompanySettings> | null;
    if (c) return { ...DEFAULT_COMPANY, ...c };
  } catch { /* ignore */ }
  return DEFAULT_COMPANY;
}

type Ctx = { settings: CompanySettings; save: (s: CompanySettings) => void; reload: () => Promise<void> };
const CompanyContext = createContext<Ctx | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(() => { const c = loadCache(); apply(c); return c; });

  const save = useCallback((s: CompanySettings) => {
    apply(s);
    setSettings(s);
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  const reload = useCallback(async () => {
    const r = await callApi<{ settings: Partial<CompanySettings> }>({ action: 'settings' });
    if (r.ok) save({ ...DEFAULT_COMPANY, ...r.settings });
  }, [save]);

  useEffect(() => {
    void loadBoot().then((r) => {
      if (r.ok) save({ ...DEFAULT_COMPANY, ...(r.settings as Partial<CompanySettings>) });
      else void reload();
    });
  }, [save, reload]);

  const value = useMemo(() => ({ settings, save, reload }), [settings, save, reload]);
  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

/** Subscribe to company details; call in any component that shows BUSINESS or TOWNS so it updates after a save. */
export function useCompany(): Ctx {
  const c = useContext(CompanyContext);
  if (!c) throw new Error('useCompany must be used inside CompanyProvider');
  return c;
}
