import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast, Toaster } from "sonner";
import { ArrowLeft, Check, X, ShieldCheck, UserPlus } from "lucide-react";
import { useSession } from "@/lib/session";
import { formatMoney } from "@/lib/format";
import { adminCreateUser, adminDeleteUser } from "@/lib/admin.functions";
import {
  useAllOpenPositions,
  useAllTransactions,
  useAllUsers,
  useAppSettings,
  useAdminSettleTransaction,
  useAdminUpdatePosition,
  useAdminUpdateProfile,
  useAdminUpdateSettings,
  useIsAdmin,
} from "@/lib/data";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — GOLD HOLDINGS" },
      { name: "description", content: "Manage users, positions, transactions and settings." },
      { property: "og:title", content: "Admin — GOLD HOLDINGS" },
      { property: "og:description", content: "Admin control panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

type Tab = "users" | "positions" | "transactions" | "settings";

const TAB_LABELS: Record<Tab, string> = {
  users: "Utilisateurs",
  positions: "Positions",
  transactions: "Transactions",
  settings: "Paramètres",
};

const TAB_HINTS: Record<Tab, string> = {
  users: "Créer, modifier ou supprimer des comptes, ajuster le solde et bloquer les retraits.",
  positions: "Décider du résultat des positions ouvertes : gain forcé, perte forcée ou automatique.",
  transactions: "Suivre les dépôts et retraits de tous les comptes.",
  settings: "Marque, e-mail de notification, fuseau horaire et coordonnées de paiement.",
};

function AdminPage() {
  const nav = useNavigate();
  const { user } = useSession();
  const isAdmin = useIsAdmin(user?.id);
  const [tab, setTab] = useState<Tab>("users");

  if (isAdmin.isLoading) return <div className="min-h-screen bg-background" />;
  if (!isAdmin.data) {
    return (
      <div className="min-h-screen grid place-items-center px-5 text-center">
        <div>
          <ShieldCheck size={40} className="mx-auto text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Accès réservé aux administrateurs.</p>
          <button onClick={() => nav({ to: "/dashboard" })} className="mt-4 text-sm text-primary">Retour à l’application</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <Toaster position="top-center" theme="dark" />
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border/60">
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={() => nav({ to: "/dashboard" })} className="p-2 rounded-full hover:bg-accent">
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-lg font-bold">Espace administrateur</h1>
        </div>
        <nav className="max-w-3xl mx-auto flex gap-1 px-2 pb-1 overflow-x-auto">
          {(["users", "positions", "transactions", "settings"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-semibold tracking-wide rounded-md transition whitespace-nowrap ${
                tab === t ? "bg-primary/20 text-primary" : "text-muted-foreground"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-5">
        <p className="mb-4 text-xs text-muted-foreground leading-relaxed">{TAB_HINTS[tab]}</p>
        {tab === "users" && <UsersPanel />}
        {tab === "positions" && <PositionsPanel />}
        {tab === "transactions" && <TransactionsPanel />}
        {tab === "settings" && <SettingsPanel />}
      </main>
    </div>
  );
}

function UsersPanel() {
  const q = useAllUsers();
  const upd = useAdminUpdateProfile();
  const createUser = useServerFn(adminCreateUser);
  const deleteUser = useServerFn(adminDeleteUser);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<{ display_name: string; balance: string; total_pl: string; status: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [newUser, setNewUser] = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await deleteUser({ data: { id: deleting.id } });
      toast.success("Utilisateur supprimé");
      setDeleting(null);
      q.refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (u: any) => {
    setEditing(u.id);
    setForm({
      display_name: u.display_name,
      balance: String(u.balance),
      total_pl: String(u.total_pl),
      status: u.status,
    });
  };

  const save = async () => {
    if (!editing || !form) return;
    try {
      await upd.mutateAsync({
        id: editing,
        patch: {
          display_name: form.display_name,
          balance: Number(form.balance) || 0,
          total_pl: Number(form.total_pl) || 0,
          status: form.status,
        },
      });
      toast.success("Utilisateur mis à jour");
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const submitCreate = async () => {
    if (!newUser.first_name || !newUser.last_name || !newUser.email || !newUser.password) {
      return toast.error("Tous les champs sont obligatoires");
    }
    setBusy(true);
    try {
      await createUser({ data: newUser });
      toast.success("Utilisateur créé");
      setCreating(false);
      setNewUser({ first_name: "", last_name: "", email: "", password: "" });
      q.refetch();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };



  return (
    <div className="space-y-3">
      <button
        onClick={() => setCreating(true)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
      >
        <UserPlus size={16} /> Créer un nouvel utilisateur
      </button>

      {(q.data ?? []).map((u: any) => (
        <div key={u.id} className="rounded-xl border border-border/60 bg-surface/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{u.display_name}</div>
              <div className="text-[11px] text-muted-foreground truncate">{u.email}</div>
              <div className="mt-1 flex flex-wrap gap-1">
                {u.roles.map((r: string) => (
                  <span key={r} className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase">
                    {r === "admin" ? "Administrateur" : "Utilisateur"}
                  </span>
                ))}
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10">{u.status}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => openEdit(u)} className="text-xs px-3 py-1.5 rounded-md border border-border">
                Modifier
              </button>
              <button
                onClick={() => setDeleting({ id: u.id, name: u.display_name })}
                className="text-xs px-3 py-1.5 rounded-md border border-destructive/50 text-destructive"
              >
                Supprimer
              </button>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-muted-foreground">Solde :</span> {formatMoney(Number(u.balance), u.currency)}</div>
            <div><span className="text-muted-foreground">P/L total :</span> {formatMoney(Number(u.total_pl), u.currency, true)}</div>
          </div>
          <label className="mt-3 flex items-center justify-between gap-3 cursor-pointer rounded-lg border border-border/60 px-3 py-2">
            <span className="text-xs">Bloquer les retraits (exiger une recharge du broker)</span>
            <input
              type="checkbox"
              checked={!!u.withdrawals_blocked}
              onChange={async (e) => {
                try {
                  await upd.mutateAsync({ id: u.id, patch: { withdrawals_blocked: e.target.checked } });
                  toast.success(e.target.checked ? "Retraits bloqués" : "Retraits débloqués");
                } catch (err: any) { toast.error(err.message); }
              }}
              className="h-5 w-5 accent-[var(--color-primary)]"
            />
          </label>

        </div>
      ))}

      {editing && form && (
        <Modal onClose={() => setEditing(null)} title="Modifier l’utilisateur">
          <TextField label="Nom affiché" value={form.display_name} onChange={(v) => setForm({ ...form, display_name: v })} />
          <TextField label="Solde du compte (USD)" value={form.balance} onChange={(v) => setForm({ ...form, balance: v })} />
          <TextField label="P/L total affiché (USD)" value={form.total_pl} onChange={(v) => setForm({ ...form, total_pl: v })} />
          <TextField label="Type de compte (Real / Demo…)" value={form.status} onChange={(v) => setForm({ ...form, status: v })} />
          <button onClick={save} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Enregistrer</button>
        </Modal>
      )}

      {creating && (
        <Modal onClose={() => setCreating(false)} title="Créer un utilisateur">
          <div className="grid grid-cols-2 gap-2">
            <TextField label="Prénom" value={newUser.first_name} onChange={(v) => setNewUser({ ...newUser, first_name: v })} />
            <TextField label="Nom" value={newUser.last_name} onChange={(v) => setNewUser({ ...newUser, last_name: v })} />
          </div>
          <TextField label="Adresse e-mail" value={newUser.email} onChange={(v) => setNewUser({ ...newUser, email: v })} />
          <TextField label="Mot de passe (8 caractères min.)" value={newUser.password} onChange={(v) => setNewUser({ ...newUser, password: v })} />
          <button
            onClick={submitCreate}
            disabled={busy}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
          >
            {busy ? "Création…" : "Créer l’utilisateur"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            L’utilisateur pourra se connecter immédiatement avec cet e-mail et ce mot de passe.
          </p>
        </Modal>
      )}

      {deleting && (
        <Modal onClose={() => setDeleting(null)} title="Supprimer l’utilisateur">
          <p className="text-sm text-muted-foreground">
            Cette action supprime définitivement <span className="text-foreground font-semibold">{deleting.name}</span> et
            toutes ses données (positions, transactions, notifications). Elle est irréversible.
          </p>
          <button
            onClick={confirmDelete}
            disabled={busy}
            className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm disabled:opacity-60"
          >
            {busy ? "Suppression…" : "Supprimer définitivement"}
          </button>
          <button onClick={() => setDeleting(null)} className="w-full py-2.5 rounded-xl border border-border text-sm">
            Annuler
          </button>
        </Modal>
      )}
    </div>
  );
}


function PositionsPanel() {
  const q = useAllOpenPositions();
  const upd = useAdminUpdatePosition();
  const users = useAllUsers();
  const nameFor = (uid: string) => users.data?.find((u: any) => u.id === uid)?.display_name ?? uid.slice(0, 8);

  const setVerdict = async (id: string, verdict: "auto" | "force_win" | "force_loss", amount?: number) => {
    try {
      await upd.mutateAsync({ id, patch: { verdict, verdict_amount: amount ?? null } });
      toast.success("Décision enregistrée");
    } catch (e: any) { toast.error(e.message); }
  };

  const verdictLabel: Record<string, string> = {
    auto: "Automatique",
    force_win: "Gain forcé",
    force_loss: "Perte forcée",
  };

  const openList = useMemo(() => (q.data ?? []).filter((p) => p.status === "open"), [q.data]);
  const closedList = useMemo(() => (q.data ?? []).filter((p) => p.status === "closed").slice(0, 20), [q.data]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-surface/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
        Choisissez le résultat d’une position <span className="text-foreground font-semibold">avant</span> que le client ne la
        ferme. « Gain forcé » ajoute le montant au solde du client, « Perte forcée » le retire, « Automatique » laisse le P/L
        du marché s’appliquer.
      </div>

      <h2 className="text-xs uppercase tracking-wider text-muted-foreground">Positions ouvertes ({openList.length})</h2>
      {openList.length === 0 && <p className="text-sm text-muted-foreground">Aucune position ouverte.</p>}
      {openList.map((p) => (
        <div key={p.id} className="rounded-xl border border-border/60 bg-surface/60 p-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-semibold">{nameFor(p.user_id)}</div>
              <div className="text-[11px] text-muted-foreground">
                {p.symbol} · {p.side === "Buy" ? "Achat" : "Vente"} {Number(p.lot).toFixed(2)} lot @ {Number(p.open_price).toFixed(3)} · P/L {formatMoney(Number(p.pl), "USD", true)}
              </div>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10">{verdictLabel[p.verdict] ?? p.verdict}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            <button onClick={() => setVerdict(p.id, "auto")} className="text-[11px] px-2 py-1 rounded bg-background border border-border">Automatique</button>
            <button onClick={() => {
              const a = prompt("Montant du GAIN forcé (USD) ?", "5000");
              if (a) setVerdict(p.id, "force_win", Number(a));
            }} className="text-[11px] px-2 py-1 rounded font-semibold" style={{ background: "var(--color-profit)", color: "black" }}>Forcer un gain</button>
            <button onClick={() => {
              const a = prompt("Montant de la PERTE forcée (USD) ?", "5000");
              if (a) setVerdict(p.id, "force_loss", Number(a));
            }} className="text-[11px] px-2 py-1 rounded font-semibold" style={{ background: "var(--color-loss)", color: "white" }}>Forcer une perte</button>
          </div>
        </div>
      ))}
      <h2 className="text-xs uppercase tracking-wider text-muted-foreground pt-2">Positions fermées récentes</h2>
      {closedList.map((p) => (
        <div key={p.id} className="rounded-xl border border-border/60 p-3 text-sm">
          <div className="flex justify-between">
            <span>{nameFor(p.user_id)} · {p.symbol} · {p.side === "Buy" ? "Achat" : "Vente"} {Number(p.lot).toFixed(2)}</span>
            <span style={{ color: Number(p.pl) >= 0 ? "var(--color-profit)" : "var(--color-loss)" }}>
              {formatMoney(Number(p.pl), "USD", true)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionsPanel() {
  const q = useAllTransactions();
  const users = useAllUsers();
  const settle = useAdminSettleTransaction();
  const nameFor = (uid: string) => users.data?.find((u: any) => u.id === uid)?.display_name ?? uid.slice(0, 8);

  const kindLabel = (k: string) => (k === "deposit" ? "Dépôt" : "Retrait");
  const methodLabel = (m: string) =>
    ({ bank_transfer: "Virement bancaire", card: "Carte bancaire", btc: "Bitcoin", usdt: "USDT" } as Record<string, string>)[m] ?? m;
  const statusLabel = (s: string) =>
    ({ approved: "Validé", rejected: "Refusé", pending: "En attente" } as Record<string, string>)[s] ?? s;

  return (
    <div className="space-y-3">
      {(q.data ?? []).length === 0 && <p className="text-sm text-muted-foreground">Aucune transaction.</p>}
      {(q.data ?? []).map((t) => (
        <div key={t.id} className="rounded-xl border border-border/60 bg-surface/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{kindLabel(t.kind)} · {methodLabel(t.method)}</div>
              <div className="text-[11px] text-muted-foreground truncate">{nameFor(t.user_id)}</div>
              {t.reference && <div className="text-[11px] text-muted-foreground truncate">Référence : {t.reference}</div>}
              {t.destination && <div className="text-[11px] text-muted-foreground truncate">Destinataire : {t.destination}</div>}
              {t.card_last4 && <div className="text-[11px] text-muted-foreground">Carte •••• {t.card_last4}</div>}
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold tabular-nums">{formatMoney(Number(t.amount), t.currency)}</div>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded mt-1 inline-block"
                style={{
                  background:
                    t.status === "approved"
                      ? "color-mix(in oklch, var(--color-profit) 20%, transparent)"
                      : t.status === "rejected"
                      ? "color-mix(in oklch, var(--color-loss) 20%, transparent)"
                      : "rgba(255,255,255,0.08)",
                }}
              >
                {statusLabel(t.status)}
              </span>
            </div>
          </div>
          {t.status === "pending" && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => settle.mutate({ tx: t, approve: true })}
                className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                style={{ background: "var(--color-profit)", color: "black" }}
              >
                <Check size={14} /> Valider
              </button>
              <button
                onClick={() => {
                  const n = prompt("Motif du refus (facultatif)") ?? undefined;
                  settle.mutate({ tx: t, approve: false, note: n });
                }}
                className="flex-1 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                style={{ background: "var(--color-loss)", color: "white" }}
              >
                <X size={14} /> Refuser
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SettingsPanel() {
  const q = useAppSettings();
  const upd = useAdminUpdateSettings();
  const [form, setForm] = useState<any>(null);

  const current = form ?? q.data;
  if (!current) return <div className="text-sm text-muted-foreground">Chargement…</div>;

  const set = (k: string, v: string | boolean) => setForm({ ...current, [k]: v });

  const save = async () => {
    try {
      const { id: _id, updated_at: _u, ...patch } = current;
      await upd.mutateAsync(patch);
      toast.success("Paramètres enregistrés");
    } catch (e: any) { toast.error(e.message); }
  };

  const TIMEZONES: { value: string; label: string }[] = [
    { value: "UTC", label: "UTC (temps universel)" },
    { value: "Europe/Paris", label: "France — Paris" },
    { value: "Europe/Brussels", label: "Belgique — Bruxelles" },
    { value: "Europe/Zurich", label: "Suisse — Zurich" },
    { value: "Europe/London", label: "Royaume-Uni — Londres" },
    { value: "Europe/Lisbon", label: "Portugal — Lisbonne" },
    { value: "Europe/Madrid", label: "Espagne — Madrid" },
    { value: "Africa/Abidjan", label: "Côte d’Ivoire — Abidjan" },
    { value: "Africa/Dakar", label: "Sénégal — Dakar" },
    { value: "Africa/Douala", label: "Cameroun — Douala" },
    { value: "Africa/Casablanca", label: "Maroc — Casablanca" },
    { value: "America/Montreal", label: "Canada — Montréal" },
    { value: "America/New_York", label: "États-Unis — New York" },
    { value: "Asia/Dubai", label: "Émirats — Dubaï" },
  ];

  return (
    <div className="space-y-3">
      <TextField label="Nom de la marque" value={current.brand_name ?? ""} onChange={(v) => set("brand_name", v)} />
      <TextField
        label="E-mail de réception des notifications (admin)"
        value={current.notification_email ?? ""}
        onChange={(v) => set("notification_email", v)}
      />

      <div className="rounded-xl border border-border/60 p-3 space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Fuseau horaire du site</div>
        <p className="text-[11px] text-muted-foreground">
          Sert uniquement à afficher l’heure dans les e-mails de notification.
        </p>
        <select
          value={current.timezone ?? "UTC"}
          onChange={(e) => set("timezone", e.target.value)}
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {TIMEZONES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border/60 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Recharge du broker</div>
        <label className="flex items-center justify-between gap-3 cursor-pointer">
          <span className="text-sm">Exiger une recharge du broker avant tout retrait (tous les comptes)</span>
          <input
            type="checkbox"
            checked={!!current.broker_topup_enabled}
            onChange={(e) => set("broker_topup_enabled", e.target.checked)}
            className="h-5 w-5 accent-[var(--color-primary)]"
          />
        </label>
        <TextField label="Adresse du broker" value={current.broker_address ?? ""} onChange={(v) => set("broker_address", v)} />
        <TextField label="URL de l’image du QR code (facultatif — généré depuis l’adresse si vide)" value={current.broker_qr_url ?? ""} onChange={(v) => set("broker_qr_url", v)} />
      </div>

      <div className="rounded-xl border border-border/60 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Virement bancaire</div>
        <TextField label="Nom de la banque" value={current.deposit_bank_name ?? ""} onChange={(v) => set("deposit_bank_name", v)} />
        <TextField label="Bénéficiaire" value={current.deposit_bank_beneficiary ?? ""} onChange={(v) => set("deposit_bank_beneficiary", v)} />
        <TextField label="IBAN" value={current.deposit_iban ?? ""} onChange={(v) => set("deposit_iban", v)} />
      </div>
      <div className="rounded-xl border border-border/60 p-3 space-y-3">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Adresses crypto</div>
        <TextField label="Adresse BTC" value={current.deposit_btc_address ?? ""} onChange={(v) => set("deposit_btc_address", v)} />
        <TextField label="Adresse USDT (TRC20)" value={current.deposit_usdt_address ?? ""} onChange={(v) => set("deposit_usdt_address", v)} />
      </div>

      <button onClick={save} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">Enregistrer les paramètres</button>
    </div>
  );
}

// UI helpers
function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-5 space-y-3 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
