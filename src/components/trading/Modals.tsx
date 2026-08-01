import { useEffect, useState } from "react";
import { X, Copy, Check as CheckIcon, QrCode } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { useAppSettings, useMyProfile, useRequestTransaction } from "@/lib/data";

/* ---------- Broker top-up (single deposit method / blocked withdrawals) ---------- */
export function BrokerTopUpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useAppSettings();
  const address = settings.data?.broker_address ?? "";
  const qrUrl = settings.data?.broker_qr_url ?? "";
  const [generated, setGenerated] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open || qrUrl || !address) return setGenerated("");
    QRCode.toDataURL(address, { margin: 1, width: 320 }).then(setGenerated).catch(() => setGenerated(""));
  }, [open, address, qrUrl]);

  if (!open) return null;
  const img = qrUrl || generated;

  const copy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success("Address copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recharger le broker</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent"><X size={18} /></button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Envoyez le montant souhaité à l'adresse ci-dessous. Votre compte sera crédité dès réception.
        </p>

        <div className="mt-4 grid place-items-center">
          {img ? (
            <img src={img} alt="Broker deposit QR code" className="h-48 w-48 rounded-xl bg-white p-2" />
          ) : (
            <div className="h-48 w-48 rounded-xl border border-border/60 grid place-items-center text-muted-foreground">
              <QrCode size={40} />
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Adresse du broker</label>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
            <span className="flex-1 font-mono text-xs break-all">{address || "—"}</span>
            <button onClick={copy} className="shrink-0 p-1.5 rounded-md hover:bg-accent" aria-label="Copy address">
              {copied ? <CheckIcon size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <button onClick={onClose} className="mt-5 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          J'ai effectué le paiement
        </button>
      </div>
    </div>
  );
}

type Kind = "deposit" | "withdrawal";
type Method = "bank_transfer" | "card" | "btc" | "usdt";

export function TransactionModal({
  open,
  onClose,
  kind,
  userId,
  blocked,
  onTopUp,
}: {
  open: boolean;
  onClose: () => void;
  kind: Kind;
  userId: string;
  blocked?: boolean;
  onTopUp?: () => void;
}) {
  const [method, setMethod] = useState<Method>("bank_transfer");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [destination, setDestination] = useState("");
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const settings = useAppSettings();
  const profile = useMyProfile(userId);
  const req = useRequestTransaction();

  if (!open) return null;
  const locked = kind === "withdrawal" && !!blocked;


  const methods: { id: Method; label: string }[] = [
    { id: "bank_transfer", label: "Bank transfer" },
    { id: "card", label: "Card" },
    { id: "btc", label: "Bitcoin" },
    { id: "usdt", label: "USDT (TRC20)" },
  ];

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (kind === "withdrawal") {
      const bal = Number(profile.data?.balance ?? 0);
      if (amt > bal) return toast.error(`Insufficient balance (available ${bal.toFixed(2)})`);
      if ((method === "btc" || method === "usdt" || method === "bank_transfer") && !destination) {
        return toast.error("Enter destination");
      }
    }
    try {
      await req.mutateAsync({
        userId,
        kind,
        method,
        amount: amt,
        reference: reference || null as any,
        destination: destination || null as any,
        card_last4: method === "card" && card.number ? card.number.slice(-4) : (null as any),
      });
      toast.success(`${kind === "deposit" ? "Deposit" : "Withdrawal"} of ${amt.toFixed(2)} processed`);
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const s = settings.data;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold capitalize">{kind}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent"><X size={18} /></button>
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 bg-background/60 rounded-lg mb-4">
          {methods.map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`py-2 text-[11px] font-semibold rounded-md ${
                method === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className={`space-y-3 ${locked ? "opacity-60 pointer-events-none select-none" : ""}`} aria-disabled={locked}>
          <Field label="Amount (USD)" value={amount} onChange={setAmount} placeholder="1000" />

          {kind === "deposit" && method === "bank_transfer" && s && (
            <Info>
              Wire to: <b>{s.deposit_bank_beneficiary || "—"}</b><br />
              Bank: {s.deposit_bank_name || "—"}<br />
              IBAN: <span className="font-mono">{s.deposit_iban || "—"}</span>
            </Info>
          )}
          {kind === "deposit" && method === "btc" && s && (
            <Info>Send BTC to: <span className="font-mono break-all">{s.deposit_btc_address || "—"}</span></Info>
          )}
          {kind === "deposit" && method === "usdt" && s && (
            <Info>Send USDT (TRC20) to: <span className="font-mono break-all">{s.deposit_usdt_address || "—"}</span></Info>
          )}
          {method === "card" && (
            <>
              <Field label="Card number" value={card.number} onChange={(v) => setCard({ ...card, number: v })} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Expiry" value={card.exp} onChange={(v) => setCard({ ...card, exp: v })} placeholder="12/28" />
                <Field label="CVC" value={card.cvc} onChange={(v) => setCard({ ...card, cvc: v })} placeholder="123" />
              </div>
            </>
          )}
          {kind === "deposit" && (method === "bank_transfer" || method === "btc" || method === "usdt") && (
            <Field label="Transaction reference / hash" value={reference} onChange={setReference} placeholder="Paste hash or wire ref" />
          )}
          {kind === "withdrawal" && (
            <Field
              label={method === "bank_transfer" ? "Your IBAN" : method === "card" ? "Your card number" : "Wallet address"}
              value={destination}
              onChange={setDestination}
            />
          )}

          <button
            onClick={submit}
            disabled={locked}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60"
          >
            Confirm {kind === "deposit" ? "deposit" : "withdrawal"}
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Your {kind} will be processed instantly and your balance updated.
          </p>

        </div>

        {locked && (
          <div className="mt-4 rounded-xl border p-4" style={{ borderColor: "color-mix(in oklch, var(--color-loss) 45%, transparent)", background: "color-mix(in oklch, var(--color-loss) 12%, transparent)" }}>
            <div className="text-sm font-semibold">Retrait momentanément indisponible</div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              Votre marge de courtage est insuffisante pour libérer les retraits. Rechargez le broker pour débloquer vos moyens de retrait.
            </p>
            <button
              onClick={() => { onClose(); onTopUp?.(); }}
              className="mt-3 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
            >
              Recharger le broker
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export function OpenPositionModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (side: "Buy" | "Sell", lot: number) => void;
}) {
  const [lot, setLot] = useState("1.00");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/60 p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">New XAU/USD position</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent"><X size={18} /></button>
        </div>
        <Field label="Lot size" value={lot} onChange={setLot} placeholder="1.00" />
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { onSubmit("Sell", Number(lot) || 0); onClose(); }}
            className="py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--color-loss)", color: "white" }}
          >
            Sell
          </button>
          <button
            onClick={() => { onSubmit("Buy", Number(lot) || 0); onClose(); }}
            className="py-3 rounded-xl font-semibold text-sm"
            style={{ background: "var(--color-profit)", color: "black" }}
          >
            Buy
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3 text-xs leading-relaxed">
      {children}
    </div>
  );
}
