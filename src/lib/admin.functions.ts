import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; password: string; first_name: string; last_name: string }) => {
    if (!input?.email || !input?.password) throw new Error("Email and password required");
    if (input.password.length < 8) throw new Error("Password must be at least 8 characters");
    return input;
  })
  .handler(async ({ data, context }) => {
    // Verify caller is admin (via user-scoped supabase client, respects RLS)
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const display_name = `${data.first_name} ${data.last_name}`.trim() || data.email.split("@")[0];

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name, first_name: data.first_name, last_name: data.last_name },
    });
    if (error) throw new Error(error.message);

    // Ensure profile display_name reflects provided name (handle_new_user trigger uses metadata fallback)
    if (created?.user?.id) {
      await supabaseAdmin.from("profiles").update({ display_name, verified: true }).eq("id", created.user.id);
    }

    return { ok: true, id: created?.user?.id ?? null };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    if (!input?.id) throw new Error("User id required");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");
    if (data.id === context.userId) throw new Error("You cannot delete your own account");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSettleTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; approve: boolean; note?: string }) => {
    if (!input?.id) throw new Error("Transaction id required");
    return { id: input.id, approve: !!input.approve, note: input.note };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: tx, error: txErr } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (txErr) throw new Error(txErr.message);
    if (!tx) throw new Error("Transaction introuvable");
    if (tx.status !== "pending") throw new Error("Transaction déjà traitée");

    const amount = Number(tx.amount);
    const currency = tx.currency ?? "USD";
    const isDeposit = tx.kind === "deposit";
    const status = data.approve ? "approved" : "rejected";

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("email,display_name,balance")
      .eq("id", tx.user_id)
      .maybeSingle();

    let newBalance = Number(prof?.balance ?? 0);

    if (data.approve) {
      const delta = isDeposit ? amount : -amount;
      const { data: rpcBal, error: balErr } = await supabaseAdmin.rpc("apply_balance_only", {
        _user_id: tx.user_id,
        _delta: delta,
      });
      if (balErr) throw new Error(balErr.message);
      newBalance = Number(rpcBal ?? newBalance + delta);
    }

    const { error: upErr } = await supabaseAdmin
      .from("transactions")
      .update({ status, admin_note: data.note ?? null, processed_at: new Date().toISOString() })
      .eq("id", tx.id);
    if (upErr) throw new Error(upErr.message);

    const label = isDeposit ? "Deposit" : "Withdrawal";
    await supabaseAdmin.from("notifications").insert({
      user_id: tx.user_id,
      title: data.approve ? `${label} completed` : `${label} declined`,
      body: data.approve
        ? `Your ${tx.kind} of ${amount.toFixed(2)} ${currency} has been completed.`
        : `Your ${tx.kind} of ${amount.toFixed(2)} ${currency} could not be completed.`,
    });

    const { sendTransactionalEmail, getMailConfig, formatInTz } = await import("./email.server");
    const mailCfg = await getMailConfig();
    const methodLabel = {
      bank_transfer: "Bank transfer",
      card: "Debit / credit card",
      btc: "Bitcoin (BTC)",
      usdt: "USDT (TRC20)",
    }[tx.method as "bank_transfer" | "card" | "btc" | "usdt"];

    await sendTransactionalEmail({
      to: prof?.email ?? undefined,
      adminEmail: mailCfg.email,
      subject: data.approve
        ? `${label} completed — ${amount.toFixed(2)} ${currency}`
        : `${label} declined — ${amount.toFixed(2)} ${currency}`,
      payload: {
        title: data.approve ? `${label} completed` : `${label} declined`,
        preheader: data.approve
          ? `Your ${tx.kind} of ${amount.toFixed(2)} ${currency} has been settled.`
          : `Your ${tx.kind} of ${amount.toFixed(2)} ${currency} was not completed.`,
        greeting: `Hello ${prof?.display_name ?? "trader"},`,
        intro: data.approve
          ? isDeposit
            ? `Your deposit has been credited to your trading account and is available immediately.`
            : `Your withdrawal has been settled and the funds have been sent to your specified destination.`
          : `We were unable to complete your ${tx.kind} request. No funds have been debited from your trading account.`,
        rows: [
          { label: "Transaction type", value: label },
          { label: "Amount", value: `${amount.toFixed(2)} ${currency}`, accent: data.approve ? "profit" : "loss" },
          { label: "Method", value: methodLabel ?? String(tx.method) },
          ...(tx.destination ? [{ label: "Destination", value: String(tx.destination) }] : []),
          ...(tx.card_last4 ? [{ label: "Card", value: `•••• ${tx.card_last4}` }] : []),
          { label: "Status", value: data.approve ? "Completed" : "Declined", accent: (data.approve ? "profit" : "loss") as "profit" | "loss" },
          { label: "Processed at", value: formatInTz(mailCfg.timezone) },
          ...(data.approve
            ? [{ label: "New balance", value: `${newBalance.toFixed(2)} ${currency}` }]
            : []),
        ],
        reference: tx.id,
        footerNote: data.approve
          ? "You can review this transaction at any time in your account history."
          : "Your available balance is unchanged. You may submit a new request at any time.",
      },
    });

    return { ok: true, status };
  });
