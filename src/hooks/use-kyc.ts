import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const KYC_DUE_DAYS = 5;

export function kycDue(createdAt: string | null | undefined) {
  if (!createdAt) return false;
  return Date.now() >= new Date(createdAt).getTime() + KYC_DUE_DAYS * 86400000;
}

export function useKyc() {
  return useQuery({
    queryKey: ["kyc"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("kyc_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000,
  });
}
