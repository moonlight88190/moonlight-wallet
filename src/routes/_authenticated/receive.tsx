import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share, QrCode, Check, ShieldCheck, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  useProfile,
  useWallet,
  useAccountGeography,
  getAccountRegionLabel,
} from "@/hooks/use-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageTitle } from "@/components/AppShell";
import { PaymentMethodIcon, BrandAsset } from "@/components/AssetComponents";

export const Route = createFileRoute("/_authenticated/receive")({
  head: () => ({
    meta: [
      { title: "Receive Money — Moonlight Wallet" },
      {
        name: "description",
        content: "Share your Moonlight ID or QR code to receive money.",
      },
      { property: "og:title", content: "Receive Money — Moonlight Wallet" },
      { property: "og:description", content: "Share your Moonlight ID or QR code." },
    ],
  }),
  component: Receive,
});

const qrPayload = (code: string) => `moonlight:${code}`;

/**
 * Renders the wallet ID and Moonlight QR code with copy, share, and enlarged QR actions.
 * Displays payment methods based on the account geography and capabilities.
 */
function Receive() {
  const wallet = useWallet();
  const profile = useProfile();
  const geography = useAccountGeography();
  const [copied, setCopied] = useState(false);
  const [big, setBig] = useState(false);
  const code = wallet.data?.wallet_code ?? "";

  const isIndianAccount = Boolean(
    geography.data?.isIndia || geography.data?.capabilities?.supportsUPI,
  );

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
    <div className="mx-auto max-w-md text-center space-y-5 sm:space-y-6 animate-fade-up">
      <PageTitle eyebrow="RECEIVE" title="Receive Money">
        Anyone on Moonlight or supported payout rails can send money using this ID or QR code.
      </PageTitle>

      {/* ─── Identity Card ─── */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 sm:p-7 shadow-card space-y-5">
        {/* Region Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-secondary/50 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
          {geography.data?.isIndia || geography.data?.isEurope ? (
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
          ) : (
            <Globe className="h-3 w-3 text-primary" />
          )}
          <span>{getAccountRegionLabel(geography.data)}</span>
        </div>

        {/* QR Code */}
        {wallet.isLoading ? (
          <Skeleton className="mx-auto h-44 w-44 sm:h-52 sm:w-52 rounded-2xl" />
        ) : (
          <div className="mx-auto w-fit rounded-2xl bg-white p-4 shadow-sm border border-border/10">
            <QRCodeSVG
              value={qrPayload(code)}
              size={180}
              className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]"
              fgColor="#0f172a"
              level="M"
            />
          </div>
        )}

        {/* Wallet ID */}
        <div>
          <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
            Your Moonlight Wallet ID
          </p>
          <p className="mt-1.5 font-mono text-[20px] sm:text-[24px] font-semibold tracking-wider text-foreground">
            {code || "—"}
          </p>
          {profile.data && (
            <p className="mt-1 text-[12px] font-medium text-muted-foreground">
              {profile.data.full_name}
            </p>
          )}
        </div>

        {/* ─── Supported Withdrawals (Filtered by Account Geography) ─── */}
        {isIndianAccount ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Withdrawals
              </p>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Zero Surcharge
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="upi" size="sm" />
              <BrandAsset id="google-pay" size="sm" />
              <BrandAsset id="phonepe" size="sm" />
              <BrandAsset id="paytm" size="sm" />
              <BrandAsset id="bhim" size="sm" />
              <PaymentMethodIcon id="in-bank" size="sm" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Direct balance withdrawals supported via UPI, mobile payment apps, and IMPS domestic interbank rails.
            </p>
          </div>
        ) : geography.data?.isEurope || geography.data?.capabilities?.supportsSEPA ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Withdrawals
              </p>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                SEPA Network
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="sepa" size="sm" />
              {geography.data?.countryCode === "CZ" && (
                <PaymentMethodIcon id="cz-bank" size="sm" />
              )}
              <PaymentMethodIcon id="int-bank" size="sm" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Direct balance withdrawals supported via Single Euro Payments Area (SEPA Credit Transfer).
            </p>
          </div>
        ) : geography.data?.isUK || geography.data?.capabilities?.supportsFasterPayments ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Withdrawals
              </p>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Faster Payments
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="faster-payments" size="sm" />
              <PaymentMethodIcon id="int-bank" size="sm" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Direct balance withdrawals supported via the UK Faster Payments Service and interbank network.
            </p>
          </div>
        ) : geography.data?.capabilities?.supportsGCash ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Withdrawals
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="gcash" size="sm" />
              <PaymentMethodIcon id="ph-bank" size="sm" />
              <PaymentMethodIcon id="int-bank" size="sm" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Direct balance withdrawals supported via GCash and Philippine interbank rails.
            </p>
          </div>
        ) : geography.data?.capabilities?.supportsPix ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Withdrawals
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="pix" size="sm" />
              <PaymentMethodIcon id="int-bank" size="sm" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Direct balance withdrawals supported via Pix instant settlement.
            </p>
          </div>
        ) : (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Withdrawals
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="int-bank" size="sm" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Direct balance withdrawals supported via international wire and SWIFT transfer.
            </p>
          </div>
        )}
      </div>

      {/* ─── Action Buttons (Clean 3-column grid, no duplicate buttons) ─── */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          {
            label: copied ? "Copied!" : "Copy ID",
            icon: copied ? Check : Copy,
            onClick: copy,
            isCopied: copied,
          },
          { label: "Share", icon: Share, onClick: share },
          { label: "Show QR", icon: QrCode, onClick: () => setBig(true) },
        ].map((b) => (
          <button
            key={b.label}
            onClick={b.onClick}
            disabled={!code}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/40 bg-card min-h-[56px] py-3 text-[11px] font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.97] shadow-card disabled:opacity-40 cursor-pointer touch-manipulation ${
              b.isCopied
                ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : ""
            }`}
          >
            <b.icon
              className={`h-[18px] w-[18px] transition-transform ${b.isCopied ? "scale-110 text-emerald-500" : ""}`}
              strokeWidth={1.6}
            />
            {b.label}
          </button>
        ))}
      </div>

      {/* ─── Full-Screen QR Dialog ─── */}
      <Dialog open={big} onOpenChange={setBig}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-2xl text-center p-5 sm:p-6">
          <DialogTitle className="text-center font-mono text-[14px] font-semibold">
            {code}
          </DialogTitle>
          <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-border/10">
            <QRCodeSVG
              value={qrPayload(code)}
              size={220}
              className="w-[220px] h-[220px] sm:w-[250px] sm:h-[250px]"
              fgColor="#0f172a"
              level="M"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Scan with Moonlight mobile camera or QR reader
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
