import { useSyncExternalStore } from "react";

export type Position = {
  id: string;
  symbol: string;
  side: "Sell" | "Buy";
  lot: number;
  openPrice: number;
  currentPrice: number;
  pl: number;
};

export type TradingState = {
  accountName: string;
  accountId: string;
  balance: number;
  currency: string;
  totalPL: number;
  positions: Position[];
};

const defaultState: TradingState = {
  accountName: "GOLD HOLDINGS",
  accountId: "223840870",
  balance: 164_153_230.0,
  currency: "USD",
  totalPL: 8_421_774.35,
  positions: Array.from({ length: 6 }).map((_, i) => ({
    id: `p${i}`,
    symbol: "XAU/USD",
    side: "Sell",
    lot: 75.0,
    openPrice: 4123.769,
    currentPrice: 4046.076,
    pl: 582_431.12 - i * 41_233.7,
  })),
};

const STORAGE_KEY = "trading-state-v1";

function load(): TradingState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch {
    return defaultState;
  }
}

let state: TradingState = defaultState;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function setState(patch: Partial<TradingState>) {
  state = { ...state, ...patch };
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  emit();
}

export function resetState() {
  state = defaultState;
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  emit();
}

function subscribe(l: () => void) {
  if (!hydrated && typeof window !== "undefined") {
    hydrated = true;
    state = load();
    queueMicrotask(emit);
  }
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useTradingState() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => defaultState,
  );
}

let liveStarted = false;
export function startLiveTicker() {
  if (liveStarted || typeof window === "undefined") return;
  liveStarted = true;
  setInterval(() => {
    const drift = (Math.random() - 0.5) * 0.8;
    let plDelta = 0;
    const positions = state.positions.map((p) => {
      const newPrice = Math.max(0, p.currentPrice + drift + (Math.random() - 0.5) * 0.35);
      const dir = p.side === "Sell" ? -1 : 1;
      const change = (newPrice - p.currentPrice) * dir * p.lot * 100 + (Math.random() - 0.5) * 25;
      plDelta += change;
      return {
        ...p,
        currentPrice: Number(newPrice.toFixed(3)),
        pl: p.pl + change,
      };
    });
    state = { ...state, positions, totalPL: state.totalPL + plDelta };
    emit();
  }, 1000);
}

export function formatMoney(n: number, currency = "USD", withSign = false) {
  const sign = n < 0 ? "-" : withSign ? "+" : "";
  const abs = Math.abs(n);
  return `${sign}${abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function formatNumber(n: number, digits = 3) {
  return n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
