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
  type GiftCardMeta,
  type LuxuryBrandMeta,
  type PaymentMethodMeta,
} from "@/lib/assets";
import { formatMoney } from "@/lib/currency";
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
    title: "Europe & United Kingdom",
    badge: "Primary Corridor",
    flagCode: "EU",
    items: PAYMENT_METHODS.filter(
      (m) => m.region === "Europe" || m.id === "faster-payments" || m.id === "cz-bank",
    ),
  },
  {
    id: "india",
    title: "India Corridor",
    badge: "UPI Rail",
    flagCode: "IN",
    items: PAYMENT_METHODS.filter((m) => m.region === "India"),
  },
  {
    id: "philippines",
    title: "Philippines Corridor",
    badge: "InstaPay & GCash",
    flagCode: "PH",
    items: PAYMENT_METHODS.filter((m) => m.region === "Philippines"),
  },
  {
    id: "international",
    title: "Global Corridors & International",
    badge: "Global Payout",
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

  // States
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodMeta | null>(null);

  // Form Fields
  const [withdrawAmount, setWithdrawAmount] = useState<string>("100");
  const [upiId, setUpiId] = useState<string>("");
  const [fullName, setFullName] = useState<string>(profile?.full_name || "");
  const [email, setEmail] = useState<string>(profile?.email || "");
  const [phone, setPhone] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Animation & Receipt Modal State
  const [isProcessing, setIsProcessing] = useState(false);
  const [busy, setBusy] = useState(false);

  const categories = ["All", "Gaming", "Shopping", "Entertainment", "Luxury", "Travel"];

  const filteredCards =
    activeCategory === "All"
      ? GIFT_CARDS
      : activeCategory === "Luxury"
        ? GIFT_CARDS.filter((c) => c.category === "Luxury")
        : GIFT_CARDS.filter((c) => c.category === activeCategory);

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
    const { data: wdId, error } = await (supabase as any).rpc("create_withdrawal", {
      p_amount: amt,
      p_currency: preferredCurrency,
      p_method: selectedMethod?.name || "UPI Direct",
      p_upi_id: isUPI ? upiId.trim() : null,
      p_provider: isUPI ? upiDetection.providerName || "UPI" : null,
      p_full_name: fullName.trim(),
      p_email: email.trim(),
      p_phone: phone.trim() || null,
      p_reason: reason.trim() || null,
    });
    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
    qc.invalidateQueries({ queryKey: ["withdrawals"] });

    setSelectedMethod(null);
    setUpiId("");
    setReason("");

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      navigate({ to: "/transactions/$id", params: { id: wdId as string } });
    }, 2500);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 sm:space-y-12 pb-12">
      <PageTitle eyebrow="WITHDRAW" title="Withdraw Funds">
        Transfer funds to European &amp; global financial accounts or redeem instantly into brand
        vouchers.
      </PageTitle>

      {/* Account Age Eligibility Banner */}
      {!isEligible48h ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex items-start gap-3.5 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <h4 className="font-bold tracking-tight">48-Hour Security Lock Active</h4>
            <p className="text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
              New accounts cannot withdraw during the first 48 hours after creation. Withdrawals
              unlock after 48 hours.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:p-5 flex items-center justify-between gap-3 text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span>Withdrawal Available</span>
          </div>
          <span className="text-[11px] font-bold bg-emerald-500/20 px-3 py-1 rounded-full">
            First withdrawal limit: $100 USD ({formatMoney(limit100InPreferred, preferredCurrency)})
          </span>
        </div>
      )}

      {/* Primary Payout Methods by Region */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
            Financial Payout Channels
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground bg-secondary px-3 py-1 rounded-full w-fit">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Verified Financial Infrastructure
          </span>
        </div>

        <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
          {REGIONS.map((region) => (
            <div
              key={region.id}
              className="rounded-3xl border border-border/60 bg-card/70 p-4 sm:p-5 shadow-soft space-y-3.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CountryFlag code={region.flagCode} circle size="sm" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base tracking-tight">
                    {region.title}
                  </h3>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full shrink-0">
                  {region.badge}
                </span>
              </div>

              <div className="space-y-2.5">
                {region.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!isEligible48h) {
                        toast.error("Withdrawals unlock 48 hours after account creation.");
                        return;
                      }
                      setSelectedMethod(item);
                      setFullName(profile?.full_name || "");
                      setEmail(profile?.email || "");
                    }}
                    className="group w-full flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-card p-3 shadow-2xs transition-all duration-200 hover:border-primary/40 hover:bg-accent/40 active:scale-[0.98] text-left cursor-pointer touch-manipulation min-w-0 min-h-[52px]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <PaymentMethodIcon id={item.id} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground text-xs sm:text-sm group-hover:text-primary transition-colors truncate">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full shrink-0">
                        {item.speed}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Luxury & Lifestyle Editorial Section */}
      <div className="pt-4 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold tracking-tight">
                Luxury &amp; Private Lifestyle Vouchers
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Bespoke concierge redemption for European luxury fashion houses and fine watchmakers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {LUXURY_BRANDS.map((brand) => (
            <Button
              type="button"
              variant="outline"
              key={brand.id}
              onClick={() => toast.info("Coming soon")}
              className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-3.5 text-center shadow-2xs transition-all hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-soft cursor-pointer active:scale-[0.98] touch-manipulation"
            >
              <div className="relative flex h-12 w-full items-center justify-center p-1">
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain filter dark:invert group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="mt-2 w-full border-t border-border/40 pt-2">
                <p className="text-xs font-semibold text-foreground truncate">{brand.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{brand.category}</p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Gift Cards Gallery */}
      <div className="pt-4 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold tracking-tight">
                Digital Vouchers &amp; Passes
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Convert Moonlight balance into instant digital brand vouchers.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0 touch-pan-x min-w-0 max-w-full">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-4 py-2 min-h-[44px] shrink-0 inline-flex items-center text-xs font-semibold transition-all active:scale-[0.96] cursor-pointer touch-manipulation ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {activeCategory === "Luxury" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {LUXURY_BRANDS.slice(0, 8).map((brand) => (
              <Button
                type="button"
                variant="outline"
                key={brand.id}
                onClick={() => toast.info("Coming soon")}
                className="group relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-amber-500/30 bg-card p-4 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-soft cursor-pointer active:scale-[0.98]"
              >
                <div className="relative flex h-12 w-full items-center justify-center p-1">
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="max-h-9 max-w-[90px] object-contain filter dark:invert group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="mt-2 w-full border-t border-border/40 pt-2">
                  <p className="text-xs font-semibold text-foreground truncate">{brand.name}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                    Luxury Pass
                  </p>
                </div>
              </Button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
            {filteredCards.map((card) => (
              <GiftCardBrand key={card.id} card={card} onClick={() => toast.info("Coming soon")} />
            ))}
          </div>
        )}
      </div>

      {/* Dialog / Bottom Sheet for Withdrawal Method */}
      <Dialog open={!!selectedMethod} onOpenChange={() => setSelectedMethod(null)}>
        {selectedMethod && (
          <DialogContent className="fixed inset-0 z-50 flex flex-col w-full h-[100dvh] max-h-[100dvh] rounded-none p-4 pt-safe pb-safe bg-background border-none overflow-y-auto sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:h-auto sm:rounded-3xl sm:border sm:border-border/80">
            {/* Grab Handle for Mobile Bottom Sheet Feel */}
            <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-1 sm:hidden shrink-0" />

            <DialogHeader>
              <div className="flex items-center gap-3">
                <PaymentMethodIcon id={selectedMethod.id} size="md" />
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-semibold truncate">
                    {selectedMethod.name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground truncate">
                    {selectedMethod.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* UPI Provider showcase inside UPI method */}
            {selectedMethod.id === "upi" && (
              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-3 space-y-2">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Supported UPI Apps
                </p>
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {UPI_PROVIDERS.map((prov) => (
                    <div
                      key={prov.id}
                      className="flex items-center gap-1.5 rounded-xl border bg-card px-2.5 py-1.5 shadow-2xs shrink-0 text-xs font-medium"
                    >
                      <PaymentMethodIcon id={prov.id} size="sm" />
                      <span>{prov.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Amount ({preferredCurrency})
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="100"
                    className="rounded-xl h-12 text-base font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    First Withdrawal Limit
                  </label>
                  <div className="h-12 rounded-xl border bg-secondary/40 px-3 flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    $100 USD ({formatMoney(limit100InPreferred, preferredCurrency)})
                  </div>
                </div>
              </div>

              {selectedMethod.id.includes("upi") ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    UPI ID / VPA
                  </label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@ybl, username@okaxis or username@paytm"
                    className="rounded-xl h-12 text-base font-mono"
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
                    {selectedMethod.id.includes("gcash")
                      ? "GCash Registered Mobile Number"
                      : selectedMethod.id === "paynow"
                        ? "PayNow Mobile / NRIC / UEN"
                        : selectedMethod.id === "pix"
                          ? "Pix Key (CPF / Email / Phone)"
                          : "Recipient IBAN / Account Number"}
                  </label>
                  <Input
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="Account / IBAN details"
                    className="rounded-xl h-12 text-base font-mono"
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
                    className="rounded-xl h-12 text-base"
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
                    className="rounded-xl h-12 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Phone (optional)
                  </label>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 890"
                    className="rounded-xl h-12 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Reason / Note (optional)
                  </label>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Payout reason"
                    className="rounded-xl h-12 text-base"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 pt-2 bg-background/95 backdrop-blur-xs">
                <Button
                  disabled={busy}
                  onClick={handleInitiateWithdraw}
                  className="w-full rounded-full h-12 text-base font-semibold shadow-soft active:scale-[0.98] cursor-pointer touch-manipulation"
                >
                  Submit Withdrawal
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog for Gift Card or Luxury Voucher Redemption */}
      <Dialog
        open={!!selectedCard || !!selectedLuxury}
        onOpenChange={() => {
          setSelectedCard(null);
          setSelectedLuxury(null);
        }}
      >
        {(selectedCard || selectedLuxury) && (
          <DialogContent className="top-0 left-0 translate-x-0 translate-y-0 h-[100dvh] max-w-none rounded-none border-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:h-auto w-full sm:max-w-md max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto sm:rounded-3xl p-5 sm:p-6 sm:border border-border/80 bg-background shadow-2xl pb-safe">
            {/* Grab Handle for Mobile */}
            <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-1 sm:hidden shrink-0" />

            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg font-semibold">
                {selectedCard?.brand || selectedLuxury?.name} Voucher
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedCard?.description || `Exclusive digital pass for ${selectedLuxury?.name}.`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="relative flex h-36 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 p-4 shadow-soft">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[50, 100, 250, 500].map((val) => (
                    <button
                      key={val}
                      onClick={() => setCardValue(val)}
                      className={`rounded-xl py-2.5 min-h-[48px] text-xs font-semibold border transition-all active:scale-[0.97] cursor-pointer touch-manipulation ${
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

              <div className="rounded-2xl border bg-secondary/30 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Voucher Cost:</span>
                  <span className="font-semibold text-foreground">
                    {formatMoney(cardValue, preferredCurrency)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Instant Email Delivery
                  </span>
                </div>
              </div>

              <Button
                onClick={handleRedeemCard}
                className="w-full rounded-full h-12 text-base font-semibold shadow-soft active:scale-[0.98] cursor-pointer touch-manipulation"
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
            sourceAmount={Number(withdrawAmount) || cardValue}
            sourceCurrency={preferredCurrency}
            destinationAmount={Number(withdrawAmount) || cardValue}
            destinationCurrency={preferredCurrency}
          />
        </DialogContent>
      </Dialog>

      {/* Official Transaction Receipt Modal */}
      <Dialog open={!!activeReceipt} onOpenChange={() => setActiveReceipt(null)}>
        {activeReceipt && (
          <DialogContent className="top-0 left-0 translate-x-0 translate-y-0 h-[100dvh] max-w-none rounded-none border-0 sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:h-auto w-full sm:max-w-md max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto sm:rounded-3xl p-5 sm:p-6 space-y-5 sm:border border-border/80 bg-background shadow-2xl pb-safe">
            {/* Grab handle for mobile */}
            <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-1 sm:hidden shrink-0" />

            <DialogHeader className="text-center space-y-1">
              <div className="mx-auto inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Clock className="h-3.5 w-3.5" /> {activeReceipt.status}
              </div>
              <DialogTitle className="text-xl font-bold tracking-tight pt-1">
                {activeReceipt.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Moonlight Wallet Transaction Record
              </DialogDescription>
            </DialogHeader>

            <div className="text-center space-y-1 py-3 bg-secondary/20 rounded-2xl border border-border/40">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Amount
              </p>
              <h2 className="text-3xl font-mono font-semibold text-foreground tracking-tight">
                {formatMoney(activeReceipt.amount, activeReceipt.currency)}
              </h2>
            </div>

            <div className="space-y-1 text-xs divide-y border-t border-b border-border/50 py-1">
              <div className="flex justify-between items-center py-2.5">
                <span className="text-muted-foreground">Channel / Method:</span>
                <span className="font-semibold text-foreground">{activeReceipt.methodOrBrand}</span>
              </div>
              {activeReceipt.provider && (
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-semibold text-primary">{activeReceipt.provider}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2.5">
                <span className="text-muted-foreground">Destination / Account:</span>
                <span className="font-mono font-semibold text-foreground">
                  {activeReceipt.accountOrCode}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-muted-foreground">Date &amp; Time:</span>
                <span className="font-medium text-foreground">{activeReceipt.date}</span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-3 text-xs">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  Reference Code
                </p>
                <p className="font-mono text-xs font-bold text-foreground truncate mt-0.5">
                  {activeReceipt.reference}
                </p>
              </div>
              <button
                onClick={() => copyReceiptRef(activeReceipt.reference)}
                className="flex h-10 items-center gap-1.5 rounded-xl border bg-card px-3 text-xs font-semibold text-foreground hover:bg-accent transition-colors shrink-0 cursor-pointer touch-manipulation active:scale-[0.96]"
              >
                {refCopied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {refCopied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="sticky bottom-0 pt-2 bg-background/95 backdrop-blur-xs">
              <Button
                onClick={() => setActiveReceipt(null)}
                className="w-full rounded-full h-12 text-base font-semibold shadow-soft cursor-pointer touch-manipulation"
              >
                Done &amp; Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
