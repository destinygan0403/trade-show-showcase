import { useEffect, useState } from "react";
import {
  Newspaper,
  Calendar,
  Shield,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { formatNumber, useTradingState } from "@/lib/trading-store";


/* -------------------- TRADE -------------------- */
export function TradeView() {
  const s = useTradingState();
  const price = s.positions[0]?.currentPrice ?? 4046;
  const spread = 0.24;
  const bid = price - spread / 2;
  const ask = price + spread / 2;
  const [lot, setLot] = useState(1.0);

  const watchlist = [
    { sym: "XAU/USD", name: "Gold vs Dollar", price, chg: +0.42 },
    { sym: "EUR/USD", name: "Euro vs Dollar", price: 1.0842, chg: -0.12 },
    { sym: "BTC/USD", name: "Bitcoin", price: 68432.5, chg: +1.87 },
    { sym: "US500", name: "S&P 500", price: 5623.4, chg: +0.34 },
    { sym: "USOIL", name: "Crude Oil", price: 78.12, chg: -0.68 },
    { sym: "NAS100", name: "Nasdaq 100", price: 19842.7, chg: +0.91 },
  ];

  return (
    <section className="px-5 mt-4 space-y-4">
      {/* Quick trade panel */}
      <div className="rounded-2xl border border-border/60 bg-surface/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">XAU/USD</div>
            <div className="text-[11px] text-muted-foreground">Gold Spot</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted-foreground">Spread</div>
            <div className="text-xs font-semibold text-white tabular-nums">{spread.toFixed(2)}</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => toast(`Sell ${lot.toFixed(2)} lot @ ${formatNumber(bid)}`)}
            className="rounded-xl px-3 py-3 text-left active:scale-[0.98] transition"
            style={{ background: "color-mix(in oklch, var(--color-loss) 22%, transparent)", border: "1px solid color-mix(in oklch, var(--color-loss) 40%, transparent)" }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-loss)" }}>Sell</div>
            <div className="text-lg font-bold text-white tabular-nums">{formatNumber(bid)}</div>
          </button>
          <button
            onClick={() => toast(`Buy ${lot.toFixed(2)} lot @ ${formatNumber(ask)}`)}
            className="rounded-xl px-3 py-3 text-left active:scale-[0.98] transition"
            style={{ background: "color-mix(in oklch, var(--color-profit) 22%, transparent)", border: "1px solid color-mix(in oklch, var(--color-profit) 40%, transparent)" }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-profit)" }}>Buy</div>
            <div className="text-lg font-bold text-white tabular-nums">{formatNumber(ask)}</div>
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Volume</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setLot((v) => Math.max(0.01, +(v - 0.5).toFixed(2)))} className="h-8 w-8 rounded-lg bg-surface-2/70 text-white">-</button>
            <span className="text-sm font-semibold text-white tabular-nums w-16 text-center">{lot.toFixed(2)}</span>
            <button onClick={() => setLot((v) => +(v + 0.5).toFixed(2))} className="h-8 w-8 rounded-lg bg-surface-2/70 text-white">+</button>
          </div>
        </div>
      </div>

      {/* Watchlist */}
      <div>
        <div className="flex items-center justify-between px-1 pb-2">
          <h2 className="text-sm font-semibold text-white">Watchlist</h2>
          <button onClick={() => toast("Edit watchlist")} className="text-xs text-primary">Edit</button>
        </div>
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          {watchlist.map((w, i) => {
            const up = w.chg >= 0;
            return (
              <button
                key={w.sym}
                onClick={() => toast(`${w.sym} — ${formatNumber(w.price)}`)}
                className={`w-full grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 text-left bg-surface/40 ${i > 0 ? "border-t border-border/50" : ""}`}
              >
                <Star size={14} className="text-yellow-400/70" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{w.sym}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{w.name}</div>
                </div>
                <div className="text-right tabular-nums">
                  <div className="text-sm font-semibold text-white">{formatNumber(w.price, w.price > 100 ? 2 : 4)}</div>
                  <div className="text-[11px] font-medium" style={{ color: up ? "var(--color-profit)" : "var(--color-loss)" }}>
                    {up ? "+" : ""}{w.chg.toFixed(2)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* -------------------- INSIGHTS -------------------- */
export function InsightsView() {
  const news = [
    { t: "Gold hits new record as Fed signals dovish tilt", src: "Reuters", time: "2h", tag: "XAU/USD" },
    { t: "US Dollar weakens ahead of NFP release", src: "Bloomberg", time: "4h", tag: "DXY" },
    { t: "Central banks accelerate gold reserves buying", src: "FT", time: "6h", tag: "Macro" },
    { t: "ECB holds rates, hints at Q4 cut trajectory", src: "CNBC", time: "9h", tag: "EUR" },
  ];
  const events = [
    { time: "13:30", ccy: "USD", name: "Core PCE Price Index (YoY)", imp: 3, fcst: "2.6%", prev: "2.8%" },
    { time: "14:45", ccy: "USD", name: "Chicago PMI", imp: 2, fcst: "46.1", prev: "44.9" },
    { time: "16:00", ccy: "EUR", name: "ECB President Speech", imp: 3, fcst: "-", prev: "-" },
    { time: "22:30", ccy: "USD", name: "FOMC Member Powell Speaks", imp: 3, fcst: "-", prev: "-" },
  ];
  return (
    <section className="px-5 mt-4 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-2">
          <Newspaper size={14} /> Market News
        </h2>
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          {news.map((n, i) => (
            <button
              key={i}
              onClick={() => toast(n.t)}
              className={`w-full text-left px-4 py-3 bg-surface/40 ${i > 0 ? "border-t border-border/50" : ""}`}
            >
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <span className="px-1.5 py-0.5 rounded bg-primary/15">{n.tag}</span>
                <span className="text-muted-foreground normal-case tracking-normal font-normal">{n.src} · {n.time}</span>
              </div>
              <div className="mt-1 text-sm text-white leading-snug">{n.t}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white flex items-center gap-2 pb-2">
          <Calendar size={14} /> Economic Calendar
        </h2>
        <div className="rounded-2xl border border-border/60 overflow-hidden">
          {events.map((e, i) => (
            <div key={i} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 bg-surface/40 ${i > 0 ? "border-t border-border/50" : ""}`}>
              <div className="text-xs font-mono text-white/80 tabular-nums">{e.time}</div>
              <div className="min-w-0">
                <div className="text-xs text-white truncate">{e.name}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/80">{e.ccy}</span>
                  <span className="flex gap-0.5">
                    {[1, 2, 3].map((n) => (
                      <span key={n} className={`h-1.5 w-1.5 rounded-full ${n <= e.imp ? "bg-[var(--color-loss)]" : "bg-white/15"}`} />
                    ))}
                  </span>
                </div>
              </div>
              <div className="text-right text-[11px] tabular-nums">
                <div className="text-white/90">F: {e.fcst}</div>
                <div className="text-muted-foreground">P: {e.prev}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------- PERFORMANCE (chart only) -------------------- */
type Candle = { o: number; h: number; l: number; c: number };

function genCandles(n: number, end: number): Candle[] {
  const arr: Candle[] = [];
  let price = end * 0.98;
  for (let i = 0; i < n; i++) {
    const vol = price * 0.0015;
    const o = price;
    const c = Math.max(1, o + (Math.random() - 0.5) * vol * 3);
    const h = Math.max(o, c) + Math.random() * vol;
    const l = Math.min(o, c) - Math.random() * vol;
    arr.push({ o, h, l, c });
    price = c;
  }
  return arr;
}

export function PerformanceView() {
  const s = useTradingState();
  const [tf, setTf] = useState<"M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1">("M30");
  const N = 60;
  const [candles, setCandles] = useState<Candle[]>(() => genCandles(N, s.balance / 1e6 + 1.075));

  useEffect(() => {
    setCandles(genCandles(N, s.balance / 1e6 + 1.075));
  }, [tf, s.balance]);

  // live tick — mutate last candle
  useEffect(() => {
    const id = setInterval(() => {
      setCandles((prev) => {
        const next = prev.slice();
        const last = { ...next[next.length - 1] };
        const vol = last.c * 0.0008;
        const nc = Math.max(1, last.c + (Math.random() - 0.5) * vol * 2);
        last.c = nc;
        last.h = Math.max(last.h, nc);
        last.l = Math.min(last.l, nc);
        next[next.length - 1] = last;
        // occasionally push a new candle
        if (Math.random() < 0.12) {
          next.shift();
          next.push({ o: nc, h: nc, l: nc, c: nc + (Math.random() - 0.5) * vol });
        }
        return next;
      });
    }, 900);
    return () => clearInterval(id);
  }, []);

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] ?? last;
  const bid = last.c;
  const ask = last.c + 0.00007;
  const up = last.c >= prev.c;

  const min = Math.min(...candles.map((c) => c.l));
  const max = Math.max(...candles.map((c) => c.h));
  const pad = (max - min) * 0.15 || 0.001;
  const yMin = min - pad;
  const yMax = max + pad;
  const range = yMax - yMin;

  const W = 340;
  const H = 380;
  const rightAxis = 44;
  const chartW = W - rightAxis;
  const cw = chartW / candles.length;
  const bodyW = Math.max(2, cw * 0.65);
  const yOf = (v: number) => ((yMax - v) / range) * H;

  const gridLines = 8;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => yMin + (range * i) / gridLines);

  const fmt = (v: number) => v.toFixed(5);

  return (
    <section className="mt-2 flex flex-col">
      {/* Bid / Ask bar */}
      <div className="grid grid-cols-2 gap-2 px-3">
        <div
          className="rounded-md px-3 py-2"
          style={{ background: "color-mix(in oklch, var(--color-loss) 20%, transparent)" }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-loss)" }}>Sell</div>
          <div className="text-lg font-bold text-white tabular-nums leading-none mt-0.5">
            {fmt(bid).slice(0, 4)}<span className="text-2xl">{fmt(bid).slice(4, 6)}</span><sup className="text-xs">{fmt(bid).slice(6)}</sup>
          </div>
        </div>
        <div
          className="rounded-md px-3 py-2 text-right"
          style={{ background: "color-mix(in oklch, var(--color-profit) 20%, transparent)" }}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-profit)" }}>Buy</div>
          <div className="text-lg font-bold text-white tabular-nums leading-none mt-0.5">
            {fmt(ask).slice(0, 4)}<span className="text-2xl">{fmt(ask).slice(4, 6)}</span><sup className="text-xs">{fmt(ask).slice(6)}</sup>
          </div>
        </div>
      </div>

      {/* Timeframe bar */}
      <div className="mt-2 px-3 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {(["M1", "M5", "M15", "M30", "H1", "H4", "D1"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setTf(r)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded transition ${
              tf === r ? "bg-primary/25 text-primary" : "text-muted-foreground"
            }`}
          >
            {r}
          </button>
        ))}
        <div className="ml-auto text-[10px] text-muted-foreground">EUR/USD · {tf}</div>
      </div>

      {/* Chart */}
      <div className="mt-2 px-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[420px]" preserveAspectRatio="none">
          {/* horizontal grid + right axis labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1="0" x2={chartW} y1={yOf(t)} y2={yOf(t)} stroke="currentColor" strokeOpacity="0.06" />
              <text x={chartW + 4} y={yOf(t) + 3} fontSize="8" fill="currentColor" fillOpacity="0.55" fontFamily="monospace">
                {t.toFixed(5)}
              </text>
            </g>
          ))}
          {/* vertical grid */}
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1={chartW * f} x2={chartW * f} y1="0" y2={H} stroke="currentColor" strokeOpacity="0.05" />
          ))}

          {/* candles */}
          {candles.map((c, i) => {
            const x = i * cw + cw / 2;
            const isUp = c.c >= c.o;
            const col = isUp ? "var(--color-profit)" : "var(--color-loss)";
            const yO = yOf(c.o);
            const yC = yOf(c.c);
            const yH = yOf(c.h);
            const yL = yOf(c.l);
            const top = Math.min(yO, yC);
            const bh = Math.max(1, Math.abs(yC - yO));
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yH} y2={yL} stroke={col} strokeWidth="1" />
                <rect x={x - bodyW / 2} y={top} width={bodyW} height={bh} fill={col} />
              </g>
            );
          })}

          {/* current price line */}
          <line
            x1="0"
            x2={chartW}
            y1={yOf(last.c)}
            y2={yOf(last.c)}
            stroke={up ? "var(--color-profit)" : "var(--color-loss)"}
            strokeWidth="0.7"
            strokeDasharray="2 2"
            strokeOpacity="0.8"
          />
          <rect
            x={chartW}
            y={yOf(last.c) - 7}
            width={rightAxis}
            height="14"
            fill={up ? "var(--color-profit)" : "var(--color-loss)"}
          />
          <text
            x={chartW + rightAxis / 2}
            y={yOf(last.c) + 3}
            fontSize="8.5"
            fill="white"
            fontFamily="monospace"
            textAnchor="middle"
            fontWeight="700"
          >
            {last.c.toFixed(5)}
          </text>
        </svg>
      </div>
    </section>
  );
}

/* -------------------- PROFILE -------------------- */
export function ProfileView({ onOpenSecret }: { onOpenSecret?: () => void }) {
  const s = useTradingState();
  const rows = [
    { icon: <Shield size={16} />, label: "Security", value: "2FA enabled" },
    { icon: <Bell size={16} />, label: "Notifications", value: "On" },
    { icon: <Lock size={16} />, label: "Change password", value: "" },
    { icon: <HelpCircle size={16} />, label: "Help & Support", value: "" },
  ];
  return (
    <section className="px-5 mt-4 space-y-4">
      <div className="rounded-2xl border border-border/60 bg-surface/60 p-4 flex items-center gap-4">
        <div
          className="h-14 w-14 rounded-full grid place-items-center text-lg font-bold text-black"
          style={{ background: "linear-gradient(135deg, oklch(0.9 0.17 90), oklch(0.75 0.16 70))" }}
          onDoubleClick={onOpenSecret}
        >
          GH
        </div>
        <div className="min-w-0">
          <div className="text-base font-semibold text-white truncate">{s.accountName}</div>
          <div className="text-xs text-muted-foreground">ID #{s.accountId} · Verified</div>
          <div className="mt-1 flex gap-1.5">
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/80">MT5</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary">Pro</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 overflow-hidden">
        {rows.map((r, i) => (
          <button
            key={r.label}
            onClick={() => toast(r.label)}
            className={`w-full grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3.5 text-left bg-surface/40 ${
              i > 0 ? "border-t border-border/50" : ""
            }`}
          >
            <span className="text-muted-foreground">{r.icon}</span>
            <span className="text-sm text-white">{r.label}</span>
            <span className="text-xs text-muted-foreground">{r.value}</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>

      <button
        onClick={() => toast("Signed out")}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border/60 bg-surface/40 text-sm font-semibold text-[var(--color-loss)]"
      >
        <LogOut size={16} /> Sign out
      </button>
    </section>
  );
}
