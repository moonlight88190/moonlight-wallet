import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const HOSTED_ORIGIN = "https://moonlight-wallet.lovable.app";

function isLocalHost() {
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h.endsWith(".local");
}

export async function signInWithGoogle(onSignedIn?: () => void) {
  // Google sign-in is not permitted from local machines; continue on the hosted app.
  if (isLocalHost()) {
    toast.message("Opening Google sign-in on the hosted app…");
    window.location.assign(
      `${HOSTED_ORIGIN}/~oauth/initiate?provider=google&redirect_uri=${encodeURIComponent(HOSTED_ORIGIN)}`,
    );
    return;
  }
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    // 1. Attempt Lovable managed OAuth broker
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: origin,
    });

    if (result.redirected) return;

    if (result.error) {
      console.warn(
        "Lovable OAuth broker failed, falling back to direct OAuth redirect:",
        result.error,
      );
      const { data, error: directError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: origin,
        },
      });

      if (directError) {
        toast.error("Could not start Google sign-in. Please sign in with email.");
        return;
      }

      if (data?.url && typeof window !== "undefined") {
        window.location.assign(data.url);
      }
      return;
    }

    onSignedIn?.();
  } catch (e) {
    console.warn("OAuth initiate failed, attempting direct Supabase fallback...", e);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { data, error: directError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: origin,
        },
      });

      if (directError) {
        toast.error("Google sign-in could not be completed.");
      } else if (data?.url && typeof window !== "undefined") {
        window.location.assign(data.url);
      }
    } catch (err) {
      console.error("Direct OAuth failed:", err);
      toast.error("Google sign-in could not be completed.");
    }
  }
}
