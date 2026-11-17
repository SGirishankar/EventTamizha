import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { L } from '../i18n/lang';
import type { Pandal } from '../data/config';
import { callApi, loadBoot } from './api';

/** An offer the admin wrote (Admin → Offers & Combos). */
export type Offer = { id: string; title: L; details: L; badge: string; validTill: string; active: boolean };

/** A combo package: a set of products (and optionally a pandal size) sold together at a special price. */
export type Combo = {
  id: string; name: L; details: L; pandalId: Pandal['id'] | ''; length: number; breadth: number;
  items: Record<string, number>; price: number; img: string; active: boolean;
};

type Remote = { offers: Offer[]; packages: Combo[] };
const KEY = 'event360-content-v1';

function loadCache(): Remote {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || 'null') as Remote | null;
    if (r && Array.isArray(r.offers) && Array.isArray(r.packages)) return r;
  } catch { /* ignore */ }
  return { offers: [], packages: [] };
}

type Ctx = { offers: Offer[]; combos: Combo[]; reload: () => Promise<void> };
const ContentContext = createContext<Ctx | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [remote, setRemote] = useState<Remote>(loadCache);
  const reload = useCallback(async () => {
    const r = await callApi<Remote>({ action: 'content' });
    if (!r.ok) return; // offline or an older script: keep what we have
    const next = { offers: r.offers ?? [], packages: r.packages ?? [] };
    setRemote(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    void loadBoot().then((r) => {
      if (!r.ok) return void reload();
      const next = { offers: (r.content.offers ?? []) as Remote['offers'], packages: (r.content.packages ?? []) as Remote['packages'] };
      setRemote(next);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    });
  }, [reload]);
  const value = useMemo<Ctx>(() => ({ offers: remote.offers, combos: remote.packages, reload }), [remote, reload]);
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): Ctx {
  const c = useContext(ContentContext);
  if (!c) throw new Error('useContent must be used inside ContentProvider');
  return c;
}
