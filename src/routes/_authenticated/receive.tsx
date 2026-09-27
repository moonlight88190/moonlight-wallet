import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share, QrCode, Check } from "lucide-react";
import { toast } from "sonner";
import { useProfile, useWallet } from "@/hooks/use-wallet";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageTitle } from "@/components/AppShell";

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
      try { await navigator.share({ title: "My Moonlight ID", text }); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Share message copied");
    }
  }

  return (
    <div className="mx-auto max-w-md text-center">
      <PageTitle eyebrow="RECEIVE" title="Receive money">Anyone on Moonlight can pay you with this ID or QR code.</PageTitle>
      <div className="rounded-[2rem] border bg-card p-10 shadow-soft">
        {wallet.isLoading ? (
          <Skeleton className="mx-auto h-52 w-52 rounded-2xl" />
        ) : (
          <div className="mx-auto w-fit rounded-2xl bg-[oklch(1_0_0)] p-4">
            <QRCodeSVG value={qrPayload(code)} size={200} fgColor="#1b2b45" level="M" />
          </div>
        )}
        <p className="mt-8 text-xs font-medium tracking-[0.25em] text-muted-foreground">YOUR MOONLIGHT ID</p>
        <p className="mt-2 font-mono text-2xl font-medium tracking-wider">{code || "—"}</p>
        {profile.data && <p className="mt-1 text-sm text-muted-foreground">{profile.data.full_name}</p>}
      </div>
      <div className="mt-8 grid grid-cols-3 gap-3">
        {[
          { label: copied ? "Copied" : "Copy ID", icon: copied ? Check : Copy, onClick: copy },
          { label: "Share", icon: Share, onClick: share },
          { label: "Show QR", icon: QrCode, onClick: () => setBig(true) },
        ].map((b) => (
          <button key={b.label} onClick={b.onClick} disabled={!code} className="flex flex-col items-center gap-2 rounded-2xl border bg-card py-4 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50">
            <b.icon className="h-5 w-5" strokeWidth={1.5} />
            {b.label}
          </button>
        ))}
      </div>
      <Dialog open={big} onOpenChange={setBig}>
        <DialogContent className="max-w-sm rounded-3xl text-center">
          <DialogTitle className="text-center">{code}</DialogTitle>
          <div className="mx-auto mt-2 w-fit rounded-2xl bg-[oklch(1_0_0)] p-5">
            <QRCodeSVG value={qrPayload(code)} size={260} fgColor="#1b2b45" level="M" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
