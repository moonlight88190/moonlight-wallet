import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share, QrCode, Check, ShieldCheck, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useWallet,
  getAccountStatusLabel,
  isEuropeanVerified,
} from "@/hooks/use-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageTitle } from "@/components/AppShell";
import { PaymentMethodIcon } from "@/components/AssetComponents";

export const Route = createFileRoute("/_authenticated/receive")({
  head: () => ({
    meta: [
      { title: "Receive Money — Moonlight Wallet" },
      {
        name: "description",
        content: "Share your Moonlight ID or QR code to receive money globally.",
      },
      { property: "og:title", content: "Receive Money — Moonlight Wallet" },
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
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Wallet ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (!code) return;
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
    <div className="mx-auto max-w-md text-center space-y-6 sm:space-y-8">
      <PageTitle eyebrow="RECEIVE" title="Receive Money">
        Anyone on Moonlight or supported payout rails can send money using this ID or QR.
      </PageTitle>

      <div className="rounded-3xl sm:rounded-[2.5rem] border border-border/60 bg-card/80 p-5 sm:p-8 shadow-soft space-y-5 sm:space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/80 px-3 py-1 text-xs font-semibold text-muted-foreground">
          {isEuropeanVerified(profile.data?.email) ? (
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Globe className="h-3.5 w-3.5 text-blue-500" />
          )}
          <span>{getAccountStatusLabel(profile.data?.email)}</span>
        </div>

        {wallet.isLoading ? (
          <Skeleton className="mx-auto h-44 w-44 sm:h-52 sm:w-52 rounded-2xl" />
        ) : (
          <div className="mx-auto w-fit rounded-2xl bg-white p-3.5 sm:p-4 shadow-sm border border-border/20">
            <QRCodeSVG
              value={qrPayload(code)}
              size={180}
              className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]"
              fgColor="#1b2b45"
              level="M"
            />
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            YOUR MOONLIGHT WALLET ID
          </p>
          <p className="mt-1 font-mono text-xl sm:text-2xl font-semibold tracking-wider text-foreground">
            {code || "—"}
          </p>
          {profile.data && (
            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
              {profile.data.full_name}
            </p>
          )}
        </div>

        {/* Supported Corridor Badges */}
        <div className="border-t border-border/50 pt-4 space-y-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase">
            Compatible Payout Infrastructure
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <PaymentMethodIcon id="sepa" size="sm" />
            <PaymentMethodIcon id="faster-payments" size="sm" />
            <PaymentMethodIcon id="upi-qr" size="sm" />
            <PaymentMethodIcon id="gcash" size="sm" />
            <PaymentMethodIcon id="paynow" size="sm" />
            <PaymentMethodIcon id="pix" size="sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {[
          { label: copied ? "Copied!" : "Copy ID", icon: copied ? Check : Copy, onClick: copy },
          { label: "Share", icon: Share, onClick: share },
          { label: "Show QR", icon: QrCode, onClick: () => setBig(true) },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.onClick}
            disabled={!code}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card py-3.5 sm:py-4 text-xs font-semibold transition-all hover:bg-accent hover:border-primary/40 active:scale-[0.97] shadow-2xs disabled:opacity-50 cursor-pointer touch-manipulation"
          >
            <b.icon className="h-5 w-5" strokeWidth={1.75} />
            {b.label}
          </button>
        ))}
      </div>

      <Dialog open={big} onOpenChange={setBig}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-3xl text-center p-5 sm:p-6">
          <DialogTitle className="text-center font-mono text-base">{code}</DialogTitle>
          <div className="mx-auto mt-2 w-fit rounded-2xl bg-white p-4 sm:p-5">
            <QRCodeSVG
              value={qrPayload(code)}
              size={220}
              className="w-[220px] h-[220px] sm:w-[250px] sm:h-[250px]"
              fgColor="#1b2b45"
              level="M"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Scan with Moonlight mobile camera or QR reader
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
