export const SYMBOLS = [
  "AUDCAD",
  "AUDCHF",
  "AUDDKK",
  "AUDHKD",
  "AUDHUF",
  "AUDJPY",
  "AUDNOK",
  "AUDNZD",
  "AUDPLN",
  "AUDSEK",
  "XAUUSD",
] as const;

export type TradableSymbol = (typeof SYMBOLS)[number];

export const DEFAULT_SYMBOL: TradableSymbol = "XAUUSD";

/** Indicative base price used when opening a market order on a symbol. */
export const SYMBOL_BASE_PRICE: Record<string, number> = {
  AUDCAD: 0.9012,
  AUDCHF: 0.5701,
  AUDDKK: 4.4325,
  AUDHKD: 5.0812,
  AUDHUF: 231.45,
  AUDJPY: 98.412,
  AUDNOK: 6.8321,
  AUDNZD: 1.0912,
  AUDPLN: 2.6104,
  AUDSEK: 6.3417,
  XAUUSD: 4046,
};

export function isTradableSymbol(v: string): boolean {
  return (SYMBOLS as readonly string[]).includes(v);
}
