import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Newspaper,
  Calendar,
  Shield,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  ChevronRight,
  Star,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { formatMoney, formatNumber, useTradingState } from "@/lib/trading-store";

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

/* -------------------- PERFORMANCE -------------------- */
export function PerformanceView() {
  const s = useTradingState();
  const [range, setRange] = useState<"1D" | "1W" | "1M" | "3M" | "1Y" | "ALL">("1D");
  const points = { "1D": 96, "1W": 120, "1M": 150, "3M": 180, "1Y": 220, ALL: 260 }[range];

  const [series, setSeries] = useState<number[]>(() => genSeries(points, s.balance));

  // regenerate on range change
  useEffect(() => {
    setSeries(genSeries(points, s.balance));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  // live update — push new tick every second, drop oldest
  useEffect(() => {
    const id = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        const vol = last * 0.0008;
        const next = Math.max(1, last + (Math.random() - 0.48) * vol);
        return [...prev.slice(1), next];
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const first = series[0];
  const last = series[series.length - 1];
  const change = last - first;
  const pct = (change / first) * 100;
  const positive = change >= 0;
  const color = positive ? "var(--color-profit)" : "var(--color-loss)";

  const stats = [
    { label: "Win rate", value: "72.4%" },
    { label: "Profit factor", value: "2.18" },
    { label: "Best trade", value: formatMoney(1_284_320, s.currency, true) },
    { label: "Worst trade", value: formatMoney(-412_950, s.currency, true) },
    { label: "Avg. duration", value: "3h 42m" },
    { label: "Total trades", value: "1,284" },
  ];

  return (
    <section className="px-5 mt-4 space-y-4">
      <div className="rounded-2xl border border-border/60 bg-surface/60 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Equity</div>
            <div className="mt-1 text-2xl font-bold text-white tabular-nums">
              {formatMoney(last, s.currency).replace(` ${s.currency}`, "")}
              <span className="text-sm text-white/50 font-medium ml-1">{s.currency}</span>
            </div>
            <div className="mt-1 text-sm font-semibold tabular-nums flex items-center gap-1" style={{ color }}>
              {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {positive ? "+" : ""}{formatMoney(change, s.currency).replace(` ${s.currency}`, "")} ({positive ? "+" : ""}{pct.toFixed(2)}%)
            </div>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "var(--color-profit)" }} />
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--color-profit)" }} />
            </span>
            LIVE
          </div>
        </div>

        <LiveChart data={series} color={color} />

        <div className="mt-3 grid grid-cols-6 gap-1">
          {(["1D", "1W", "1M", "3M", "1Y", "ALL"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-[11px] font-semibold py-1.5 rounded-md transition ${
                range === r ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-surface-2/60"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-surface/60 overflow-hidden">
        <div className="px-4 py-3 border-b border-border/60 flex items-center gap-2">
          <Activity size={14} className="text-primary" />
          <span className="text-sm font-semibold text-white">Statistics</span>
        </div>
        <div className="grid grid-cols-2">
          {stats.map((st, i) => (
            <div
              key={st.label}
              className={`px-4 py-3 ${i % 2 === 0 ? "border-r border-border/50" : ""} ${i < stats.length - 2 ? "border-b border-border/50" : ""}`}
            >
              <div className="text-[11px] text-muted-foreground">{st.label}</div>
              <div className="mt-0.5 text-sm font-semibold text-white tabular-nums">{st.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function genSeries(n: number, endValue: number): number[] {
  const arr: number[] = new Array(n);
  // walk backwards from endValue with small drift/volatility
  let v = endValue;
  arr[n - 1] = v;
  for (let i = n - 2; i >= 0; i--) {
    const vol = v * 0.004;
    // slight negative drift going back so history ends lower on average
    v = v - (Math.random() - 0.55) * vol;
    arr[i] = Math.max(1, v);
  }
  return arr;
}

function LiveChart({ data, color }: { data: number[]; color: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const w = 320;
  const h = 140;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const step = w / (data.length - 1);
  const points = data.map((v, i) => [i * step, h - ((v - min) / range) * h] as const);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;
  const lastPt = points[points.length - 1];
  const gradId = "chartGrad";

  return (
    <div className="mt-3 -mx-1">
      <svg ref={ref} viewBox={`0 0 ${w} ${h}`} className="w-full h-[140px]" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="0" x2={w} y1={h * f} y2={h * f} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
        ))}
        <path d={area} fill={`url(#${gradId})`} />
        <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={lastPt[0]} cy={lastPt[1]} r="3" fill={color} />
        <circle cx={lastPt[0]} cy={lastPt[1]} r="6" fill={color} fillOpacity="0.25">
          <animate attributeName="r" values="4;9;4" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="fill-opacity" values="0.35;0;0.35" dur="1.6s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
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
