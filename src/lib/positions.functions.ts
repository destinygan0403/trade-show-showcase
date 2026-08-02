import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { isTradableSymbol, DEFAULT_SYMBOL } from "./symbols";

type Side = "Buy" | "Sell";

export const openPosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { side: Side; lot: number; open_price: number; symbol?: string; stake?: number }) => {
    if (input.side !== "Buy" && input.side !== "Sell") throw new Error("Invalid side");
    const lot = Number(input.lot);
    const price = Number(input.open_price);
    if (!Number.isFinite(lot) || lot <= 0) throw new Error("Invalid lot");
    if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid price");
    const stake = Number(input.stake ?? 0);
    if (!Number.isFinite(stake) || stake < 0) throw new Error("Montant investi invalide");
    const symbol = input.symbol && isTradableSymbol(input.symbol) ? input.symbol : DEFAULT_SYMBOL;
    return { side: input.side, lot, open_price: price, symbol, stake };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: vProf } = await supabaseAdmin.from("profiles").select("verified").eq("id", userId).maybeSingle();
    if (!vProf?.verified) throw new Error("Compte non vérifié — en attente de validation");


    if (data.stake > 0) {
      const { data: bal } = await supabaseAdmin.from("profiles").select("balance").eq("id", userId).maybeSingle();
      if (!bal || Number(bal.balance) < data.stake) throw new Error("Solde insuffisant pour ouvrir cette position");
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("positions")
      .insert({
        user_id: userId,
        symbol: data.symbol,
        side: data.side,
        lot: data.lot,
        stake: data.stake,
        open_price: data.open_price,
        current_price: data.open_price,
      })
      .select("id, opened_at")
      .maybeSingle();
    if (error) throw new Error(error.message);

    // Margin is debited from the balance right away (credited back on close).
    if (data.stake > 0) {
      const { error: dErr } = await supabaseAdmin.rpc("apply_balance_only", { _user_id: userId, _delta: -data.stake });
      if (dErr) throw new Error(dErr.message);
    }

    const { data: prof } = await supabaseAdmin.from("profiles").select("email,display_name").eq("id", userId).maybeSingle();
    if (prof?.email) {
      const { sendTransactionalEmail, getMailConfig, formatInTz } = await import("./email.server");
      const cfg = await getMailConfig();
      await sendTransactionalEmail({
        to: prof.email,
        adminEmail: cfg.email,
        subject: `Position opened — ${data.side} ${data.lot.toFixed(2)} lot ${data.symbol}`,
        payload: {
          title: "Position opened",
          preheader: `Your ${data.side} order on ${data.symbol} has been executed.`,
          greeting: `Hello ${prof.display_name ?? "trader"},`,
          intro: `Your market order has been executed successfully on ${data.symbol}. The position is now open and its P/L will update in real time on your dashboard.`,
          rows: [
            { label: "Symbol", value: data.symbol },
            { label: "Side", value: data.side, accent: data.side === "Buy" ? "profit" : "loss" },
            { label: "Volume", value: `${data.lot.toFixed(2)} lot` },
            { label: "Open price", value: data.open_price.toFixed(3) },
            ...(data.stake > 0 ? [{ label: "Invested amount", value: data.stake.toFixed(2) }] : []),
            { label: "Executed at", value: formatInTz(cfg.timezone, inserted?.opened_at ?? Date.now()) },
          ],
          reference: inserted?.id ?? undefined,
          footerNote: "Keep an eye on this position from the dashboard. You can close it at any moment from the Open tab.",
        },
      });
    }

    return { ok: true, id: inserted?.id ?? null };
  });

