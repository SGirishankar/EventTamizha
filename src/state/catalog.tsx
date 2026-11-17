import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ITEMS, PANDALS, type Category, type Item } from '../data/config';
import type { L } from '../i18n/lang';
import type { ItemIconName } from '../components/icons';
import { callApi, loadBoot } from './api';

/** A product the admin added (stored in the "Products" sheet). */
export type AddedProduct = { id: string; category: Category; name: L; unit: L; price: number; img: string };
/** A pandal rate the admin changed. */
export type PandalRate = { id: string; pricePerSqft: number; minCharge: number };
type Remote = { added: AddedProduct[]; hidden: string[]; overrides?: AddedProduct[]; pandals?: PandalRate[] };

/** The rates built into the website; used when the admin has not changed a pandal's rate. */
const DEFAULT_RATES = new Map(PANDALS.map((p) => [p.id as string, { pricePerSqft: p.pricePerSqft, minCharge: p.minCharge }]));

/** Puts the admin's rates into the shared PANDALS list so every price calculation and card uses them. */
function applyRates(list: PandalRate[] | undefined) {
  const set = new Map((list ?? []).map((r) => [r.id, r]));
  for (const p of PANDALS) {
    const r = set.get(p.id);
    const d = DEFAULT_RATES.get(p.id)!;
    p.pricePerSqft = r && r.pricePerSqft > 0 ? r.pricePerSqft : d.pricePerSqft;
    p.minCharge = r && r.minCharge >= 0 ? r.minCharge : d.minCharge;
  }
}

const KEY = 'event360-products-v1';
const ICON: Record<Category, ItemIconName> = { decor: 'Flower2', lighting: 'Lightbulb', rentals: 'Armchair', sound: 'Speaker' };

const toItem = (p: AddedProduct): Item => ({ id: p.id, category: p.category, name: p.name, unit: p.unit, price: p.price, icon: ICON[p.category] ?? 'Sparkles', img: p.img || undefined, custom: true });

function loadCache(): Remote {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || 'null') as Remote | null;
    if (r && Array.isArray(r.added) && Array.isArray(r.hidden)) return r;
  } catch { /* ignore */ }
  return { added: [], hidden: [] };
}

type Ctx = {
  /** Everything customers can see and order: built-in items minus hidden ones, plus admin-added products. */
  items: Item[];
  /** Built-in products the admin removed (can be restored). */
  hiddenItems: Item[];
  /** Ids of pandal types whose rate the admin changed (they can be reset to the built-in rate). */
  changedPandals: string[];
  reload: () => Promise<void>;
};

const CatalogContext = createContext<Ctx | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [remote, setRemote] = useState<Remote>(loadCache);

  const reload = useCallback(async () => {
    const r = await callApi<Remote>({ action: 'products' });
    if (!r.ok) return; // offline, demo mode or an older script: keep what we have
    const next = { added: r.added ?? [], hidden: r.hidden ?? [], overrides: r.overrides ?? [], pandals: r.pandals ?? [] };
    setRemote(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  // First load shares one combined request with offers and company details; an older script falls back to its own call.
  useEffect(() => {
    void loadBoot().then((r) => {
      if (!r.ok) return void reload();
      const next = { added: (r.products.added ?? []) as Remote['added'], hidden: r.products.hidden ?? [], overrides: (r.products.overrides ?? []) as Remote['overrides'], pandals: (r.products.pandals ?? []) as PandalRate[] };
      setRemote(next);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    });
  }, [reload]);

  const value = useMemo<Ctx>(() => {
    applyRates(remote.pandals); // before anything below renders, so prices are right on the first paint
    const hidden = new Set(remote.hidden);
    const over = new Map((remote.overrides ?? []).map((o) => [o.id, o]));
    // Built-in items the admin edited keep their id and icon but take the saved name, unit, price and photo.
    const builtIn = ITEMS.filter((i) => !hidden.has(i.id)).map((i) => {
      const o = over.get(i.id);
      return o ? { ...i, name: o.name, unit: o.unit, price: o.price, img: o.img || undefined, edited: true } : i;
    });
    return {
      items: [...builtIn, ...remote.added.map(toItem)],
      hiddenItems: ITEMS.filter((i) => hidden.has(i.id)),
      changedPandals: (remote.pandals ?? []).map((r) => r.id),
      reload,
    };
  }, [remote, reload]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Ctx {
  const c = useContext(CatalogContext);
  if (!c) throw new Error('useCatalog must be used inside CatalogProvider');
  return c;
}
