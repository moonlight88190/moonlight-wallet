import { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  User,
  ArrowLeft,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Zap,
  Clock,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  BankLogo,
  CountryFlag,
  GiftCardBrand,
  GiftCardImage,
  UPIProviderLogo,
  BrandAsset,
} from "@/components/AssetComponents";
import { PaymentAnimation } from "@/components/PaymentAnimation";
import { triggerTransactionalEmail } from "@/lib/email";
import {
  GIFT_CARDS,
  PAYMENT_METHODS,
  UPI_PROVIDERS,
  INDIAN_BANKS,
  getMethodTargetCurrency,
  parseUPIHandle,
  type BankMeta,
  type GiftCardMeta,
  type PaymentMethodMeta,
  type UPIProviderMeta,
} from "@/lib/assets";
import { CURRENCIES, convert, formatMoney, getRate } from "@/lib/currency";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfile, useWallet, useRates, useAccountGeography } from "@/hooks/use-wallet";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      { title: "Withdraw — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Withdraw via UPI, Indian Banks, SEPA, UK Faster Payments, GCash or redeem digital vouchers.",
      },
      { property: "og:title", content: "Withdraw — Moonlight Wallet" },
      {
        property: "og:description",
        content: "Payout channels and digital gift cards.",
      },
    ],
  }),
  component: Withdraw,
});

/* ─── Rail chips shown in step 1 ─── */
const RAIL_OPTIONS = [
  { id: "upi", name: "UPI", icon: "upi", badge: "5 Business Days" },
  { id: "in-bank", name: "Indian Bank", icon: "sbi", badge: "5 Business Days" },
  { id: "sepa", name: "SEPA", icon: "sepa", badge: "5 Business Days" },
  { id: "faster-payments", name: "Faster Payments", icon: "faster-payments", badge: "5 Business Days" },
  { id: "gcash", name: "GCash", icon: "gcash", badge: "5 Business Days" },
  { id: "pix", name: "Pix", icon: "pix", badge: "5 Business Days" },
];

