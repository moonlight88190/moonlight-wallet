import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Crown,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PageTitle } from "@/components/AppShell";
import { CountryFlag, GiftCardBrand, PaymentMethodIcon } from "@/components/AssetComponents";
import { PaymentAnimation } from "@/components/PaymentAnimation";
import {
  GIFT_CARDS,
  LUXURY_BRANDS,
  PAYMENT_METHODS,
  UPI_PROVIDERS,
  getMethodTargetCurrency,
  type GiftCardMeta,
  type LuxuryBrandMeta,
  type PaymentMethodMeta,
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
          "Withdraw Moonlight Wallet balance via SEPA Instant, Czech Bank Transfer, UK Faster Payments, UPI Direct, GCash, PayNow, Pix, SWIFT or Redeem Digital Vouchers & Luxury Vouchers.",
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

const REGIONS = [
  {
    id: "europe",
    title: "Europe & UK",
    badge: "Primary",
    flagCode: "EU",
    items: PAYMENT_METHODS.filter(
      (m) => m.region === "Europe" || m.id === "faster-payments" || m.id === "cz-bank",
    ),
  },
  {
    id: "india",
    title: "India (UPI)",
    badge: "UPI Rail",
    flagCode: "IN",
    items: PAYMENT_METHODS.filter((m) => m.region === "India"),
  },
  {
    id: "philippines",
    title: "Philippines",
    badge: "GCash",
    flagCode: "PH",
    items: PAYMENT_METHODS.filter((m) => m.region === "Philippines"),
  },
  {
    id: "international",
    title: "Global Payouts",
    badge: "SWIFT/Global",
    flagCode: "US",
    items: PAYMENT_METHODS.filter(
      (m) => m.region === "International" && m.id !== "faster-payments",
    ),
  },
];

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

  return { isVPA: true, providerName: "UPI-compatible / Unknown provider" };
}

