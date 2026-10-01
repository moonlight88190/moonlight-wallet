import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ScanLine, CheckCircle2, Image as ImageIcon, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useRates, useWallet } from "@/hooks/use-wallet";
import { CURRENCIES, TRANSFER_FEE_RATE, convert, formatMoney } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageTitle } from "@/components/AppShell";
import { CountryFlag, CurrencyIcon } from "@/components/AssetComponents";
import { PaymentAnimation } from "@/components/PaymentAnimation";

export const Route = createFileRoute("/_authenticated/send")({
  head: () => ({
    meta: [
      { title: "Send money — Moonlight Wallet" },
      { name: "description", content: "Send money to any Moonlight wallet by ID, email or QR." },
      { property: "og:title", content: "Send money — Moonlight Wallet" },
      { property: "og:description", content: "Send money by ID, email or QR." },
    ],
  }),
  component: Send,
});

type Recipient = { wallet_code: string; full_name: string; preferred_currency: string };

function Scanner({ onResult }: { onResult: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanningFile, setIsScanningFile] = useState(false);

  useEffect(() => {
    let scanner: { stop: () => Promise<void> } | null = null;
    let done = false;
    import("html5-qrcode").then(({ Html5Qrcode }) => {
      if (done || !ref.current) return;
      const s = new Html5Qrcode("ml-qr-reader");
      scanner = s;
      s.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 220 },
        (text) => {
          onResult(text);
        },
        () => {},
      ).catch(() => toast.error("Camera unavailable. Try uploading an image."));
    });
    return () => {
      done = true;
      scanner?.stop().catch(() => {});
    };
  }, [onResult]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningFile(true);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const s = new Html5Qrcode("ml-qr-reader-hidden");
      const rawText = await s.scanFile(file, true);
      const trimmed = rawText.trim();
      let walletCode = trimmed;
      if (trimmed.toLowerCase().startsWith("moonlight:")) {
        walletCode = trimmed.slice(10).trim();
      }

      if (!walletCode || (!walletCode.startsWith("ML-") && !walletCode.includes("@"))) {
        toast.error("Invalid QR code payload. Please select a valid Moonlight Wallet QR code.");
        return;
      }

      onResult(walletCode);
    } catch {
      toast.error(
        "Could not find a valid QR code in this image. Please select a clear QR code image.",
      );
    } finally {
      setIsScanningFile(false);
      if (e.target) e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div
        id="ml-qr-reader"
        ref={ref}
        className="w-full max-w-xs aspect-square mx-auto rounded-2xl overflow-hidden bg-black"
      />
      <div id="ml-qr-reader-hidden" className="hidden" />
      <div className="flex flex-col items-center gap-2 pt-2">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">OR</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanningFile}
          className="w-full flex items-center justify-center gap-2 rounded-full border bg-secondary/80 px-5 h-12 text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-50 cursor-pointer touch-manipulation"
        >
          {isScanningFile ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4 text-primary" />
          )}
          Upload from gallery
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

