import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Landmark, CheckCircle2, Sparkles, Lock, Gift } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { GiftCardBrand, TransferMethodCard } from "@/components/AssetComponents";
import {
  GIFT_CARDS,
  LUXURY_BRANDS,
  PAYMENT_METHODS,
  type GiftCardMeta,
  type PaymentMethodMeta,
} from "@/lib/assets";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/withdraw")({
  head: () => ({
    meta: [
      {
        name: "description",
        content: "Withdraw funds via SEPA, UPI, GCash, Bank Transfer, or luxury vouchers.",
      },
    ],
  }),
  component: WithdrawPage,
});

function WithdrawPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodMeta | null>(null);
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCardMeta | null>(null);
  const [amount, setAmount] = useState("");
  const [recipientDetails, setRecipientDetails] = useState("");
  const [success, setSuccess] = useState(false);

  function handleWithdrawSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    setSuccess(true);
  }

  return (
    <div className="space-y-10">
      <PageTitle eyebrow="WITHDRAW &amp; PAYOUTS" title="Multi-Currency Payout Rails">
        Direct settlement via European SEPA, India UPI, PH InstaPay/GCash, or Global Wire.
      </PageTitle>

      {/* Corridor Selection */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Settlement Rails</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {PAYMENT_METHODS.map((method) => (
            <TransferMethodCard
              key={method.id}
              method={method}
              onClick={() => {
                setSelectedMethod(method);
                setSuccess(false);
                setAmount("");
                setRecipientDetails("");
              }}
            />
          ))}
        </div>
      </section>

      {/* Gift Cards Marketplace */}
      <section className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Digital Vouchers &amp; Gift Cards
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Official vouchers for global gaming, shopping, and entertainment platforms.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {GIFT_CARDS.map((card) => (
            <GiftCardBrand
              key={card.id}
              card={card}
              onClick={() => {
                setSelectedGiftCard(card);
                setSuccess(false);
                setAmount("50");
              }}
            />
          ))}
        </div>
      </section>

      {/* Luxury Brands Portfolio */}
      <section className="space-y-4 pt-6 border-t">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-xl font-semibold tracking-tight">
                Luxury &amp; Bespoke Concierge
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              High horology, couture houses, and luxury department store redemptions.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {LUXURY_BRANDS.map((brand) => (
            <div
              key={brand.id}
              onClick={() => toast.info(`Luxury Concierge: ${brand.name}`)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-card shadow-xs hover:border-primary/40 cursor-pointer transition-all group text-center"
            >
              <div className="h-10 w-20 flex items-center justify-center">
                <img
                  src={brand.logoUrl}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain filter dark:invert dark:brightness-200 opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <span className="text-xs font-semibold text-foreground mt-2">{brand.name}</span>
              <span className="text-[10px] text-muted-foreground">{brand.category}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Payout Modal */}
      <Dialog open={!!selectedMethod} onOpenChange={(open) => !open && setSelectedMethod(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Landmark className="h-5 w-5 text-primary" />
              {selectedMethod?.name}
            </DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center space-y-4 animate-in fade-in">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="text-xl font-semibold">Payout Request Submitted</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Your withdrawal request of €{amount} via {selectedMethod?.name} has been processed
                onto the settlement rail.
              </p>
              <button
                onClick={() => setSelectedMethod(null)}
                className="mt-4 w-full h-11 rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Amount (EUR €)
                </label>
                <Input
                  type="number"
                  placeholder="100.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl text-base"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  {selectedMethod?.id.includes("upi")
                    ? "UPI ID (VPA)"
                    : selectedMethod?.id.includes("gcash")
                      ? "GCash Mobile Number"
                      : "IBAN / Bank Account Details"}
                </label>
                <Input
                  placeholder={
                    selectedMethod?.id.includes("upi")
                      ? "username@upi"
                      : selectedMethod?.id.includes("gcash")
                        ? "+63 912 345 6789"
                        : "CZ65 0800 0000 0000 1234 5678"
                  }
                  value={recipientDetails}
                  onChange={(e) => setRecipientDetails(e.target.value)}
                  className="mt-1.5 h-12 rounded-xl text-base"
                  required
                />
              </div>
              <div className="rounded-xl border bg-muted/40 p-3 text-[11px] text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Protected by European Financial Infrastructure &amp; Encryption</span>
              </div>
              <button
                type="submit"
                className="w-full h-12 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition-opacity"
              >
                Confirm Settlement
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Gift Card Modal */}
      <Dialog open={!!selectedGiftCard} onOpenChange={(open) => !open && setSelectedGiftCard(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
              <Gift className="h-5 w-5 text-primary" />
              {selectedGiftCard?.brand} Digital Voucher
            </DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="py-6 text-center space-y-4 animate-in fade-in">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h3 className="text-xl font-semibold">Voucher Issued</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Your €{amount} digital gift card code for {selectedGiftCard?.brand} has been issued
                and sent to your email.
              </p>
              <button
                onClick={() => setSelectedGiftCard(null)}
                className="mt-4 w-full h-11 rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleWithdrawSubmit} className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Select Denomination (EUR €)
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {["25", "50", "100"].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`h-10 rounded-xl font-semibold text-xs border transition-all ${
                        amount === val
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50"
                      }`}
                    >
                      €{val}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full h-12 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-90 transition-opacity mt-4"
              >
                Issue Digital Voucher
              </button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
