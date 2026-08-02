import { useEffect, useState } from "react";

export type MarketNews = {
  id: string;
  title: string;
  body: string;
  tag: string;
  source: string;
  created_at: string;
};

const POOL: { title: string; body: string; tag: string; source: string }[] = [
  { title: "L'or franchit un nouveau record", body: "Le XAU/USD progresse alors que la Fed adopte un ton plus accommodant.", tag: "XAU/USD", source: "Reuters" },
  { title: "Le dollar recule avant les NFP", body: "Le DXY perd du terrain à l'approche du rapport sur l'emploi américain.", tag: "DXY", source: "Bloomberg" },
  { title: "Les banques centrales accélèrent leurs achats d'or", body: "La demande officielle soutient durablement les cours du métal jaune.", tag: "Macro", source: "FT" },
  { title: "La BCE maintient ses taux", body: "Le marché anticipe désormais une première baisse au quatrième trimestre.", tag: "EUR", source: "CNBC" },
  { title: "Volatilité accrue sur l'AUD/JPY", body: "Les flux de portage se dénouent après les déclarations de la BoJ.", tag: "AUD/JPY", source: "Investing" },
  { title: "Les rendements américains se détendent", body: "Le 10 ans recule, un environnement favorable aux actifs sans rendement.", tag: "Taux", source: "Reuters" },
  { title: "Tensions géopolitiques : ruée vers les valeurs refuges", body: "Les flux acheteurs se renforcent sur l'or et le franc suisse.", tag: "Risque", source: "AFP" },
  { title: "Inflation US en ligne avec les attentes", body: "Le Core PCE ressort à 2,6 %, conforme au consensus des économistes.", tag: "USD", source: "Bloomberg" },
  { title: "L'once teste une résistance clé", body: "Les traders surveillent une cassure technique sur le graphique H4.", tag: "XAU/USD", source: "TradingView" },
  { title: "Le pétrole pèse sur les devises liées aux matières premières", body: "CAD et NOK sous pression après la baisse du brut.", tag: "Commodities", source: "Reuters" },
];

const STORAGE = "otc_market_news_v1";
const INTERVAL_MS = 90_000;

let feed: MarketNews[] = [];
let listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function push() {
  const item = POOL[Math.floor(Math.random() * POOL.length)];
  feed = [
    { id: `news-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, created_at: new Date().toISOString(), ...item },
    ...feed,
  ].slice(0, 25);
  try {
    localStorage.setItem(STORAGE, JSON.stringify(feed));
  } catch {
    /* ignore */
  }
  emit();
}

function boot() {
  if (typeof window === "undefined") return;
  if (feed.length === 0) {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) feed = JSON.parse(raw) as MarketNews[];
    } catch {
      /* ignore */
    }
  }
  if (feed.length === 0) {
    const now = Date.now();
    feed = POOL.slice(0, 4).map((n, i) => ({
      id: `news-seed-${i}`,
      created_at: new Date(now - (i + 1) * 42 * 60_000).toISOString(),
      ...n,
    }));
  }
  if (!timer) timer = setInterval(push, INTERVAL_MS);
}

export function useMarketNews() {
  const [items, setItems] = useState<MarketNews[]>(feed);
  useEffect(() => {
    boot();
    const l = () => setItems([...feed]);
    listeners.add(l);
    l();
    return () => {
      listeners.delete(l);
    };
  }, []);
  return items;
}

const READ_KEY = "otc_news_read_at";

export function getNewsReadAt(): number {
  if (typeof window === "undefined") return 0;
  return Number(localStorage.getItem(READ_KEY) ?? 0);
}

export function markNewsRead() {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_KEY, String(Date.now()));
  emit();
}