function Send() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();

  const [step, setStep] = useState<"to" | "amount" | "review" | "animating" | "done">("to");
  const [animState, setAnimState] = useState<"confirming" | "processing" | "completed" | "failed">(
    "confirming",
  );
  const [query, setQuery] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState(false);
  const [txId, setTxId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const cur = currency || profile.data?.preferred_currency || "EUR";
  const r = rates.data?.rates ?? {};
  const amt = Number(amount) || 0;
  const fee = amt * TRANSFER_FEE_RATE;
  const recvCur = recipient?.preferred_currency ?? "EUR";
  const recv = convert(amt, cur, recvCur, r);
  const rateRatio = convert(1, cur, recvCur, r);
  const available = Number(wallet.data?.balance_usd ?? 0) * (r[cur] ?? 1);

  // New account anti-fraud check (48-hour security clearance window)
  const createdAt = profile.data?.created_at ? new Date(profile.data.created_at) : new Date();
  const accountAgeHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const isNewAccount = accountAgeHours < 48;
  const curRate = r[cur] ?? 1;
  const limit10InCur = 10 * curRate; // $10 USD equivalent in current display currency
  const isOverNewAccountLimit = isNewAccount && amt > limit10InCur + 1e-6;

  async function lookup(q: string) {
    const v = q.trim().replace(/^moonlight:/i, "");
    if (!v) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("lookup_recipient", { p_query: v });
    setBusy(false);
    if (error || !data?.length) {
      toast.error("No Moonlight wallet found for that ID or email.");
      return;
    }
    setRecipient(data[0] ?? null);
    setStep("amount");
  }

  async function confirmTransfer() {
    if (!recipient) return;
    if (isOverNewAccountLimit) {
      toast.error(
        `New account security limit: Maximum transfer amount during the 48-hour security clearance window is $10.00 USD (${formatMoney(limit10InCur, cur)}).`,
      );
      return;
    }
    setStep("animating");
    setAnimState("processing");
    setBusy(true);

    const res = await supabase.rpc("send_transfer", {
      p_recipient_code: recipient.wallet_code,
      p_amount: amt,
      p_currency: cur,
      ...(note ? { p_note: note } : {}),
    });

    setBusy(false);

    if (res.error) {
      setErrorMessage(res.error.message);
      setAnimState("failed");
      return;
    }

    setTxId(res.data as string);

    // Keep animation running for 6.0 seconds so user experiences full clearance sequence
    setTimeout(() => {
      setAnimState("completed");
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    }, 6000);
  }

  const btn =
    "flex h-[52px] w-full items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 shadow-soft touch-manipulation cursor-pointer";

  return (
    <div className="mx-auto max-w-md">
      {step === "to" && (
        <>
          <PageTitle eyebrow="SEND" title="Who are you sending to?">
            Search by wallet ID or email, or scan their QR code.
          </PageTitle>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              lookup(query);
            }}
            className="space-y-3"
          >
            <Input
              autoFocus
              placeholder="ML-XXXX-XXXX or name@email.com"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 rounded-xl text-base"
              maxLength={255}
            />
            <button disabled={busy || !query.trim()} className={btn}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find recipient"}
            </button>
          </form>
          <button
            onClick={() => setScan(true)}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border bg-card text-[15px] font-medium hover:bg-accent transition-colors shadow-xs"
          >
            <ScanLine className="h-4 w-4" /> Scan QR
          </button>
          <Dialog open={scan} onOpenChange={setScan}>
            <DialogContent className="max-w-sm rounded-3xl">
              <DialogTitle>Scan a Moonlight QR</DialogTitle>
              {scan && (
                <Scanner
                  onResult={(v) => {
                    setScan(false);
                    setQuery(v);
                    lookup(v);
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      )}

      {step === "amount" && recipient && (
        <>
          <PageTitle eyebrow="SEND" title={`To ${recipient.full_name}`}>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm">{recipient.wallet_code}</span>
              <CountryFlag code={recvCur} circle size="xs" />
            </div>
          </PageTitle>
          <div className="space-y-4">
            <div className="flex gap-2.5">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular h-14 rounded-2xl text-2xl px-4 flex-1 min-w-0"
              />
              <Select
                value={cur}
                onValueChange={(newCur) => {
                  if (amt > 0 && cur && newCur && cur !== newCur) {
                    const convertedVal = convert(amt, cur, newCur, r);
                    setAmount(convertedVal.toFixed(2));
                  }
                  setCurrency(newCur);
                }}
              >
                <SelectTrigger className="h-14 w-36 rounded-2xl border px-3 shrink-0">
                  <CurrencyIcon code={cur} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl p-1">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="rounded-xl py-2">
                      <div className="flex items-center gap-2">
                        <CountryFlag code={c.code} circle size="xs" />
                        <span className="font-semibold">{c.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="px-1 text-xs text-muted-foreground flex items-center gap-1.5">
              Available {formatMoney(available, cur)}
            </p>

            {isNewAccount && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Security Protection &amp; Fraud Prevention Policy</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To protect your account against identity theft and unauthorized scam transactions,
                  transfers for accounts under 48 hours old are limited to{" "}
                  <strong className="text-foreground">$10.00 USD</strong> (
                  {formatMoney(limit10InCur, cur)}) during the initial verification clearance
                  period.
                </p>
              </div>
            )}

            <Input
              placeholder="Note (optional)"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 rounded-xl"
            />
            {amt > 0 && (
              <div className="rounded-2xl border bg-card p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Recipient receives:</span>
                  <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <CountryFlag code={recvCur} circle size="xs" />
                    {cur === recvCur ? (
                      formatMoney(recv, recvCur)
                    ) : (
                      <span>
                        {formatMoney(amt, cur)} converted to{" "}
                        <strong className="text-emerald-600 dark:text-emerald-400">
                          {formatMoney(recv, recvCur)}
                        </strong>
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground pt-1 border-t border-border/40">
                  <span>Transaction Charge (10%):</span>
                  <span className="font-semibold">{formatMoney(fee, cur)}</span>
                </div>
                <div className="pt-1.5 border-t border-border/40 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Transaction charge is 10%. Once sent/submitted, transactions cannot be cancelled or reversed.
                </div>
              </div>
            )}
            <button
              disabled={amt <= 0 || amt + fee > available + 1e-9 || isOverNewAccountLimit}
              onClick={() => {
                if (isOverNewAccountLimit) {
                  toast.error(
                    `New account security limit: Max $10.00 USD (${formatMoney(limit10InCur, cur)}).`,
                  );
                  return;
                }
                setStep("review");
              }}
              className={btn}
            >
              {amt + fee > available + 1e-9
                ? "Insufficient balance"
                : isOverNewAccountLimit
                  ? `Limit Exceeded ($10 USD Max for New Accounts)`
                  : "Review Transfer"}
            </button>
            <button
              onClick={() => {
                setRecipient(null);
                setStep("to");
              }}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Change recipient
            </button>
          </div>
        </>
      )}

      {step === "review" && recipient && (
        <>
          <PageTitle eyebrow="REVIEW" title={formatMoney(amt, cur)} />
          <div className="divide-y rounded-3xl border bg-card px-5 shadow-soft">
            <div className="flex justify-between gap-4 py-4 text-sm">
              <span className="text-muted-foreground">From</span>
              <span className="text-right font-medium">
                {profile.data?.full_name} · {wallet.data?.wallet_code}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-4 text-sm">
              <span className="text-muted-foreground">To</span>
              <span className="text-right font-medium flex items-center gap-1.5 justify-end">
                <CountryFlag code={recvCur} circle size="xs" />
                {recipient.full_name} · {recipient.wallet_code}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-4 text-sm">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="text-right font-medium font-mono text-xs">
                1 {cur} ≈ {rateRatio.toFixed(4)} {recvCur}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-4 text-sm">
              <span className="text-muted-foreground">Transaction Fee (10%)</span>
              <span className="text-right font-medium">{formatMoney(fee, cur)}</span>
            </div>
            <div className="flex justify-between gap-4 py-4 text-sm">
              <span className="text-muted-foreground">Recipient receives</span>
              <span className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
                {cur === recvCur ? (
                  formatMoney(recv, recvCur)
                ) : (
                  <span>
                    {formatMoney(amt, cur)} converted to {formatMoney(recv, recvCur)}
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between gap-4 py-4 text-sm font-semibold">
              <span>Total Charge</span>
              <span>{formatMoney(amt + fee, cur)}</span>
            </div>
            <div className="py-3 text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-3 rounded-xl">
              Transaction charge is 10%. Once sent/submitted, transactions cannot be cancelled or reversed.
            </div>
            {note && (
              <div className="flex justify-between gap-4 py-4 text-sm">
                <span className="text-muted-foreground">Note</span>
                <span className="text-right font-medium">{note}</span>
              </div>
            )}
          </div>
          <button disabled={busy} onClick={confirmTransfer} className={`${btn} mt-8`}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Send"}
          </button>
          <button
            onClick={() => setStep("amount")}
            className="mt-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Back
          </button>
        </>
      )}

      {step === "animating" && recipient && (
        <div className="py-4 animate-in fade-in duration-300">
          <PaymentAnimation
            state={animState}
            senderName={profile.data?.full_name || "Sender"}
            senderCode={wallet.data?.wallet_code || "ML-SENDER"}
            recipientName={recipient.full_name}
            recipientCode={recipient.wallet_code}
            sourceAmount={amt}
            sourceCurrency={cur}
            destinationAmount={recv}
            destinationCurrency={recvCur}
            exchangeRate={rateRatio}
            fee={fee}
            errorMessage={errorMessage}
            onRetry={() => {
              setStep("review");
            }}
            onViewReceipt={() => {
              if (txId) navigate({ to: "/transactions/$id", params: { id: txId } });
            }}
          />
        </div>
      )}

      {step === "done" && (
        <div className="pt-10 text-center animate-in fade-in zoom-in-95">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" strokeWidth={1.25} />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sent Successfully</h1>
          <p className="mt-2 text-muted-foreground">
            {formatMoney(amt, cur)} ({formatMoney(recv, recvCur)}) to {recipient?.full_name}
          </p>
          <div className="mt-10 space-y-2">
            <Link to="/transactions/$id" params={{ id: txId }} className={btn}>
              View receipt
            </Link>
            <Link
              to="/dashboard"
              className="block py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Return to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
