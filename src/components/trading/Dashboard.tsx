import { useEffect, useRef, useState } from "react";
import {
  Bell,
  User,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ChevronRight,
  Wallet,
  BarChart3,
  LineChart,
  UserCircle2,
} from "lucide-react";
import { formatMoney, formatNumber, startLiveTicker, useTradingState } from "@/lib/trading-store";
import { SecretConfig } from "./SecretConfig";

export function Dashboard() {
  const s = useTradingState();
  const [tab, setTab] = useState<"Open" | "Pending" | "Closed">("Open");
  const [configOpen, setConfigOpen] = useState(false);
  const tapRef = useRef<{ count: number; timer: ReturnType<typeof setTimeout> | null }>({
    count: 0,
    timer: null,
  });

  useEffect(() => { startLiveTicker(); }, []);

  const onTitleTap = () => {
    tapRef.current.count += 1;
    if (tapRef.current.timer) clearTimeout(tapRef.current.timer);
    tapRef.current.timer = setTimeout(() => (tapRef.current.count = 0), 1200);
    if (tapRef.current.count >= 5) {
      tapRef.current.count = 0;
      setConfigOpen(true);
    }
  };

  const [intPart, decPart] = formatMoney(s.balance, s.currency).split(".");
  const decOnly = decPart?.split(" ")[0] ?? "00";

  return (
    <div className="min-h-screen mx-auto max-w-md pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1
          onClick={onTitleTap}
          className="text-2xl font-semibold tracking-tight select-none cursor-default"
        >
          Accounts
        </h1>
        <div className="flex items-center gap-2">
          <IconBtn><Bell size={18} /></IconBtn>
          <IconBtn><User size={18} /></IconBtn>
        </div>
      </header>

      {/* Account card */}
      <section className="px-5">
        <div className="rounded-2xl bg-surface/80 backdrop-blur border border-border/60 p-5 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate font-medium text-foreground/90">{s.accountName}</span>
                <span className="text-muted-foreground">#{s.accountId}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Tag>Real</Tag>
                <Tag>MT5</Tag>
                <Tag accent>Pro</Tag>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground shrink-0" />
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Balance</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-bold tracking-tight tabular-nums">{intPart}</span>
              <span className="text-2xl font-semibold text-muted-foreground tabular-nums">
                .{decOnly}
              </span>
              <span className="text-sm text-muted-foreground ml-1">{s.currency}</span>
            </div>
            <div className="mt-1 text-sm tabular-nums" style={{ color: s.totalPL >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
              {s.totalPL >= 0 ? "▲" : "▼"} {formatMoney(s.totalPL, s.currency, true)}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            <Action icon={<TrendingUp size={18} />} label="Trade" primary />
            <Action icon={<ArrowDownToLine size={18} />} label="Deposit" />
            <Action icon={<ArrowUpFromLine size={18} />} label="Withdraw" />
            <Action icon={<ArrowLeftRight size={18} />} label="Transfer" />
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
                  <span className={`ml-1 ${active ? "text-foreground" : "text-muted-foreground/70"}`}>
                    ({count})
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
      <section className="px-5 mt-4 space-y-3">
        {tab === "Open" ? (
          <>
            <SymbolSummary
              symbol="XAU/USD"
              count={s.positions.length}
              totalPL={s.positions.reduce((a, p) => a + p.pl, 0)}
              currency={s.currency}
            />
            {s.positions.map((p) => (
              <PositionRow key={p.id} {...p} currency={s.currency} />
            ))}
          </>
        ) : (
          <div className="rounded-2xl bg-surface/60 border border-border/60 p-10 text-center text-sm text-muted-foreground">
            No {tab.toLowerCase()} positions
          </div>
        )}
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40">
        <div className="mx-auto max-w-md px-3 pb-3 pt-2">
          <div className="rounded-2xl border border-border/60 bg-surface/90 backdrop-blur-lg shadow-xl grid grid-cols-5">
            <NavItem icon={<Wallet size={18} />} label="Accounts" active />
            <NavItem icon={<TrendingUp size={18} />} label="Trade" />
            <NavItem icon={<BarChart3 size={18} />} label="Insights" />
            <NavItem icon={<LineChart size={18} />} label="Performance" />
            <NavItem icon={<UserCircle2 size={18} />} label="Profile" />
          </div>
        </div>
      </nav>

      <SecretConfig open={configOpen} onClose={() => setConfigOpen(false)} />
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="grid place-items-center h-10 w-10 rounded-full bg-surface/70 border border-border/60 text-foreground/90 hover:bg-surface">
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
          : "border-border/70 text-muted-foreground bg-surface-2/60"
      }`}
      style={accent ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-electric))" } : undefined}
    >
      {children}
    </span>
  );
}

function Action({ icon, label, primary }: { icon: React.ReactNode; label: string; primary?: boolean }) {
  return (
    <button className="flex flex-col items-center gap-1.5 group">
      <span
        className={`grid place-items-center h-11 w-11 rounded-xl border transition-all ${
          primary
            ? "border-transparent text-primary-foreground shadow-lg"
            : "border-border/60 bg-surface-2/60 text-foreground/90 group-hover:bg-surface-2"
        }`}
        style={
          primary
            ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-electric))" }
            : undefined
        }
      >
        {icon}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
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
    <div className="flex items-center justify-between rounded-2xl bg-surface/70 border border-border/60 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="h-9 w-9 rounded-full grid place-items-center text-xs font-bold"
          style={{ background: "linear-gradient(135deg, oklch(0.82 0.16 85), oklch(0.65 0.15 55))", color: "#1a0f00" }}
        >
          Au
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate">{symbol}</div>
          <div className="text-xs text-muted-foreground">{count} positions</div>
        </div>
      </div>
      <div className="text-right tabular-nums">
        <div
          className="text-sm font-semibold"
          style={{ color: positive ? "var(--color-profit)" : "var(--color-loss)" }}
        >
          {formatMoney(totalPL, currency, true)}
        </div>
        <div className="text-[11px] text-muted-foreground">Total P/L</div>
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
    <div className="rounded-2xl bg-surface/60 border border-border/60 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{symbol}</div>
          <div className="mt-0.5 text-xs text-muted-foreground truncate">
            <span style={{ color: sideColor }} className="font-medium">
              {side} {lot.toFixed(2)} lot
            </span>{" "}
            at <span className="text-foreground/80 tabular-nums">{formatNumber(openPrice)}</span>
          </div>
        </div>
        <div className="text-right tabular-nums shrink-0">
          <div
            className="text-sm font-semibold"
            style={{ color: positive ? "var(--color-profit)" : "var(--color-loss)" }}
          >
            {formatMoney(pl, currency, true)}
          </div>
          <div className="text-[11px] text-muted-foreground">{formatNumber(currentPrice)}</div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium">
      <span style={{ color: active ? "var(--color-electric)" : undefined }} className={active ? "" : "text-muted-foreground"}>
        {icon}
      </span>
      <span style={{ color: active ? "var(--color-electric)" : undefined }} className={active ? "" : "text-muted-foreground"}>
        {label}
      </span>
    </button>
  );
}
