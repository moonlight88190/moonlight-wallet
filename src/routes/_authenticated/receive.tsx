import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share, QrCode, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useProfile, useWallet } from "@/hooks/use-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageTitle } from "@/components/AppShell";
import { CountryFlag, PaymentMethodIcon } from "@/components/AssetComponents";

export const Route = createFileRoute("/_authenticated/receive")({
  head: () => ({
    meta: [
      { title: "Receive money — Moonlight Wallet" },
      { name: "description", content: "Share your Moonlight ID or QR code to receive money." },
      { property: "og:title", content: "Receive money — Moonlight Wallet" },
      { property: "og:description", content: "Share your Moonlight ID or QR code." },
    ],
  }),
  component: Receive,
});

const qrPayload = (code: string) => `moonlight:${code}`;

function Receive() {
  const wallet = useWallet();
  const profile = useProfile();
  const [copied, setCopied] = useState(false);
  const [big, setBig] = useState(false);
  const code = wallet.data?.wallet_code ?? "";

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Wallet ID copied");
    setTimeout(() => setCopied(false), 1600);
  }

  async function share() {
    const text = `Send me money on Moonlight Wallet. My ID: ${code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Moonlight ID", text });
      } catch {
        /* dismissed */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Share message copied");
    }
  }

  return (
    <div className="mx-auto max-w-md text-center space-y-8">
      <PageTitle eyebrow="RECEIVE" title="Receive Money">
        Anyone on Moonlight or supported payout rails can send money using this ID or QR.
      </PageTitle>

      <div className="rounded-[2.5rem] border bg-card/80 p-8 shadow-soft space-y-6">
        {wallet.isLoading ? (
          <Skeleton className="mx-auto h-52 w-52 rounded-2xl" />
        ) : (
          <div className="mx-auto w-fit rounded-2xl bg-[oklch(1_0_0)] p-4 shadow-sm border border-border/20">
            <QRCodeSVG value={qrPayload(code)} size={200} fgColor="#1b2b45" level="M" />
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            YOUR MOONLIGHT WALLET ID
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tracking-wider text-foreground">
            {code || "—"}
          </p>
          {profile.data && (
            <p className="mt-1 text-sm font-medium text-muted-foreground">
              {profile.data.full_name}
            </p>
          )}
        </div>

        {/* Supported Corridor Badges */}
        <div className="border-t pt-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
            Compatible Payout Infrastructure
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <PaymentMethodIcon id="sepa" size="sm" />
            <PaymentMethodIcon id="upi-qr" size="sm" />
            <PaymentMethodIcon id="gcash" size="sm" />
            <PaymentMethodIcon id="cz-bank" size="sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: copied ? "Copied" : "Copy ID", icon: copied ? Check : Copy, onClick: copy },
          { label: "Share", icon: Share, onClick: share },
          { label: "Show QR", icon: QrCode, onClick: () => setBig(true) },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.onClick}
            disabled={!code}
            className="flex flex-col items-center gap-2 rounded-2xl border bg-card py-4 text-xs font-semibold transition-all hover:bg-accent hover:border-primary/30 shadow-xs disabled:opacity-50"
          >
            <b.icon className="h-5 w-5" strokeWidth={1.5} />
            {b.label}
          </button>
        ))}
      </div>

      <Dialog open={big} onOpenChange={setBig}>
        <DialogContent className="max-w-sm rounded-3xl text-center p-6">
          <DialogTitle className="text-center font-mono">{code}</DialogTitle>
          <div className="mx-auto mt-2 w-fit rounded-2xl bg-[oklch(1_0_0)] p-5">
            <QRCodeSVG value={qrPayload(code)} size={260} fgColor="#1b2b45" level="M" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Scan with Moonlight mobile camera or QR reader
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
