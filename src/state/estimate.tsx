import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { useCatalog } from './catalog';
import { useContent, type Combo } from './content';
import type { L } from '../i18n/lang';
import { CHARGES, FEET_PER_METRE, ITEMS, PANDALS, type Category, type Item, type Package, type Pandal } from '../data/config';

export type Unit = 'ft' | 'm';

export type EstimateState = {
  pandalId: Pandal['id'] | null;
  length: number;
  breadth: number;
  unit: Unit;
  distanceKm: number;
  qty: Record<string, number>;
  board: BoardDesign;
  packageId: string | null;
};

export const BOARD_STYLES = ['primary', 'ivory', 'emerald', 'rose', 'marigold', 'led'] as const;
export const BOARD_KINDS = ['wedding', 'name', 'birthday', 'housewarming'] as const;
export type BoardDesign = { line1: string; line2: string; date: string; style: (typeof BOARD_STYLES)[number]; kind?: (typeof BOARD_KINDS)[number] };

const INITIAL: EstimateState = {
  pandalId: null,
  length: 40,
  breadth: 20,
  unit: 'ft',
  distanceKm: 10,
  qty: {},
  board: { line1: '', line2: '', date: '', style: 'primary', kind: 'wedding' },
  packageId: null,
};

export type Line = { item: Item; qty: number; total: number };

export type Breakdown = {
  pandal: Pandal | null;
  lengthFt: number;
  breadthFt: number;
  areaSqft: number;
  areaSqm: number;
  pandalCost: number;
  minApplied: boolean;
  lines: Record<Category, Line[]>;
  subtotals: Record<Category, number>;
  transport: number;
  total: number;
  hasAnything: boolean;
  /** Combo package saving, while the selection still contains the whole combo. */
  combo: { id: string; name: L; discount: number } | null;
};

export function toFeet(v: number, unit: Unit) {
  return unit === 'm' ? v * FEET_PER_METRE : v;
}

export function computeEstimate(s: EstimateState, items: Item[] = ITEMS, combos: Combo[] = []): Breakdown {
  const pandal = PANDALS.find((p) => p.id === s.pandalId) ?? null;
  const lengthFt = toFeet(Math.max(0, s.length || 0), s.unit);
  const breadthFt = toFeet(Math.max(0, s.breadth || 0), s.unit);
  const areaSqft = lengthFt * breadthFt;
  const areaSqm = areaSqft / (FEET_PER_METRE * FEET_PER_METRE);

  let pandalCost = 0;
  let minApplied = false;
  if (pandal && areaSqft > 0) {
    const raw = areaSqft * pandal.pricePerSqft;
    minApplied = raw < pandal.minCharge;
    pandalCost = Math.max(raw, pandal.minCharge);
  }

  const lines: Record<Category, Line[]> = { decor: [], lighting: [], rentals: [], sound: [] };
  for (const item of items) {
    const q = s.qty[item.id] ?? 0;
    if (q > 0) lines[item.category].push({ item, qty: q, total: q * item.price });
  }
  const sum = (ls: Line[]) => ls.reduce((a, l) => a + l.total, 0);
  const subtotals = {
    decor: sum(lines.decor),
    lighting: sum(lines.lighting),
    rentals: sum(lines.rentals),
    sound: sum(lines.sound),
  };
  const itemsTotal = subtotals.decor + subtotals.lighting + subtotals.rentals + subtotals.sound;
  const hasAnything = pandalCost > 0 || itemsTotal > 0;

  // Transport: Rs 200 for every 10 km (rounded up). No separate labour / setup & dismantling charge.
  const blocks = Math.max(1, Math.ceil(Math.max(0, s.distanceKm || 0) / CHARGES.transportBlockKm));
  const transport = hasAnything ? blocks * CHARGES.transportPerBlock : 0;

  // Combo saving: the combo's items (and pandal size) at normal prices, minus the combo price.
  let combo: Breakdown['combo'] = null;
  const c = s.packageId ? combos.find((x) => x.id === s.packageId) : undefined;
  if (c) {
    const byId = new Map(items.map((i) => [i.id, i]));
    const hasItems = Object.entries(c.items).every(([id, q]) => byId.has(id) && (s.qty[id] ?? 0) >= q);
    const cp = c.pandalId ? PANDALS.find((p) => p.id === c.pandalId) : undefined;
    const comboArea = c.length * c.breadth;
    const hasPandal = !c.pandalId || (pandal?.id === c.pandalId && areaSqft >= comboArea);
    if (hasItems && hasPandal) {
      const itemsBase = Object.entries(c.items).reduce((a, [id, q]) => a + (byId.get(id)?.price ?? 0) * q, 0);
      const pandalBase = cp && comboArea > 0 ? Math.max(comboArea * cp.pricePerSqft, cp.minCharge) : 0;
      const discount = Math.max(0, Math.round(itemsBase + pandalBase - c.price));
      if (discount > 0) combo = { id: c.id, name: c.name, discount };
    }
  }

  return {
    pandal,
    lengthFt,
    breadthFt,
    areaSqft,
    areaSqm,
    pandalCost,
    minApplied,
    lines,
    subtotals,
    transport,
    total: pandalCost + itemsTotal + transport - (combo?.discount ?? 0),
    hasAnything,
    combo,
  };
}

