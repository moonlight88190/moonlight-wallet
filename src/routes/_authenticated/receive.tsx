import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Copy,
  Share,
  QrCode,
  Check,
  ShieldCheck,
  Globe,
  Smartphone,
  Wallet,
} from "lucide-react";
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
        content: "Receive funds via UPI QR, instant bank clearing, or your Moonlight Wallet ID.",
      },
      { property: "og:title", content: "Receive Money — Moonlight Wallet" },
      { property: "og:description", content: "Instant receive channels and account QR." },
    ],
  }),
  component: Receive,
});

function Receive() {
  const wallet = useWallet();
  const profile = useProfile();
  const geography = useAccountGeography();

  const [copiedType, setCopiedType] = useState<"upi" | "wallet" | null>(null);
  const [big, setBig] = useState(false);

  const code = wallet.data?.wallet_code ?? "";
  const payeeName = profile.data?.full_name?.trim() || "Moonlight Customer";

  const isIndianAccount = Boolean(
    geography.data?.isIndia || geography.data?.capabilities?.supportsUPI,
  );

  // Default active tab: UPI QR for Indian accounts, Wallet ID for other accounts
  const [activeTab, setActiveTab] = useState<"upi" | "wallet">("upi");

  // Format valid, compliant UPI VPA from legitimate user wallet identifier
  const cleanCode = (code || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const upiVpa = cleanCode ? `${cleanCode}@moonlight` : "";

  // NPCI-compliant UPI deep link payload for QR code
  const upiQrPayload = upiVpa
    ? `upi://pay?pa=${encodeURIComponent(upiVpa)}&pn=${encodeURIComponent(payeeName)}&cu=INR&tn=${encodeURIComponent("Transfer via Moonlight")}`
    : "";

  // Standard Moonlight wallet peer-to-peer payload
  const walletQrPayload = code ? `moonlight:${code}` : "";

  // Selected payload based on account geography and active tab
  const isViewingUpi = isIndianAccount && activeTab === "upi";
  const activeQrPayload = isViewingUpi ? upiQrPayload : walletQrPayload;

  async function copyUpi() {
    if (!upiVpa) return;
    await navigator.clipboard.writeText(upiVpa);
    setCopiedType("upi");
    toast.success("UPI ID copied to clipboard");
    setTimeout(() => setCopiedType(null), 2000);
  }

  async function copyWalletCode() {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopiedType("wallet");
    toast.success("Moonlight Wallet ID copied to clipboard");
    setTimeout(() => setCopiedType(null), 2000);
  }

  async function share() {
    if (!code) return;
    const text = isViewingUpi && upiVpa
      ? `Pay me via UPI: ${upiVpa} (${payeeName}) on Moonlight Wallet.`
      : `Send me money on Moonlight Wallet. My ID: ${code} (${payeeName}).`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isViewingUpi ? "My Moonlight UPI ID" : "My Moonlight Wallet ID",
          text,
        });
      } catch {
        /* user dismissed share sheet */
      }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Payment details copied for sharing");
    }
  }

  return (
    <div className="mx-auto max-w-md text-center space-y-5 sm:space-y-6 animate-fade-up">
      <PageTitle eyebrow="RECEIVE" title="Receive Funds">
        {isIndianAccount
          ? "Receive instant transfers via official UPI QR or your Moonlight Wallet ID."
          : "Receive instant transfers from other Moonlight users or supported regional payout rails."}
      </PageTitle>

      {/* ─── Mode Selector for Indian Accounts ─── */}
      {isIndianAccount && (
        <div className="flex rounded-2xl border border-border/40 bg-card p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("upi")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer touch-manipulation ${
              activeTab === "upi"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>UPI QR (Scan & Pay)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer touch-manipulation ${
              activeTab === "wallet"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            <span>Moonlight ID</span>
          </button>
        </div>
      )}

      {/* ─── Identity & QR Card ─── */}
      <div className="rounded-2xl border border-border/40 bg-card p-5 sm:p-7 shadow-card space-y-5">
        {/* Region & Capability Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border/30 bg-secondary/50 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
          {geography.data?.isIndia || geography.data?.isEurope ? (
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
          ) : (
            <Globe className="h-3 w-3 text-primary" />
          )}
          <span>{getAccountRegionLabel(geography.data)}</span>
        </div>

        {/* QR Code Container */}
        {wallet.isLoading ? (
          <Skeleton className="mx-auto h-52 w-52 rounded-2xl" />
        ) : (
          <div className="mx-auto w-fit rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-border/10 flex flex-col items-center gap-3">
            {/* Header Badge inside QR card */}
            {isViewingUpi ? (
              <div className="flex items-center gap-2">
                <img
                  src="/assets/payment-methods/upi.svg"
                  alt="NPCI UPI"
                  className="h-5 w-auto object-contain"
                />
                <span className="text-[11px] font-bold tracking-tight text-slate-800">
                  Unified Payments Interface
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <img
                  src="/assets/brand/moonlight-emblem.png"
                  alt="Moonlight"
                  className="h-4 w-4 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = "none";
                  }}
                />
                <span className="text-[11px] font-semibold tracking-wide text-slate-800 uppercase">
                  Moonlight Wallet
                </span>
              </div>
            )}

            <QRCodeSVG
              value={activeQrPayload || "moonlight:pending"}
              size={180}
              className="w-[180px] h-[180px] sm:w-[200px] sm:h-[200px]"
              fgColor="#0f172a"
              level="M"
            />

            <p className="text-[10px] font-medium text-slate-500">
              {isViewingUpi
                ? "Scan with Google Pay, PhonePe, Paytm or any UPI app"
                : "Scan with Moonlight camera to transfer instantly"}
            </p>
          </div>
        )}

        {/* Primary Identifier Display */}
        <div className="space-y-1">
          {isViewingUpi ? (
            <>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Virtual Payment Address (VPA)
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="font-mono text-[18px] sm:text-[22px] font-bold text-foreground">
                  {upiVpa || "—"}
                </span>
                {upiVpa && (
                  <button
                    type="button"
                    onClick={copyUpi}
                    aria-label="Copy UPI ID"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    {copiedType === "upi" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-[12px] font-medium text-muted-foreground">
                Payee: <span className="text-foreground font-semibold">{payeeName}</span>
              </p>
              <p className="text-[11px] text-muted-foreground/75 font-mono pt-0.5">
                Account ID: {code}
              </p>
            </>
          ) : (
            <>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Your Moonlight Wallet ID
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="font-mono text-[20px] sm:text-[24px] font-bold tracking-wider text-foreground">
                  {code || "—"}
                </span>
                {code && (
                  <button
                    type="button"
                    onClick={copyWalletCode}
                    aria-label="Copy Wallet ID"
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    {copiedType === "wallet" ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <p className="text-[12px] font-medium text-muted-foreground">
                Account Name: <span className="text-foreground font-semibold">{payeeName}</span>
              </p>
            </>
          )}
        </div>

        {/* ─── Compatible Clearing Infrastructure by Geography ─── */}
        {isIndianAccount ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Indian Clearing Rails
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
              Direct routing via NPCI Unified Payments Interface and IMPS domestic interbank rails.
            </p>
          </div>
        ) : geography.data?.isEurope || geography.data?.capabilities?.supportsSEPA ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported European Clearing Rails
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
              Euro clearing via Single Euro Payments Area (SEPA Credit Transfer).
            </p>
          </div>
        ) : geography.data?.isUK || geography.data?.capabilities?.supportsFasterPayments ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported UK Clearing Rails
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
              Settlement via the UK Faster Payments Service and interbank network.
            </p>
          </div>
        ) : geography.data?.capabilities?.supportsGCash ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Domestic Clearing Rails
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="gcash" size="sm" />
              <PaymentMethodIcon id="ph-bank" size="sm" />
              <PaymentMethodIcon id="int-bank" size="sm" />
            </div>
          </div>
        ) : geography.data?.capabilities?.supportsPix ? (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                Supported Domestic Clearing Rails
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="pix" size="sm" />
              <PaymentMethodIcon id="int-bank" size="sm" />
            </div>
          </div>
        ) : (
          <div className="border-t border-border/30 pt-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold text-muted-foreground tracking-[0.1em] uppercase">
                International Payout Rails
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <PaymentMethodIcon id="int-bank" size="sm" />
            </div>
          </div>
        )}
      </div>

      {/* ─── Action Buttons (No Duplicates) ─── */}
      <div className={`grid ${isIndianAccount ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"} gap-2.5`}>
        {isIndianAccount && (
          <button
            type="button"
            onClick={copyUpi}
            disabled={!upiVpa}
            className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/40 bg-card min-h-[56px] py-3 px-2 text-[11px] font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.97] shadow-card disabled:opacity-40 cursor-pointer touch-manipulation ${
              copiedType === "upi"
                ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                : ""
            }`}
          >
            {copiedType === "upi" ? (
              <Check className="h-[18px] w-[18px] text-emerald-500 scale-110 transition-transform" />
            ) : (
              <Copy className="h-[18px] w-[18px]" strokeWidth={1.6} />
            )}
            <span>{copiedType === "upi" ? "Copied UPI!" : "Copy UPI ID"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={copyWalletCode}
          disabled={!code}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/40 bg-card min-h-[56px] py-3 px-2 text-[11px] font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.97] shadow-card disabled:opacity-40 cursor-pointer touch-manipulation ${
            copiedType === "wallet"
              ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : ""
          }`}
        >
          {copiedType === "wallet" ? (
            <Check className="h-[18px] w-[18px] text-emerald-500 scale-110 transition-transform" />
          ) : (
            <Copy className="h-[18px] w-[18px]" strokeWidth={1.6} />
          )}
          <span>{copiedType === "wallet" ? "Copied ID!" : "Copy Wallet ID"}</span>
        </button>

        <button
          type="button"
          onClick={share}
          disabled={!code}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/40 bg-card min-h-[56px] py-3 px-2 text-[11px] font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.97] shadow-card disabled:opacity-40 cursor-pointer touch-manipulation"
        >
          <Share className="h-[18px] w-[18px]" strokeWidth={1.6} />
          <span>Share</span>
        </button>

        <button
          type="button"
          onClick={() => setBig(true)}
          disabled={!code}
          className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-border/40 bg-card min-h-[56px] py-3 px-2 text-[11px] font-semibold transition-all hover:bg-accent hover:border-border active:scale-[0.97] shadow-card disabled:opacity-40 cursor-pointer touch-manipulation"
        >
          <QrCode className="h-[18px] w-[18px]" strokeWidth={1.6} />
          <span>Full Screen</span>
        </button>
      </div>

      {/* ─── Full-Screen QR Dialog ─── */}
      <Dialog open={big} onOpenChange={setBig}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm rounded-2xl text-center p-5 sm:p-6">
          <DialogTitle className="text-center font-mono text-[14px] font-semibold">
            {isViewingUpi ? upiVpa : code}
          </DialogTitle>
          <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-border/10 flex flex-col items-center gap-3">
            {isViewingUpi ? (
              <img
                src="/assets/payment-methods/upi.svg"
                alt="UPI"
                className="h-6 w-auto object-contain"
              />
            ) : (
              <img
                src="/assets/brand/moonlight-emblem.png"
                alt="Moonlight"
                className="h-5 w-5 object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            )}
            <QRCodeSVG
              value={activeQrPayload || "moonlight:pending"}
              size={220}
              className="w-[220px] h-[220px] sm:w-[250px] sm:h-[250px]"
              fgColor="#0f172a"
              level="M"
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            {isViewingUpi
              ? "Scan with Google Pay, PhonePe, Paytm, BHIM, or any UPI app to pay"
              : "Scan with Moonlight camera to transfer funds instantly"}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
