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

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function useMyNotifications(userId: string | undefined) {
  return useQuery({
    enabled: !!userId,
    queryKey: ["notifications", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
    refetchInterval: 20000,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
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

import { openPosition, closePosition } from "./positions.functions";
import { SYMBOL_BASE_PRICE } from "./symbols";

export function useOpenPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; side: "Buy" | "Sell"; lot: number; symbol?: string; stake?: number }) => {
      const symbol = input.symbol ?? "XAUUSD";
      const base = SYMBOL_BASE_PRICE[symbol] ?? 1;
      const spread = base * 0.0008;
      const openPrice = Number((base + (Math.random() - 0.5) * spread * 2).toFixed(base > 50 ? 3 : 5));
      await openPosition({ data: { side: input.side, lot: input.lot, open_price: openPrice, symbol, stake: input.stake ?? 0 } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}


export function useClosePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Position & { client_pl?: number }) => {
      await closePosition({ data: { positionId: input.id, client_pl: input.client_pl } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["positions"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

import { submitTransaction } from "./transactions.functions";

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
      await submitTransaction({
        data: {
          kind: input.kind,
          method: input.method,
          amount: input.amount,
          reference: input.reference,
          destination: input.destination,
          card_last4: input.card_last4,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tx"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
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
      const { adminSettleTransaction } = await import("./admin.functions");
      await adminSettleTransaction({ data: { id: input.tx.id, approve: input.approve, note: input.note } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-tx"] });
      qc.invalidateQueries({ queryKey: ["tx"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}


export function useAdminDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tx"] });
      qc.invalidateQueries({ queryKey: ["admin-tx"] });
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
