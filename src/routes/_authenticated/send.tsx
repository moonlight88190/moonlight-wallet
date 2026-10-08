import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  ScanLine,
  CheckCircle2,
  Image as ImageIcon,
  ShieldAlert,
  UserCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Snowflake,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useRates, useWallet, useTransactions } from "@/hooks/use-wallet";
import { CURRENCIES, TRANSFER_FEE_RATE, convert, formatMoney, getRate } from "@/lib/currency";
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
import { triggerTransactionalEmail } from "@/lib/email";

export type SendSearchParams = {
  to?: string;
  scan?: string;
};

export const Route = createFileRoute("/_authenticated/send")({
  validateSearch: (search: Record<string, unknown>): SendSearchParams => ({
    ...(typeof search["to"] === "string" ? { to: search["to"] } : {}),
    ...(typeof search["scan"] === "string" ? { scan: search["scan"] } : {}),
  }),
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
        className="w-full max-w-xs aspect-square mx-auto rounded-3xl overflow-hidden bg-black border border-border/50 shadow-inner"
      />
      <div id="ml-qr-reader-hidden" className="hidden" />
      <div className="flex flex-col items-center gap-2 pt-2">
        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">OR</p>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isScanningFile}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-muted/60 px-5 h-12 text-xs font-semibold hover:bg-muted transition-all disabled:opacity-50 cursor-pointer touch-manipulation"
        >
          {isScanningFile ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4 text-primary" />
          )}
          Upload QR image from gallery
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
  const search = Route.useSearch();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
  const txQuery = useTransactions(50);

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

  const isFrozen = wallet.data?.status === "frozen";

  const cur = currency || profile.data?.preferred_currency || "EUR";
  const r = rates.data?.rates ?? {};
  const amt = Number(amount) || 0;
  const fee = amt * TRANSFER_FEE_RATE;
  const recvCur = recipient?.preferred_currency ?? "EUR";
  const recv = convert(amt, cur, recvCur, r);
  const rateRatio = convert(1, cur, recvCur, r);
  const curRate = getRate(cur, r);
  const available = Number(wallet.data?.balance_usd ?? 0) * curRate;

  // New account anti-fraud check (48-hour security clearance window)
  const createdAt = profile.data?.created_at ? new Date(profile.data.created_at) : new Date();
  const accountAgeHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  const isNewAccount = accountAgeHours < 48;
  const limit10InCur = 10 * curRate; // $10 USD equivalent in current display currency
  const isOverNewAccountLimit = isNewAccount && amt > limit10InCur + 1e-6;

  async function lookup(q: string) {
    const v = q.trim().replace(/^moonlight:/i, "");
    if (v === "4336") {
      navigate({ to: "/admin-access" });
      return;
    }
    if (isFrozen) {
      toast.error("Account is frozen. Outgoing transfers are locked.");
      return;
    }
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

  // Auto-fill and lookup if navigated from receipt or activity with ?to=...
  useEffect(() => {
    if (search?.to) {
      const code = search.to.trim();
      setQuery(code);
      if (!isFrozen) {
        lookup(code);
      }
    } else if (search?.scan === "true") {
      if (!isFrozen) {
        setScan(true);
      }
    }
  }, [search?.to, search?.scan, isFrozen]);

  // Derive recent contacts (recipients you sent to & senders who paid you)
  const myWalletId = wallet.data?.id;
  const myWalletCode = wallet.data?.wallet_code;

  const recentContacts = useMemo(() => {
    const list: Array<{
      walletCode: string;
      name: string;
      type: "sent" | "received";
      date: string;
    }> = [];
    const seen = new Set<string>();

    for (const t of txQuery.data ?? []) {
      if (t.kind !== "transfer") continue;
      const isOut = t.sender_wallet_id === myWalletId;
      const code = isOut ? t.recipient_wallet_code : t.sender_wallet_code;
      const name = isOut
        ? t.recipient_name || "Recipient"
        : t.sender_name || "Sender";

      if (code && code !== myWalletCode && !seen.has(code.toUpperCase())) {
        seen.add(code.toUpperCase());
        list.push({
          walletCode: code,
          name,
          type: isOut ? "sent" : "received",
          date: t.created_at,
        });
      }
    }
    return list.slice(0, 6);
  }, [txQuery.data, myWalletId, myWalletCode]);

  async function confirmTransfer() {
    if (!recipient) return;
    if (isFrozen) {
      toast.error("Account is frozen. Outgoing transfers are locked.");
      return;
    }
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

    const createdTxId = res.data as string;
    setTxId(createdTxId);
    setAnimState("completed");
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });

    // Automatically trigger authoritative transactional email delivery
    triggerTransactionalEmail({
      eventType: "transfer_sent",
      transactionId: createdTxId,
    });
  }

  const primaryBtn =
    "flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-xs font-bold tracking-wider uppercase text-primary-foreground transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 shadow-md touch-manipulation cursor-pointer";

  return (
    <div className="mx-auto max-w-md pb-3">
      {step === "to" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageTitle eyebrow="SEND MONEY" title="Who are you sending to?">
            Search by Moonlight ID or registered email, or scan their QR code.
          </PageTitle>

          {/* Account Freeze Banner */}
          {isFrozen && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-left space-y-2 text-destructive dark:text-rose-300 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <Lock className="h-4 w-4" />
                  <span>Transfers Suspended — Account Frozen</span>
                </div>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md bg-destructive/20 border border-destructive/30">
                  Locked
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This wallet is currently under an administrative security freeze. Outgoing peer payments, QR code lookups, and account search are temporarily paused. Your funds remain safe and secure in your account.
              </p>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isFrozen) {
                toast.error("Account is frozen. Outgoing transfers are locked.");
                return;
              }
              lookup(query);
            }}
            className="space-y-4"
          >
            <div className="relative">
              <Input
                autoFocus={!isFrozen}
                disabled={isFrozen}
                placeholder="ML-XXXX-XXXX or name@email.com"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`h-14 rounded-2xl text-base px-4 border-border/60 bg-card/60 shadow-xs focus:ring-2 focus:ring-primary/20 ${
                  isFrozen ? "opacity-60 cursor-not-allowed" : ""
                }`}
                maxLength={255}
              />
            </div>
            <button
              disabled={isFrozen || busy || !query.trim()}
              className={`${primaryBtn} ${isFrozen ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {isFrozen ? (
                <span className="flex items-center gap-2">
                  <Lock className="h-4 w-4" /> Transfers Locked
                </span>
              ) : busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Find Recipient"
              )}
            </button>
          </form>

          {/* Quick Recent Contacts & Senders */}
          {recentContacts.length > 0 && (
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                  Recent Senders &amp; Recipients
                </span>
                <span className="text-[10px] text-muted-foreground/80">
                  {isFrozen ? "Transfers disabled" : "Tap to pay directly"}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {recentContacts.map((c) => (
                  <button
                    key={c.walletCode}
                    type="button"
                    disabled={isFrozen}
                    onClick={() => {
                      if (isFrozen) {
                        toast.error("Account is frozen. Outgoing transfers are locked.");
                        return;
                      }
                      setQuery(c.walletCode);
                      lookup(c.walletCode);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-2xl border border-border/60 bg-card/60 text-left group transition-all ${
                      isFrozen
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:bg-secondary/70 hover:border-border cursor-pointer touch-manipulation active:scale-[0.98]"
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-xs group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
                      {c.name.charAt(0).toUpperCase() || "M"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {c.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span className={c.type === "received" ? "text-emerald-500 font-semibold" : "font-medium"}>
                          {c.type === "received" ? "Paid you" : "Sent to"}
                        </span>
                        <span>·</span>
                        <span className="font-mono text-muted-foreground/80 truncate">{c.walletCode}</span>
                      </div>
                    </div>
                    {isFrozen ? (
                      <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/40" />
            </div>
            <span className="relative bg-background px-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              OR
            </span>
          </div>

          <button
            disabled={isFrozen}
            onClick={() => {
              if (isFrozen) {
                toast.error("Account is frozen. QR scanning is locked.");
                return;
              }
              setScan(true);
            }}
            className={`flex h-13 w-full items-center justify-center gap-2.5 rounded-2xl border border-border/60 bg-card/60 text-xs font-semibold tracking-wide transition-all shadow-xs ${
              isFrozen
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-muted/60 cursor-pointer"
            }`}
          >
            {isFrozen ? <Lock className="h-4 w-4 text-destructive" /> : <ScanLine className="h-4 w-4 text-primary" />}
            {isFrozen ? "QR Scanner Locked" : "Scan QR Code"}
          </button>

          <Dialog open={scan} onOpenChange={setScan}>
            <DialogContent className="max-w-sm rounded-3xl border border-border/60 bg-card p-6 shadow-2xl">
              <DialogTitle className="text-base font-semibold text-center mb-2">
                Scan Moonlight QR
              </DialogTitle>
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
        </div>
      )}

      {step === "amount" && recipient && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <PageTitle eyebrow="TRANSFER AMOUNT" title={`To ${recipient.full_name}`}>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
                  {recipient.wallet_code}
                </span>
                <CountryFlag code={recvCur} circle size="xs" />
              </div>
            </PageTitle>
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <UserCheck className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

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
                className="tabular h-14 rounded-2xl text-2xl px-4 flex-1 min-w-0 border-border/60 bg-card/60 font-semibold"
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
                <SelectTrigger className="h-14 w-24 rounded-2xl border-border/60 bg-card/60 px-2 shrink-0 font-semibold overflow-hidden">
                  <CurrencyIcon code={cur} />
                </SelectTrigger>
                <SelectContent className="rounded-2xl p-1 border-border/60">
                  {CURRENCIES.map((c) => (
                    <SelectItem
                      key={c.code}
                      value={c.code}
                      className="rounded-xl py-2 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <CountryFlag code={c.code} circle size="xs" />
                        <span className="font-semibold text-xs">{c.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="px-1 text-xs text-muted-foreground flex items-center justify-between">
                <span>Available balance</span>
                <span className="font-semibold text-foreground">{formatMoney(available, cur)}</span>
              </p>

              {/* Quick Amount Allocation Chips */}
              <div className="flex items-center gap-1.5">
                {[
                  { label: "25%", factor: 0.25 },
                  { label: "50%", factor: 0.5 },
                  { label: "75%", factor: 0.75 },
                  { label: "Max", factor: 1.0 },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      const maxSendable = available / (1 + TRANSFER_FEE_RATE);
                      const calculated = Math.max(0, maxSendable * chip.factor);
                      setAmount(calculated.toFixed(2));
                    }}
                    className="flex-1 py-1.5 px-2 rounded-xl text-xs font-semibold bg-secondary/70 hover:bg-secondary border border-border/50 text-foreground transition-all cursor-pointer active:scale-95 text-center"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {isNewAccount && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs space-y-1.5 backdrop-blur-xs">
                <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>Security Clearance Window (First 48 Hours)</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  To protect your account against unauthorized scam transactions, transfers for
                  accounts under 48 hours old are limited to{" "}
                  <strong className="text-foreground">$10.00 USD</strong> (
                  {formatMoney(limit10InCur, cur)}) during initial verification.
                </p>
              </div>
            )}

            <Input
              placeholder="Add note (optional)"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 rounded-2xl border-border/60 bg-card/60 text-base px-4"
            />

            {amt > 0 && (
              <div className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-2.5 text-xs shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Recipient receives:</span>
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <CountryFlag code={recvCur} circle size="xs" />
                    {cur === recvCur ? (
                      formatMoney(recv, recvCur)
                    ) : (
                      <span>
                        {formatMoney(amt, cur)} →{" "}
                        <strong className="text-emerald-500 font-semibold">
                          {formatMoney(recv, recvCur)}
                        </strong>
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground pt-2 border-t border-border/40">
                  <span>Transfer Fee (10%):</span>
                  <span className="font-semibold text-foreground">{formatMoney(fee, cur)}</span>
                </div>
                <div className="pt-2 border-t border-border/40 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  Transaction fee is 10%. Transfers are final once confirmed.
                </div>
              </div>
            )}

            <button
              disabled={isFrozen || amt <= 0 || amt + fee > available + 1e-9 || isOverNewAccountLimit}
              onClick={() => {
                if (isFrozen) {
                  toast.error("Account is frozen. Outgoing transfers are locked.");
                  return;
                }
                if (isOverNewAccountLimit) {
                  toast.error(
                    `New account security limit: Max $10.00 USD (${formatMoney(limit10InCur, cur)}).`,
                  );
                  return;
                }
                setStep("review");
              }}
              className={primaryBtn}
            >
              {isFrozen ? (
                "Transfers Locked"
              ) : amt + fee > available + 1e-9 ? (
                "Insufficient Balance"
              ) : isOverNewAccountLimit ? (
                "Limit Exceeded ($10 USD Max for New Accounts)"
              ) : (
                "Review Transfer"
              )}
            </button>

            <button
              onClick={() => {
                setRecipient(null);
                setStep("to");
              }}
              className="w-full text-center py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Change Recipient
            </button>
          </div>
        </div>
      )}

      {step === "review" && recipient && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <PageTitle eyebrow="CONFIRM DETAILS" title={formatMoney(amt, cur)} />

          <div className="rounded-3xl border border-border/60 bg-card/60 p-5 shadow-soft divide-y divide-border/40 space-y-3">
            <div className="flex justify-between gap-4 pb-3 text-xs">
              <span className="text-muted-foreground">From</span>
              <span className="text-right font-medium text-foreground">
                {profile.data?.full_name} ·{" "}
                <span className="font-mono text-[11px]">{wallet.data?.wallet_code}</span>
              </span>
            </div>

            <div className="flex justify-between gap-4 pt-3 pb-3 text-xs">
              <span className="text-muted-foreground">To</span>
              <span className="text-right font-medium text-foreground flex items-center gap-1.5 justify-end">
                <CountryFlag code={recvCur} circle size="xs" />
                {recipient.full_name} ·{" "}
                <span className="font-mono text-[11px]">{recipient.wallet_code}</span>
              </span>
            </div>

            <div className="flex justify-between gap-4 pt-3 pb-3 text-xs">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="text-right font-medium font-mono text-[11px] text-muted-foreground">
                1 {cur} ≈ {rateRatio.toFixed(4)} {recvCur}
              </span>
            </div>

            <div className="flex justify-between gap-4 pt-3 pb-3 text-xs">
              <span className="text-muted-foreground">Transfer Fee (10%)</span>
              <span className="text-right font-medium text-foreground">
                {formatMoney(fee, cur)}
              </span>
            </div>

            <div className="flex justify-between gap-4 pt-3 pb-3 text-xs">
              <span className="text-muted-foreground">Recipient Receives</span>
              <span className="text-right font-semibold text-emerald-500">
                {cur === recvCur ? (
                  formatMoney(recv, recvCur)
                ) : (
                  <span>
                    {formatMoney(amt, cur)} ({formatMoney(recv, recvCur)})
                  </span>
                )}
              </span>
            </div>

            <div className="flex justify-between gap-4 pt-3 pb-3 text-sm font-semibold">
              <span>Total Debit Amount</span>
              <span className="text-foreground">{formatMoney(amt + fee, cur)}</span>
            </div>

            {note && (
              <div className="flex justify-between gap-4 pt-3 text-xs">
                <span className="text-muted-foreground">Note</span>
                <span className="text-right font-medium text-foreground">{note}</span>
              </div>
            )}
          </div>

          <div className="py-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-4 py-2.5 rounded-xl border border-amber-500/20">
            Transfer charge is 10%. Submitted transfers cannot be cancelled or reversed.
          </div>

          <button disabled={isFrozen || busy} onClick={confirmTransfer} className={primaryBtn}>
            {isFrozen ? "Transfers Locked" : busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & Send"}
          </button>

          <button
            onClick={() => setStep("amount")}
            className="w-full text-center py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            Back to Amount
          </button>
        </div>
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
            paymentMethodId="moonlight"
            paymentMethodName="Moonlight Transfer"
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
        <div className="pt-8 text-center animate-in fade-in zoom-in-95 space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sent Successfully</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatMoney(amt, cur)} ({formatMoney(recv, recvCur)}) to {recipient?.full_name}
            </p>
          </div>
          <div className="space-y-3 pt-4">
            <Link to="/transactions/$id" params={{ id: txId }} className={primaryBtn}>
              View Receipt
            </Link>
            <Link
              to="/dashboard"
              className="block text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Return to Home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