function Withdraw() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: wallet } = useWallet();
  const { data: profile } = useProfile();
  const rates = useRates();
  const geography = useAccountGeography();
  const geo = geography.data;

  const isFrozen = wallet?.status === "frozen";

  // Authoritative verified jurisdiction resolution (Indian by default; changed via admin panel only)
  const verifiedCountryCode = (
    geo?.countryCode ||
    (profile?.admin_region_override ? profile?.country_code : "IN") ||
    "IN"
  ).toUpperCase();
  const isEurope =
    geo?.isEurope ??
    Boolean(
      profile?.admin_region_override &&
      ([
        "DE",
        "FR",
        "IT",
        "ES",
        "NL",
        "BE",
        "AT",
        "PT",
        "IE",
        "FI",
        "GR",
        "EE",
        "LV",
        "LT",
        "SK",
        "SI",
        "CY",
        "MT",
        "LU",
      ].includes(verifiedCountryCode) ||
        profile?.region?.toUpperCase() === "EUROPE"),
    );
  const isPH = Boolean(
    geo?.capabilities?.supportsGCash ||
      (profile?.admin_region_override &&
        (verifiedCountryCode === "PH" ||
          profile?.region?.toUpperCase() === "PHILIPPINES")),
  );
  const isIndia = geo?.isIndia ?? (!isEurope && !isPH);
  const isUK = Boolean(
    geo?.isUK ??
      (profile?.admin_region_override &&
        (verifiedCountryCode === "GB" || verifiedCountryCode === "UK")),
  );
  const isBR = Boolean(
    geo?.capabilities?.supportsPix ||
      (profile?.admin_region_override && verifiedCountryCode === "BR"),
  );

  // Currency strictly locked to verified jurisdiction (AML & CFT Statutory Requirement)
  const verifiedCurrency = isIndia
    ? "INR"
    : isEurope
      ? "EUR"
      : isPH
        ? "PHP"
        : isUK
          ? "GBP"
          : isBR
            ? "BRL"
            : "INR";

  const verifiedCountryName = isIndia
    ? "India"
    : isEurope
      ? "Europe"
      : isPH
        ? "Philippines"
        : isUK
          ? "United Kingdom"
          : isBR
            ? "Brazil"
            : geo?.countryName || "India";

  const verifiedFlagCode = isIndia
    ? "IN"
    : isEurope
      ? "DE"
      : isPH
        ? "PH"
        : isUK
          ? "GB"
          : isBR
            ? "BR"
            : "IN";

  // Authorized domestic payout rails for verified country
  const allowedRailIds = isIndia
    ? ["upi", "in-bank"]
    : isEurope
      ? ["sepa"]
      : isPH
        ? ["gcash"]
        : isUK
          ? ["faster-payments"]
          : isBR
            ? ["pix"]
            : ["upi", "in-bank"];

  const preferredCurrency = profile?.preferred_currency || verifiedCurrency;
  const r = rates.data?.rates ?? {};

  // 48h account age check & real-time countdown calculation
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const unlockTime = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
  const accountAgeHours = Math.max(0, (now - createdAt.getTime()) / (1000 * 60 * 60));
  const isEligible48h = accountAgeHours >= 48;
  const remainingMs = Math.max(0, unlockTime.getTime() - now);
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const progressPercent = Math.min(100, Math.max(0, Math.round((accountAgeHours / 48) * 100)));

  // Security lock explanation popup
  const [isSecurityLockOpen, setIsSecurityLockOpen] = useState<boolean>(false);

  // $100 USD max limit
  const userRate = getRate(preferredCurrency, rates.data?.rates);
  const limit100InPreferred = 100 * userRate;

  // Mode: rails vs vouchers
  const [activeTab, setActiveTab] = useState<"rails" | "vouchers">("rails");

  // Selected payout method: default to first allowed domestic rail
  const initialDefaultMethod =
    PAYMENT_METHODS.find((m) => allowedRailIds.includes(m.id)) || PAYMENT_METHODS[0]!;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodMeta>(initialDefaultMethod);
  const [selectedUPIApp, setSelectedUPIApp] = useState<UPIProviderMeta | null>(
    UPI_PROVIDERS.find((p) => p.id === "bhim") || UPI_PROVIDERS[0]!,
  );
  const [selectedBank, setSelectedBank] = useState<BankMeta | null>(INDIAN_BANKS[0]!);

  // Form state - currency strictly locked to verified jurisdiction
  const [withdrawAmount, setWithdrawAmount] = useState<string>("100");
  const [withdrawCurrency, setWithdrawCurrency] = useState<string>(verifiedCurrency);
  const [upiId, setUpiId] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [fullName, setFullName] = useState<string>(profile?.full_name || "");
  const [email, setEmail] = useState<string>(profile?.email || "");
  const [phone, setPhone] = useState<string>("");
  const [showPersonalDetails, setShowPersonalDetails] = useState<boolean>(false);

  // Synchronize method and currency whenever verified geography resolves
  useEffect(() => {
    if (!allowedRailIds.includes(selectedMethod.id)) {
      const firstAllowed =
        PAYMENT_METHODS.find((m) => allowedRailIds.includes(m.id)) || PAYMENT_METHODS[0]!;
      setSelectedMethod(firstAllowed);
    }
    if (withdrawCurrency !== verifiedCurrency) {
      setWithdrawCurrency(verifiedCurrency);
    }
  }, [allowedRailIds, selectedMethod.id, verifiedCurrency, withdrawCurrency]);

  // Review dialog
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  // Vouchers
  const [selectedCard, setSelectedCard] = useState<GiftCardMeta | null>(null);
  const [cardValue, setCardValue] = useState<number>(25);
  const [activeCardCategory, setActiveCardCategory] = useState<string>("All");

  // Animation state
  const [animState, setAnimState] = useState<"idle" | "processing" | "completed" | "failed">(
    "idle",
  );
  const [busy, setBusy] = useState(false);
  const [createdWdId, setCreatedWdId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  // Currency conversions: verified domestic payout corridor
  const sourceAmt = Number(withdrawAmount) || 0;
  const isUPI = selectedMethod.id.includes("upi");
  const isIndianBank = selectedMethod.id === "in-bank";
  const effectiveCurrency = verifiedCurrency;
  const targetCorridorCurrency = verifiedCurrency;
  const isCrossCorridor = false;
  const feeAmount = sourceAmt * 0.1;
  const netReceivedAmt = sourceAmt - feeAmount;

  const upiDetection = parseUPIHandle(upiId);

  // Sync UPI provider when user types a recognized handle (e.g. @upi -> BHIM)
  const handleUpiIdChange = (val: string) => {
    setUpiId(val);
    const det = parseUPIHandle(val);
    if (det.isVPA && det.providerId) {
      const match = UPI_PROVIDERS.find((p) => p.id === det.providerId);
      if (match) setSelectedUPIApp(match);
    }
  };

  // Rail switch handler with AML compliance and jurisdiction lock enforcement
  const handleSelectRail = (railId: string) => {
    if (isFrozen) {
      toast.error("Account is frozen. Payout rail selection is disabled.");
      return;
    }
    if (!allowedRailIds.includes(railId)) {
      toast.error(
        `AML & Fraud Prevention Policy: Verified ${verifiedCountryName} accounts may only withdraw in ${verifiedCurrency} via domestic rails (${allowedRailIds.join(", ").toUpperCase()}). Foreign rail access is restricted to prevent cross-border money laundering.`,
        { duration: 5000 },
      );
      return;
    }
    const found = PAYMENT_METHODS.find((m) => m.id === railId);
    if (!found) return;
    setSelectedMethod(found);
    setWithdrawCurrency(verifiedCurrency);
  };

  // Submit withdrawal
  async function handleSubmitWithdrawal() {
    if (isFrozen) {
      toast.error("Account is frozen. Withdrawals are locked.");
      return;
    }
    if (!isEligible48h) {
      setIsReviewOpen(false);
      setIsSecurityLockOpen(true);
      return;
    }

    if (sourceAmt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    // Strict AML Verification
    if (!allowedRailIds.includes(selectedMethod.id)) {
      toast.error(
        `AML Policy: Payout method not authorized for verified ${verifiedCountryName} accounts.`,
      );
      return;
    }

    if (effectiveCurrency !== verifiedCurrency) {
      toast.error(
        `AML Policy: Verified ${verifiedCountryName} accounts may only withdraw in ${verifiedCurrency}.`,
      );
      return;
    }

    if (sourceAmt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (isUPI) {
      if (!upiId.trim() || !upiDetection.isVPA) {
        toast.error("Please enter a valid UPI VPA (e.g. username@okhdfcbank or user@upi).");
        return;
      }
      if (!phone.trim() || phone.trim().length < 8) {
        toast.error("Please enter a valid beneficiary phone number for UPI verification.");
        return;
      }
    }

    if (isIndianBank) {
      if (!accountNumber.trim() || accountNumber.trim().length < 8) {
        toast.error("Please enter a valid bank account number.");
        return;
      }
      if (!ifscCode.trim() || ifscCode.trim().length < 4) {
        toast.error("Please enter a valid IFSC code.");
        return;
      }
    }

    const currentFullName = fullName.trim() || profile?.full_name || "Valued Customer";
    const currentEmail = email.trim() || profile?.email || "customer@moonlight.com";

    setIsReviewOpen(false);
    setBusy(true);
    setWithdrawError(null);
    setAnimState("processing");

    // Automatically resolve effective UPI app based on detected handle or selection
    const detectedUPI =
      isUPI && upiDetection.isVPA && upiDetection.providerId
        ? UPI_PROVIDERS.find((p) => p.id === upiDetection.providerId)
        : null;

    const effectiveUPIApp =
      detectedUPI || selectedUPIApp || UPI_PROVIDERS.find((p) => p.id === "bhim");

    const methodName = isIndianBank
      ? `${selectedBank?.name || "Indian Bank"} IMPS Transfer`
      : isUPI
        ? `${effectiveUPIApp?.name || "BHIM"} (UPI)`
        : selectedMethod.name;

    const providerName = isIndianBank
      ? selectedBank?.name
      : isUPI
        ? effectiveUPIApp?.name || "BHIM UPI"
        : selectedMethod.name;

    const finalCurrency = isUPI || isIndianBank ? "INR" : withdrawCurrency;

    const withdrawReason = isIndianBank
      ? `Transfer to ${selectedBank?.name || "Indian Bank"} A/C ••••${accountNumber.slice(-4)} (IFSC: ${ifscCode.toUpperCase()})`
      : isUPI
        ? `UPI Payout to ${upiId.trim()} (${phone.trim()}) via ${providerName}`
        : `Transfer to ${selectedMethod.name}`;

    const { data: wdId, error } = await supabase.rpc(
      "create_withdrawal" as never,
      {
        p_amount: sourceAmt,
        p_currency: finalCurrency,
        p_method: methodName,
        p_full_name: currentFullName,
        p_email: currentEmail,
        p_upi_id: isUPI ? upiId.trim() : null,
        p_provider: providerName,
        p_phone: phone.trim() || null,
        p_reason: withdrawReason,
      } as never,
    );

    setBusy(false);

    if (error) {
      setWithdrawError(error.message);
      setAnimState("failed");
      toast.error(error.message);
      return;
    }

    const createdWdIdStr = wdId as string;
    setCreatedWdId(createdWdIdStr);
    setAnimState("completed");
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["withdrawals"] });

    triggerTransactionalEmail({
      eventType: "withdrawal_requested",
      withdrawalId: createdWdIdStr,
    });
  }

  // Voucher redemption
  async function handleRedeemVoucher() {
    if (isFrozen) {
      toast.error("Account is frozen. Voucher redemption is locked.");
      return;
    }
    if (!isEligible48h) {
      setSelectedCard(null);
      setIsSecurityLockOpen(true);
      return;
    }

    const brandName = selectedCard?.brand || "Digital Voucher";
    setBusy(true);
    setWithdrawError(null);
    setAnimState("processing");

    const { data: wdId, error } = await supabase.rpc(
      "create_withdrawal" as never,
      {
        p_amount: cardValue,
        p_currency: preferredCurrency,
        p_method: `${brandName} Digital Voucher`,
        p_full_name: profile?.full_name || "Valued Customer",
        p_email: profile?.email || "customer@moonlight.com",
        p_upi_id: null,
        p_provider: brandName,
        p_phone: null,
        p_reason: `Redeemed ${brandName} Voucher`,
      } as never,
    );

    setBusy(false);

    if (error) {
      setWithdrawError(error.message);
      setAnimState("failed");
      toast.error(error.message);
      return;
    }

    const createdVoucherWdId = wdId as string;
    setSelectedCard(null);
    setCreatedWdId(createdVoucherWdId);
    setAnimState("completed");
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["withdrawals"] });

    triggerTransactionalEmail({
      eventType: "withdrawal_requested",
      withdrawalId: createdVoucherWdId,
    });
  }

  const primaryBtn =
    "flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-bold tracking-wider uppercase text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-md touch-manipulation cursor-pointer";

  // Animation state: render cinematic payment journey
  if (animState !== "idle") {
    return (
      <div className="mx-auto max-w-md py-6 px-2 animate-in fade-in duration-200">
        <PaymentAnimation
          state={animState}
          type="withdrawal"
          senderName={profile?.full_name || "Moonlight Wallet"}
          senderCode={wallet?.wallet_code || "ML-WALLET"}
          recipientName={
            selectedMethod.id === "in-bank"
              ? `${selectedBank?.name} ••••${accountNumber.slice(-4) || "0000"}`
              : upiId.trim() || selectedMethod.name
          }
          recipientCode={
            selectedMethod.id === "in-bank"
              ? `IFSC: ${ifscCode.toUpperCase() || "IFSC"}`
              : upiId.trim() || selectedMethod.name
          }
          sourceAmount={sourceAmt}
          sourceCurrency={withdrawCurrency}
          destinationAmount={netReceivedAmt}
          destinationCurrency={targetCorridorCurrency}
          paymentMethodId={
            selectedMethod.id === "in-bank"
              ? selectedBank?.id || "in-bank"
              : selectedUPIApp?.id || selectedMethod.id
          }
          paymentMethodName={
            selectedMethod.id === "in-bank"
              ? selectedBank?.name || "Indian Bank"
              : selectedUPIApp?.name || selectedMethod.name
          }
          exchangeRate={undefined}
          fee={feeAmount}
          errorMessage={withdrawError || undefined}
          onRetry={() => setAnimState("idle")}
          onViewReceipt={() => {
            if (createdWdId) navigate({ to: "/withdrawals/$id", params: { id: createdWdId } });
          }}
          onCancel={() => setAnimState("idle")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 pb-2 animate-in fade-in duration-200 overflow-x-hidden px-1 sm:px-0">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Withdraw</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Transfer funds to bank payout rails or redeem digital gift vouchers.
        </p>
      </div>

      {/* Eligibility */}
      {!isEligible48h && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsSecurityLockOpen(true)}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start justify-between gap-3 text-xs cursor-pointer hover:bg-amber-500/15 transition-all group shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 flex-wrap">
                <span>Account Security Clearance Active</span>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300">
                  {remainingHours}h {remainingMinutes}m remaining
                </span>
              </p>
              <p className="text-muted-foreground leading-relaxed">
                In accordance with statutory financial compliance and account protection protocols, newly registered wallets undergo a mandatory 48-hour security clearance window prior to outbound external bank disbursements. Tap to view clearance details &amp; schedule.
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-semibold text-amber-600 dark:text-amber-400 underline underline-offset-2 group-hover:text-amber-500 mt-0.5">
            View Details
          </span>
        </div>
      )}

      {/* ─── AML & Anti-Fraud Compliance Notice ─── */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 sm:p-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-foreground text-xs">
              AML & Anti-Fraud Compliance Policy
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/25 px-2 py-0.5 text-[10px] font-semibold text-primary">
            <CountryFlag code={verifiedFlagCode} circle size="xs" />
            <span>{verifiedCountryName} Verified</span>
          </span>
        </div>

        <p className="text-muted-foreground text-[11px] leading-relaxed">
          In strict compliance with statutory Anti-Money Laundering (AML), CFT guidelines, and
          central bank regulations (including Reserve Bank of India, European Central Bank, and
          BSP), withdrawals are locked to your verified country of residence and its domestic
          national currency:
        </p>

        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              isIndia
                ? "border-primary/50 bg-primary/10 font-semibold"
                : "border-border/40 bg-card/40 opacity-70"
            }`}
          >
            <span className="text-[10px] block text-muted-foreground">India 🇮🇳</span>
            <span className="text-xs font-mono font-bold text-foreground">INR Only</span>
          </div>
          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              isEurope
                ? "border-primary/50 bg-primary/10 font-semibold"
                : "border-border/40 bg-card/40 opacity-70"
            }`}
          >
            <span className="text-[10px] block text-muted-foreground">Europe 🇪🇺</span>
            <span className="text-xs font-mono font-bold text-foreground">EUR Only</span>
          </div>
          <div
            className={`p-2 rounded-xl border text-center transition-all ${
              isPH
                ? "border-primary/50 bg-primary/10 font-semibold"
                : "border-border/40 bg-card/40 opacity-70"
            }`}
          >
            <span className="text-[10px] block text-muted-foreground">Philippines 🇵🇭</span>
            <span className="text-xs font-mono font-bold text-foreground">PHP Only</span>
          </div>
        </div>

        <div className="flex items-start gap-1.5 pt-1 text-[10px] text-muted-foreground border-t border-border/40">
          <Lock className="h-3 w-3 shrink-0 mt-0.5 text-muted-foreground/80" />
          <span>
            <strong>Fraud & Anti-Money Laundering Safeguard:</strong> Protects your account against
            unauthorized cross-border foreign exchange conversion, credential stuffing exfiltration,
            and illicit money laundering by locking rails to verified local identity.
          </span>
        </div>
      </div>

      {/* ─── Freeze Alert Banner ─── */}
      {isFrozen && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left space-y-2 text-destructive dark:text-rose-300 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <Lock className="h-4 w-4" />
              <span>Withdrawals Suspended — Account Frozen</span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-destructive/20 border border-destructive/30">
              Restricted
            </span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This wallet is under an administrative security freeze. Outbound domestic payouts (UPI, Indian Bank IMPS, SEPA, Faster Payments) and digital gift voucher redemptions are paused. Your ledger funds remain safe.
          </p>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-card/60 border border-border/60 text-xs font-semibold shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab("rails")}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "rails"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Payout Rails
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "vouchers"
              ? "bg-primary text-primary-foreground shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Gift Vouchers
        </button>
      </div>

      {activeTab === "rails" ? (
        <div className="space-y-6 w-full">
          {/* ─── STEP 1: Payout Method ─── */}
          <section className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Payout Channel
              </span>
              <span className="text-xs font-semibold text-primary">{selectedMethod.name}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full">
              {RAIL_OPTIONS.map((rail) => {
                const isSelected = selectedMethod.id === rail.id;
                const isAllowed = allowedRailIds.includes(rail.id);
                return (
                  <button
                    key={rail.id}
                    type="button"
                    onClick={() => handleSelectRail(rail.id)}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all cursor-pointer touch-manipulation text-center min-w-0 overflow-hidden relative ${
                      isSelected
                        ? "border-primary/60 bg-primary/10 shadow-xs font-semibold"
                        : isAllowed
                          ? "border-border/50 bg-card/60 hover:bg-muted/40"
                          : "border-border/30 bg-muted/20 opacity-60 hover:opacity-80"
                    }`}
                  >
                    {!isAllowed && (
                      <span className="absolute top-1.5 right-1.5 text-muted-foreground/80">
                        <Lock className="h-3 w-3" />
                      </span>
                    )}
                    <BrandAsset id={rail.icon} size="xs" />
                    <span className="text-xs font-semibold text-foreground truncate w-full">
                      {rail.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono ${
                        isAllowed
                          ? "text-muted-foreground bg-muted/60"
                          : "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      {isAllowed ? rail.badge : "AML Locked"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* UPI Sub-selector */}
            {selectedMethod.id === "upi" && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-2 w-full overflow-hidden">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">
                  Select UPI Provider
                </span>
                <div className="grid grid-cols-5 gap-1.5 w-full">
                  {UPI_PROVIDERS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUPIApp(app)}
                      className={`flex flex-col items-center justify-center gap-1 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer touch-manipulation min-w-0 overflow-hidden ${
                        selectedUPIApp?.id === app.id
                          ? "border-primary bg-primary/10 shadow-xs font-semibold"
                          : "border-transparent hover:bg-muted/40"
                      }`}
                    >
                      <UPIProviderLogo providerId={app.id} size="xs" />
                      <span className="text-[10px] font-medium truncate w-full text-center block">
                        {app.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bank Sub-selector */}
            {selectedMethod.id === "in-bank" && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-2 w-full overflow-hidden">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">
                  Select Bank
                </span>
                <div className="grid grid-cols-5 gap-1.5 w-full">
                  {INDIAN_BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`flex flex-col items-center justify-center gap-1 p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer touch-manipulation min-w-0 overflow-hidden ${
                        selectedBank?.id === b.id
                          ? "border-primary bg-primary/10 shadow-xs font-semibold"
                          : "border-transparent hover:bg-muted/40"
                      }`}
                    >
                      <BankLogo bankId={b.id} size="xs" />
                      <span className="text-[10px] font-medium truncate w-full text-center block">
                        {b.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ─── STEP 2: Amount ─── */}
          <section className="space-y-3 pt-3 border-t border-border/40 w-full">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Withdrawal Amount
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Available:{" "}
                <strong className="text-foreground">
                  {formatMoney(Number(wallet?.balance_usd || 0) * userRate, preferredCurrency)}
                </strong>
              </span>
            </div>

            <div className="flex gap-2.5 w-full">
              <Input
                type="number"
                inputMode="decimal"
                disabled={isFrozen || busy}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="100"
                className={`h-14 text-2xl font-bold rounded-2xl flex-1 border-border/60 bg-card/60 px-4 min-w-0 ${
                  isFrozen ? "opacity-60 cursor-not-allowed" : ""
                }`}
              />
              <div
                className="h-14 w-36 rounded-2xl border border-border/60 bg-muted/40 font-semibold shrink-0 flex items-center justify-between px-3 cursor-not-allowed select-none"
                title={`Locked to ${effectiveCurrency} based on your verified ${verifiedCountryName} identity (Anti-Money Laundering & Fraud Protection Policy)`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <CountryFlag code={verifiedFlagCode} circle size="xs" />
                  <span className="text-sm font-bold text-foreground font-mono">
                    {effectiveCurrency}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-background/60 border border-border/40 px-1.5 py-0.5 rounded-md">
                  <Lock className="h-2.5 w-2.5" />
                  <span>AML</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 px-1 pt-0.5">
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Withdrawal currency strictly locked to <strong>{effectiveCurrency}</strong>{" "}
                (Verified Country: <strong>{verifiedCountryName}</strong>).
              </span>
            </p>
          </section>

          {/* ─── STEP 3: Destination ─── */}
          <section className="space-y-3 pt-3 border-t border-border/40 w-full">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Destination Details
            </span>

            {/* UPI */}
            {selectedMethod.id.includes("upi") && (
              <div className="space-y-3 w-full">
                {/* 5 Business Days Settlement Window Notice */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5 text-xs">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-foreground">
                      Standard Settlement Window: 5 Business Days
                    </span>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Withdrawal requests undergo multi-factor regulatory clearance and are processed across 5 business days. If statutory KYC verification is required, you will be notified to submit documents to moonlightwealthmanagement@gmail.com.
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="upi-vpa-input"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1"
                  >
                    UPI ID / VPA
                  </label>
                  <Input
                    id="upi-vpa-input"
                    value={upiId}
                    onChange={(e) => handleUpiIdChange(e.target.value)}
                    placeholder={
                      selectedUPIApp?.id === "bhim"
                        ? "username@upi"
                        : selectedUPIApp?.id === "google-pay"
                          ? "username@okhdfcbank"
                          : selectedUPIApp?.id === "phonepe"
                            ? "username@ybl"
                            : selectedUPIApp?.id === "paytm"
                              ? "mobilenumber@paytm"
                              : selectedUPIApp?.id === "amazon-pay"
                                ? "username@apl"
                                : "username@bank"
                    }
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck="false"
                    className="rounded-2xl h-12 text-base sm:text-sm font-mono border-border/60 bg-card/60 px-4 w-full"
                  />
                  {upiId.trim() && upiDetection.isVPA && (
                    <div className="flex items-center gap-1.5 px-1 pt-0.5">
                      <span className="text-[11px] text-emerald-500 font-medium">
                        Detected: {upiDetection.providerName}
                      </span>
                      {upiDetection.providerId && (
                        <UPIProviderLogo providerId={upiDetection.providerId} size="xs" />
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="beneficiary-phone-input"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1"
                  >
                    Registered Mobile Number
                  </label>
                  <Input
                    id="beneficiary-phone-input"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="rounded-2xl h-12 text-base sm:text-sm font-mono border-border/60 bg-card/60 px-4 w-full"
                  />
                  <p className="text-[10px] text-muted-foreground px-1">
                    Required for UPI beneficiary validation and IMPS settlement confirmation.
                  </p>
                </div>
              </div>
            )}

            {/* Indian Bank */}
            {selectedMethod.id === "in-bank" && (
              <div className="space-y-3 w-full">
                <div className="space-y-1">
                  <label
                    htmlFor="bank-account-number"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1"
                  >
                    Account Number
                  </label>
                  <Input
                    id="bank-account-number"
                    type="text"
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Bank Account Number"
                    className="rounded-2xl h-12 text-base sm:text-sm font-mono border-border/60 bg-card/60 px-4 w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="bank-ifsc-code"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1"
                  >
                    IFSC Code
                  </label>
                  <Input
                    id="bank-ifsc-code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="IFSC Code (e.g. SBIN0001234)"
                    className="rounded-2xl h-12 text-base sm:text-sm font-mono uppercase border-border/60 bg-card/60 px-4 w-full"
                    maxLength={11}
                  />
                </div>
              </div>
            )}

            {/* Other rails */}
            {!selectedMethod.id.includes("upi") && selectedMethod.id !== "in-bank" && (
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder={
                  selectedMethod.id === "sepa"
                    ? "IBAN (e.g. DE89...)"
                    : selectedMethod.id === "faster-payments"
                      ? "Sort code & account number"
                      : selectedMethod.id === "gcash"
                        ? "Mobile number"
                        : selectedMethod.id === "pix"
                          ? "Pix key (CPF / email / phone)"
                          : "Account identifier"
                }
                className="rounded-2xl h-12 text-base sm:text-sm font-mono border-border/60 bg-card/60 px-4 w-full"
              />
            )}
          </section>

          {/* ─── Personal Details (collapsible) ─── */}
          <div className="w-full">
            <button
              type="button"
              onClick={() => setShowPersonalDetails(!showPersonalDetails)}
              className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground py-1 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" />
                <span>
                  Profile:{" "}
                  <strong className="text-foreground">{fullName || profile?.full_name}</strong>
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  showPersonalDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showPersonalDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 animate-in fade-in duration-150 w-full">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="h-11 rounded-xl text-base sm:text-sm border-border/60 bg-card/60 px-3 w-full"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="h-11 rounded-xl text-base sm:text-sm border-border/60 bg-card/60 px-3 w-full"
                />
              </div>
            )}
          </div>

          {/* ─── Fee Summary ─── */}
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2 text-xs shadow-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>You send</span>
              <span className="font-mono font-semibold text-foreground">
                {formatMoney(sourceAmt, withdrawCurrency)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Fee (10%)</span>
              <span className="font-mono">{formatMoney(feeAmount, withdrawCurrency)}</span>
            </div>
            <div className="flex justify-between font-semibold text-foreground border-t border-border/40 pt-2">
              <span>Net payout</span>
              <span className="font-mono text-emerald-500 font-bold text-sm">
                {formatMoney(netReceivedAmt, targetCorridorCurrency)}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            disabled={isFrozen || busy || sourceAmt <= 0}
            onClick={() => {
              if (isFrozen) {
                toast.error("Account is frozen. Withdrawals are disabled.");
                return;
              }
              if (!isEligible48h) {
                setIsSecurityLockOpen(true);
                return;
              }
              setIsReviewOpen(true);
            }}
            className={`${primaryBtn} ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isFrozen ? (
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4" /> Withdrawals Locked
              </span>
            ) : (
              <>
                Review Withdrawal <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        /* ─── Vouchers ─── */
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {["All", "Gaming", "Shopping", "Entertainment"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCardCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-colors ${
                  activeCardCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GIFT_CARDS.filter(
              (c) => activeCardCategory === "All" || c.category === activeCardCategory,
            ).map((card) => (
              <GiftCardBrand key={card.id} card={card} onClick={() => setSelectedCard(card)} />
            ))}
          </div>
        </div>
      )}

      {/* ─── Review Dialog ─── */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-sm rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-center">
              Confirm Withdrawal
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              Verify your payout details before submitting to processing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs divide-y divide-border/40">
            <div className="flex justify-between pb-2">
              <span className="text-muted-foreground">Payout Channel</span>
              <span className="font-semibold text-foreground">
                {isIndianBank
                  ? `${selectedBank?.name || "Indian Bank"} IMPS Transfer`
                  : isUPI
                    ? `${(upiDetection.isVPA && upiDetection.providerId ? UPI_PROVIDERS.find((p) => p.id === upiDetection.providerId) : selectedUPIApp)?.name || "BHIM"} (UPI)`
                    : selectedMethod.name}
              </span>
            </div>
            <div className="flex justify-between pt-2 pb-2">
              <span className="text-muted-foreground">Settlement Window</span>
              <span className="font-semibold text-primary flex items-center gap-1 font-mono text-xs">
                <Clock className="h-3 w-3" />
                5 Business Days
              </span>
            </div>
            <div className="flex justify-between pt-2 pb-2">
              <span className="text-muted-foreground">Verified Country</span>
              <span className="font-medium text-foreground flex items-center gap-1.5">
                <CountryFlag code={verifiedFlagCode} circle size="xs" />
                <span>
                  {verifiedCountryName} ({effectiveCurrency} Only)
                </span>
              </span>
            </div>
            <div className="flex justify-between pt-2 pb-2">
              <span className="text-muted-foreground">AML Policy</span>
              <span className="text-[11px] font-semibold text-primary">Verified Domestic Rail</span>
            </div>
            <div className="flex justify-between pt-2 pb-2">
              <span className="text-muted-foreground">Destination</span>
              <span className="font-mono font-medium text-foreground truncate max-w-[180px]">
                {selectedMethod.id === "in-bank"
                  ? `${selectedBank?.name} ••••${accountNumber.slice(-4)}`
                  : upiId.trim() || profile?.email}
              </span>
            </div>
            {phone.trim() && (
              <div className="flex justify-between pt-2 pb-2">
                <span className="text-muted-foreground">Mobile Phone</span>
                <span className="font-mono font-medium text-foreground">{phone.trim()}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 pb-2">
              <span className="text-muted-foreground">Requested Amount</span>
              <span className="font-mono font-semibold">
                {formatMoney(sourceAmt, effectiveCurrency)}
              </span>
            </div>
            <div className="flex justify-between pt-2 pb-2">
              <span className="text-muted-foreground">Processing Fee (10%)</span>
              <span className="font-mono">{formatMoney(feeAmount, effectiveCurrency)}</span>
            </div>
            <div className="flex justify-between pt-2 font-bold text-sm text-foreground">
              <span>Net Payout</span>
              <span className="font-mono text-emerald-500">
                {formatMoney(netReceivedAmt, targetCorridorCurrency)}
              </span>
            </div>
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              className="flex-1 rounded-2xl text-xs h-11 border-border/60 cursor-pointer font-semibold"
            >
              Edit
            </Button>
            <button
              disabled={isFrozen || busy}
              onClick={handleSubmitWithdrawal}
              className={`${primaryBtn} flex-1 h-11 text-xs ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isFrozen ? "Withdrawals Locked" : "Submit"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Voucher Redeem Dialog ─── */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-sm rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-center">
              Redeem {selectedCard?.brand}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground text-center">
              Voucher code issued instantly upon wallet balance deduction.
            </DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4 py-1">
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden border border-border/60 shadow-xs">
                <GiftCardImage imageUrl={selectedCard.imageUrl} alt={selectedCard.brand} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Select Denomination
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCardValue(val)}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        cardValue === val
                          ? "border-primary bg-primary text-primary-foreground shadow-xs"
                          : "border-border/50 bg-card/60 text-foreground hover:bg-muted/40"
                      }`}
                    >
                      {formatMoney(val, preferredCurrency)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={isFrozen || busy}
                onClick={() => {
                  if (isFrozen) {
                    toast.error("Account is frozen. Voucher redemption is locked.");
                    return;
                  }
                  if (!isEligible48h) {
                    setIsSecurityLockOpen(true);
                    return;
                  }
                  handleRedeemVoucher();
                }}
                className={`${primaryBtn} ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {isFrozen ? "Redemption Locked" : "Confirm Redemption"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── 48-Hour Security Clearance Explanation Modal ─── */}
      <Dialog open={isSecurityLockOpen} onOpenChange={setIsSecurityLockOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7 border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="space-y-3 text-center sm:text-left">
            <div className="mx-auto sm:mx-0 flex h-13 w-13 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-500 shadow-inner">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                Withdrawals Temporarily Locked
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-1">
                48-Hour Mandatory Cooling-Off &amp; Anti-Fraud Clearance
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Live Countdown & Unlock Schedule Card */}
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Clock className="h-3.5 w-3.5" /> Time Until Unlock
                </span>
                <span className="rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-mono font-bold text-xs px-2.5 py-0.5 border border-amber-500/30">
                  {remainingHours}h {remainingMinutes}m remaining
                </span>
              </div>

              {/* Clearance Progress Bar */}
              <div className="space-y-1.5">
                <div className="h-2.5 w-full rounded-full bg-secondary/80 overflow-hidden p-0.5 border border-border/30">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                  <span>Account Created</span>
                  <span>{progressPercent}% Complete (48h target)</span>
                </div>
              </div>

              {/* Exact Unlock Date & Time */}
              <div className="border-t border-amber-500/15 pt-2 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" /> Unlocks on:
                </span>
                <span className="font-semibold text-foreground font-mono">
                  {unlockTime.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  at{" "}
                  {unlockTime.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>

            {/* Why Can't You Withdraw Right Now */}
            <div className="space-y-2.5 text-muted-foreground leading-relaxed">
              <p className="font-semibold text-foreground text-xs">
                Why is outbound withdrawal temporarily restricted?
              </p>
              <div className="space-y-2.5 text-[11px]">
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong>Anti-Fraud &amp; Asset Protection:</strong> Under statutory financial safety guidelines, all newly registered accounts undergo a mandatory 48-hour cooling-off period to safeguard your wallet against unauthorized takeovers, bot manipulation, and premature asset drainage.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>
                    <strong>Corridor Clearance:</strong> Outbound banking rails (including domestic UPI and bank IMPS gateways) require introductory compliance authorization before processing external disbursements.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                  <span>
                    <strong>Internal Transfers Available:</strong> While external bank withdrawals are completing this cooling window, internal peer-to-peer transfers to other Moonlight wallets remain active (up to $10.00 USD during the introductory 48 hours).
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              className="w-full rounded-full h-11 text-xs font-semibold cursor-pointer"
              onClick={() => setIsSecurityLockOpen(false)}
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
