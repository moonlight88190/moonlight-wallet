import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronRight, ArrowRight, Check, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { CountryFlag, GiftCardBrand, PaymentMethodIcon } from "@/components/AssetComponents";
import {
  GIFT_CARDS,
  PAYMENT_METHODS,
  type GiftCardMeta,
  type PaymentMethodMeta,
} from "@/lib/assets";
import { formatMoney } from "@/lib/currency";
import { useProfile, useWallet } from "@/hooks/use-wallet";
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
      { title: "Withdraw & Redeem — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Withdraw Moonlight Wallet balance via SEPA Instant, Czech Bank Transfer, UPI, GCash, SWIFT or Redeem Digital Gift Cards.",
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
    title: "Europe & Czech Republic",
    badge: "Primary Corridor",
    flagCode: "EU",
    items: PAYMENT_METHODS.filter((m) => m.region === "Europe"),
  },
  {
    id: "india",
    title: "India Corridor",
    badge: "Instant NPCI Rail",
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
    title: "International Wire",
    badge: "Global Payout",
    flagCode: "US",
    items: PAYMENT_METHODS.filter((m) => m.region === "International"),
  },
];

function Withdraw() {
  const { data: wallet } = useWallet();
  const { data: profile } = useProfile();
  const balanceUsd = Number(wallet?.balance_usd ?? 0);
  const preferredCurrency = profile?.preferred_currency || "EUR";

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodMeta | null>(null);
  const [selectedCard, setSelectedCard] = useState<GiftCardMeta | null>(null);
  const [cardValue, setCardValue] = useState<number>(50);
  const [withdrawAmount, setWithdrawAmount] = useState<string>("100");
  const [accountDetails, setAccountDetails] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const categories = ["All", "Luxury", "Gaming", "Shopping", "Entertainment", "Travel"];
  const filteredCards =
    activeCategory === "All" ? GIFT_CARDS : GIFT_CARDS.filter((c) => c.category === activeCategory);

  function handleInitiateWithdraw() {
    if (!accountDetails) {
      toast.error("Please enter account details or VPA / IBAN");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSelectedMethod(null);
      setAccountDetails("");
      toast.success(`Withdrawal request submitted! Order reference generated.`);
    }, 1200);
  }

  function handleRedeemCard() {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSelectedCard(null);
      toast.success(
        `${selectedCard?.brand} $${cardValue} gift voucher generated! Code sent to email.`,
      );
    }, 1200);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <PageTitle eyebrow="WITHDRAW & REDEEM" title="Withdraw Funds">
        Transfer funds to European &amp; international accounts or redeem instantly into digital
        gift vouchers.
      </PageTitle>

      {/* Primary Payout Methods by Region */}
      <div className="space-y-10">
        <div className="flex items-center justify-between border-b pb-4">
          <h2 className="text-xl font-semibold tracking-tight">Financial Payout Channels</h2>
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Verified Financial Infrastructure
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {REGIONS.map((region) => (
            <div
              key={region.id}
              className="rounded-3xl border bg-card/60 p-5 shadow-soft space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CountryFlag code={region.flagCode} circle size="sm" />
                  <h3 className="font-semibold text-foreground text-base tracking-tight">
                    {region.title}
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full">
                  {region.badge}
                </span>
              </div>

              <div className="space-y-3">
                {region.items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMethod(item)}
                    className="group flex items-center justify-between rounded-2xl border border-border/50 bg-card p-3.5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:bg-accent/30 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <PaymentMethodIcon id={item.id} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                            {item.name}
                          </span>
                          {item.badge && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                        {item.speed}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gift Cards Gallery */}
      <div className="pt-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-semibold tracking-tight">
                Gift Cards &amp; Luxury Vouchers
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Convert Moonlight funds into instant official brand cards and luxury vouchers.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filteredCards.map((card) => (
            <GiftCardBrand key={card.id} card={card} onClick={() => setSelectedCard(card)} />
          ))}
        </div>
      </div>

      {/* Dialog for Withdrawal Method */}
      <Dialog open={!!selectedMethod} onOpenChange={() => setSelectedMethod(null)}>
        {selectedMethod && (
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <PaymentMethodIcon id={selectedMethod.id} size="md" />
                <div>
                  <DialogTitle className="text-lg font-semibold">{selectedMethod.name}</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {selectedMethod.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="rounded-2xl border bg-secondary/30 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payout Speed:</span>
                  <span className="font-semibold text-emerald-500">{selectedMethod.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Network Fee:</span>
                  <span className="font-semibold">0.00 EUR (Free)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Available Balance:</span>
                  <span className="font-semibold">{formatMoney(balanceUsd, "USD")}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Withdrawal Amount (USD)
                </label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="100"
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  {selectedMethod.id.includes("upi")
                    ? "Virtual Payment Address (VPA / UPI ID)"
                    : selectedMethod.id.includes("gcash")
                      ? "GCash Registered Mobile Number"
                      : "Recipient IBAN / Bank Account Number"}
                </label>
                <Input
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder={
                    selectedMethod.id.includes("upi")
                      ? "username@upi or mobile@paytm"
                      : selectedMethod.id.includes("gcash")
                        ? "+63 9XX XXX XXXX"
                        : "CZ65 0800 0000 0012 3456 7890"
                  }
                  className="rounded-xl h-11"
                />
              </div>

              <Button
                onClick={handleInitiateWithdraw}
                disabled={isProcessing}
                className="w-full rounded-full h-11 font-medium mt-2"
              >
                {isProcessing ? "Processing Payout..." : "Confirm Withdrawal"}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Dialog for Gift Card Redemption */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        {selectedCard && (
          <DialogContent className="sm:max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">
                {selectedCard.brand} Voucher
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedCard.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              <div className="relative aspect-[1.58/1] w-full overflow-hidden rounded-2xl bg-muted shadow-soft">
                <img
                  src={selectedCard.imageUrl}
                  alt={selectedCard.brand}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Select Voucher Denomination
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 250].map((val) => (
                    <button
                      key={val}
                      onClick={() => setCardValue(val)}
                      className={`rounded-xl py-2 text-xs font-semibold border transition-all ${
                        cardValue === val
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/60 bg-card hover:bg-accent"
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-secondary/30 p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Voucher Cost:</span>
                  <span className="font-semibold">${cardValue}.00 USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery:</span>
                  <span className="font-semibold text-emerald-500">Instant Email Code</span>
                </div>
              </div>

              <Button
                onClick={handleRedeemCard}
                disabled={isProcessing}
                className="w-full rounded-full h-11 font-medium"
              >
                {isProcessing ? "Generating Code..." : `Redeem for $${cardValue}.00`}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
