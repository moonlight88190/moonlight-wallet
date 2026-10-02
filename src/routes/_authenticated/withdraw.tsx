import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Wallet,
  ChevronDown,
  ArrowRight,
  User,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PageTitle } from "@/components/AppShell";
import {
  BankLogo,
  CountryFlag,
  GiftCardBrand,
  GiftCardImage,
  PaymentMethodIcon,
  UPIProviderLogo,
  BrandAsset,
} from "@/components/AssetComponents";
import { PaymentAnimation } from "@/components/PaymentAnimation";
import {
  GIFT_CARDS,
  LUXURY_BRANDS,
  PAYMENT_METHODS,
  UPI_PROVIDERS,
  INDIAN_BANKS,
  getMethodTargetCurrency,
  type BankMeta,
  type GiftCardMeta,
  type LuxuryBrandMeta,
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
import { useProfile, useWallet, useRates } from "@/hooks/use-wallet";
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
      { title: "Withdraw Funds — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Withdraw Moonlight Wallet balance via UPI, Indian Banks, SEPA Instant, UK Faster Payments, GCash or redeem digital vouchers.",
      },
      { property: "og:title", content: "Withdraw — Moonlight Wallet" },
      {
        property: "og:description",
        content: "European & Global Payout Channels and Premium Digital Gift Cards.",
      },
    ],
  }),
  component: Withdraw,
});

