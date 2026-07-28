import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast, Toaster } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — GOLD HOLDINGS" },
      { name: "description", content: "Set a new password for your GOLD HOLDINGS account." },
      { property: "og:title", content: "Reset password — GOLD HOLDINGS" },
      { property: "og:description", content: "Set a new password for your GOLD HOLDINGS account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
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
