// Server-only email helper. Loaded lazily inside server-function handlers.
// The app runtime cannot open raw SMTP sockets, so sending is delegated to the
// `send-mail` backend function which talks to Hostinger SMTP.


export type MailRow = { label: string; value: string; accent?: "profit" | "loss" | "neutral" };

export type MailPayload = {
  title: string;
  preheader: string;
  greeting?: string;
  intro: string;
  rows: MailRow[];
  footerNote?: string;
  reference?: string;
};

const BRAND = "OTC Broker";
const BRAND_TAG = "Global Trading Services";
const SUPPORT = "support@otcbroker.space";

function esc(v: string) {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderHtml(p: MailPayload) {
  const rows = p.rows
    .map((r) => {
      const color =
        r.accent === "profit" ? "#0ecb81" : r.accent === "loss" ? "#f6465d" : "#0f172a";
      return `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f5;color:#64748b;font-size:13px;">${esc(r.label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eef1f5;color:${color};font-size:13px;font-weight:600;text-align:right;font-family:'SFMono-Regular',Menlo,Consolas,monospace;">${esc(r.value)}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.title)}</title></head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
<div style="display:none;max-height:0;overflow:hidden;color:transparent;">${esc(p.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6fa;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.06);">
      <tr><td style="background:linear-gradient(135deg,#0b132b 0%,#1c2541 100%);padding:22px 28px;">
        <table role="presentation" width="100%"><tr>
          <td style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:0.5px;">${BRAND}</td>
          <td align="right" style="color:#8ea3c7;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;">${BRAND_TAG}</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:28px;">
        <div style="font-size:11px;font-weight:700;color:#2563eb;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">Transaction notice</div>
        <h1 style="margin:0 0 14px 0;font-size:20px;font-weight:700;color:#0f172a;">${esc(p.title)}</h1>
        ${p.greeting ? `<p style="margin:0 0 10px 0;font-size:14px;color:#334155;">${esc(p.greeting)}</p>` : ""}
        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.55;color:#475569;">${esc(p.intro)}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #eef1f5;">${rows}</table>
        ${p.reference ? `<p style="margin:18px 0 0 0;font-size:12px;color:#94a3b8;">Reference: <span style="font-family:'SFMono-Regular',Menlo,Consolas,monospace;color:#475569;">${esc(p.reference)}</span></p>` : ""}
        ${p.footerNote ? `<p style="margin:22px 0 0 0;padding:12px 14px;background:#f8fafc;border-left:3px solid #2563eb;font-size:12px;color:#475569;line-height:1.5;">${esc(p.footerNote)}</p>` : ""}
      </td></tr>
      <tr><td style="background:#0b132b;padding:18px 28px;color:#8ea3c7;font-size:11px;line-height:1.6;">
        This is an automated message from ${BRAND}. Please do not reply.<br>
        For assistance, contact <a href="mailto:${SUPPORT}" style="color:#8ea3c7;">${SUPPORT}</a>.
      </td></tr>
    </table>
    <p style="margin:14px 0 0 0;font-size:11px;color:#94a3b8;">© ${new Date().getFullYear()} ${BRAND}. All rights reserved.</p>
  </td></tr>
</table>
</body></html>`;
}

function renderText(p: MailPayload) {
  const rows = p.rows.map((r) => `${r.label}: ${r.value}`).join("\n");
  return `${p.title}\n\n${p.intro}\n\n${rows}${p.reference ? `\n\nReference: ${p.reference}` : ""}\n\n— ${BRAND}`;
}

/**
 * Send a transactional email to `to` (user) and CC the admin notification
 * address configured in `app_settings.notification_email` when present.
 */
export async function sendTransactionalEmail(opts: {
  to: string;
  subject: string;
  payload: MailPayload;
  adminEmail?: string | null;
}) {
  try {
    const transporter = getTransporter();
    const from = process.env.SMTP_FROM ?? `OTC Broker <${process.env.SMTP_USER}>`;
    const bcc = opts.adminEmail && opts.adminEmail !== opts.to ? opts.adminEmail : undefined;
    await transporter.sendMail({
      from,
      to: opts.to,
      bcc,
      subject: opts.subject,
      html: renderHtml(opts.payload),
      text: renderText(opts.payload),
    });
  } catch (err) {
    // Never let email failure break the underlying business flow.
    console.error("[email] send failed:", err);
  }
}

export async function getAdminNotificationEmail(): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("app_settings").select("notification_email").eq("id", 1).maybeSingle();
  return (data?.notification_email as string | null) ?? null;
}
