import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Camera, FileText, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useKyc } from "@/hooks/use-kyc";
import { Button } from "@/components/ui/button";
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
      ) : status === "approved" || status === "pending" ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-center space-y-3">
          {status === "approved" ? (
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
          ) : (
            <Clock className="mx-auto h-10 w-10 text-gold" />
          )}
          <p className="text-lg font-semibold">{status === "approved" ? "You're verified" : "Under review"}</p>
          <p className="text-sm text-muted-foreground">
            {status === "approved" ? "Your identity has been verified." : "We're reviewing your photo and document."}
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
