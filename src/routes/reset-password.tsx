import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — OTC BROKER" },
      { name: "description", content: "Set a new password for your OTC BROKER account." },
      { property: "og:title", content: "Reset password — OTC BROKER" },
      { property: "og:description", content: "Set a new password for your OTC BROKER account." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://otcbroker.space/reset-password" },
      { property: "og:image", content: "https://otcbroker.space/otc-broker-og.jpg" },
      { property: "og:image:secure_url", content: "https://otcbroker.space/otc-broker-og.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "OTC BROKER" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Reset password — OTC BROKER" },
      { name: "twitter:description", content: "Set a new password for your OTC BROKER account." },
      { name: "twitter:image", content: "https://otcbroker.space/otc-broker-og.jpg" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://otcbroker.space/reset-password" }],
  }),
  component: ResetPage,
});

function ResetPage() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated");
      nav({ to: "/dashboard", replace: true });
    } catch (err: any) {
      toast.error(err.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-5 bg-background">
      <Toaster position="top-center" theme="dark" />
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border/60 bg-surface/60 p-5 space-y-3">
        <h1 className="text-lg font-bold">Set new password</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          placeholder="New password"
          className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button disabled={busy} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60">
          {busy ? "Saving…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