export function Withdraw() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: wallet } = useWallet();
  const { data: profile } = useProfile();
  const rates = useRates();

  const preferredCurrency = profile?.preferred_currency || "EUR";
  const r = rates.data?.rates ?? {};

  // Check 48h account age
  const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
  const accountAgeHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const isEligible48h = accountAgeHours >= 48;

  // Calculate $100 USD limit in user preferred currency
  const usdRate = r["USD"] ?? 1;
  const userRate = r[preferredCurrency] ?? 1;
  const limit100InPreferred = (100 / usdRate) * userRate;

  // Default method: UPI Direct or SEPA
  const defaultMethod = PAYMENT_METHODS.find((m) => m.id === "upi") || PAYMENT_METHODS[0];

  // Selected state
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodMeta | null>(
    defaultMethod ?? null,
  );
  const [selectedCard, setSelectedCard] = useState<GiftCardMeta | null>(null);
  const [selectedLuxury, setSelectedLuxury] = useState<LuxuryBrandMeta | null>(null);
  const [cardValue, setCardValue] = useState<number>(100);

  // Active UI tab for categories on mobile screens
  const [payoutCategory, setPayoutCategory] = useState<"channels" | "vouchers" | "luxury">(
    "channels",
  );

  // Form Fields
  const [withdrawAmount, setWithdrawAmount] = useState<string>("100");
  const [withdrawCurrency, setWithdrawCurrency] = useState<string>(preferredCurrency);
  const [upiId, setUpiId] = useState<string>("");
  const [fullName, setFullName] = useState<string>(profile?.full_name || "");
  const [email, setEmail] = useState<string>(profile?.email || "");
  const [phone, setPhone] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [activeCardCategory, setActiveCardCategory] = useState<string>("All");

  const targetCorridorCurrency = selectedMethod
    ? getMethodTargetCurrency(selectedMethod.id)
    : withdrawCurrency;
  const sourceAmt = Number(withdrawAmount) || 0;
  const convertedTargetAmt = convert(sourceAmt, withdrawCurrency, targetCorridorCurrency, r);
  const fxRateRatio = convert(1, withdrawCurrency, targetCorridorCurrency, r);
  const isCrossCorridor = withdrawCurrency !== targetCorridorCurrency;

  // Animation & Receipt Modal State
  const [isProcessing, setIsProcessing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<{
    title: string;
    status: string;
    amount: number;
    currency: string;
    methodOrBrand: string;
    provider?: string;
    accountOrCode: string;
    date: string;
    reference: string;
  } | null>(null);
  const [refCopied, setRefCopied] = useState(false);

  function copyReceiptRef(ref: string) {
    navigator.clipboard.writeText(ref);
    setRefCopied(true);
    toast.success("Reference code copied!");
    setTimeout(() => setRefCopied(false), 2000);
  }

  async function handleRedeemCard() {
    if (!isEligible48h) {
      toast.error("Withdrawals unlock 48 hours after account creation.");
      return;
    }

    const brandName = selectedCard?.brand || selectedLuxury?.name || "Digital Voucher";
    setBusy(true);
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
      toast.error(error.message);
      return;
    }

    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["withdrawals"] });

    setSelectedCard(null);
    setSelectedLuxury(null);

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      navigate({ to: "/transactions/$id", params: { id: wdId as string } });
    }, 6000);
  }

  const categories = ["All", "Gaming", "Shopping", "Entertainment", "Luxury", "Travel"];

  const filteredCards =
    activeCardCategory === "All"
      ? GIFT_CARDS
      : activeCardCategory === "Luxury"
        ? GIFT_CARDS.filter((c) => c.category === "Luxury")
        : GIFT_CARDS.filter((c) => c.category === activeCardCategory);

  const upiDetection = parseUPIHandle(upiId);

  async function handleInitiateWithdraw() {
    if (!isEligible48h) {
      toast.error("Withdrawals unlock 48 hours after account creation.");
      return;
    }

    const amt = Number(withdrawAmount) || 0;
    if (amt <= 0) {
      toast.error("Please enter a valid withdrawal amount.");
      return;
    }

    const isUPI = selectedMethod?.id === "upi" || selectedMethod?.id === "upi-qr";
    if (isUPI) {
      if (!upiDetection.isVPA) {
        toast.error("Please enter a valid UPI VPA (e.g., username@provider).");
        return;
      }
    }

    if (!fullName.trim() || !email.trim()) {
      toast.error("Full Name and Email are required.");
      return;
    }

    setBusy(true);
    const finalWdAmount = convertedTargetAmt;
    const finalWdCurrency = targetCorridorCurrency;

    const { data: wdId, error } = await supabase.rpc(
      "create_withdrawal" as never,
      {
        p_amount: finalWdAmount,
        p_currency: finalWdCurrency,
        p_method: selectedMethod?.name || "UPI Direct",
        p_upi_id: isUPI ? upiId.trim() : null,
        p_provider: isUPI ? upiDetection.providerName || "UPI" : null,
        p_full_name: fullName.trim(),
        p_email: email.trim(),
        p_phone: phone.trim() || null,
        p_reason: reason.trim() || null,
      } as never,
    );
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["withdrawals"] });

    setReason("");

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      navigate({ to: "/transactions/$id", params: { id: wdId as string } });
    }, 6000);
  }

  return (
    <div className="mx-auto max-w-md space-y-5 pb-12">
      <PageTitle eyebrow="WITHDRAW" title="Withdraw Funds">
        Transfer funds to financial accounts or redeem instantly into brand vouchers.
      </PageTitle>

      {/* Account Age Eligibility Banner */}
      {!isEligible48h ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-amber-600 dark:text-amber-400 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold tracking-tight">48-Hour Security Lock Active</h4>
            <p className="text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
              New accounts cannot withdraw during the first 48 hours after creation. Withdrawals
              unlock after 48 hours.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center justify-between gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Withdrawal Available</span>
          </div>
          <span className="text-[10px] font-bold bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
            Limit: $100 USD ({formatMoney(limit100InPreferred, preferredCurrency)})
          </span>
        </div>
      )}

      {/* Main Centered Mobile-First Form Card */}
      <div
        id="withdrawal-form-card"
        className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-soft space-y-4"
      >
        {/* Header with Selected Channel */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedMethod ? (
              <PaymentMethodIcon id={selectedMethod.id} size="sm" />
            ) : (
              <Building2 className="h-5 w-5 text-primary" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Payout Channel
              </div>
              <div className="font-bold text-foreground text-sm truncate">
                {selectedMethod?.name || "Select Method"}
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
            <ShieldCheck className="h-3 w-3" />
            {selectedMethod?.speed || "Instant"}
          </span>
        </div>

        {/* Amount Input & Currency Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Withdrawal Amount</label>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="100"
              className="rounded-xl h-12 text-lg font-medium flex-1 min-w-0"
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
              <SelectTrigger className="h-12 w-28 rounded-xl border font-semibold shrink-0">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="font-semibold">
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* UPI Handle Detection Showcase inside form */}
        {selectedMethod?.id === "upi" && (
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-2.5 space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Supported UPI Handles
            </p>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
              {UPI_PROVIDERS.map((prov) => (
                <div
                  key={prov.id}
                  className="flex items-center gap-1 rounded-lg border bg-card px-2 py-1 shadow-2xs shrink-0 text-[11px] font-medium"
                >
                  <PaymentMethodIcon id={prov.id} size="sm" />
                  <span>{prov.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recipient Details */}
        {selectedMethod?.id.includes("upi") ? (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">UPI ID / VPA</label>
            <Input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="username@ybl, username@gpay or username@paytm"
              className="rounded-xl h-12 text-sm font-mono"
            />
            {upiId.trim() && (
              <div className="flex items-center justify-between text-xs px-1 pt-0.5">
                <span className="text-muted-foreground">Provider:</span>
                <span className="font-semibold text-primary">
                  {upiDetection.providerName || "Invalid handle format"}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {selectedMethod?.id.includes("gcash")
                ? "GCash Registered Mobile Number"
                : selectedMethod?.id === "paynow"
                  ? "PayNow Mobile / NRIC / UEN"
                  : selectedMethod?.id === "pix"
                    ? "Pix Key (CPF / Email / Phone)"
                    : "Recipient IBAN / Account Number"}
            </label>
            <Input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="Account / IBAN details"
              className="rounded-xl h-12 text-sm font-mono"
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Full Name</label>
            <Input
              value={fullName}
              autoComplete="name"
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              className="rounded-xl h-11 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Email</label>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@email.com"
              className="rounded-xl h-11 text-sm"
            />
          </div>
        </div>

        {/* FX Conversion Clearance Box */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 space-y-1.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Requested Amount:</span>
            <span className="font-semibold text-foreground">
              {formatMoney(sourceAmt, withdrawCurrency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-primary/10">
            <span>Transaction Fee (10%):</span>
            <span className="font-semibold">{formatMoney(sourceAmt * 0.1, withdrawCurrency)}</span>
          </div>
          {isCrossCorridor && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Corridor FX Rate:</span>
                <span className="font-mono text-xs font-semibold text-muted-foreground">
                  1 {withdrawCurrency} ≈ {fxRateRatio.toFixed(4)} {targetCorridorCurrency}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-primary/10">
                <span className="font-semibold text-primary">Target Payout Amount:</span>
                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(convertedTargetAmt, targetCorridorCurrency)}
                </span>
              </div>
            </>
          )}
          <div className="pt-1.5 border-t border-primary/10 text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-tight">
            Fee is 10%. Once submitted, transactions cannot be cancelled or reversed.
          </div>
        </div>

        <Button
          disabled={busy || !isEligible48h}
          onClick={handleInitiateWithdraw}
          className="w-full rounded-full h-12 text-sm font-semibold shadow-soft active:scale-[0.98] cursor-pointer touch-manipulation"
        >
          Submit Withdrawal
        </Button>
      </div>

      {/* Category Tabs for Compact Mobile Browsing */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-border/50 pb-2">
          <h2 className="text-base font-semibold text-foreground tracking-tight">
            Payout Channels &amp; Vouchers
          </h2>
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
            Select Channel
          </span>
        </div>

        {/* Segmented Category Buttons */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-secondary/50 border border-border/40 text-xs font-semibold">
          <button
            onClick={() => setPayoutCategory("channels")}
            className={`py-2 rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
              payoutCategory === "channels"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Banking Rails
          </button>
          <button
            onClick={() => setPayoutCategory("vouchers")}
            className={`py-2 rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
              payoutCategory === "vouchers"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Gift Cards
          </button>
          <button
            onClick={() => setPayoutCategory("luxury")}
            className={`py-2 rounded-xl transition-all cursor-pointer active:scale-[0.97] ${
              payoutCategory === "luxury"
                ? "bg-card text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Luxury Passes
          </button>
        </div>

        {/* Tab 1: Financial Banking Rails */}
        {payoutCategory === "channels" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {REGIONS.map((region) => (
              <div
                key={region.id}
                className="rounded-2xl border border-border/60 bg-card/80 p-3.5 space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CountryFlag code={region.flagCode} circle size="xs" />
                    <h3 className="font-semibold text-foreground text-xs tracking-tight">
                      {region.title}
                    </h3>
                  </div>
                  <span className="text-[9px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                    {region.badge}
                  </span>
                </div>

                <div className="grid gap-2">
                  {region.items.map((item) => {
                    const isSelected = selectedMethod?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setSelectedMethod(item);
                          const el = document.getElementById("withdrawal-form-card");
                          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                        }}
                        className={`group w-full flex items-center justify-between gap-2.5 rounded-xl border p-2.5 transition-all text-left cursor-pointer touch-manipulation min-w-0 ${
                          isSelected
                            ? "border-primary bg-primary/10 shadow-2xs"
                            : "border-border/50 bg-card hover:bg-accent/40"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <PaymentMethodIcon id={item.id} size="sm" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="font-semibold text-foreground text-xs truncate">
                                {item.name}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                            {item.speed}
                          </span>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Digital Gift Vouchers */}
        {payoutCategory === "vouchers" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar touch-pan-x">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCardCategory(cat)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                    activeCardCategory === cat
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {filteredCards.map((card) => (
                <GiftCardBrand
                  key={card.id}
                  card={card}
                  onClick={() => {
                    setSelectedCard(card);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Luxury Lifestyle Passes */}
        {payoutCategory === "luxury" && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
            {LUXURY_BRANDS.map((brand) => (
              <Button
                type="button"
                variant="outline"
                key={brand.id}
                onClick={() => {
                  setSelectedLuxury(brand);
                }}
                className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-3 text-center shadow-2xs transition-all hover:border-amber-500/40 cursor-pointer active:scale-[0.98]"
              >
                <div className="relative flex h-10 w-full items-center justify-center p-1">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="max-h-full max-w-full object-contain filter dark:invert group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="mt-1.5 w-full border-t border-border/40 pt-1.5">
                  <p className="text-xs font-semibold text-foreground truncate">{brand.name}</p>
                  <p className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                    Luxury Pass
                  </p>
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Dialog for Gift Card or Luxury Voucher Redemption */}
      <Dialog
        open={!!selectedCard || !!selectedLuxury}
        onOpenChange={() => {
          setSelectedCard(null);
          setSelectedLuxury(null);
        }}
      >
        {(selectedCard || selectedLuxury) && (
          <DialogContent className="fixed left-0 right-0 bottom-0 top-auto z-50 flex flex-col w-full max-h-[92dvh] rounded-t-3xl rounded-b-none p-5 pb-safe bg-background border-t border-x border-border/80 shadow-2xl overflow-hidden sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:h-auto sm:max-h-[85vh] sm:rounded-3xl sm:border sm:p-6">
            <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-3 sm:hidden shrink-0" />

            <DialogHeader className="shrink-0 text-left pb-2 border-b border-border/40">
              <DialogTitle className="text-base font-semibold truncate">
                {selectedCard?.brand || selectedLuxury?.name} Voucher
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground truncate">
                {selectedCard?.description || `Exclusive digital pass for ${selectedLuxury?.name}.`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1">
              {!isEligible48h && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 flex items-start gap-3 text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold">48-Hour Security Lock Active</p>
                    <p className="text-amber-600/90 dark:text-amber-400/90 leading-normal">
                      New accounts cannot withdraw during the first 48 hours after creation.
                    </p>
                  </div>
                </div>
              )}

              <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 p-3 shadow-soft">
                {selectedLuxury ? (
                  <img
                    src={selectedLuxury.logoUrl}
                    alt={selectedLuxury.name}
                    className="max-h-12 max-w-[150px] object-contain filter invert"
                  />
                ) : (
                  <img
                    src={selectedCard?.imageUrl}
                    alt={selectedCard?.brand}
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Select Voucher Denomination ({preferredCurrency})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      onClick={() => setCardValue(val)}
                      className={`rounded-xl py-2 text-xs font-semibold border transition-all active:scale-[0.97] cursor-pointer touch-manipulation ${
                        cardValue === val
                          ? "border-primary bg-primary/10 text-primary shadow-2xs"
                          : "border-border/60 bg-card hover:bg-accent text-foreground"
                      }`}
                    >
                      {formatMoney(val, preferredCurrency)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-secondary/30 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Voucher Cost:</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(cardValue, preferredCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
                  <span>Transaction Fee (10%):</span>
                  <span className="font-semibold">
                    {formatMoney(cardValue * 0.1, preferredCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Instant Email Delivery
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0 pt-3 border-t border-border/40 bg-background">
              <Button
                onClick={handleRedeemCard}
                className="w-full rounded-full h-12 text-sm font-semibold shadow-soft active:scale-[0.98] cursor-pointer touch-manipulation"
              >
                Acquire for {formatMoney(cardValue, preferredCurrency)}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Processing Animation Modal */}
      <Dialog open={isProcessing} onOpenChange={() => {}}>
        <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none">
          <PaymentAnimation
            state="processing"
            type="withdrawal"
            senderName={profile?.full_name || "Moonlight Wallet"}
            senderCode={wallet?.wallet_code || "ML-SENDER"}
            recipientName={selectedMethod?.name || "Withdrawal Payout Rail"}
            recipientCode={upiId || "UPI"}
            sourceAmount={sourceAmt || cardValue}
            sourceCurrency={withdrawCurrency}
            destinationAmount={convertedTargetAmt || cardValue}
            destinationCurrency={targetCorridorCurrency}
            exchangeRate={fxRateRatio}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
