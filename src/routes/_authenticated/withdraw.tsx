import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ArrowRight,
  User,
  ArrowLeft,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  BankLogo,
  GiftCardBrand,
  GiftCardImage,
  UPIProviderLogo,
  BrandAsset,
} from "@/components/AssetComponents";
import { PaymentAnimation } from "@/components/PaymentAnimation";
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
import { CURRENCIES, convert, formatMoney } from "@/lib/currency";
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
  { id: "upi", name: "UPI", icon: "upi", badge: "Instant" },
  { id: "in-bank", name: "Indian Bank", icon: "sbi", badge: "IMPS" },
  { id: "sepa", name: "SEPA", icon: "sepa", badge: "EUR" },
  { id: "faster-payments", name: "Faster Payments", icon: "faster-payments", badge: "GBP" },
  { id: "gcash", name: "GCash", icon: "gcash", badge: "PHP" },
  { id: "pix", name: "Pix", icon: "pix", badge: "BRL" },
];

function Withdraw() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: wallet } = useWallet();
  const { data: profile } = useProfile();
  const rates = useRates();

  const preferredCurrency = profile?.preferred_currency || "EUR";
  const r = rates.data?.rates ?? {};

  // 48h account age check
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const accountAgeHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const isEligible48h = accountAgeHours >= 48;

  // $100 USD max limit
  const usdRate = r["USD"] ?? 1;
  const userRate = r[preferredCurrency] ?? 1;
  const limit100InPreferred = (100 / usdRate) * userRate;

  // Mode: rails vs vouchers
  const [activeTab, setActiveTab] = useState<"rails" | "vouchers">("rails");

  // Selected payout method
  const defaultMethod = PAYMENT_METHODS.find((m) => m.id === "upi") || PAYMENT_METHODS[0]!;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodMeta>(defaultMethod);
  const [selectedUPIApp, setSelectedUPIApp] = useState<UPIProviderMeta | null>(UPI_PROVIDERS[0]!);
  const [selectedBank, setSelectedBank] = useState<BankMeta | null>(INDIAN_BANKS[0]!);

  // Form state
  const [withdrawAmount, setWithdrawAmount] = useState<string>("100");
  const [withdrawCurrency, setWithdrawCurrency] = useState<string>(preferredCurrency);
  const [upiId, setUpiId] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [fullName, setFullName] = useState<string>(profile?.full_name || "");
  const [email, setEmail] = useState<string>(profile?.email || "");
  const [phone, setPhone] = useState<string>("");
  const [showPersonalDetails, setShowPersonalDetails] = useState<boolean>(false);

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

  // Currency conversions
  const sourceAmt = Number(withdrawAmount) || 0;
  const targetCorridorCurrency = getMethodTargetCurrency(selectedMethod.id);
  const isCrossCorridor = withdrawCurrency !== targetCorridorCurrency;
  const sourceRate = r[withdrawCurrency] ?? 1;
  const targetRate = r[targetCorridorCurrency] ?? 1;
  const fxRateRatio = sourceRate > 0 ? targetRate / sourceRate : 1;
  const convertedTargetAmt = isCrossCorridor ? sourceAmt * fxRateRatio : sourceAmt;
  const feeAmount = sourceAmt * 0.1;
  const netReceivedAmt = isCrossCorridor
    ? (sourceAmt - feeAmount) * fxRateRatio
    : sourceAmt - feeAmount;

  const upiDetection = parseUPIHandle(upiId);

  // Submit withdrawal
  async function handleSubmitWithdrawal() {
    if (!isEligible48h) {
      toast.error("Withdrawals unlock 48 hours after account creation.");
      return;
    }

    if (sourceAmt <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const isUPI = selectedMethod.id.includes("upi");
    const isIndianBank = selectedMethod.id === "in-bank";

    if (isUPI) {
      if (!upiId.trim() || !upiDetection.isVPA) {
        toast.error("Please enter a valid UPI VPA (e.g. username@okhdfcbank).");
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

    const methodName = isIndianBank
      ? `${selectedBank?.name || "Indian Bank"} IMPS Transfer`
      : selectedUPIApp
        ? `${selectedUPIApp.name} (UPI)`
        : selectedMethod.name;

    const providerName = isIndianBank
      ? selectedBank?.name
      : selectedUPIApp
        ? selectedUPIApp.name
        : isUPI
          ? upiDetection.providerName || "UPI"
          : selectedMethod.name;

    const withdrawReason = isIndianBank
      ? `Transfer to ${selectedBank?.name || "Indian Bank"} A/C ••••${accountNumber.slice(-4)} (IFSC: ${ifscCode.toUpperCase()})`
      : isUPI
        ? `UPI Payout to ${upiId.trim()} (${phone.trim()}) via ${providerName}`
        : `Transfer to ${selectedMethod.name}`;

    const { data: wdId, error } = await supabase.rpc(
      "create_withdrawal" as never,
      {
        p_amount: sourceAmt,
        p_currency: withdrawCurrency,
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

    setCreatedWdId(wdId as string);
    setAnimState("completed");
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["withdrawals"] });
  }

  // Voucher redemption
  async function handleRedeemVoucher() {
    if (!isEligible48h) {
      toast.error("Withdrawals unlock 48 hours after account creation.");
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

    setSelectedCard(null);
    setCreatedWdId(wdId as string);
    setAnimState("completed");
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["withdrawals"] });
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
          exchangeRate={isCrossCorridor ? fxRateRatio : undefined}
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
    <div className="mx-auto max-w-md space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Withdraw</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Transfer funds to bank payout rails or redeem digital gift vouchers.
        </p>
      </div>

      {/* Eligibility */}
      {!isEligible48h && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3 text-xs">
          <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-amber-700 dark:text-amber-400">
              48-Hour Security Clearance Active
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Withdrawal operations unlock 48 hours after account creation to protect against
              unauthorized transfers.
            </p>
          </div>
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
        <div className="space-y-6">
          {/* ─── STEP 1: Payout Method ─── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Payout Channel
              </span>
              <span className="text-xs font-semibold text-primary">{selectedMethod.name}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {RAIL_OPTIONS.map((rail) => {
                const isSelected = selectedMethod.id === rail.id;
                return (
                  <button
                    key={rail.id}
                    type="button"
                    onClick={() => {
                      const found = PAYMENT_METHODS.find((m) => m.id === rail.id);
                      if (found) setSelectedMethod(found);
                    }}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border transition-all cursor-pointer touch-manipulation text-center ${
                      isSelected
                        ? "border-primary/60 bg-primary/10 shadow-xs font-semibold"
                        : "border-border/50 bg-card/60 hover:bg-muted/40"
                    }`}
                  >
                    <BrandAsset id={rail.icon} size="xs" />
                    <span className="text-xs font-semibold text-foreground truncate w-full">
                      {rail.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.2 rounded-md">
                      {rail.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* UPI Sub-selector */}
            {selectedMethod.id === "upi" && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">
                  Select UPI Provider
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {UPI_PROVIDERS.map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUPIApp(app)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer touch-manipulation ${
                        selectedUPIApp?.id === app.id
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-transparent hover:bg-muted/40"
                      }`}
                    >
                      <UPIProviderLogo providerId={app.id} size="xs" />
                      <span className="text-[10px] font-medium truncate w-full text-center">
                        {app.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bank Sub-selector */}
            {selectedMethod.id === "in-bank" && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-3 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 block">
                  Select Bank
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {INDIAN_BANKS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBank(b)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer touch-manipulation ${
                        selectedBank?.id === b.id
                          ? "border-primary bg-primary/10 shadow-xs"
                          : "border-transparent hover:bg-muted/40"
                      }`}
                    >
                      <BankLogo bankId={b.id} size="xs" />
                      <span className="text-[10px] font-medium truncate w-full text-center">
                        {b.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ─── STEP 2: Amount ─── */}
          <section className="space-y-3 pt-3 border-t border-border/40">
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

            <div className="flex gap-2.5">
              <Input
                type="number"
                inputMode="decimal"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="100"
                className="h-14 text-2xl font-bold rounded-2xl flex-1 border-border/60 bg-card/60 px-4"
              />
              <Select
                value={withdrawCurrency}
                onValueChange={(newCur) => {
                  const curAmt = Number(withdrawAmount) || 0;
                  if (curAmt > 0 && withdrawCurrency && newCur && withdrawCurrency !== newCur) {
                    const converted = convert(curAmt, withdrawCurrency, newCur, r);
                    setWithdrawAmount(converted.toFixed(2));
                  }
                  setWithdrawCurrency(newCur);
                }}
              >
                <SelectTrigger className="h-14 w-28 rounded-2xl border-border/60 bg-card/60 font-semibold shrink-0 cursor-pointer">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/60 p-1">
                  {CURRENCIES.map((c) => (
                    <SelectItem
                      key={c.code}
                      value={c.code}
                      className="font-semibold cursor-pointer text-xs py-2"
                    >
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* ─── STEP 3: Destination ─── */}
          <section className="space-y-3 pt-3 border-t border-border/40">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
              Destination Details
            </span>

            {/* UPI */}
            {selectedMethod.id.includes("upi") && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="upi-vpa-input"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1"
                  >
                  <label htmlFor="upi-vpa-input" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    UPI ID / VPA
                  </label>
                  <Input
                    id="upi-vpa-input"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder={
                      selectedUPIApp?.id === "google-pay"
                        ? "username@okhdfcbank"
                        : selectedUPIApp?.id === "phonepe"
                          ? "username@ybl"
                          : selectedUPIApp?.id === "paytm"
                            ? "mobilenumber@paytm"
                            : "username@bank"
                    }
                    className="rounded-2xl h-12 text-sm font-mono border-border/60 bg-card/60 px-4"
                  />
                  {upiId.trim() && upiDetection.isVPA && (
                    <p className="text-[11px] text-emerald-500 font-medium px-1">
                      Detected: {upiDetection.providerName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="beneficiary-phone-input"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1"
                  >
                  <label htmlFor="beneficiary-phone-input" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Registered Mobile Number
                  </label>
                  <Input
                    id="beneficiary-phone-input"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="rounded-2xl h-12 text-sm font-mono border-border/60 bg-card/60 px-4"
                  />
                  <p className="text-[10px] text-muted-foreground px-1">
                    Required for UPI beneficiary validation and IMPS settlement confirmation.
                  </p>
                </div>
              </div>
            )}

            {/* Indian Bank */}
            {selectedMethod.id === "in-bank" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label
                    htmlFor="bank-account-number"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1"
                  >
                  <label htmlFor="bank-account-number" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    Account Number
                  </label>
                  <Input
                    id="bank-account-number"
                    type="text"
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Bank Account Number"
                    className="rounded-2xl h-12 text-sm font-mono border-border/60 bg-card/60 px-4"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="bank-ifsc-code"
                    className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1"
                  >
                  <label htmlFor="bank-ifsc-code" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                    IFSC Code
                  </label>
                  <Input
                    id="bank-ifsc-code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="IFSC Code (e.g. SBIN0001234)"
                    className="rounded-2xl h-12 text-sm font-mono uppercase border-border/60 bg-card/60 px-4"
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
                className="rounded-2xl h-12 text-sm font-mono border-border/60 bg-card/60 px-4"
              />
            )}
          </section>

          {/* ─── Personal Details (collapsible) ─── */}
          <div>
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
              <div className="grid grid-cols-2 gap-2.5 pt-2 animate-in fade-in duration-150">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  className="h-10 rounded-xl text-xs border-border/60 bg-card/60 px-3"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="h-10 rounded-xl text-xs border-border/60 bg-card/60 px-3"
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
            {isCrossCorridor && (
              <p className="text-[10px] text-muted-foreground pt-0.5 font-mono">
                Rate: 1 {withdrawCurrency} ≈ {fxRateRatio.toFixed(4)} {targetCorridorCurrency}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="button"
            disabled={busy || !isEligible48h || sourceAmt <= 0}
            onClick={() => setIsReviewOpen(true)}
            className={primaryBtn}
          >
            Review Withdrawal <ArrowRight className="h-4 w-4" />
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
              <span className="font-semibold text-foreground">{selectedMethod.name}</span>
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
                {formatMoney(sourceAmt, withdrawCurrency)}
              </span>
            </div>
            <div className="flex justify-between pt-2 pb-2">
              <span className="text-muted-foreground">Processing Fee (10%)</span>
              <span className="font-mono">{formatMoney(feeAmount, withdrawCurrency)}</span>
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
              disabled={busy}
              onClick={handleSubmitWithdrawal}
              className={`${primaryBtn} flex-1 h-11 text-xs`}
            >
              Submit
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
                disabled={busy || !isEligible48h}
                onClick={handleRedeemVoucher}
                className={primaryBtn}
              >
                Confirm Redemption
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
