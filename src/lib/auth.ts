import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function signInWithGoogle(onSignedIn?: () => void) {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";

    // 1. Attempt Lovable managed OAuth broker
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: origin,
    });

    if (result.redirected) return;

    if (result.error) {
      console.warn("Lovable OAuth broker reported an error, trying direct fallback:", result.error);
      // Fallback: Direct Supabase OAuth with dynamic redirect
      const { data, error: directError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: origin,
        },
      });

      if (directError) {
        toast.error("Google sign-in could not be completed. Please use email sign-in.");
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
