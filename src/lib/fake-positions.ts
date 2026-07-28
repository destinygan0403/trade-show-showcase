// Fictitious positions rendered alongside the user's real ones for a realistic
// demo look. They are read-only (no close button, no P/L credit) and live only
// in memory. Seeded per user so the list is stable across renders.

export type FakePosition = {
  id: string;
  symbol: "XAU/USD";
  side: "Buy" | "Sell";
  lot: number;
  open_price: number;
  base_price: number;
  base_pl: number;
  opened_at: string;
  fake: true;
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStr(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateFakePositions(seedKey: string, n = 22): FakePosition[] {
  const rand = mulberry32(hashStr(seedKey));
  const out: FakePosition[] = [];
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const side: "Buy" | "Sell" = rand() > 0.35 ? "Sell" : "Buy";
    const lot = Number((5 + rand() * 145).toFixed(2)); // 5 -> 150 lot
    const open_price = Number((4050 + (rand() - 0.5) * 120).toFixed(3));
    const base_price = Number((open_price + (rand() - 0.5) * 8).toFixed(3));
    const dir = side === "Sell" ? -1 : 1;
    const base_pl = Number(((base_price - open_price) * dir * lot * 100).toFixed(2));
    out.push({
      id: `fake-${i}-${(rand() * 1e6) | 0}`,
      symbol: "XAU/USD",
      side,
      lot,
      open_price,
      base_price,
      base_pl,
      opened_at: new Date(now - Math.floor(rand() * 72 * 3600 * 1000)).toISOString(),
      fake: true,
    });
  }
  return out;
}
