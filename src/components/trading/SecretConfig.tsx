import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { setState, resetState, useTradingState } from "@/lib/trading-store";

export function SecretConfig({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useTradingState();
  const [balance, setBalance] = useState(String(s.balance));
  const [totalPL, setTotalPL] = useState(String(s.totalPL));
  const [positionPLs, setPositionPLs] = useState(s.positions.map((p) => String(p.pl)));

  useEffect(() => {
    if (open) {
      setBalance(String(s.balance));
      setTotalPL(String(s.totalPL));
      setPositionPLs(s.positions.map((p) => String(p.pl)));
    }
  }, [open]);

  if (!open) return null;

  const save = () => {
    const b = parseFloat(balance.replace(/,/g, "")) || 0;
    const tp = parseFloat(totalPL.replace(/,/g, "")) || 0;
    const positions = s.positions.map((p, i) => ({
      ...p,
      pl: parseFloat(positionPLs[i]?.replace(/,/g, "") || "0") || 0,
    }));
    setState({ balance: b, totalPL: tp, positions });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-md bg-surface border border-border rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Configuration</h2>
            <p className="text-xs text-muted-foreground">Set custom display values</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-accent">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <Field label="Account Balance (USD)" value={balance} onChange={setBalance} placeholder="164153230.00" />
          <Field label="Total P/L (USD)" value={totalPL} onChange={setTotalPL} placeholder="8421774.35" />

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Position P/L</label>
            <div className="mt-2 space-y-2">
              {positionPLs.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16">#{i + 1}</span>
                  <input
                    value={v}
                    onChange={(e) => {
                      const next = [...positionPLs];
                      next[i] = e.target.value;
                      setPositionPLs(next);
                    }}
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                resetState();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl border border-border text-sm font-medium hover:bg-accent"
            >
              Reset
            </button>
            <button
              onClick={save}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode="decimal"
        className="mt-1 w-full bg-background border border-border rounded-lg px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}
