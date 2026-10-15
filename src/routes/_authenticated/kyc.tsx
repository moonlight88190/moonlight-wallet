import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Camera,
  FileText,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
  KeyRound,
  Mail,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useKyc } from "@/hooks/use-kyc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/kyc")({
  head: () => ({
    meta: [
      { title: "Complete KYC — Moonlight Wallet" },
      { name: "description", content: "Verify your identity with a photo and an ID document." },
      { property: "og:title", content: "Complete KYC — Moonlight Wallet" },
      { property: "og:description", content: "Verify your identity with a photo and an ID document." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KycPage,
});

const DOCS = [
  { id: "aadhaar", label: "Aadhaar" },
  { id: "pan", label: "PAN Card" },
  { id: "driving_license", label: "Driving Licence" },
  { id: "school_id", label: "School ID" },
  { id: "college_id", label: "College ID" },
  { id: "library_id", label: "Library ID" },
] as const;

const MAX = 10 * 1024 * 1024;

function usePreview(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return setUrl(null);
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  return url;
}

function KycPage() {
  const qc = useQueryClient();
  const { data: kyc, isLoading } = useKyc();
  const [selfie, setSelfie] = useState<File | null>(null);
  const [doc, setDoc] = useState<File | null>(null);
  const [docType, setDocType] = useState<(typeof DOCS)[number]["id"]>("aadhaar");
  const [busy, setBusy] = useState(false);
  const [keyInput, setKeyInput] = useState("");
  const [keySubmitted, setKeySubmitted] = useState(() => {
    return typeof window !== "undefined" && Boolean(localStorage.getItem("keybox_kyc_key"));
  });
  const selfieUrl = usePreview(selfie);
  const docUrl = usePreview(doc);

  const pick = (set: (f: File | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (f && (!f.type.startsWith("image/") || f.size > MAX)) {
      toast.error("Please choose an image under 10 MB.");
      return;
    }
    set(f);
  };

  async function submit() {
    if (!selfie || !doc) return;
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const stamp = Date.now();
      const ext = (f: File) => (f.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
      const sp = `${u.user.id}/${stamp}-selfie.${ext(selfie)}`;
      const dp = `${u.user.id}/${stamp}-${docType}.${ext(doc)}`;
      const up1 = await supabase.storage.from("kyc").upload(sp, selfie, { contentType: selfie.type });
      if (up1.error) throw up1.error;
      const up2 = await supabase.storage.from("kyc").upload(dp, doc, { contentType: doc.type });
      if (up2.error) throw up2.error;
      const { error } = await supabase
        .from("kyc_submissions")
        .insert({ user_id: u.user.id, selfie_path: sp, doc_path: dp, doc_type: docType });
      if (error) throw error;
      toast.success("KYC submitted for review");
      qc.invalidateQueries({ queryKey: ["kyc"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  const status = kyc?.status;

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-8 animate-fade-up">
      <div className="flex items-center gap-2">
        <Link to="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-accent" aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Complete KYC</h1>
      </div>

      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      ) : status === "approved" ? (
        <div className="space-y-4">
          {/* Identity Verified Badge Card */}
          <div className="rounded-3xl border border-success/30 bg-success/5 p-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <p className="text-lg font-semibold text-foreground">KYC Identity Verified</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Your identity documents have been approved by Moonlight Compliance.
            </p>
          </div>

          {/* KeyBox Verification Action Section */}
          <div className="rounded-3xl border-2 border-primary/30 bg-gradient-to-b from-primary/10 via-card to-card p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <KeyRound className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-foreground">Add KeyBox Verification Key</h2>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                    Release Security Step
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Now that your KYC is successful, enter the security verification key provided by the sender. Verification will be processed by our compliance team and you will receive verification confirmation directly in your registered email.
                </p>
              </div>
            </div>

            {/* Email Notice Card */}
            <div className="rounded-2xl border border-border/80 bg-secondary/50 p-3.5 flex items-start gap-2.5 text-xs">
              <Mail className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold text-foreground">
                  Verification Confirmation Via Email
                </span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Once your key is submitted, key verification starts immediately. You will receive official verification confirmation and payout release notifications in your registered mail at the earliest.
                </p>
              </div>
            </div>

            {keySubmitted ? (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Key Submitted · Verification In Progress</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Received
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your verification key has been submitted to Moonlight Compliance. Verification is underway and you will receive confirmation in your registered email at the earliest.
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setKeySubmitted(false)}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    Change or re-enter key
                  </button>
                  <Link
                    to="/transactions"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    View Withdrawal Activity &rarr;
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    KeyBox Security Key
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="Enter verification key (e.g. 5-digit key)"
                      className="h-11 font-mono tracking-widest uppercase bg-background text-sm"
                    />
                    <Button
                      type="button"
                      disabled={!keyInput.trim()}
                      onClick={() => {
                        if (!keyInput.trim()) return;
                        localStorage.setItem("keybox_kyc_key", keyInput.trim());
                        setKeySubmitted(true);
                        toast.success(
                          "Verification key submitted! Key verification has started. Confirmation will be sent to your registered email at the earliest.",
                        );
                      }}
                      className="h-11 px-5 rounded-xl font-bold shrink-0"
                    >
                      Submit Key
                    </Button>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  The verification key is provided by the sender. Contact{" "}
                  <a href="mailto:moonlightwealthmanagement@gmail.com" className="text-primary underline">
                    moonlightwealthmanagement@gmail.com
                  </a>{" "}
                  if you need assistance.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : status === "pending" ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center space-y-3">
          <Clock className="mx-auto h-10 w-10 text-gold" />
          <p className="text-lg font-semibold">Under review</p>
          <p className="text-sm text-muted-foreground">
            We're reviewing your photo and document. Once approved, you will be prompted to add your KeyBox key.
          </p>
        </div>
      ) : (
        <>
          {status === "rejected" && (
            <div className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <div>
                <p className="font-semibold">Previous submission rejected</p>
                {kyc?.review_note && <p className="text-muted-foreground">{kyc.review_note}</p>}
              </div>
            </div>
          )}

          <section className="rounded-3xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">1. Live or recent photo</p>
            <p className="text-xs text-muted-foreground">Your face must clearly match the document below.</p>
            <label className={cn("flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-border bg-background", selfieUrl && "border-solid")}>
              {selfieUrl ? (
                <img src={selfieUrl} alt="Your photo" className="max-h-64 w-auto object-contain" />
              ) : (
                <>
                  <Camera className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm">Take or upload photo</span>
                </>
              )}
              <input type="file" accept="image/*" capture="user" className="hidden" onChange={pick(setSelfie)} />
            </label>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">2. ID document</p>
            <div className="grid grid-cols-2 gap-2">
              {DOCS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDocType(d.id)}
                  className={cn(
                    "min-h-[44px] rounded-xl border px-3 text-sm",
                    docType === d.id ? "border-primary bg-primary/10 font-semibold" : "border-border",
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-border bg-background">
              {docUrl ? (
                <img src={docUrl} alt="ID document" className="max-h-64 w-auto object-contain" />
              ) : (
                <>
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm">Upload document photo</span>
                </>
              )}
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={pick(setDoc)} />
            </label>
          </section>

          <Button className="h-12 w-full rounded-2xl" disabled={!selfie || !doc || busy} onClick={submit}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for review"}
          </Button>
        </>
      )}
    </div>
  );
}
