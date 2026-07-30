// SMTP relay edge function. The app's server functions call this endpoint
// because the app runtime cannot open raw TCP/TLS sockets for SMTP.
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { to, cc, subject, html, text } = await req.json();
    if (!to || !subject) {
      return new Response(JSON.stringify({ error: "to and subject are required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const hostname = Deno.env.get("SMTP_HOST")!;
    const port = Number(Deno.env.get("SMTP_PORT") ?? "465");
    const username = Deno.env.get("SMTP_USER")!;
    const password = Deno.env.get("SMTP_PASSWORD")!;
    // The SMTP server only allows sending as the authenticated mailbox.
    const from = `OTC Broker <${username}>`;

    const client = new SMTPClient({
      connection: { hostname, port, tls: port === 465, auth: { username, password } },
    });

    await client.send({
      from,
      to,
      cc: cc ?? undefined,
      subject,
      content: text ?? subject,
      html,
    });
    await client.close();

    console.log("[send-mail] sent", { to, cc, subject });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-mail] failed", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
