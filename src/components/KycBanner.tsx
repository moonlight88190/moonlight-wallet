import { Link } from "@tanstack/react-router";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { useKyc, kycDue } from "@/hooks/use-kyc";
import { useProfile } from "@/hooks/use-wallet";

export function KycBanner() {
  const { data: profile } = useProfile();
  const { data: kyc } = useKyc();
  if (!profile || kyc === undefined) return null;
  if (!kycDue(profile.created_at) || kyc?.status === "approved") return null;
  const pending = kyc?.status === "pending";
  return (
    <Link
      to="/kyc"
      className="flex items-center gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 min-h-[56px]"
    >
      <ShieldCheck className="h-5 w-5 text-gold shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {pending ? "KYC under review" : kyc?.status === "rejected" ? "KYC rejected — resubmit" : "Complete your KYC"}
        </p>
        <p className="text-xs text-muted-foreground">
          {pending ? "We'll notify you once it's approved." : "Required to keep withdrawing."}
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