export const closePosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { positionId: string; client_pl?: number }) => {
    if (!input?.positionId) throw new Error("Missing positionId");
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: pos, error: pErr } = await supabaseAdmin
      .from("positions")
      .select("*")
      .eq("id", data.positionId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!pos) throw new Error("Position not found");
    if (pos.user_id !== userId) throw new Error("Forbidden");
    if (pos.status !== "open") throw new Error("Position already closed");

    const stake = Number((pos as { stake?: number }).stake ?? 0) || 0;
    let pl = Number(pos.pl);
    const closePrice = Number(pos.current_price);
    if (pos.verdict === "force_win") {
      pl = Math.abs(Number(pos.verdict_amount ?? 5000));
    } else if (pos.verdict === "force_loss") {
      pl = -Math.abs(Number(pos.verdict_amount ?? 5000));
    } else if (Number.isFinite(Number(data.client_pl))) {
      // No admin verdict: settle on the live (floating) P/L shown to the user.
      pl = Number(data.client_pl);
    }
    if (!Number.isFinite(pl)) pl = 0;
    // A losing position can never cost more than the invested amount.
    if (stake > 0 && pl < -stake) pl = -stake;

    const closedAt = new Date().toISOString();
    // Guard against double-close races: only the update that still sees the
    // position as "open" wins, and only that one credits the balance.
    const { data: updatedRows, error: uErr } = await supabaseAdmin
      .from("positions")
      .update({ status: "closed", closed_at: closedAt, close_price: closePrice, pl })
      .eq("id", pos.id)
      .eq("status", "open")
      .select("id");
    if (uErr) throw new Error(uErr.message);
    if (!updatedRows || updatedRows.length === 0) throw new Error("Position already closed");

    // Give the invested margin back (balance only, not counted as P/L)…
    if (stake > 0) {
      const { error: rErr } = await supabaseAdmin.rpc("apply_balance_only", { _user_id: userId, _delta: stake });
      if (rErr) throw new Error(rErr.message);
    }
    // …then apply the realized result atomically (balance + total P/L).
    const { data: newBalanceRaw, error: rpcErr } = await supabaseAdmin.rpc("apply_balance_delta", {
      _user_id: userId,
      _delta: pl,
    });
    if (rpcErr) throw new Error(rpcErr.message);
    const newBalance = newBalanceRaw === null || newBalanceRaw === undefined ? undefined : Number(newBalanceRaw);

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("email,display_name,currency")
      .eq("id", userId)
      .maybeSingle();

    if (prof?.email) {
      const { sendTransactionalEmail, getMailConfig, formatInTz } = await import("./email.server");
      const cfg = await getMailConfig();
      const currency = prof.currency ?? "USD";
      const symbol = String(pos.symbol ?? "XAUUSD");
      const openedAt = new Date(pos.opened_at as string);
      const durationMs = Date.now() - openedAt.getTime();
      const mins = Math.max(1, Math.round(durationMs / 60000));
      const durationLabel = mins < 60 ? `${mins} min` : `${(mins / 60).toFixed(1)} h`;
      await sendTransactionalEmail({
        to: prof.email,
        adminEmail: cfg.email,
        subject: `Position closed — ${pl >= 0 ? "+" : ""}${pl.toFixed(2)} ${currency}`,
        payload: {
          title: "Position closed",
          preheader: `Your ${pos.side} ${symbol} position has been closed.`,
          greeting: `Hello ${prof.display_name ?? "trader"},`,
          intro: `Your ${pos.side} position on ${symbol} has been closed. The realized P/L has been credited to your trading balance.`,
          rows: [
            { label: "Symbol", value: symbol },
            { label: "Side", value: String(pos.side), accent: pos.side === "Buy" ? "profit" : "loss" },
            { label: "Volume", value: `${Number(pos.lot).toFixed(2)} lot` },
            { label: "Open price", value: Number(pos.open_price).toFixed(3) },
            { label: "Close price", value: closePrice.toFixed(3) },
            { label: "Duration", value: durationLabel },
            { label: "Closed at", value: formatInTz(cfg.timezone, closedAt) },
            { label: "Realized P/L", value: `${pl >= 0 ? "+" : ""}${pl.toFixed(2)} ${currency}`, accent: pl >= 0 ? "profit" : "loss" },
            ...(newBalance !== undefined
              ? [{ label: "New balance", value: `${newBalance.toFixed(2)} ${currency}` }]
              : []),
          ],
          reference: pos.id,
        },
      });
    }

    return { ok: true, pl, close_price: closePrice, new_balance: newBalance ?? null };
  });
