import { useEffect, useRef, useState } from "react";
import {
  Bell,
  User,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Wallet,
  BarChart3,
  LineChart,
  UserCircle2,
  Settings2,
  ArrowUpDown,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { formatMoney, formatNumber, startLiveTicker, useTradingState } from "@/lib/trading-store";
import { SecretConfig } from "./SecretConfig";

type NavKey = "Accounts" | "Trade" | "Insights" | "Performance" | "Profile";

export function Dashboard() {
  const s = useTradingState();
  const [tab, setTab] = useState<"Open" | "Pending" | "Closed">("Open");
  const [nav, setNav] = useState<NavKey>("Accounts");
  const [configOpen, setConfigOpen] = useState(false);
  const tapRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({
    count: 0,
    timer: null,
  });

  useEffect(() => {
    startLiveTicker();
  }, []);

  const onTitleTap = () => {
    tapRef.current.count += 1;
    if (tapRef.current.timer) clearTimeout(tapRef.current.timer);
    tapRef.current.timer = setTimeout(() => (tapRef.current.count = 0), 1200);
    if (tapRef.current.count >= 5) {
      tapRef.current.count = 0;
      setConfigOpen(true);
    }
  };

  const action = (label: string) => toast(`${label}`, { description: "Action indisponible en démo." });

  return (
    <div className="min-h-screen mx-auto max-w-md pb-24">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pt-6 pb-4">
        <h1
          onClick={onTitleTap}
          className="text-3xl font-bold tracking-tight select-none cursor-default truncate"
        >
          Accounts
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <IconBtn onClick={() => action("Notifications")}>
            <Bell size={18} />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[var(--color-loss)]" />
          </IconBtn>
          <IconBtn onClick={() => action("Profil")}>
            <User size={18} />
          </IconBtn>
        </div>
      </header>

      {/* Account card */}
      <section className="px-5">
        <div className="relative rounded-3xl border border-border/60 p-5 shadow-xl shadow-black/30 overflow-hidden"
          style={{ background: "linear-gradient(160deg, oklch(0.28 0.09 255) 0%, oklch(0.18 0.07 255) 55%, oklch(0.14 0.05 255) 100%)" }}
        >
          <button
            onClick={() => setConfigOpen(true)}
            className="absolute top-4 right-4 grid place-items-center h-8 w-8 rounded-full bg-white/10 border border-white/10 text-white/80 hover:bg-white/15"
            aria-label="Settings"
          >
            <Settings2 size={14} />
          </button>

          <div className="min-w-0 pr-10">
            <div className="flex items-center gap-2 text-sm">
              <span className="truncate font-semibold text-white/95">{s.accountName}</span>
              <span className="text-white/50 text-xs"># {s.accountId}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Tag>Real</Tag>
              <Tag>MT5</Tag>
              <Tag accent>Pro</Tag>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold tracking-tight tabular-nums text-white">
                {formatMoney(s.balance, s.currency).replace(` ${s.currency}`, "")}
              </span>
              <span className="text-sm text-white/60">{s.currency}</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            <Action icon={<TrendingUp size={18} />} label="Trade" primary onClick={() => action("Trade")} />
            <Action icon={<ArrowDownToLine size={18} />} label="Deposit" onClick={() => action("Deposit")} />
            <Action icon={<ArrowUpFromLine size={18} />} label="Withdraw" onClick={() => action("Withdraw")} />
            <Action icon={<ArrowLeftRight size={18} />} label="Transfer" onClick={() => action("Transfer")} />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="px-5 mt-6">
        <div className="flex items-center gap-1 border-b border-border/60">
          {(["Open", "Pending", "Closed"] as const).map((t) => {
            const active = tab === t;
            const count = t === "Open" ? 173 : undefined;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative py-3 px-3 text-sm font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t}
                {count !== undefined && (
                  <span
                    className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      active
                        ? "bg-primary/20 text-primary"
                        : "bg-surface-2/70 text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                )}
                {active && (
                  <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Positions */}
      {nav === "Accounts" && tab === "Open" ? (
        <section className="px-5 mt-4">
          <div className="flex items-center justify-between px-1 pb-2">
            <span className="text-xs text-muted-foreground">Total P/L:</span>
            <button
              onClick={() => action("Trier")}
              className="text-muted-foreground p-1 rounded-md hover:bg-surface-2/60"
              aria-label="Sort"
            >
              <ArrowUpDown size={14} />
            </button>
          </div>

          <div className="space-y-2">
            <SymbolSummary
              symbol="XAU/USD"
              count={s.positions.length}
              totalPL={s.positions.reduce((a, p) => a + p.pl, 0)}
              currency={s.currency}
            />
            {s.positions.map((p) => (
              <PositionRow key={p.id} {...p} currency={s.currency} />
            ))}
          </div>
        </section>
      ) : (
        <section className="px-5 mt-4">
          <div className="rounded-2xl bg-surface/60 border border-border/60 p-10 text-center text-sm text-muted-foreground">
            {nav !== "Accounts" ? `${nav} — bientôt disponible` : `Aucune position ${tab.toLowerCase()}`}
          </div>
        </section>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="mx-auto max-w-md px-3 pb-3 pt-2">
          <div className="rounded-2xl border border-border/60 bg-surface/90 backdrop-blur-lg shadow-xl grid grid-cols-5">
            {(
              [
                { key: "Accounts", icon: <Wallet size={18} />, label: "Accounts" },
                { key: "Trade", icon: <TrendingUp size={18} />, label: "Trade" },
                { key: "Insights", icon: <BarChart3 size={18} />, label: "Insights" },
                { key: "Performance", icon: <LineChart size={18} />, label: "Performance" },
                { key: "Profile", icon: <UserCircle2 size={18} />, label: "Profile" },
              ] as const
            ).map((n) => (
              <NavItem
                key={n.key}
                icon={n.icon}
                label={n.label}
                active={nav === n.key}
                onClick={() => setNav(n.key as NavKey)}
              />
            ))}
          </div>
        </div>
      </nav>

      <SecretConfig open={configOpen} onClose={() => setConfigOpen(false)} />
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative grid place-items-center h-10 w-10 rounded-full bg-surface/70 border border-border/60 text-foreground/90 hover:bg-surface active:scale-95 transition"
    >
      {children}
    </button>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
        accent
          ? "border-transparent text-primary-foreground"
          : "border-white/15 text-white/80 bg-white/5"
      }`}
      style={accent ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-electric))" } : undefined}
    >
      {children}
    </span>
  );
}

function Action({
  icon,
  label,
  primary,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group active:scale-95 transition">
      <span
        className={`grid place-items-center h-11 w-11 rounded-full border transition-all ${
          primary
            ? "border-transparent shadow-lg text-black"
            : "border-white/10 bg-white/5 text-white/90 group-hover:bg-white/10"
        }`}
        style={
          primary
            ? { background: "linear-gradient(135deg, oklch(0.9 0.17 90), oklch(0.75 0.16 70))" }
            : undefined
        }
      >
        {icon}
      </span>
      <span className="text-[11px] text-white/70">{label}</span>
    </button>
  );
}

function SymbolSummary({
  symbol,
  count,
  totalPL,
  currency,
}: {
  symbol: string;
  count: number;
  totalPL: number;
  currency: string;
}) {
  const positive = totalPL >= 0;
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-border/60 px-4 py-3"
      style={{ background: "linear-gradient(135deg, oklch(0.28 0.08 255), oklch(0.2 0.06 255))" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <XauLogo />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate text-white">{symbol}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-white/80">
            {count}
          </span>
        </div>
      </div>
      <div className="text-right tabular-nums shrink-0">
        <div
          className="text-sm font-semibold"
          style={{ color: positive ? "var(--color-profit)" : "var(--color-loss)" }}
        >
          {formatMoney(totalPL, currency, true)}
        </div>
      </div>
    </div>
  );
}

function PositionRow({
  symbol,
  side,
  lot,
  openPrice,
  currentPrice,
  pl,
  currency,
}: {
  symbol: string;
  side: "Sell" | "Buy";
  lot: number;
  openPrice: number;
  currentPrice: number;
  pl: number;
  currency: string;
}) {
  const positive = pl >= 0;
  const sideColor = side === "Sell" ? "var(--color-loss)" : "var(--color-profit)";
  return (
    <button
      className="w-full text-left grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl border border-border/60 px-4 py-3 active:scale-[0.99] transition"
      style={{ background: "linear-gradient(135deg, oklch(0.26 0.07 255), oklch(0.18 0.05 255))" }}
    >
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{symbol}</div>
        <div className="mt-0.5 text-xs truncate">
          <span style={{ color: sideColor }} className="font-medium">
            {side} {lot.toFixed(2)} lot
          </span>{" "}
          <span className="text-white/60">at</span>{" "}
          <span className="text-white/80 tabular-nums">{formatNumber(openPrice)}</span>
        </div>
      </div>
      <div className="text-right tabular-nums shrink-0">
        <div
          className="text-sm font-semibold"
          style={{ color: positive ? "var(--color-profit)" : "var(--color-loss)" }}
        >
          {formatMoney(pl, currency, true)}
        </div>
        <div className="text-[11px] text-white/60">{formatNumber(currentPrice)}</div>
      </div>
    </button>
  );
}


function XauLogo() {
  return (
    <div className="h-8 w-8 shrink-0 rounded-full grid place-items-center overflow-hidden">
      <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#DAA520" />
          </linearGradient>
          <clipPath id="flagClip">
            <circle cx="20" cy="12" r="10" />
          </clipPath>
        </defs>

        {/* US flag in top-right corner, clipped to a round circle */}
        <g clipPath="url(#flagClip)">
          <circle cx="20" cy="12" r="10" fill="#B22234" />
          {/* White stripes */}
          <rect x="11" y="2" width="18" height="2.8" fill="#ffffff" />
          <rect x="11" y="7.6" width="18" height="2.8" fill="#ffffff" />
          <rect x="11" y="13.2" width="18" height="2.8" fill="#ffffff" />
          <rect x="11" y="18.8" width="18" height="2.8" fill="#ffffff" />
          {/* Blue canton */}
          <rect x="11" y="2" width="8" height="8" fill="#3C3B6E" />
          {/* Stars */}
          <g fill="#ffffff">
            <circle cx="12.5" cy="3.4" r="0.55" />
            <circle cx="15" cy="3.4" r="0.55" />
            <circle cx="17.5" cy="3.4" r="0.55" />
            <circle cx="13.75" cy="5.5" r="0.55" />
            <circle cx="16.25" cy="5.5" r="0.55" />
            <circle cx="12.5" cy="7.6" r="0.55" />
            <circle cx="15" cy="7.6" r="0.55" />
            <circle cx="17.5" cy="7.6" r="0.55" />
          </g>
        </g>

        {/* Gold circle in bottom-left corner, same size, overlapping on top */}
        <circle cx="12" cy="20" r="10" fill="url(#goldGrad)" stroke="#B8860B" strokeWidth="0.6" />
        {/* Three gold bars (squares) arranged in pyramid */}
        <rect x="7" y="23" width="3.5" height="3.5" rx="0.4" fill="#B8860B" />
        <rect x="11.5" y="23" width="3.5" height="3.5" rx="0.4" fill="#B8860B" />
        <rect x="9.25" y="18.5" width="3.5" height="3.5" rx="0.4" fill="#B8860B" />
      </svg>
    </div>
  );
}


function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium active:scale-95 transition"
    >
      <span
        style={{ color: active ? "var(--color-electric)" : undefined }}
        className={active ? "" : "text-muted-foreground"}
      >
        {icon}
      </span>
      <span
        style={{ color: active ? "var(--color-electric)" : undefined }}
        className={active ? "" : "text-muted-foreground"}
      >
        {label}
      </span>
    </button>
  );
}
