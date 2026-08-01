import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
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
  ArrowUpDown,
  MoreVertical,
  X,
} from "lucide-react";

import { toast, Toaster } from "sonner";
import { useSession } from "@/lib/session";
import { formatMoney, formatNumber } from "@/lib/format";
import {
  useAdminDeleteTransaction,
  useAppSettings,

  useClosePosition,
  useIsAdmin,
  useMyPositions,
  useMyProfile,
  useMyTransactions,
  useOpenPosition,
  type Transaction,
} from "@/lib/data";
import { TradeView, InsightsView, PerformanceView, ProfileView } from "./views";
import { TransactionModal, OpenPositionModal, BrokerTopUpModal } from "./Modals";

type NavKey = "Accounts" | "Trade" | "Insights" | "Performance" | "Profile";
type Tab = "Open" | "Pending" | "Closed" | "History";

export function Dashboard() {
  const { user } = useSession();
  const nav = useNavigate();
  const userId = user?.id;
  const profile = useMyProfile(userId);
  const positions = useMyPositions(userId);
  const isAdmin = useIsAdmin(userId);
  const openPos = useOpenPosition();
  const closePos = useClosePosition();
  const settings = useAppSettings();
  const transactions = useMyTransactions(userId);
  const history = transactions.data ?? [];
  const delTx = useAdminDeleteTransaction();
  const withdrawalsBlocked = !!profile.data?.withdrawals_blocked;


  const [tab, setTab] = useState<Tab>("Open");
  const [navKey, setNavKey] = useState<NavKey>("Accounts");
  const [txModal, setTxModal] = useState<null | "deposit" | "withdrawal">(null);
  const [openModal, setOpenModal] = useState(false);
  const [brokerModal, setBrokerModal] = useState(false);
  const [txDetail, setTxDetail] = useState<Transaction | null>(null);

  // Client-side live drift on current_price for visual pop only.
  const [drift, setDrift] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDrift((d) => d + (Math.random() - 0.5) * 0.4), 1200);
    return () => clearInterval(id);
  }, []);


  const p = profile.data;
  const balance = Number(p?.balance ?? 0);
  const currency = p?.currency ?? "USD";
  const realPositions = (positions.data ?? []).map((pos) => {
    const base = Number(pos.current_price);
    const live = pos.status === "open" ? Number((base + drift * 0.3).toFixed(3)) : base;
    const dir = pos.side === "Sell" ? -1 : 1;
    const livePl = pos.status === "open"
      ? Number(pos.pl) + (live - base) * dir * Number(pos.lot) * 100
      : Number(pos.pl);
    return { ...pos, live_price: live, live_pl: livePl, is_fake: false as const };
  });

  const openPositions = realPositions.filter((x) => x.status === "open");
  const closedPositions = realPositions.filter((x) => x.status === "closed");
  const list = tab === "Open" ? openPositions : tab === "Closed" ? closedPositions : [];
  const totalOpenPL = openPositions.reduce((a, p) => a + p.live_pl, 0);


  // Secret admin trigger: 5 rapid taps on "Accounts"
  const tapCount = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSecretTap = () => {
    tapCount.current += 1;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1200);
    if (tapCount.current >= 5) {
      tapCount.current = 0;
      if (isAdmin.data) nav({ to: "/admin" });
    }
  };


  const submitNew = (side: "Buy" | "Sell", lot: number) => {
    if (!userId || !lot) return;
    openPos.mutate({ userId, side, lot }, {
      onSuccess: () => toast.success(`${side} ${lot.toFixed(2)} lot opened`),
      onError: (e: any) => toast.error(e.message),
    });
  };

  const closeAll = () => {
    const open = (positions.data ?? []).filter((x) => x.status === "open");
    if (open.length === 0) return toast("No open positions");
    open.forEach((pos) =>
      closePos.mutate(pos, { onError: (e: any) => toast.error(e.message) }),
    );
    toast.success(`Closing ${open.length} position${open.length > 1 ? "s" : ""}`);
  };

  return (
    <div className="min-h-screen mx-auto max-w-md pb-32">
      {navKey !== "Performance" && navKey !== "Trade" && navKey !== "Profile" && (
        <>
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 pt-6 pb-4">
            <h1 onClick={onSecretTap} className="text-3xl font-bold tracking-tight truncate select-none cursor-default">Accounts</h1>
            <div className="flex items-center gap-2 shrink-0">
              <IconBtn onClick={() => toast("No new notifications")}>
                <Bell size={18} />
              </IconBtn>
              <IconBtn onClick={() => setNavKey("Profile")}>
                <User size={18} />
              </IconBtn>
            </div>
          </header>


          <section className="px-5">
            <div
              className="relative rounded-3xl border border-border/60 p-5 shadow-xl shadow-black/30 overflow-hidden"
              style={{ background: "var(--card-gradient)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="truncate font-semibold text-white/95">{p?.display_name ?? "…"}</span>
                    <span className="text-white/50 text-xs"># {p?.account_id ?? "…"}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Tag>{p?.status ?? "Real"}</Tag>
                    <Tag>MT5</Tag>
                    <Tag accent>Pro</Tag>
                  </div>
                </div>
                <button className="p-1 -m-1 text-white/70 hover:text-white shrink-0" aria-label="Account menu">
                  <MoreVertical size={18} />
                </button>
              </div>

              <div className="mt-4 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[26px] font-bold tracking-tight tabular-nums text-white truncate">
                      {formatMoney(balance, currency).replace(` ${currency}`, "")}
                    </span>
                    <span className="text-sm text-white/60">{currency}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2">
                <Action icon={<TrendingUp size={18} />} label="Trade" primary onClick={() => setOpenModal(true)} />
                <Action icon={<ArrowDownToLine size={18} />} label="Deposit" onClick={() => setBrokerModal(true)} />
                <Action
                  icon={<ArrowUpFromLine size={18} />}
                  label="Withdraw"
                  onClick={() => setTxModal("withdrawal")}
                />

                <Action icon={<ArrowLeftRight size={18} />} label="Transfer" onClick={() => toast("Contact admin")} />
              </div>
            </div>
          </section>

        </>
      )}

      {navKey === "Accounts" && (
        <>
          <nav className="px-5 mt-6">
            <div className="flex items-center gap-1 border-b border-border/60">
              {(["Open", "Pending", "Closed", "History"] as const).map((t) => {
                const active = tab === t;
                const count =
                  t === "Open" ? openPositions.length
                  : t === "Closed" ? closedPositions.length
                  : t === "History" ? history.length
                  : 0;
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`relative py-3 px-3 text-sm font-medium transition-colors ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {t}
                    {count > 0 && (
                      <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        active ? "bg-primary/20 text-primary" : "bg-surface-2/70 text-muted-foreground"
                      }`}>{count}</span>
                    )}
                    {active && <span className="absolute left-2 right-2 -bottom-px h-0.5 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </nav>

          {tab === "History" ? (
            history.length > 0 ? (
              <section className="mt-4 border-t border-border/60">
                {history.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTxDetail(t)}
                    className="w-full text-left grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 border-b border-border/60 bg-surface/30"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white capitalize">{t.kind}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t.method.replace("_", " ")} · {new Date(t.created_at).toLocaleString("fr-FR")}
                      </div>
                    </div>
                    <div className="text-right shrink-0 tabular-nums">
                      <div
                        className="text-sm font-semibold"
                        style={{ color: t.kind === "deposit" ? "var(--color-profit)" : "var(--color-loss)" }}
                      >
                        {t.kind === "deposit" ? "+" : "-"}{formatMoney(Number(t.amount), t.currency)}
                      </div>
                      <div className="text-[11px] text-muted-foreground capitalize">{t.status}</div>
                    </div>
                  </button>
                ))}
              </section>
            ) : (
              <section className="px-5 mt-4" />
            )
          ) : list.length > 0 ? (
            <section className="mt-4">
              <div className="flex items-center justify-between px-5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Total P/L:</span>
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: Number(p?.total_pl ?? 0) >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}
                  >
                    {formatMoney(Number(p?.total_pl ?? 0), currency, true)}
                  </span>
                </div>
                <button className="text-muted-foreground p-1 rounded-md hover:bg-surface-2/60"><ArrowUpDown size={14} /></button>
              </div>

              <div className="border-t border-border/60">
                {tab === "Open" && (
                  <SymbolSummary symbol="XAU/USD" count={openPositions.length} totalPL={totalOpenPL} currency={currency} />
                )}
                {list.map((pos) => (
                  <PositionRow
                    key={pos.id}
                    symbol={pos.symbol}
                    side={pos.side}
                    lot={Number(pos.lot)}
                    openPrice={Number(pos.open_price)}
                    currentPrice={pos.live_price}
                    pl={pos.live_pl}
                    currency={currency}
                    canClose={pos.status === "open"}
                    onClose={() => closePos.mutate(pos, {
                      onSuccess: () => toast.success("Position closed"),
                      onError: (e: any) => toast.error(e.message),
                    })}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section className="px-5 mt-4">
              <div className="rounded-2xl bg-surface/60 border border-border/60 p-10 text-center text-sm text-muted-foreground">
                No {tab.toLowerCase()} positions
              </div>
            </section>
          )}
        </>
      )}

      {navKey === "Trade" && (
        <TradeView
          balance={balance}
          currency={currency}
          openPositions={openPositions}
          onNewOrder={() => setOpenModal(true)}
          onCloseAll={closeAll}
          onClose={(pos) => {
            closePos.mutate(pos as any, {
              onSuccess: () => toast.success("Position closed"),
              onError: (e: any) => toast.error(e.message),
            });
          }}
        />
      )}
      {navKey === "Insights" && <InsightsView />}
      {navKey === "Performance" && <PerformanceView />}
      {navKey === "Profile" && (
        <ProfileView
          profile={p}
          email={user?.email ?? ""}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 w-full z-50">
        <div className="border-t border-border/60 bg-surface/98 backdrop-blur-lg shadow-[0_-8px_32px_rgba(0,0,0,0.45)] grid grid-cols-5">
          {([
            { key: "Accounts", icon: <Wallet size={18} /> },
            { key: "Trade", icon: <TrendingUp size={18} /> },
            { key: "Insights", icon: <BarChart3 size={18} /> },
            { key: "Performance", icon: <LineChart size={18} /> },
            { key: "Profile", icon: <UserCircle2 size={18} /> },
          ] as const).map((n) => (
            <NavItem
              key={n.key}
              icon={n.icon}
              label={n.key}
              active={navKey === n.key}
              onClick={() => setNavKey(n.key as NavKey)}
            />
          ))}
        </div>
      </nav>

      <TransactionModal
        open={!!txModal}
        onClose={() => setTxModal(null)}
        kind={txModal ?? "deposit"}
        userId={userId!}
        blocked={withdrawalsBlocked}
        onTopUp={() => setBrokerModal(true)}
      />
      <BrokerTopUpModal open={brokerModal} onClose={() => setBrokerModal(false)} />
      {txDetail && (
        <TxDetailModal
          tx={txDetail}
          onClose={() => setTxDetail(null)}
          canDelete={!!isAdmin.data}
          onDelete={() => {
            delTx.mutate(txDetail.id, {
              onSuccess: () => { toast.success("Transaction deleted"); setTxDetail(null); },
              onError: (e: any) => toast.error(e.message),
            });
          }}
        />
      )}

      <OpenPositionModal open={openModal} onClose={() => setOpenModal(false)} onSubmit={submitNew} />
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="relative grid place-items-center h-10 w-10 rounded-full bg-surface/70 border border-border/60 text-foreground/90 hover:bg-surface active:scale-95 transition">
      {children}
    </button>
  );
}

function Tag({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
        accent ? "border-transparent text-primary-foreground" : "border-white/15 text-white/80 bg-white/5"
      }`}
      style={accent ? { background: "linear-gradient(135deg, var(--color-primary), var(--color-electric))" } : undefined}
    >
      {children}
    </span>
  );
}

function Action({ icon, label, primary, onClick }: { icon: React.ReactNode; label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 group active:scale-95 transition">
      <span
        className={`grid place-items-center h-11 w-11 rounded-full border ${
          primary ? "border-transparent shadow-lg text-black" : "border-white/10 bg-white/5 text-white/90 group-hover:bg-white/10"
        }`}
        style={primary ? { background: "linear-gradient(135deg, oklch(0.9 0.17 90), oklch(0.75 0.16 70))" } : undefined}
      >
        {icon}
      </span>
      <span className="text-[11px] text-white/70">{label}</span>
    </button>
  );
}

function SymbolSummary({ symbol, count, totalPL, currency }: { symbol: string; count: number; totalPL: number; currency: string }) {
  const positive = totalPL >= 0;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 border-b border-border/60 bg-surface/30">
      <div className="flex items-center gap-3 min-w-0">
        <XauLogo />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate text-white">{symbol}</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-white/80">{count}</span>
        </div>
      </div>
      <div className="text-right tabular-nums shrink-0">
        <div className="text-sm font-semibold" style={{ color: positive ? "var(--color-profit)" : "var(--color-loss)" }}>
          {formatMoney(totalPL, currency, true)}
        </div>
      </div>
    </div>
  );
}

function PositionRow({
  symbol, side, lot, openPrice, currentPrice, pl, currency, canClose, onClose,
}: {
  symbol: string; side: "Buy" | "Sell"; lot: number; openPrice: number; currentPrice: number; pl: number; currency: string;
  canClose?: boolean; onClose?: () => void;
}) {
  const positive = pl >= 0;
  const sideColor = side === "Sell" ? "var(--color-loss)" : "var(--color-profit)";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 px-5 py-3 border-b border-border/60 bg-surface/30">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-white">{symbol}</div>
        <div className="mt-0.5 text-xs truncate">
          <span style={{ color: sideColor }} className="font-medium">{side} {lot.toFixed(2)} lot</span>{" "}
          <span className="text-white/60">at</span>{" "}
          <span className="text-white/80 tabular-nums">{formatNumber(openPrice)}</span>
        </div>
      </div>
      <div className="text-right tabular-nums shrink-0">
        <div className="text-sm font-semibold" style={{ color: positive ? "var(--color-profit)" : "var(--color-loss)" }}>
          {formatMoney(pl, currency, true)}
        </div>
        <div className="text-[11px] text-white/60">{formatNumber(currentPrice)}</div>
      </div>
      {canClose && (
        <button
          onClick={onClose}
          className="text-[10px] font-semibold px-2 py-1 rounded border border-border/60 hover:bg-accent"
        >
          Close
        </button>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium active:scale-95 transition">
      <span style={{ color: active ? "var(--color-electric)" : undefined }} className={active ? "" : "text-muted-foreground"}>{icon}</span>
      <span style={{ color: active ? "var(--color-electric)" : undefined }} className={active ? "" : "text-muted-foreground"}>{label}</span>
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
          <clipPath id="flagClip"><circle cx="20" cy="12" r="10" /></clipPath>
        </defs>
        <g clipPath="url(#flagClip)">
          <circle cx="20" cy="12" r="10" fill="#B22234" />
          <rect x="11" y="2" width="18" height="2.8" fill="#fff" />
          <rect x="11" y="7.6" width="18" height="2.8" fill="#fff" />
          <rect x="11" y="13.2" width="18" height="2.8" fill="#fff" />
          <rect x="11" y="18.8" width="18" height="2.8" fill="#fff" />
          <rect x="11" y="2" width="8" height="8" fill="#3C3B6E" />
        </g>
        <circle cx="12" cy="20" r="10" fill="url(#goldGrad)" stroke="#B8860B" strokeWidth="0.6" />
        <rect x="7" y="23" width="3.5" height="3.5" rx="0.4" fill="#B8860B" />
        <rect x="11.5" y="23" width="3.5" height="3.5" rx="0.4" fill="#B8860B" />
        <rect x="9.25" y="18.5" width="3.5" height="3.5" rx="0.4" fill="#B8860B" />
      </svg>
    </div>
  );
}

function TxDetailModal({ tx, onClose, canDelete, onDelete }: { tx: Transaction; onClose: () => void; canDelete?: boolean; onDelete?: () => void }) {
  const rows: [string, string][] = [
    ["Type", tx.kind === "deposit" ? "Deposit" : "Withdrawal"],
    ["Amount", formatMoney(Number(tx.amount), tx.currency)],
    ["Method", tx.method.replace("_", " ")],
    ["Status", tx.status],
    ["Date", new Date(tx.created_at).toLocaleString("fr-FR")],
    ...(tx.processed_at ? ([["Processed", new Date(tx.processed_at).toLocaleString("fr-FR")]] as [string, string][]) : []),
    ...(tx.destination ? ([["Destination", tx.destination]] as [string, string][]) : []),
    ...(tx.card_last4 ? ([["Card", `•••• ${tx.card_last4}`]] as [string, string][]) : []),
    ...(tx.reference ? ([["Reference", tx.reference]] as [string, string][]) : []),
    ...(tx.admin_note ? ([["Note", tx.admin_note]] as [string, string][]) : []),
    ["Transaction ID", tx.id],
  ];
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transaction details</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent"><X size={18} /></button>
        </div>
        <div className="rounded-xl border border-border/60 overflow-hidden">
          {rows.map(([k, v], i) => (
            <div key={k} className={`flex items-start justify-between gap-3 px-4 py-2.5 text-sm ${i > 0 ? "border-t border-border/50" : ""}`}>
              <span className="text-muted-foreground">{k}</span>
              <span className="text-right break-all capitalize">{v}</span>
            </div>
          ))}
        </div>
        {canDelete && (
          <button
            onClick={() => { if (confirm("Delete this transaction permanently?")) onDelete?.(); }}
            className="mt-4 w-full py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--color-loss)", color: "white" }}
          >
            Delete transaction
          </button>
        )}

      </div>
    </div>
  );
}
