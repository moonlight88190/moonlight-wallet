import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Gift,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Sparkles,
  ChevronLeft,
  Wallet,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWallet, useProfile } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/redeem")({
  head: () => ({
    meta: [
      { title: "Redeem Voucher — Moonlight Wallet" },
      {
        name: "description",
        content:
          "Redeem your digital gift card or voucher code directly to your Moonlight balance.",
      },
    ],
  }),
  component: RedeemPage,
});

type RedemptionResult = {
  success: boolean;
  amount: number;
  currency: string;
  amount_usd: number;
  transaction_id: string;
};

function formatVoucherInput(val: string): string {
  // Uppercase and strip unwanted characters except hyphens and alphanumeric
  const clean = val.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  return clean;
}

function RedeemPage() {
  const qc = useQueryClient();
  const wallet = useWallet();
  const profile = useProfile();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<RedemptionResult | null>(null);

  const preferredCurrency = profile.data?.preferred_currency || "USD";

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setCode(formatVoucherInput(text.trim()));
        setErrorMsg(null);
      }
    } catch {
      toast.error("Unable to read clipboard");
    }
  }

  async function handleRedeem(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg("Please enter a voucher code.");
      return;
    }

    setBusy(true);
    setErrorMsg(null);

    try {
      const { data, error } = await supabase.rpc("redeem_voucher", {
        p_code: cleanCode,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes("Invalid voucher code")) {
          msg = "Invalid voucher code. Please check the characters and try again.";
        } else if (msg.includes("already been redeemed")) {
          msg = "This voucher has already been redeemed.";
        } else if (msg.includes("expired")) {
          msg = "This voucher has expired.";
        } else if (msg.includes("temporarily restricted")) {
          msg = "Account is temporarily restricted. Contact support.";
        }
        setErrorMsg(msg);
        toast.error(msg);
        setBusy(false);
        return;
      }

      const res = data as unknown as RedemptionResult;
      setResult(res);
      toast.success("Voucher redeemed successfully!");

      // Invalidate relevant queries
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["vouchers"] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to redeem voucher";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  function handleReset() {
    setCode("");
    setErrorMsg(null);
    setResult(null);
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-3 sm:px-4 py-4 sm:py-6 pb-20 animate-in fade-in duration-200">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2 touch-manipulation"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Home</span>
        </Link>
        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
          <Wallet className="h-3.5 w-3.5 text-primary" />
          <span>Balance: {formatMoney(wallet.data?.balance_usd || 0, "USD")}</span>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Redeem Voucher</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Apply a Moonlight gift card, promotional code, or partner voucher directly to your
          balance.
        </p>
      </div>

      {/* ─── Success Card ─── */}
      {result ? (
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 shadow-xl space-y-5 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="h-7 w-7" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">
              Credit Applied Successfully
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-foreground tracking-tight">
              +{formatMoney(result.amount, result.currency)}
            </div>
            {result.currency.toUpperCase() !== "USD" && (
              <p className="text-xs text-muted-foreground font-mono">
                Credited as {formatMoney(result.amount_usd, "USD")} in your wallet
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-secondary/40 border border-border/40 p-4 text-xs space-y-2 text-left">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Voucher Code</span>
              <span className="font-mono font-bold text-foreground">{code.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Credited To</span>
              <span className="font-mono font-medium text-foreground">
                {wallet.data?.wallet_code || "My Wallet"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <span className="font-semibold text-emerald-400 uppercase">COMPLETED</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <Link
              to="/transactions"
              className="flex-1 inline-flex items-center justify-center rounded-full bg-primary h-11 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-opacity"
            >
              View in Activity
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="flex-1 rounded-full h-11 text-xs font-semibold border-border/50 hover:bg-secondary cursor-pointer"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Redeem Another
            </Button>
          </div>
        </div>
      ) : (
        /* ─── Input Form ─── */
        <div className="relative overflow-hidden rounded-3xl border border-[#2A3241] bg-[#10141D] p-5 sm:p-6 shadow-xl space-y-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          <form onSubmit={handleRedeem} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="voucher-code-input"
                  className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  Voucher or Gift Code
                </label>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Paste code
                </button>
              </div>

              <div className="relative">
                <Input
                  id="voucher-code-input"
                  value={code}
                  onChange={(e) => {
                    setCode(formatVoucherInput(e.target.value));
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. ML-7X9A-4K2P"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck="false"
                  className="h-13 rounded-2xl bg-secondary/30 border-border/50 text-center font-mono text-lg font-bold tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground/50 focus-visible:ring-primary/40"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 p-3.5 text-xs text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="flex-1 font-medium">{errorMsg}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={busy || !code.trim()}
              className="w-full rounded-full h-12 text-xs font-semibold tracking-wide shadow-md active:scale-[0.99] cursor-pointer transition-all"
            >
              {busy ? (
                <span>Validating & Crediting...</span>
              ) : (
                <span className="flex items-center justify-center gap-1.5">
                  Redeem to Wallet <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Redemption Rules Information */}
          <div className="rounded-2xl bg-secondary/20 border border-border/30 p-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-foreground text-[11px] uppercase tracking-wider">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Redemption Terms</span>
            </div>
            <ul className="space-y-1.5 text-[11px] leading-relaxed list-disc list-inside">
              <li>0% processing fee on all voucher code redemptions.</li>
              <li>Multi-currency codes convert automatically at official base rates.</li>
              <li>Wallet balances update immediately upon authorization.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