export function parseUPIHandle(vpa: string): {
  isVPA: boolean;
  providerId?: string;
  providerName?: string;
} {
  const trimmed = vpa.trim().toLowerCase();
  if (!trimmed.includes("@") || trimmed.startsWith("@") || trimmed.endsWith("@")) {
    return { isVPA: false };
  }
  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { isVPA: false };
  }

  const handle = `@${parts[1]}`;
  const found = UPI_PROVIDERS.find((p) => p.handles.includes(handle));
  if (found) {
    return { isVPA: true, providerId: found.id, providerName: found.name };
  }

  return { isVPA: true, providerName: "UPI-compatible format" };
}

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

  // $100 USD max limit in preferred currency
  const usdRate = r["USD"] ?? 1;
  const userRate = r[preferredCurrency] ?? 1;
  const limit100InPreferred = (100 / usdRate) * userRate;

  // Active top mode: rails vs vouchers
  const [activeTab, setActiveTab] = useState<"rails" | "vouchers">("rails");

  // Selected payment rail
  const defaultMethod = PAYMENT_METHODS.find((m) => m.id === "upi") || PAYMENT_METHODS[0]!;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodMeta>(defaultMethod);
  const [selectedUPIApp, setSelectedUPIApp] = useState<UPIProviderMeta | null>(UPI_PROVIDERS[0]!);
  const [selectedBank, setSelectedBank] = useState<BankMeta | null>(INDIAN_BANKS[0]!);

  // Payout input states
  const [withdrawAmount, setWithdrawAmount] = useState<string>("100");
  const [withdrawCurrency, setWithdrawCurrency] = useState<string>(preferredCurrency);
  const [upiId, setUpiId] = useState<string>("");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [ifscCode, setIfscCode] = useState<string>("");
  const [fullName, setFullName] = useState<string>(profile?.full_name || "");
  const [email, setEmail] = useState<string>(profile?.email || "");
  const [phone, setPhone] = useState<string>("");
  const [showPersonalDetails, setShowPersonalDetails] = useState<boolean>(false);

  // Review confirmation step
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);

  // Vouchers state
  const [selectedCard, setSelectedCard] = useState<GiftCardMeta | null>(null);
  const [cardValue, setCardValue] = useState<number>(25);
  const [activeCardCategory, setActiveCardCategory] = useState<string>("All");

  // Animation & Execution state
  const [animState, setAnimState] = useState<"idle" | "processing" | "completed" | "failed">("idle");
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

  // Submit withdrawal flow
  async function handleSubmitWithdrawal() {
    if (!isEligible48h) {
      toast.error("Withdrawals unlock 48 hours after account creation.");
      return;
    }

    if (sourceAmt <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }

    const isUPI = selectedMethod.id.includes("upi");
    const isIndianBank = selectedMethod.id === "in-bank";

    if (isUPI) {
      if (!upiId.trim() || !upiDetection.isVPA) {
        toast.error("Please enter a valid UPI VPA (e.g. username@okhdfcbank).");
        return;
      }
    }

    if (isIndianBank) {
      if (!accountNumber.trim() || accountNumber.trim().length < 8) {
        toast.error("Please enter a valid bank account number (minimum 8 digits).");
        return;
      }
      if (!ifscCode.trim() || ifscCode.trim().length < 4) {
        toast.error("Please enter a valid IFSC code (e.g. SBIN0000300).");
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
        ? `UPI Payout to ${upiId.trim()} via ${providerName}`
        : `Transfer to ${selectedMethod.name}`;

    const { data: wdId, error } = await supabase.rpc(
      "create_withdrawal" as never,
      {
        p_amount: convertedTargetAmt,
        p_currency: targetCorridorCurrency,
        p_method: methodName,
        p_upi_id: isUPI ? upiId.trim() : null,
        p_provider: providerName,
        p_full_name: currentFullName,
        p_email: currentEmail,
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

  // Voucher redemption flow
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
        p_method: "Digital Voucher Pass",
        p_upi_id: null,
        p_provider: brandName,
        p_full_name: profile?.full_name || "Valued Customer",
        p_email: profile?.email || "customer@moonlight.com",
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

  // If animation is active, render the cinematic state-driven journey
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
              ? `${selectedBank?.name} Account ••••${accountNumber.slice(-4) || "0000"}`
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
            if (createdWdId) navigate({ to: "/transactions/$id", params: { id: createdWdId } });
          }}
          onCancel={() => setAnimState("idle")}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6 pb-16 animate-in fade-in duration-200">
      <PageTitle eyebrow="WITHDRAW" title="Withdraw Funds">
        Transfer funds to external payout rails or redeem digital brand vouchers.
      </PageTitle>

      {/* Account Eligibility Banner */}
      {!isEligible48h ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-amber-600 dark:text-amber-400 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold tracking-tight">48-Hour Security Clearance Window Active</h4>
            <p className="text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
              New accounts cannot withdraw during the initial 48-hour compliance window. Withdrawals unlock once 48 hours have elapsed.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Withdrawals Active</span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
            Limit: $100 USD ({formatMoney(limit100InPreferred, preferredCurrency)})
          </span>
        </div>
      )}

      {/* Mode Selector Tabs: Payout Rails vs Vouchers */}
      <div className="grid grid-cols-2 p-1 rounded-2xl bg-secondary/60 border border-border/40 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("rails")}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "rails"
              ? "bg-card text-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Banking Rails &amp; UPI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("vouchers")}
          className={`py-2.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "vouchers"
              ? "bg-card text-foreground shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Digital Vouchers
        </button>
      </div>

      {activeTab === "rails" ? (
        /* ==============================================================
           PROGRESSIVE DISCLOSURE WITHDRAWAL FORM
           ============================================================== */
        <div className="rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs space-y-5">
          {/* STEP 1: CHOOSE PAYOUT METHOD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                1. Select Payout Method
              </label>
              <span className="text-[10px] font-semibold text-primary">
                {selectedMethod.name}
              </span>
            </div>

            {/* Compact Horizontally Scrollable Rail Chips */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "upi", name: "UPI Direct", icon: "upi", badge: "Instant" },
                { id: "in-bank", name: "Indian Bank", icon: "sbi", badge: "IMPS/NEFT" },
                { id: "sepa", name: "SEPA Instant", icon: "sepa", badge: "Eurozone" },
                { id: "faster-payments", name: "Faster Payments", icon: "faster-payments", badge: "UK" },
                { id: "gcash", name: "GCash", icon: "gcash", badge: "Philippines" },
                { id: "pix", name: "Pix Instant", icon: "pix", badge: "Brazil" },
              ].map((rail) => {
                const isSelected = selectedMethod.id === rail.id;
                return (
                  <button
                    key={rail.id}
                    type="button"
                    onClick={() => {
                      const found = PAYMENT_METHODS.find((m) => m.id === rail.id);
                      if (found) setSelectedMethod(found);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all cursor-pointer touch-manipulation min-h-[64px] text-center ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-2xs font-bold"
                        : "border-border/60 bg-secondary/20 hover:bg-secondary/50"
                    }`}
                  >
                    <BrandAsset id={rail.icon} size="xs" />
                    <span className="text-[11px] font-semibold text-foreground truncate w-full">
                      {rail.name}
                    </span>
                    <span className="text-[9px] text-muted-foreground leading-none">
                      {rail.badge}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sub-selector for UPI Apps if UPI selected */}
            {selectedMethod.id === "upi" && (
              <div className="mt-3 rounded-2xl border border-border/50 bg-secondary/30 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  <span>Selected App / Provider</span>
                  {selectedUPIApp && (
                    <span className="text-primary font-bold">{selectedUPIApp.name}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {UPI_PROVIDERS.map((app) => {
                    const isAppSelected = selectedUPIApp?.id === app.id;
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedUPIApp(app)}
                        className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl border text-center transition-all cursor-pointer touch-manipulation ${
                          isAppSelected
                            ? "border-primary bg-primary/10 font-bold shadow-2xs"
                            : "border-border/40 bg-card hover:bg-secondary"
                        }`}
                      >
                        <UPIProviderLogo providerId={app.id} size="xs" />
                        <span className="text-[10px] font-medium truncate w-full">
                          {app.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-selector for Indian Banks if Indian Bank selected */}
            {selectedMethod.id === "in-bank" && (
              <div className="mt-3 rounded-2xl border border-border/50 bg-secondary/30 p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  <span>Select Destination Bank</span>
                  {selectedBank && (
                    <span className="text-primary font-bold">{selectedBank.name}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {INDIAN_BANKS.map((b) => {
                    const isBankSelected = selectedBank?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => setSelectedBank(b)}
                        className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-xl border text-center transition-all cursor-pointer touch-manipulation ${
                          isBankSelected
                            ? "border-primary bg-primary/10 font-bold shadow-2xs"
                            : "border-border/40 bg-card hover:bg-secondary"
                        }`}
                      >
                        <BankLogo bankId={b.id} size="sm" />
                        <span className="text-[10px] font-medium truncate w-full">
                          {b.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: AMOUNT */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                2. Withdrawal Amount
              </label>
              <span className="text-[11px] font-mono text-muted-foreground">
                Balance: {formatMoney(Number(wallet?.balance_usd || 0) * userRate, preferredCurrency)}
              </span>
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="100"
                className="h-12 text-lg font-bold rounded-xl flex-1"
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
                <SelectTrigger className="h-12 w-28 rounded-xl border font-semibold shrink-0 cursor-pointer">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="font-semibold cursor-pointer">
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* STEP 3: DESTINATION (STRICTLY REQUIRED FIELDS ONLY) */}
          <div className="space-y-2.5 pt-2 border-t border-border/40">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              3. Beneficiary Destination
            </label>

            {/* UPI Destination */}
            {selectedMethod.id.includes("upi") && (
              <div className="space-y-1.5">
                <Input
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder={
                    selectedUPIApp?.id === "google-pay"
                      ? "username@okhdfcbank or username@okaxis"
                      : selectedUPIApp?.id === "phonepe"
                        ? "username@ybl or username@ibl"
                        : selectedUPIApp?.id === "paytm"
                          ? "mobilenumber@paytm"
                          : selectedUPIApp?.id === "bhim"
                            ? "mobilenumber@upi"
                            : selectedUPIApp?.id === "amazon-pay"
                              ? "username@apl"
                              : "username@bank or mobilenumber@upi"
                  }
                  className="rounded-xl h-12 text-sm font-mono"
                />
                {upiId.trim() && (
                  <div className="flex items-center justify-between text-xs px-1">
                    <span className="text-muted-foreground">Validated Rail:</span>
                    <span className="font-semibold text-primary">
                      {upiDetection.providerName || "Validating UPI format"}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Indian Bank Destination */}
            {selectedMethod.id === "in-bank" && (
              <div className="space-y-2">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Bank Account Number (10–18 digits)"
                  className="rounded-xl h-11 text-sm font-mono"
                />
                <Input
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="Bank IFSC Code (e.g. SBIN0000300 or HDFC0000123)"
                  className="rounded-xl h-11 text-sm font-mono uppercase"
                  maxLength={11}
                />
              </div>
            )}

            {/* SEPA, Faster Payments, GCash, Pix */}
            {!selectedMethod.id.includes("upi") && selectedMethod.id !== "in-bank" && (
              <Input
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder={
                  selectedMethod.id === "sepa"
                    ? "Recipient IBAN (e.g. DE89... or FR76...)"
                    : selectedMethod.id === "faster-payments"
                      ? "UK Sort Code & Account Number"
                      : selectedMethod.id === "gcash"
                        ? "GCash Registered Mobile Number"
                        : selectedMethod.id === "pix"
                          ? "Pix Key (CPF / Email / Phone)"
                          : "Account / IBAN identifier"
                }
                className="rounded-xl h-12 text-sm font-mono"
              />
            )}
          </div>

          {/* COLLAPSIBLE PERSONAL DETAILS (PRE-FILLED) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowPersonalDetails(!showPersonalDetails)}
              className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>
                  Account Profile: <strong className="text-foreground">{fullName || profile?.full_name}</strong>
                </span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  showPersonalDetails ? "rotate-180" : ""
                }`}
              />
            </button>

            {showPersonalDetails && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 animate-in fade-in duration-150">
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name"
                  className="h-10 rounded-xl text-xs"
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="h-10 rounded-xl text-xs"
                />
              </div>
            )}
          </div>

          {/* COMPACT FEE & FX SUMMARY */}
          <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3.5 space-y-2 text-xs">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>You send</span>
              <span className="font-mono font-semibold text-foreground">
                {formatMoney(sourceAmt, withdrawCurrency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Fee (10%)</span>
              <span className="font-mono">{formatMoney(feeAmount, withdrawCurrency)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-foreground border-t border-border/40 pt-1.5">
              <span>You receive</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatMoney(netReceivedAmt, targetCorridorCurrency)}
              </span>
            </div>
            {isCrossCorridor && (
              <div className="text-[10px] text-muted-foreground pt-0.5">
                FX Rate: 1 {withdrawCurrency} ≈ {fxRateRatio.toFixed(4)} {targetCorridorCurrency}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground leading-tight pt-1">
              Standard compliance review applies. Requests enter the 14-stage review schedule.
            </p>
          </div>

          {/* VISUALLY DOMINANT ACTION BUTTON */}
          <Button
            type="button"
            disabled={busy || !isEligible48h || sourceAmt <= 0}
            onClick={() => setIsReviewOpen(true)}
            className="w-full rounded-full h-12 text-sm font-semibold shadow-soft active:scale-[0.98] cursor-pointer touch-manipulation"
          >
            Review Withdrawal <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* ==============================================================
           DIGITAL BRAND VOUCHERS MARKETPLACE
           ============================================================== */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["All", "Gaming", "Shopping", "Entertainment"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCardCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer shrink-0 transition-colors ${
                    activeCardCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {GIFT_CARDS.filter(
              (c) => activeCardCategory === "All" || c.category === activeCardCategory,
            ).map((card) => (
              <GiftCardBrand
                key={card.id}
                card={card}
                onClick={() => setSelectedCard(card)}
              />
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION REVIEW DIALOG */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Confirm Withdrawal</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please verify your payout destination before submitting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Payout Rail</span>
              <span className="font-semibold text-foreground">{selectedMethod.name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Beneficiary</span>
              <span className="font-mono font-medium text-foreground truncate max-w-[180px]">
                {selectedMethod.id === "in-bank"
                  ? `${selectedBank?.name} A/C ••••${accountNumber.slice(-4)}`
                  : upiId.trim() || profile?.email}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Gross Amount</span>
              <span className="font-mono font-semibold">{formatMoney(sourceAmt, withdrawCurrency)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Network Fee (10%)</span>
              <span className="font-mono">{formatMoney(feeAmount, withdrawCurrency)}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground">
              <span>Disbursed Amount</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {formatMoney(netReceivedAmt, targetCorridorCurrency)}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsReviewOpen(false)}
              className="flex-1 rounded-full text-xs h-11 cursor-pointer"
            >
              Edit Details
            </Button>
            <Button
              disabled={busy}
              onClick={handleSubmitWithdrawal}
              className="flex-1 rounded-full text-xs h-11 font-semibold cursor-pointer"
            >
              Submit Withdrawal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* VOUCHER REDEEM DIALOG */}
      <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
        <DialogContent className="max-w-sm rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Redeem {selectedCard?.brand} Pass</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Digital voucher code issued upon deduction of wallet balance.
            </DialogDescription>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4 py-2">
              <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-2xs">
                <GiftCardImage imageUrl={selectedCard.imageUrl} alt={selectedCard.brand} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Pass Denomination</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCardValue(val)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        cardValue === val
                          ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                          : "border-border/50 bg-secondary/50 text-foreground"
                      }`}
                    >
                      {formatMoney(val, preferredCurrency)}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                disabled={busy || !isEligible48h}
                onClick={handleRedeemVoucher}
                className="w-full rounded-full h-11 text-xs font-semibold cursor-pointer"
              >
                Confirm Redemption
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
