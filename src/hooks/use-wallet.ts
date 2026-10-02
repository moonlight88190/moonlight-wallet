import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getRates } from "@/lib/rates.functions";
import { syncAccountGeography } from "@/lib/geolocation.functions";
import { resolveAccountGeography, type NormalizedGeography } from "@/lib/geolocation";

/**
 * Returns account region label derived from normalized geography (e.g. "Indian Account", "European Account").
 */
export function getAccountRegionLabel(geography?: NormalizedGeography | null): string {
  if (geography?.accountRegionLabel) {
    return geography.accountRegionLabel;
  }
  return "Global Account";
}

/**
 * Hook to retrieve normalized account geography and capability resolution.
 * Automatically synchronizes with server-side IP geolocation and persists to profile.
 */
export function useAccountGeography() {
  const syncGeoFn = useServerFn(syncAccountGeography);
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["account-geography", profile?.id, profile?.country_code],
    queryFn: async () => {
      try {
        const geo = await syncGeoFn();
        return geo;
      } catch {
        // Fallback to local resolver using profile data
        return resolveAccountGeography(
          profile?.country_code,
          profile?.city,
          profile?.timezone,
          profile?.region,
        );
      }
    },
    staleTime: 60 * 60 * 1000, // 1 hour stale time
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data, error } = await supabase.from("wallets").select("*").single();
      if (error) throw error;
      return data;
    },
  });
}

export function useRates() {
  const fn = useServerFn(getRates);
  return useQuery({ queryKey: ["rates"], queryFn: () => fn(), staleTime: 60 * 60 * 1000 });
}

export function useTransactions(limit = 100) {
  return useQuery({
    queryKey: ["transactions", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useSetPreferredCurrency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, currency }: { id: string; currency: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ preferred_currency: currency, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}

export type Tx = NonNullable<ReturnType<typeof useTransactions>["data"]>[number];

/** Direction and amount of a transaction from the viewer's perspective. */
export function txView(tx: Tx, walletId: string | undefined) {
  if (tx.kind === "withdrawal") {
    // Withdrawal fee comes OUT OF requested amount.
    // Wallet debit is exactly the requested amount (or sender_debit if stored).
    const debitAmount = Number(tx.sender_debit ?? tx.amount);
    return {
      outgoing: true,
      title: `Withdrawn to ${tx.recipient_name || tx.method || "Payout"}`,
      amount: -Math.abs(debitAmount),
      currency: tx.currency,
    };
  }

  const outgoing = tx.sender_wallet_id === walletId;
  if (outgoing) {
    // Send fee is charged ON TOP of the transfer amount.
    // Total sender debit = transfer amount + fee.
    const debitAmount = Number(tx.sender_debit ?? Number(tx.amount) + Number(tx.fee || 0));
    return {
      outgoing: true,
      title: `Sent to ${tx.recipient_name || tx.recipient_wallet_code}`,
      amount: -Math.abs(debitAmount),
      currency: tx.currency,
    };
  }
  return {
    outgoing: false,
    title:
      tx.kind === "admin_credit"
        ? "Balance added"
        : `Received from ${tx.sender_name || tx.sender_wallet_code}`,
    amount: Number(tx.recipient_amount ?? tx.amount),
    currency: tx.recipient_currency ?? tx.currency,
  };
}
