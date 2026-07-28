import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Position = Database["public"]["Tables"]["positions"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];

export function useMyProfile(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

export function useIsAdmin(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["role", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).some((r) => r.role === "admin");
    },
  });
}

export function useMyPositions(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["positions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .eq("user_id", userId!)
        .order("opened_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Position[];
    },
    refetchInterval: 3000,
  });
}

export function useMyTransactions(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["tx", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

export function useAppSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as AppSettings | null;
    },
  });
}

// Admin queries
export function useAllUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("*");
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r) => {
        const list = roleMap.get(r.user_id) ?? [];
        list.push(r.role);
        roleMap.set(r.user_id, list);
      });
      return (profiles ?? []).map((p) => ({ ...p, roles: roleMap.get(p.id) ?? [] }));
    },
  });
}

export function useAllTransactions() {
  return useQuery({
    queryKey: ["admin-tx"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transactions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

export function useAllOpenPositions() {
  return useQuery({
    queryKey: ["admin-positions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("positions").select("*").order("opened_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Position[];
    },
  });
}

// ---------------- Mutations ----------------

export function useOpenPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; side: "Buy" | "Sell"; lot: number }) => {
      // simulate a price around current gold
      const openPrice = Number((4046 + (Math.random() - 0.5) * 6).toFixed(3));
      const { error } = await supabase.from("positions").insert({
        user_id: input.userId,
        side: input.side,
        lot: input.lot,
        open_price: openPrice,
        current_price: openPrice,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
}

export function useClosePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (position: Position) => {
      // Compute close price + p/l based on verdict
      let pl = position.pl;
      let closePrice = position.current_price;
      if (position.verdict === "force_win") {
        pl = Math.abs(Number(position.verdict_amount ?? 5000));
      } else if (position.verdict === "force_loss") {
        pl = -Math.abs(Number(position.verdict_amount ?? 5000));
      }
      const { error } = await supabase
        .from("positions")
        .update({ status: "closed", closed_at: new Date().toISOString(), close_price: closePrice, pl })
        .eq("id", position.id);
      if (error) throw error;

      // Credit user balance
      const { data: prof } = await supabase.from("profiles").select("balance,total_pl").eq("id", position.user_id).maybeSingle();
      if (prof) {
        await supabase
          .from("profiles")
          .update({ balance: Number(prof.balance) + pl, total_pl: Number(prof.total_pl) + pl })
          .eq("id", position.user_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useRequestTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      userId: string;
      kind: "deposit" | "withdrawal";
      method: "bank_transfer" | "card" | "btc" | "usdt";
      amount: number;
      reference?: string;
      destination?: string;
      card_last4?: string;
    }) => {
      const { error } = await supabase.from("transactions").insert({
        user_id: input.userId,
        kind: input.kind,
        method: input.method,
        amount: input.amount,
        reference: input.reference ?? null,
        destination: input.destination ?? null,
        card_last4: input.card_last4 ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tx"] }),
  });
}

// ---------------- Admin mutations ----------------

export function useAdminUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<Profile> }) => {
      const { error } = await supabase.from("profiles").update(input.patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useAdminUpdatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; patch: Partial<Position> }) => {
      const { error } = await supabase.from("positions").update(input.patch).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-positions"] });
      qc.invalidateQueries({ queryKey: ["positions"] });
    },
  });
}

export function useAdminSettleTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tx: Transaction; approve: boolean; note?: string }) => {
      const status = input.approve ? "approved" : "rejected";
      const { error } = await supabase
        .from("transactions")
        .update({ status, admin_note: input.note ?? null, processed_at: new Date().toISOString() })
        .eq("id", input.tx.id);
      if (error) throw error;

      if (input.approve) {
        const { data: prof } = await supabase.from("profiles").select("balance").eq("id", input.tx.user_id).maybeSingle();
        if (prof) {
          const delta = input.tx.kind === "deposit" ? Number(input.tx.amount) : -Number(input.tx.amount);
          await supabase.from("profiles").update({ balance: Number(prof.balance) + delta }).eq("id", input.tx.user_id);
        }
      }

      // Notify user
      await supabase.from("notifications").insert({
        user_id: input.tx.user_id,
        title: `${input.tx.kind === "deposit" ? "Deposit" : "Withdrawal"} ${status}`,
        body: `Your ${input.tx.kind} of ${input.tx.amount} ${input.tx.currency} was ${status}.`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tx"] });
      qc.invalidateQueries({ queryKey: ["tx"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });
}

export function useAdminUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<AppSettings>) => {
      const { error } = await supabase.from("app_settings").update(patch).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}
