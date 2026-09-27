import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ScanLine, CheckCircle2 } from "lucide-react";
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
      ).catch(() => toast.error("Camera unavailable. Enter the wallet ID instead."));
    });
    return () => {
      done = true;
      scanner?.stop().catch(() => {});
    };
  }, [onResult]);
  return <div id="ml-qr-reader" ref={ref} className="overflow-hidden rounded-2xl" />;
}

function Send() {
  const qc = useQueryClient();
  const profile = useProfile();
  const wallet = useWallet();
  const rates = useRates();
  const [step, setStep] = useState<"to" | "amount" | "review" | "done">("to");
  const [query, setQuery] = useState("");
  const [recipient, setRecipient] = useState<Recipient | null>(null);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [scan, setScan] = useState(false);
  const [txId, setTxId] = useState("");

  const cur = currency || profile.data?.preferred_currency || "USD";
  const r = rates.data?.rates ?? {};
  const amt = Number(amount) || 0;
  const fee = amt * TRANSFER_FEE_RATE;
  const recvCur = recipient?.preferred_currency ?? "USD";
  const recv = convert(amt, cur, recvCur, r);
  const available = Number(wallet.data?.balance_usd ?? 0) * (r[cur] ?? 1);

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

  async function confirm() {
    if (!recipient) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("send_transfer", {
      p_recipient_code: recipient.wallet_code,
      p_amount: amt,
      p_currency: cur,
      ...(note ? { p_note: note } : {}),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTxId(data as string);
    setStep("done");
    qc.invalidateQueries({ queryKey: ["wallet"] });
    qc.invalidateQueries({ queryKey: ["transactions"] });
  }

  const btn =
    "flex h-12 w-full items-center justify-center rounded-full bg-primary text-[15px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50";

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
              className="h-12 rounded-xl"
              maxLength={255}
            />
            <button disabled={busy || !query.trim()} className={btn}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find recipient"}
            </button>
          </form>
          <button
            onClick={() => setScan(true)}
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border bg-card text-[15px] font-medium hover:bg-accent"
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
            <span className="font-mono text-sm">{recipient.wallet_code}</span>
          </PageTitle>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="tabular h-14 rounded-xl text-2xl"
              />
              <Select value={cur} onValueChange={setCurrency}>
                <SelectTrigger className="h-14 w-28 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="px-1 text-xs text-muted-foreground">
              Available {formatMoney(available, cur)}
            </p>
            <Input
              placeholder="Note (optional)"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 rounded-xl"
            />
            {amt > 0 && (
              <p className="px-1 text-sm text-muted-foreground">
                {recipient.full_name.split(" ")[0]} receives{" "}
                <span className="font-medium text-foreground">{formatMoney(recv, recvCur)}</span>
              </p>
            )}
            <button
              disabled={amt <= 0 || amt + fee > available + 1e-9}
              onClick={() => setStep("review")}
              className={btn}
            >
              {amt + fee > available + 1e-9 ? "Insufficient balance" : "Review"}
            </button>
            <button
              onClick={() => {
                setRecipient(null);
                setStep("to");
              }}
              className="w-full py-2 text-sm text-muted-foreground"
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
            {[
              ["From", `${profile.data?.full_name} · ${wallet.data?.wallet_code}`],
              ["To", `${recipient.full_name} · ${recipient.wallet_code}`],
              [
                "Exchange rate",
                `1 ${cur} ≈ ${convert(1, cur, recvCur, r).toLocaleString(undefined, { maximumFractionDigits: 4 })} ${recvCur}`,
              ],
              ["Fee (0.5%)", formatMoney(fee, cur)],
              ["Recipient receives", formatMoney(recv, recvCur)],
              ["Total", formatMoney(amt + fee, cur)],
              ...(note ? [["Note", note]] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-4 text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-right font-medium">{v}</span>
              </div>
            ))}
          </div>
          <button disabled={busy} onClick={confirm} className={`${btn} mt-8`}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm transfer"}
          </button>
          <button
            onClick={() => setStep("amount")}
            className="mt-2 w-full py-2 text-sm text-muted-foreground"
          >
            Back
          </button>
        </>
      )}

      {step === "done" && (
        <div className="pt-10 text-center animate-in fade-in zoom-in-95">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" strokeWidth={1.25} />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Sent</h1>
          <p className="mt-2 text-muted-foreground">
            {formatMoney(amt, cur)} to {recipient?.full_name}
          </p>
          <div className="mt-10 space-y-2">
            <Link to="/transactions/$id" params={{ id: txId }} className={btn}>
              View receipt
            </Link>
            <Link to="/dashboard" className="block py-2 text-sm text-muted-foreground">
              Done
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
