import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAppSettings, useMyProfile, useRequestTransaction } from "@/lib/data";

type Kind = "deposit" | "withdrawal";
type Method = "bank_transfer" | "card" | "btc" | "usdt";

export function TransactionModal({
  open,
  onClose,
  kind,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  kind: Kind;
  userId: string;
}) {
  const [method, setMethod] = useState<Method>("bank_transfer");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [destination, setDestination] = useState("");
  const [card, setCard] = useState({ number: "", exp: "", cvc: "" });
  const settings = useAppSettings();
  const req = useRequestTransaction();

  if (!open) return null;

  const methods: { id: Method; label: string }[] = [
    { id: "bank_transfer", label: "Bank transfer" },
    { id: "card", label: "Card" },
    { id: "btc", label: "Bitcoin" },
    { id: "usdt", label: "USDT (TRC20)" },
  ];

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    if (kind === "withdrawal" && (method === "btc" || method === "usdt" || method === "bank_transfer") && !destination) {
      return toast.error("Enter destination");
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
      toast.success(`${kind === "deposit" ? "Deposit" : "Withdrawal"} request submitted`);
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

        <div className="space-y-3">
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

          <button onClick={submit} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
            Submit request
          </button>
          <p className="text-[11px] text-muted-foreground text-center">
            Your request will be reviewed by an admin. You'll be notified once processed.
          </p>
        </div>
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
