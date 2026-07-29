import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Side = "Buy" | "Sell";

export const openPosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { side: Side; lot: number; open_price: number }) => {
    if (input.side !== "Buy" && input.side !== "Sell") throw new Error("Invalid side");
    const lot = Number(input.lot);
    const price = Number(input.open_price);
    if (!Number.isFinite(lot) || lot <= 0) throw new Error("Invalid lot");
    if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid price");
    return { side: input.side, lot, open_price: price };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: inserted, error } = await supabaseAdmin
      .from("positions")
      .insert({
        user_id: userId,
        side: data.side,
        lot: data.lot,
        open_price: data.open_price,
        current_price: data.open_price,
      })
      .select("id, opened_at")
      .maybeSingle();
    if (error) throw new Error(error.message);

    const { data: prof } = await supabaseAdmin.from("profiles").select("email,display_name").eq("id", userId).maybeSingle();
    if (prof?.email) {
      const { sendTransactionalEmail, getAdminNotificationEmail } = await import("./email.server");
      const admin = await getAdminNotificationEmail();
      await sendTransactionalEmail({
        to: prof.email,
        adminEmail: admin,
        subject: `Position opened — ${data.side} ${data.lot.toFixed(2)} lot XAU/USD`,
        payload: {
          title: "Position opened",
          preheader: `Your ${data.side} order on XAU/USD has been executed.`,
          greeting: `Hello ${prof.display_name ?? "trader"},`,
          intro: `Your market order has been executed successfully on XAU/USD. The position is now open and its P/L will update in real time on your dashboard.`,
          rows: [
            { label: "Symbol", value: "XAU/USD" },
            { label: "Side", value: data.side, accent: data.side === "Buy" ? "profit" : "loss" },
            { label: "Volume", value: `${data.lot.toFixed(2)} lot` },
            { label: "Open price", value: data.open_price.toFixed(3) },
            { label: "Executed at", value: new Date(inserted?.opened_at ?? Date.now()).toUTCString() },
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
  .inputValidator((input: { positionId: string }) => {
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

    let pl = Number(pos.pl);
    const closePrice = Number(pos.current_price);
    if (pos.verdict === "force_win") {
      pl = Math.abs(Number(pos.verdict_amount ?? 5000));
    } else if (pos.verdict === "force_loss") {
      pl = -Math.abs(Number(pos.verdict_amount ?? 5000));
    }

    const closedAt = new Date().toISOString();
    const { error: uErr } = await supabaseAdmin
      .from("positions")
      .update({ status: "closed", closed_at: closedAt, close_price: closePrice, pl })
      .eq("id", pos.id);
    if (uErr) throw new Error(uErr.message);

    const { data: prof } = await supabaseAdmin
      .from("profiles")
      .select("email,display_name,balance,total_pl,currency")
      .eq("id", userId)
      .maybeSingle();

    let newBalance: number | undefined;
    if (prof) {
      newBalance = Number(prof.balance) + pl;
      await supabaseAdmin
        .from("profiles")
        .update({ balance: newBalance, total_pl: Number(prof.total_pl) + pl })
        .eq("id", userId);
    }

    if (prof?.email) {
      const { sendTransactionalEmail, getAdminNotificationEmail } = await import("./email.server");
      const admin = await getAdminNotificationEmail();
      const currency = prof.currency ?? "USD";
      const openedAt = new Date(pos.opened_at as string);
      const durationMs = Date.now() - openedAt.getTime();
      const mins = Math.max(1, Math.round(durationMs / 60000));
      const durationLabel = mins < 60 ? `${mins} min` : `${(mins / 60).toFixed(1)} h`;
      await sendTransactionalEmail({
        to: prof.email,
        adminEmail: admin,
        subject: `Position closed — ${pl >= 0 ? "+" : ""}${pl.toFixed(2)} ${currency}`,
        payload: {
          title: "Position closed",
          preheader: `Your ${pos.side} XAU/USD position has been closed.`,
          greeting: `Hello ${prof.display_name ?? "trader"},`,
          intro: `Your ${pos.side} position on XAU/USD has been closed. The realized P/L has been credited to your trading balance.`,
          rows: [
            { label: "Symbol", value: "XAU/USD" },
            { label: "Side", value: String(pos.side), accent: pos.side === "Buy" ? "profit" : "loss" },
            { label: "Volume", value: `${Number(pos.lot).toFixed(2)} lot` },
            { label: "Open price", value: Number(pos.open_price).toFixed(3) },
            { label: "Close price", value: closePrice.toFixed(3) },
            { label: "Duration", value: durationLabel },
            { label: "Realized P/L", value: `${pl >= 0 ? "+" : ""}${pl.toFixed(2)} ${currency}`, accent: pl >= 0 ? "profit" : "loss" },
            newBalance !== undefined
              ? { label: "New balance", value: `${newBalance.toFixed(2)} ${currency}` }
              : { label: "Closed at", value: new Date(closedAt).toUTCString() },
          ],
          reference: pos.id,
        },
      });
    }

    return { ok: true, pl, close_price: closePrice };
  });
