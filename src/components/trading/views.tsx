import { useEffect, useState } from "react";
import {
  Newspaper, Calendar, Shield, Bell, Lock, HelpCircle, LogOut, ChevronRight,
  Menu, Plus, ArrowRight, ArrowUpDown, Sun, Moon,
  User, Mail, CreditCard, Globe, Languages, FileText, Fingerprint, Smartphone, Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/format";
import { useTheme, setTheme } from "@/lib/theme";
import type { Position, Profile } from "@/lib/data";

/* -------------------- TRADE (MT5-style) -------------------- */
export function TradeView({
  balance,
  currency,
  openPositions,
  onNewOrder,
  onClose,
  onCloseAll,
}: {
  balance: number;
  currency: string;
  openPositions: (Position & { live_price: number; live_pl: number })[];
  onNewOrder: () => void;
  onClose: (p: Position) => void;
  onCloseAll: () => void;
}) {
  const totalPL = openPositions.reduce((a, p) => a + p.live_pl, 0);
  const equity = balance + totalPL;
  const freeMargin = equity - Math.abs(totalPL) * 0.02;
  const fmt2 = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const hasPositions = openPositions.length > 0;

  return (
    <section className="fixed inset-0 bottom-16 bg-background flex flex-col z-10 max-w-md mx-auto">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <button onClick={() => toast("Menu")} className="h-8 w-8 grid place-items-center text-white/70">
          <Menu size={18} />
        </button>
        <div
          className="text-[15px] font-semibold tabular-nums"
          style={{ color: totalPL >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}
        >
          {totalPL >= 0 ? "" : "-"}{fmt2(Math.abs(totalPL))} {currency}
        </div>
        <button onClick={onNewOrder} className="h-8 w-8 grid place-items-center text-white/70">
          <Plus size={20} />
        </button>
      </div>

      <div className="px-4 pt-2 pb-3 space-y-1.5">
        <SummaryRow label="Balance:" value={fmt2(balance)} />
        <SummaryRow label="Equity:" value={fmt2(equity)} />
        <SummaryRow label="Free Margin:" value={fmt2(freeMargin)} />
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <button
          onClick={onNewOrder}
          className="py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
        >
          Ouvrir une position
        </button>
        <button
          onClick={onCloseAll}
          disabled={!hasPositions}
          className="py-2.5 rounded-xl border border-border font-semibold text-xs disabled:opacity-40"
        >
          Fermer toutes les positions
        </button>
      </div>

      {hasPositions && (
        <>
          <div className="flex items-center justify-between px-4 pt-2 pb-2 border-b border-border/40">
            <span className="text-[13px] text-white/80">Positions</span>
            <button className="text-white/50"><ArrowUpDown size={14} /></button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {openPositions.map((p) => (
              <MtPositionRow key={p.id} pos={p} onClose={() => onClose(p)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[15px] text-white/85">{label}</span>
      <span className="text-[15px] font-semibold text-white tabular-nums">{value}</span>
    </div>
  );
}

function MtPositionRow({
  pos, onClose,
}: {
  pos: Position & { live_price: number; live_pl: number };
  onClose: () => void;
}) {
  const sideColor = pos.side === "Sell" ? "var(--color-loss)" : "var(--color-profit)";
  const plColor = pos.live_pl >= 0 ? "var(--color-profit)" : "var(--color-loss)";
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-4 py-3 border-b border-border/40">
      <div className="min-w-0">
        <div className="text-[15px] leading-tight">
          <span className="font-semibold text-white">XAUUSDm </span>
          <span style={{ color: sideColor }} className="font-medium">
            {pos.side.toLowerCase()} {Number(pos.lot).toFixed(2)}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-white/70 tabular-nums">
          <span>{fmt(Number(pos.open_price))}</span>
          <ArrowRight size={12} className="text-white/40" />
          <span>{fmt(pos.live_price)}</span>
        </div>
      </div>
      <div className="text-right text-[15px] font-semibold tabular-nums" style={{ color: plColor }}>
        {pos.live_pl >= 0 ? "" : "-"}
        {Math.abs(pos.live_pl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      <button onClick={onClose} className="text-[10px] font-semibold px-2 py-1 rounded border border-border/60">
        Close
      </button>
    </div>
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
            <button key={i} onClick={() => toast(n.t)} className={`w-full text-left px-4 py-3 bg-surface/40 ${i > 0 ? "border-t border-border/50" : ""}`}>
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
  const [tf, setTf] = useState<"M1" | "M5" | "M15" | "M30" | "H1" | "H4" | "D1">("M30");
  const N = 60;
  const [candles, setCandles] = useState<Candle[]>(() => genCandles(N, 1.0875));
  useEffect(() => setCandles(genCandles(N, 1.0875)), [tf]);
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
  const up = last.c >= prev.c;
  const min = Math.min(...candles.map((c) => c.l));
  const max = Math.max(...candles.map((c) => c.h));
  const pad = (max - min) * 0.15 || 0.001;
  const yMin = min - pad, yMax = max + pad, range = yMax - yMin;
  const W = 340, H = 380, rightAxis = 44, chartW = W - rightAxis;
  const cw = chartW / candles.length;
  const bodyW = Math.max(2, cw * 0.65);
  const yOf = (v: number) => ((yMax - v) / range) * H;
  const ticks = Array.from({ length: 9 }, (_, i) => yMin + (range * i) / 8);

  return (
    <section className="fixed inset-0 bottom-16 bg-background flex flex-col z-10 max-w-md mx-auto">
      <div className="px-3 pt-3 pb-2 flex items-center gap-1 overflow-x-auto border-b border-border/60">
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

      <div className="flex-1 min-h-0 px-2 py-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1="0" x2={chartW} y1={yOf(t)} y2={yOf(t)} stroke="currentColor" strokeOpacity="0.06" />
              <text x={chartW + 4} y={yOf(t) + 3} fontSize="8" fill="currentColor" fillOpacity="0.55" fontFamily="monospace">
                {t.toFixed(5)}
              </text>
            </g>
          ))}
          {candles.map((c, i) => {
            const x = i * cw + cw / 2;
            const isUp = c.c >= c.o;
            const col = isUp ? "var(--color-profit)" : "var(--color-loss)";
            const yO = yOf(c.o), yC = yOf(c.c), yH = yOf(c.h), yL = yOf(c.l);
            const top = Math.min(yO, yC);
            const bh = Math.max(1, Math.abs(yC - yO));
            return (
              <g key={i}>
                <line x1={x} x2={x} y1={yH} y2={yL} stroke={col} strokeWidth="1" />
                <rect x={x - bodyW / 2} y={top} width={bodyW} height={bh} fill={col} />
              </g>
            );
          })}
          <line x1="0" x2={chartW} y1={yOf(last.c)} y2={yOf(last.c)}
            stroke={up ? "var(--color-profit)" : "var(--color-loss)"}
            strokeWidth="0.7" strokeDasharray="2 2" strokeOpacity="0.8" />
          <rect x={chartW} y={yOf(last.c) - 7} width={rightAxis} height="14"
            fill={up ? "var(--color-profit)" : "var(--color-loss)"} />
          <text x={chartW + rightAxis / 2} y={yOf(last.c) + 3} fontSize="8.5" fill="white"
            fontFamily="monospace" textAnchor="middle" fontWeight="700">
            {last.c.toFixed(5)}
          </text>
        </svg>
      </div>
    </section>
  );
}

/* -------------------- PROFILE (dedicated page, no account card) -------------------- */
export function ProfileView({
  profile, email,
}: {
  profile: Profile | null | undefined;
  email: string;
}) {
  const theme = useTheme();
  const isLight = theme === "light";
  const initials = (profile?.display_name ?? "GH").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const accountRows = [
    { icon: <User size={16} />, label: "Full name", value: profile?.display_name ?? "—" },
    { icon: <Mail size={16} />, label: "Email", value: email || "—" },
    { icon: <CreditCard size={16} />, label: "Account ID", value: `#${profile?.account_id ?? "—"}` },
    { icon: <Globe size={16} />, label: "Base currency", value: profile?.currency ?? "USD" },
  ];
  const securityRows = [
    { icon: <Lock size={16} />, label: "Change password" },
    { icon: <Fingerprint size={16} />, label: "Biometric login", value: "Off" },
    { icon: <Shield size={16} />, label: "Two-factor auth", value: "Enabled" },
    { icon: <Smartphone size={16} />, label: "Trusted devices", value: "1 device" },
  ];
  const prefsRows = [
    { icon: <Bell size={16} />, label: "Notifications", value: "On" },
    { icon: <Languages size={16} />, label: "Language", value: "English" },
    { icon: <FileText size={16} />, label: "Statements & reports" },
  ];
  const supportRows = [
    { icon: <HelpCircle size={16} />, label: "Help & Support" },
    { icon: <Info size={16} />, label: "About", value: "v1.0.0" },
  ];

  return (
    <section className="px-5 pt-6 pb-4 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
      </header>

      <div className="flex flex-col items-center text-center gap-3 pt-2">
        <div
          className="h-20 w-20 rounded-full grid place-items-center text-2xl font-bold text-black shadow-lg"
          style={{ background: "linear-gradient(135deg, oklch(0.9 0.17 90), oklch(0.75 0.16 70))" }}
        >
          {initials}
        </div>
        <div>
          <div className="text-lg font-semibold text-white">{profile?.display_name ?? "…"}</div>
          <div className="text-xs text-muted-foreground">{email}</div>
        </div>
        <div className="flex gap-1.5">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white/85">{profile?.status ?? "Real"}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-white/85">MT5</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-primary/20 text-primary">Pro</span>
        </div>
      </div>

      <Group title="Account">{accountRows.map((r, i) => <Row key={r.label} first={i === 0} {...r} />)}</Group>

      <div className="rounded-2xl border border-border/60 bg-surface/60">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">{isLight ? <Sun size={16} /> : <Moon size={16} />}</span>
            <div>
              <div className="text-sm text-white">Appearance</div>
              <div className="text-[11px] text-muted-foreground">{isLight ? "Light theme" : "Dark theme"}</div>
            </div>
          </div>
          <div className="inline-flex p-0.5 rounded-full border border-border/60 bg-background/50">
            <button onClick={() => setTheme("dark")} className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition"
              style={!isLight ? { background: "var(--color-primary)", color: "var(--color-primary-foreground)" } : { color: "var(--muted-foreground)" }}>
              <Moon size={12} /> Dark
            </button>
            <button onClick={() => setTheme("light")} className="px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition"
              style={isLight ? { background: "var(--color-primary)", color: "var(--color-primary-foreground)" } : { color: "var(--muted-foreground)" }}>
              <Sun size={12} /> Light
            </button>
          </div>
        </div>
      </div>

      <Group title="Security">{securityRows.map((r, i) => <Row key={r.label} first={i === 0} {...r} />)}</Group>
      <Group title="Preferences">{prefsRows.map((r, i) => <Row key={r.label} first={i === 0} {...r} />)}</Group>
      <Group title="Support">{supportRows.map((r, i) => <Row key={r.label} first={i === 0} {...r} />)}</Group>

      <button
        onClick={async () => { await supabase.auth.signOut(); }}
        className="w-full rounded-2xl border border-border/60 bg-surface/40 px-4 py-3.5 flex items-center justify-center gap-2 text-sm text-white/80 hover:bg-surface/60"
      >
        <LogOut size={16} /> Sign out
      </button>
    </section>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-1 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{title}</div>
      <div className="rounded-2xl border border-border/60 overflow-hidden bg-surface/40">{children}</div>
    </div>
  );
}

function Row({ icon, label, value, first }: { icon: React.ReactNode; label: string; value?: string; first?: boolean }) {
  return (
    <button
      onClick={() => toast(label)}
      className={`w-full grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 px-4 py-3.5 text-left ${first ? "" : "border-t border-border/50"}`}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-sm text-white">{label}</span>
      <span className="text-xs text-muted-foreground truncate max-w-[45vw]">{value ?? ""}</span>
      <ChevronRight size={14} className="text-muted-foreground" />
    </button>
  );
}

