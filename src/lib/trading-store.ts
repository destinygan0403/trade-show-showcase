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
  positions: Array.from({ length: 26 }).map((_, i) => {
    const lots = [75.0, 50.0, 100.0, 25.0, 62.5, 80.0, 40.0, 120.0, 30.0, 90.0, 55.0, 35.0, 70.0, 45.0, 85.0, 20.0, 60.0, 95.0, 15.0, 110.0, 65.0, 28.0, 48.0, 72.0, 38.0, 88.0][i];
    const openBase = 4120 + (i % 7) * 1.5;
    const currentBase = 4046 + (Math.random() - 0.5) * 18;
    const side: "Sell" | "Buy" = i % 5 === 0 ? "Buy" : "Sell";
    const dir = side === "Sell" ? -1 : 1;
    const pl = (currentBase - openBase) * dir * lots * 100 + (Math.random() - 0.5) * 5000;
    return {
      id: `p${i}`,
      symbol: "XAU/USD",
      side,
      lot: lots,
      openPrice: Number(openBase.toFixed(3)),
      currentPrice: Number(currentBase.toFixed(3)),
      pl: Number(pl.toFixed(2)),
    };
  }),
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
