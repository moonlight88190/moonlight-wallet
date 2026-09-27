import React from "react";
import { CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { CountryFlag } from "@/components/AssetComponents";

export type PaymentState = "CONFIRMING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface TransactionAnimationData {
  sourceAmount: number;
  sourceCurrency: string;
  destinationAmount: number;
  destinationCurrency: string;
  recipientName: string;
  recipientCode: string;
  fee: number;
  status: PaymentState;
  errorMessage?: string;
  onFinished?: () => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  INR: "₹",
  PHP: "₱",
  JPY: "¥",
  CHF: "CHF",
  CZK: "Kč",
  CAD: "C$",
  AUD: "A$",
  SGD: "S$",
  AED: "AED",
};

export function PaymentAnimationOverlay({ data }: { data: TransactionAnimationData }) {
  const {
    sourceAmount,
    sourceCurrency,
    destinationAmount,
    destinationCurrency,
    recipientName,
    recipientCode,
    status,
    errorMessage,
  } = data;

  const destSymbol = CURRENCY_SYMBOLS[destinationCurrency] || destinationCurrency;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-2xl px-6 py-10 animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm text-center">
        {/* Particle / Aura Ring */}
        <div className="relative mx-auto flex h-36 w-36 items-center justify-center">
          {status === "PROCESSING" && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          )}

          {status === "COMPLETED" && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 border border-emerald-500/30 animate-pulse" />
          )}

          {status === "FAILED" && (
            <div className="absolute inset-0 rounded-full bg-destructive/10 border border-destructive/30" />
          )}

          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-card shadow-soft border border-border/60">
            {status === "PROCESSING" || status === "CONFIRMING" ? (
              <span className="text-4xl font-semibold text-primary animate-pulse">
                {destSymbol}
              </span>
            ) : status === "COMPLETED" ? (
              <CheckCircle2 className="h-12 w-12 text-emerald-500 animate-in zoom-in-75 duration-300" />
            ) : (
              <ShieldAlert className="h-12 w-12 text-destructive animate-in zoom-in-75 duration-300" />
            )}
          </div>
        </div>

        {/* Dynamic Amount Transition */}
        <div className="mt-8 space-y-2">
          {status === "CONFIRMING" && (
            <div>
              <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                Confirming Transfer
              </p>
              <h2 className="text-3xl font-semibold tracking-tight mt-1">
                {formatMoney(sourceAmount, sourceCurrency)}
              </h2>
            </div>
          )}

          {status === "PROCESSING" && (
            <div>
              <p className="text-xs font-semibold tracking-widest text-primary uppercase animate-pulse flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> Processing Multi-Currency Rail
              </p>
              <h2 className="text-3xl font-semibold tracking-tight mt-1 text-foreground">
                {formatMoney(sourceAmount, sourceCurrency)}
              </h2>
              {sourceCurrency !== destinationCurrency && (
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  Converting to {formatMoney(destinationAmount, destinationCurrency)}
                </p>
              )}
            </div>
          )}

          {status === "COMPLETED" && (
            <div className="animate-in fade-in duration-300">
              <p className="text-xs font-semibold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
                Payment Completed
              </p>
              <h2 className="text-4xl font-semibold tracking-tight mt-1 text-foreground">
                {formatMoney(destinationAmount, destinationCurrency)}
              </h2>
            </div>
          )}

          {status === "FAILED" && (
            <div className="animate-in fade-in duration-300">
              <p className="text-xs font-semibold tracking-widest text-destructive uppercase">
                Transfer Failed
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-2">
                {errorMessage || "Unable to complete transaction onto the ledger rail."}
              </p>
            </div>
          )}
        </div>

        {/* Recipient Card Snapshot */}
        <div className="mt-8 rounded-2xl border bg-card p-4 shadow-xs text-left space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Recipient</span>
            <span>Wallet ID</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm text-foreground">{recipientName}</span>
            <span className="font-mono text-xs font-medium text-muted-foreground">
              {recipientCode}
            </span>
          </div>
          <div className="pt-2 border-t flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Destination</span>
            <div className="flex items-center gap-1.5 font-semibold">
              <CountryFlag code={destinationCurrency} circle size="xs" />
              <span>{destinationCurrency}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