type Ctx = {
  state: EstimateState;
  breakdown: Breakdown;
  update: (patch: Partial<EstimateState>) => void;
  setQty: (id: string, q: number) => void;
  reset: () => void;
  applyPackage: (p: Package) => void;
  applyCombo: (c: Combo) => void;
};

const EstimateContext = createContext<Ctx | null>(null);
const OLD_SHARED_KEY = 'pandal-estimate-v3'; // one cart for everybody on the phone: replaced by one cart per account
const GUEST_KEY = 'pandal-estimate-v4:guest';
/** Every account has its own cart, so two people using the same phone/browser never share or change each other's items. */
const keyFor = (mobile?: string | null) => (mobile ? `pandal-estimate-v4:${mobile}` : GUEST_KEY);

function load(key: string): EstimateState {
  try {
    let raw = localStorage.getItem(key);
    // First time this account opens the cart: bring along what they picked as a guest, once.
    if (!raw && key !== GUEST_KEY) {
      raw = localStorage.getItem(GUEST_KEY);
      if (raw) localStorage.removeItem(GUEST_KEY);
    }
    if (raw) {
      const saved = { ...INITIAL, ...JSON.parse(raw) } as EstimateState;
      if (!(BOARD_STYLES as readonly string[]).includes(saved.board?.style)) saved.board = { ...INITIAL.board, ...saved.board, style: 'primary' };
      if (!(BOARD_KINDS as readonly string[]).includes(saved.board?.kind ?? '')) saved.board = { ...saved.board, kind: 'wedding' };
      return saved;
    }
  } catch {
    /* ignore */
  }
  return INITIAL;
}

export function EstimateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const key = keyFor(user?.mobile);
  const [loadedKey, setLoadedKey] = useState(key);
  const [state, setState] = useState<EstimateState>(() => {
    try { localStorage.removeItem(OLD_SHARED_KEY); } catch { /* ignore */ }
    return load(key);
  });

  // A different person logged in (or out): show THEIR cart, not the previous person's.
  if (loadedKey !== key) {
    setLoadedKey(key);
    setState(load(key));
  }

  useEffect(() => {
    if (loadedKey !== key) return;
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, key, loadedKey]);

  const { items } = useCatalog();
  const { combos } = useContent();
  const breakdown = useMemo(() => computeEstimate(state, items, combos), [state, items, combos]);

  const value: Ctx = {
    state,
    breakdown,
    update: (patch) => setState((s) => ({ ...s, ...patch })),
    setQty: (id, q) =>
      setState((s) => ({ ...s, qty: { ...s.qty, [id]: Math.max(0, Math.min(9999, Math.floor(q) || 0)) } })),
    reset: () => setState(INITIAL),
    applyPackage: (p) =>
      setState((s) => ({ ...s, pandalId: p.pandalId, length: p.length, breadth: p.breadth, unit: 'ft', qty: { ...p.qty }, packageId: p.id })),
    applyCombo: (c) =>
      setState((s) => ({
        ...s,
        ...(c.pandalId ? { pandalId: c.pandalId, length: c.length, breadth: c.breadth, unit: 'ft' as const } : {}),
        qty: { ...s.qty, ...Object.fromEntries(Object.entries(c.items).map(([id, q]) => [id, Math.max(q, s.qty[id] ?? 0)])) },
        packageId: c.id,
      })),
  };
  return <EstimateContext.Provider value={value}>{children}</EstimateContext.Provider>;
}

export function useEstimate() {
  const ctx = useContext(EstimateContext);
  if (!ctx) throw new Error('useEstimate must be used inside EstimateProvider');
  return ctx;
}

/** Total for a ready package at the default transport distance. */
export function packageTotal(p: Package) {
  return computeEstimate({ ...INITIAL, pandalId: p.pandalId, length: p.length, breadth: p.breadth, qty: p.qty }).total;
}
