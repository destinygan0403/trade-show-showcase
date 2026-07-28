import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Method = "bank_transfer" | "card" | "btc" | "usdt";
type Kind = "deposit" | "withdrawal";

export const submitTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    kind: Kind;
    method: Method;
    amount: number;
    reference?: string;
    destination?: string;
    card_last4?: string;
  }) => {
    if (!input?.kind || !input?.method) throw new Error("Missing kind/method");
    const amt = Number(input.amount);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error("Invalid amount");
    return { ...input, amount: amt };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: prof, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("balance,currency")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prof) throw new Error("Profile not found");

    const balance = Number(prof.balance);
    const currency = prof.currency ?? "USD";
    const delta = data.kind === "deposit" ? data.amount : -data.amount;

    if (data.kind === "withdrawal" && data.amount > balance) {
      // Auto-reject insufficient funds
      await supabaseAdmin.from("transactions").insert({
        user_id: userId,
        kind: data.kind,
        method: data.method,
        amount: data.amount,
        currency,
        reference: data.reference ?? null,
        destination: data.destination ?? null,
        card_last4: data.card_last4 ?? null,
        status: "rejected",
        admin_note: "Insufficient funds",
        processed_at: new Date().toISOString(),
      });
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "Withdrawal declined",
        body: `Insufficient funds for a withdrawal of ${data.amount.toFixed(2)} ${currency}.`,
      });
      throw new Error("Insufficient funds");
    }

    const { error: txErr } = await supabaseAdmin.from("transactions").insert({
      user_id: userId,
      kind: data.kind,
      method: data.method,
      amount: data.amount,
      currency,
      reference: data.reference ?? null,
      destination: data.destination ?? null,
      card_last4: data.card_last4 ?? null,
      status: "approved",
      processed_at: new Date().toISOString(),
    });
    if (txErr) throw new Error(txErr.message);

    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .update({ balance: balance + delta })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);

    const label = data.kind === "deposit" ? "Deposit" : "Withdrawal";
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: `${label} confirmed`,
      body: `Your ${data.kind} of ${data.amount.toFixed(2)} ${currency} has been processed.`,
    });

    return { ok: true, new_balance: balance + delta };
  });
