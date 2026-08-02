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

    const { data: profFull } = await supabaseAdmin
      .from("profiles")
      .select("email,display_name")
      .eq("id", userId)
      .maybeSingle();
    const { sendTransactionalEmail, getMailConfig, formatInTz } = await import("./email.server");
    const mailCfg = await getMailConfig();
    const adminEmail = mailCfg.email;
    const methodLabel = {
      bank_transfer: "Bank transfer",
      card: "Debit / credit card",
      btc: "Bitcoin (BTC)",
      usdt: "USDT (TRC20)",
    }[data.method];

    if (data.kind === "withdrawal" && data.amount > balance) {
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
      if (profFull?.email) {
        await sendTransactionalEmail({
          to: profFull.email,
          adminEmail,
          subject: `Withdrawal declined — ${data.amount.toFixed(2)} ${currency}`,
          payload: {
            title: "Withdrawal declined",
            preheader: "Your withdrawal request could not be processed.",
            greeting: `Hello ${profFull.display_name ?? "trader"},`,
            intro: `We were unable to process your withdrawal request. The requested amount exceeds your available trading balance.`,
            rows: [
              { label: "Requested amount", value: `${data.amount.toFixed(2)} ${currency}`, accent: "loss" },
              { label: "Available balance", value: `${balance.toFixed(2)} ${currency}` },
              { label: "Method", value: methodLabel },
              ...(data.destination ? [{ label: "Destination", value: data.destination }] : []),
              { label: "Status", value: "Declined", accent: "loss" as const },
            ],
            footerNote:
              "Please fund your account and submit a new withdrawal request. If you believe this is an error, contact support.",
          },
        });
      }
      throw new Error("Insufficient funds");
    }

    const { data: inserted, error: txErr } = await supabaseAdmin
      .from("transactions")
      .insert({
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
      })
      .select("id")
      .maybeSingle();
    if (txErr) throw new Error(txErr.message);

    const newBalance = balance + delta;
    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);

    const label = data.kind === "deposit" ? "Deposit" : "Withdrawal";
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title: `${label} confirmed`,
      body: `Your ${data.kind} of ${data.amount.toFixed(2)} ${currency} has been processed.`,
    });

    if (profFull?.email) {
      const isDeposit = data.kind === "deposit";
      await sendTransactionalEmail({
        to: profFull.email,
        adminEmail,
        subject: `${label} confirmed — ${data.amount.toFixed(2)} ${currency}`,
        payload: {
          title: `${label} confirmed`,
          preheader: `Your ${data.kind} of ${data.amount.toFixed(2)} ${currency} has been credited.`,
          greeting: `Hello ${profFull.display_name ?? "trader"},`,
          intro: isDeposit
            ? `We have received and credited your deposit to your trading account. Your funds are immediately available for trading.`
            : `Your withdrawal request has been processed. The funds are on their way to your specified destination.`,
          rows: [
            { label: "Transaction type", value: label },
            { label: "Amount", value: `${data.amount.toFixed(2)} ${currency}`, accent: isDeposit ? "profit" : "neutral" },
            { label: "Method", value: methodLabel },
            ...(data.destination ? [{ label: "Destination", value: data.destination }] : []),
            ...(data.card_last4 ? [{ label: "Card", value: `•••• ${data.card_last4}` }] : []),
            ...(data.reference ? [{ label: "Your reference", value: data.reference }] : []),
            { label: "Processed at", value: formatInTz(mailCfg.timezone) },
            { label: "New balance", value: `${newBalance.toFixed(2)} ${currency}`, accent: "profit" },
          ],
          reference: inserted?.id ?? undefined,
          footerNote: isDeposit
            ? "Thank you for trading with OTC Broker. You can view this transaction in your account history at any time."
            : "For security, funds settlement to external accounts can take a short delay depending on your bank or network.",
        },
      });
    }

    return { ok: true, new_balance: newBalance };
  });
